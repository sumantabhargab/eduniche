/**
 * Supabase Storage utilities for the Content CMS.
 *
 * All operations are server-side only and use the service client
 * to bypass RLS for admin operations.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "../config/constants";

export interface UploadResult {
  path: string;
  size: number;
}

export async function uploadFile(
  folderId: string,
  resourceId: string,
  file: File
): Promise<{ success: boolean; path?: string; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, error: "Server not configured." };
  }

  const ext = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf("."))
    : "";
  const storagePath = `${folderId}/${resourceId}_${file.name}${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, path: storagePath };
}

export async function deleteFile(storagePath: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, error: "Server not configured." };
  }

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getSignedUrl(
  storagePath: string,
  expiresIn = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false, error: "Server not configured." };
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, url: data.signedUrl };
}
