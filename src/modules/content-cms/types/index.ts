/**
 * Core types for the Content CMS module.
 */

export type ResourceVisibility = "draft" | "published" | "archived";

export type ResourceType = "notes" | "pyqs" | "books" | "practice" | "other";

export interface ContentFolder {
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  depth: number;
  branch: string | null;
  subject: string | null;
  resource_type: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  child_count?: number;
  resource_count?: number;
}

export interface ContentResource {
  id: string;
  name: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  folder_id: string;
  branch: string | null;
  subject: string | null;
  resource_type: string | null;
  visibility: ResourceVisibility;
  tags: string[];
  description: string | null;
  created_at: string;
  updated_at: string;
  uploaded_by: string | null;
}

export interface FolderCreateInput {
  name: string;
  parent_id?: string | null;
  branch?: string | null;
  subject?: string | null;
  resource_type?: string | null;
}

export interface FolderUpdateInput {
  name?: string;
  parent_id?: string | null;
}

export interface ResourceCreateInput {
  name: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  folder_id: string;
  branch?: string | null;
  subject?: string | null;
  resource_type?: string | null;
  visibility?: ResourceVisibility;
  tags?: string[];
  description?: string;
}

export interface ResourceUpdateInput {
  name?: string;
  folder_id?: string;
  visibility?: ResourceVisibility;
  resource_type?: string | null;
  tags?: string[];
  description?: string;
}

export interface MoveItemInput {
  target_folder_id: string | null;
}

export interface SearchResult {
  folders: ContentFolder[];
  resources: ContentResource[];
}

export interface AdminSession {
  user: {
    id: string;
    email: string;
    role: string;
  };
}
