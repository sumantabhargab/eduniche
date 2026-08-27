"use client";

import { FolderInfo } from "./FileManagerClient";

interface BreadcrumbNavProps {
  breadcrumbs: FolderInfo[];
  currentFolderId: string | null;
  onNavigate: (folderId: string | null) => void;
}

export default function BreadcrumbNav({
  breadcrumbs,
  currentFolderId,
  onNavigate,
}: BreadcrumbNavProps) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      <button
        onClick={() => onNavigate(null)}
        className={`px-2 py-1 rounded-md transition-colors ${
          !currentFolderId
            ? "bg-accent-subtle text-accent font-medium"
            : "text-muted hover:text-foreground hover:bg-background-alt"
        }`}
      >
        Home
      </button>

      {breadcrumbs.map((folder) => (
        <div key={folder.id} className="flex items-center gap-1">
          <span className="text-muted">/</span>
          <button
            onClick={() => onNavigate(folder.id)}
            className={`px-2 py-1 rounded-md transition-colors ${
              currentFolderId === folder.id
                ? "bg-accent-subtle text-accent font-medium"
                : "text-muted hover:text-foreground hover:bg-background-alt"
            }`}
          >
            {folder.name}
          </button>
        </div>
      ))}
    </nav>
  );
}
