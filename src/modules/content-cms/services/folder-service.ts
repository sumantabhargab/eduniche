/**
 * FolderService — business logic for content folder CRUD.
 *
 * Uses the Supabase service client for all database operations.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "../config/constants";
import type { ContentFolder, FolderCreateInput, FolderUpdateInput } from "../types";
import { validateFolderName, validateUuid } from "../lib/validators";

export async function listChildFolders(
  parentId: string | null
): Promise<{ folders: ContentFolder[]; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { folders: [], error: "Server not configured." };
  }

  let query = supabase
    .from("content_folders")
    .select("*")
    .is("parent_id", parentId ?? null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const { data, error } = await query;
  if (error) {
    return { folders: [], error: error.message };
  }
  return { folders: (data as ContentFolder[]) ?? [] };
}

export async function getFolder(
  folderId: string
): Promise<{ folder: ContentFolder | null; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { folder: null, error: "Server not configured." };
  }

  const idCheck = validateUuid(folderId, "Folder ID");
  if (!idCheck.valid) {
    return { folder: null, error: idCheck.error };
  }

  const { data, error } = await supabase
    .from("content_folders")
    .select("*")
    .eq("id", folderId)
    .maybeSingle();

  if (error) {
    return { folder: null, error: error.message };
  }
  return { folder: (data as ContentFolder | null) ?? null };
}

export async function createFolder(
  input: FolderCreateInput,
  userId: string
): Promise<{ folder: ContentFolder | null; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { folder: null, error: "Server not configured." };
  }

  const nameCheck = validateFolderName(input.name);
  if (!nameCheck.valid) {
    return { folder: null, error: nameCheck.error };
  }

  const parentId = input.parent_id ?? null;
  let path = "";
  let depth = 0;

  if (parentId) {
    const parentResult = await getFolder(parentId);
    if (parentResult.error || !parentResult.folder) {
      return { folder: null, error: parentResult.error || "Parent folder not found." };
    }
    path = `${parentResult.folder.path}/${parentResult.folder.id}`;
    depth = parentResult.folder.depth + 1;
  }

  const { data, error } = await supabase
    .from("content_folders")
    .insert({
      name: nameCheck.value,
      parent_id: parentId,
      path,
      depth,
      branch: input.branch ?? null,
      subject: input.subject ?? null,
      resource_type: input.resource_type ?? null,
      premium: input.premium ?? false,
      created_by: userId,
    })
    .select("*")
    .single();

  if (error) {
    return { folder: null, error: error.message };
  }
  return { folder: data as ContentFolder };
}

export async function updateFolder(
  folderId: string,
  input: FolderUpdateInput
): Promise<{ folder: ContentFolder | null; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { folder: null, error: "Server not configured." };
  }

  const idCheck = validateUuid(folderId, "Folder ID");
  if (!idCheck.valid) {
    return { folder: null, error: idCheck.error };
  }

  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) {
    const nameCheck = validateFolderName(input.name);
    if (!nameCheck.valid) {
      return { folder: null, error: nameCheck.error };
    }
    updates.name = nameCheck.value;
  }

  if (input.premium !== undefined) {
    updates.premium = input.premium;
  }

  if (input.parent_id !== undefined) {
    if (input.parent_id !== null) {
      const parentResult = await getFolder(input.parent_id);
      if (parentResult.error || !parentResult.folder) {
        return { folder: null, error: parentResult.error || "Target folder not found." };
      }
      updates.parent_id = input.parent_id;
      updates.path = `${parentResult.folder.path}/${parentResult.folder.id}`;
      updates.depth = parentResult.folder.depth + 1;
    } else {
      updates.parent_id = null;
      updates.path = "";
      updates.depth = 0;
    }
  }

  if (Object.keys(updates).length === 0) {
    return { folder: null, error: "No changes provided." };
  }

  const { data, error } = await supabase
    .from("content_folders")
    .update(updates)
    .eq("id", folderId)
    .select("*")
    .single();

  if (error) {
    return { folder: null, error: error.message };
  }
  return { folder: data as ContentFolder };
}

export async function deleteFolder(
  folderId: string
): Promise<{ deleted: boolean; cascadeCount: number; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { deleted: false, cascadeCount: 0, error: "Server not configured." };
  }

  const idCheck = validateUuid(folderId, "Folder ID");
  if (!idCheck.valid) {
    return { deleted: false, cascadeCount: 0, error: idCheck.error };
  }

  // Use recursive SQL function for proper cascade delete
  const { data, error } = await supabase.rpc("delete_folder_cascade", {
    p_folder_id: folderId,
  });

  if (error) {
    return { deleted: false, cascadeCount: 0, error: error.message };
  }

  const result = data?.[0];
  const cascadeCount = (result?.deleted_folders ?? 0) + (result?.deleted_resources ?? 0);

  // Finally delete the root folder itself
  const { error: deleteError } = await supabase
    .from("content_folders")
    .delete()
    .eq("id", folderId);

  if (deleteError) {
    return { deleted: false, cascadeCount, error: deleteError.message };
  }

  return { deleted: true, cascadeCount: cascadeCount + 1 };
}
