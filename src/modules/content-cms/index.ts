/**
 * Content CMS — public API exports.
 *
 * This module provides:
 * - Admin auth utilities
 * - Folder and resource service functions
 * - Storage utilities
 * - Validation helpers
 * - TypeScript types
 * - Constants
 *
 * All admin operations require a valid admin session.
 * The services use the Supabase service client (server-side only).
 */

export * from "./types";
export * from "./config/constants";
export * from "./lib/validators";
export { getAdminSession, requireAdmin, adminLogin, adminLogout } from "./lib/auth";
export { uploadFile, deleteFile, getSignedUrl } from "./lib/storage";
export {
  listChildFolders,
  getFolder,
  createFolder,
  updateFolder,
  deleteFolder,
} from "./services/folder-service";
export {
  listResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  searchResources,
  handleFileUpload,
} from "./services/resource-service";
