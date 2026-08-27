/**
 * ResourceService — business logic for content resource CRUD.
 *
 * Uses the Supabase service client for all database operations.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "../config/constants";
import {
  ContentResource,
  ContentFolder,
  ResourceCreateInput,
  ResourceUpdateInput,
  SearchResult,
} from "../types";
import {
  validateResourceName,
  validateUuid,
  validateVisibility,
  validateTags,
  validateFileUpload,
  validateFolderName,
} from "../lib/validators";
import { deleteFile, uploadFile } from "../lib/storage";
import { getFolder } from "./folder-service";

export async function listResources(
  folderId: string,
  visibility?: string
): Promise<{ resources: ContentResource[]; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { resources: [], error: "Server not configured." };
  }

  const idCheck = validateUuid(folderId, "Folder ID");
  if (!idCheck.valid) {
    return { resources: [], error: idCheck.error };
  }

  let query = supabase
    .from("content_resources")
    .select("*")
    .eq("folder_id", folderId)
    .order("created_at", { ascending: false });

  if (visibility && visibility !== "all") {
    query = query.eq("visibility", visibility);
  }

  const { data, error } = await query;
  if (error) {
    return { resources: [], error: error.message };
  }
  return { resources: (data as ContentResource[]) ?? [] };
}

export async function getResource(
  resourceId: string
): Promise<{ resource: ContentResource | null; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { resource: null, error: "Server not configured." };
  }

  const idCheck = validateUuid(resourceId, "Resource ID");
  if (!idCheck.valid) {
    return { resource: null, error: idCheck.error };
  }

  const { data, error } = await supabase
    .from("content_resources")
    .select("*")
    .eq("id", resourceId)
    .maybeSingle();

  if (error) {
    return { resource: null, error: error.message };
  }
  return { resource: (data as ContentResource | null) ?? null };
}

export async function createResource(
  input: ResourceCreateInput,
  userId: string
): Promise<{ resource: ContentResource | null; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { resource: null, error: "Server not configured." };
  }

  const folderCheck = validateUuid(input.folder_id, "Folder ID");
  if (!folderCheck.valid) {
    return { resource: null, error: folderCheck.error };
  }

  const nameCheck = validateResourceName(input.name);
  if (!nameCheck.valid) {
    return { resource: null, error: nameCheck.error };
  }

  const { data, error } = await supabase
    .from("content_resources")
    .insert({
      name: nameCheck.value,
      original_filename: input.original_filename,
      mime_type: input.mime_type,
      file_size: input.file_size,
      storage_path: input.storage_path,
      folder_id: input.folder_id,
      branch: input.branch ?? null,
      subject: input.subject ?? null,
      resource_type: input.resource_type ?? null,
      visibility: input.visibility ?? "draft",
      tags: input.tags ?? [],
      description: input.description ?? null,
      uploaded_by: userId,
    })
    .select("*")
    .single();

  if (error) {
    return { resource: null, error: error.message };
  }
  return { resource: data as ContentResource };
}

export async function updateResource(
  resourceId: string,
  input: ResourceUpdateInput
): Promise<{ resource: ContentResource | null; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { resource: null, error: "Server not configured." };
  }

  const idCheck = validateUuid(resourceId, "Resource ID");
  if (!idCheck.valid) {
    return { resource: null, error: idCheck.error };
  }

  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) {
    const nameCheck = validateResourceName(input.name);
    if (!nameCheck.valid) {
      return { resource: null, error: nameCheck.error };
    }
    updates.name = nameCheck.value;
  }

  if (input.visibility !== undefined) {
    const visCheck = validateVisibility(input.visibility);
    if (!visCheck.valid) {
      return { resource: null, error: visCheck.error };
    }
    updates.visibility = visCheck.value;
  }

  if (input.tags !== undefined) {
    const tagsCheck = validateTags(input.tags);
    if (!tagsCheck.valid) {
      return { resource: null, error: tagsCheck.error };
    }
    updates.tags = tagsCheck.value;
  }

  if (input.folder_id !== undefined) {
    const folderCheck = validateUuid(input.folder_id, "Folder ID");
    if (!folderCheck.valid) {
      return { resource: null, error: folderCheck.error };
    }
    updates.folder_id = input.folder_id;
  }

  if (input.resource_type !== undefined) updates.resource_type = input.resource_type;
  if (input.description !== undefined) updates.description = input.description;

  if (Object.keys(updates).length === 0) {
    return { resource: null, error: "No changes provided." };
  }

  const { data, error } = await supabase
    .from("content_resources")
    .update(updates)
    .eq("id", resourceId)
    .select("*")
    .single();

  if (error) {
    return { resource: null, error: error.message };
  }
  return { resource: data as ContentResource };
}

export async function deleteResource(
  resourceId: string
): Promise<{ deleted: boolean; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { deleted: false, error: "Server not configured." };
  }

  const idCheck = validateUuid(resourceId, "Resource ID");
  if (!idCheck.valid) {
    return { deleted: false, error: idCheck.error };
  }

  const { data: resource, error: fetchError } = await supabase
    .from("content_resources")
    .select("storage_path")
    .eq("id", resourceId)
    .maybeSingle();

  if (fetchError) {
    return { deleted: false, error: fetchError.message };
  }

  const { error } = await supabase
    .from("content_resources")
    .delete()
    .eq("id", resourceId);

  if (error) {
    return { deleted: false, error: error.message };
  }

  if (resource?.storage_path) {
    await deleteFile(resource.storage_path);
  }

  return { deleted: true };
}

export async function searchResources(
  query: string,
  branch?: string,
  subject?: string,
  visibility?: string
): Promise<SearchResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { folders: [], resources: [] };
  }

  const searchTerm = query.trim();
  if (searchTerm.length === 0) {
    return { folders: [], resources: [] };
  }

  const ilikePattern = `%${searchTerm}%`;

  const { data: folders, error: folderError } = await supabase
    .from("content_folders")
    .select("*")
    .or(`name.ilike.${ilikePattern}`)
    .order("depth", { ascending: true })
    .limit(20);

  if (folderError) {
    return { folders: [], resources: [] };
  }

  let resourceQuery = supabase
    .from("content_resources")
    .select("*")
    .or(`name.ilike.${ilikePattern}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (branch && branch !== "all") {
    resourceQuery = resourceQuery.eq("branch", branch);
  }
  if (subject) {
    resourceQuery = resourceQuery.eq("subject", subject);
  }
  if (visibility && visibility !== "all") {
    resourceQuery = resourceQuery.eq("visibility", visibility);
  }

  const { data: resources, error: resourceError } = await resourceQuery;

  if (resourceError) {
    return { folders: [], resources: [] };
  }

  return {
    folders: (folders as ContentFolder[]) ?? [],
    resources: (resources as ContentResource[]) ?? [],
  };
}

export async function handleFileUpload(
  file: File,
  folderId: string,
  userId: string
): Promise<{ resource?: ContentResource; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { error: "Server not configured." };
  }

  const uploadCheck = validateFileUpload(file);
  if (!uploadCheck.valid) {
    return { error: uploadCheck.error };
  }

  const idCheck = validateUuid(folderId, "Folder ID");
  if (!idCheck.valid) {
    return { error: idCheck.error };
  }

  const folderResult = await getFolder(folderId);
  if (folderResult.error || !folderResult.folder) {
    return { error: folderResult.error || "Folder not found." };
  }

  const resourceId = crypto.randomUUID();
  const uploadResult = await uploadFile(folderId, resourceId, file);

  if (!uploadResult.success) {
    return { error: uploadResult.error };
  }

  const nameCheck = validateResourceName(
    file.name.includes(".")
      ? file.name.slice(0, file.name.lastIndexOf("."))
      : file.name
  );
  if (!nameCheck.valid) {
    return { error: nameCheck.error };
  }

  const createResult = await createResource(
    {
      name: nameCheck.value,
      original_filename: file.name,
      mime_type: file.type || "application/octet-stream",
      file_size: file.size,
      storage_path: uploadResult.path!,
      folder_id: folderId,
      branch: folderResult.folder.branch,
      subject: folderResult.folder.subject,
      resource_type: folderResult.folder.resource_type,
      visibility: "draft",
    },
    userId
  );

  if (createResult.error || !createResult.resource) {
    await deleteFile(uploadResult.path!);
    return { error: createResult.error || "Failed to create resource." };
  }

  return { resource: createResult.resource };
}
