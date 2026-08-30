"use client";

import { useState, useMemo } from "react";
import type { FolderInfo } from "./FileManagerClient";

interface ContentTreeProps {
  folders: FolderInfo[];
  currentFolderId: string | null;
  onNavigate: (folderId: string) => void;
}

export default function ContentTree({ folders, currentFolderId, onNavigate }: ContentTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (currentFolderId) {
      return new Set([currentFolderId]);
    }
    return new Set();
  });

  // Build a nested tree from the flat list
  const tree = useMemo(() => {
    const map = new Map<string, FolderInfo & { children: FolderInfo[] }>();
    const roots: (FolderInfo & { children: FolderInfo[] })[] = [];

    for (const f of folders) {
      map.set(f.id, { ...f, children: [] });
    }

    for (const f of folders) {
      const node = map.get(f.id)!;
      if (f.parent_id && map.has(f.parent_id)) {
        map.get(f.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }, [folders]);

  function toggleExpand(folderId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }

  function renderNode(folder: FolderInfo & { children: FolderInfo[] }, depth: number): React.ReactNode {
    const hasChildren = folder.children.length > 0;
    const isExpanded = expanded.has(folder.id);
    const isActive = currentFolderId === folder.id;

    return (
      <div key={folder.id}>
        <button
          onClick={() => {
            onNavigate(folder.id);
            if (hasChildren) toggleExpand(folder.id);
          }}
          className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md transition-colors text-left ${
            isActive
              ? "bg-accent-subtle text-accent"
              : "text-muted hover:text-foreground hover:bg-background-alt"
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {hasChildren && (
            <span className="shrink-0">
              {isExpanded ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </span>
          )}
          {!hasChildren && <span className="w-3.5 shrink-0" />}
          <svg className="w-4 h-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
          </svg>
          <span className="truncate">{folder.name}</span>
        </button>
        {isExpanded && hasChildren && (
          <div>
            {folder.children.map((child) => renderNode(child as FolderInfo & { children: FolderInfo[] }, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="py-2">
      {tree.map((folder) => renderNode(folder, 0))}
      {folders.length === 0 && (
        <p className="text-xs text-muted px-4 py-2">No folders yet</p>
      )}
    </div>
  );
}
