"use client";

import { useState, useRef } from "react";
import type { FolderInfo, ResourceInfo } from "./FileManagerClient";
import UploadZone from "./UploadZone";

interface ResourceGridProps {
  folders: FolderInfo[];
  resources: ResourceInfo[];
  currentFolderId: string | null;
  loading: boolean;
  onNavigate: (folderId: string) => void;
  onCreateFolder: (name: string) => void;
  onUploadComplete: () => void;
}

export default function ResourceGrid({
  folders,
  resources,
  currentFolderId,
  loading,
  onNavigate,
  onCreateFolder,
  onUploadComplete,
}: ResourceGridProps) {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    type: "folder" | "resource";
    id: string;
    x: number;
    y: number;
  } | null>(null);

  function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim());
    setNewFolderName("");
    setShowNewFolder(false);
  }

  function handleContextMenu(
    e: React.MouseEvent,
    type: "folder" | "resource",
    id: string
  ) {
    e.preventDefault();
    setContextMenu({ type, id, x: e.clientX, y: e.clientY });
  }

  function handleDelete(itemId: string) {
    const endpoint = contextMenu?.type === "folder"
      ? `/api/admin/content/folders/${itemId}`
      : `/api/admin/content/resources/${itemId}`;

    fetch(endpoint, { method: "DELETE" })
      .then(() => {
        onUploadComplete();
      })
      .catch(() => {});

    setContextMenu(null);
  }

  function handleMove(itemId: string) {
    // TODO: implement move modal
    setContextMenu(null);
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  function getFileIcon(mimeType: string) {
    if (mimeType === "application/pdf") {
      return (
        <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
        </svg>
      );
    }
    if (mimeType.startsWith("image/")) {
      return (
        <svg className="w-10 h-10 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M18.75 21H5.25A2.25 2.25 0 0 1 3 18.75V5.25A2.25 2.25 0 0 1 5.25 3h6.09L9.75 7.5h4.5L15.09 3H18.75A2.25 2.25 0 0 1 21 5.25v12.75A2.25 2.25 0 0 1 18.75 21Z" />
        </svg>
      );
    }
    if (mimeType.startsWith("video/")) {
      return (
        <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      );
    }
    return (
      <svg className="w-10 h-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-serif text-foreground">
            {currentFolderId ? "Current Folder" : "Root"}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {folders.length} folders, {resources.length} files
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showNewFolder ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") {
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }
                }}
                placeholder="Folder name"
                autoFocus
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
              <button
                onClick={handleCreateFolder}
                className="px-3 py-1.5 bg-accent text-background text-sm rounded-lg hover:bg-accent-hover transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewFolder(false);
                  setNewFolderName("");
                }}
                className="px-3 py-1.5 text-muted hover:text-foreground text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewFolder(true)}
              className="px-3 py-1.5 border border-border text-sm text-foreground rounded-lg hover:bg-background-alt transition-colors"
            >
              + New Folder
            </button>
          )}
          <UploadZone
            folderId={currentFolderId}
            onUploadComplete={onUploadComplete}
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && folders.length === 0 && resources.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-muted mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
          </svg>
          <p className="text-muted text-sm">This folder is empty</p>
          <p className="text-xs text-muted mt-1">Upload files or create subfolders to get started</p>
        </div>
      )}

      {/* Folders section */}
      {folders.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
            Folders
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => onNavigate(folder.id)}
                onContextMenu={(e) => handleContextMenu(e, "folder", folder.id)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-background hover:border-accent/30 hover:shadow-sm transition-all text-center group"
              >
                <svg className="w-10 h-10 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z" />
                </svg>
                <span className="text-sm text-foreground truncate w-full group-hover:text-accent transition-colors">
                  {folder.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resources section */}
      {resources.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
            Files
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {resources.map((resource) => (
              <div
                key={resource.id}
                onContextMenu={(e) => handleContextMenu(e, "resource", resource.id)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-background hover:border-accent/30 hover:shadow-sm transition-all text-center group cursor-default"
              >
                {getFileIcon(resource.mime_type)}
                <span className="text-sm text-foreground truncate w-full group-hover:text-accent transition-colors">
                  {resource.name}
                </span>
                <span className="text-xs text-muted">
                  {formatFileSize(resource.file_size)}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    resource.visibility === "published"
                      ? "bg-green-100 text-green-700"
                      : resource.visibility === "draft"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {resource.visibility}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-border py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => handleMove(contextMenu.id)}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-background-alt transition-colors"
            >
              Move
            </button>
            <button
              onClick={() => handleDelete(contextMenu.id)}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-background-alt transition-colors"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
