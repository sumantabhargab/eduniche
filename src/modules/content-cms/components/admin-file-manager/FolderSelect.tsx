"use client";

import { useMemo } from "react";
import { FolderInfo } from "./FileManagerClient";

interface FolderSelectProps {
  folders: FolderInfo[];
  value: string | null;
  onChange: (folderId: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

interface FlatFolder {
  id: string;
  name: string;
  depth: number;
}

function flattenFolders(folders: FolderInfo[]): FlatFolder[] {
  const map = new Map<string, FolderInfo>();
  for (const f of folders) {
    map.set(f.id, f);
  }

  const roots = folders.filter((f) => f.parent_id === null);

  const result: FlatFolder[] = [];
  const walk = (items: FolderInfo[], depth: number) => {
    for (const f of items) {
      result.push({ id: f.id, name: f.name, depth });
      const children = folders.filter((c) => c.parent_id === f.id);
      if (children.length > 0) {
        walk(children, depth + 1);
      }
    }
  };
  walk(roots, 0);
  return result;
}

export default function FolderSelect({
  folders,
  value,
  onChange,
  label = "Destination Folder",
  placeholder = "Select a folder...",
  disabled = false,
}: FolderSelectProps) {
  const flat = useMemo(() => flattenFolders(folders), [folders]);

  const formatLabel = (f: FlatFolder): string => {
    if (f.depth === 0) return f.name;
    const indent = "  ".repeat(f.depth);
    return `${indent}↳ ${f.name}`;
  };

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        value={value ?? ""}
        onChange={(e) => {
          if (e.target.value) {
            onChange(e.target.value);
          }
        }}
        disabled={disabled || flat.length === 0}
        className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="">{flat.length === 0 ? "No folders available" : placeholder}</option>
        {flat.map((f) => (
          <option key={f.id} value={f.id}>
            {formatLabel(f)}
          </option>
        ))}
      </select>
    </div>
  );
}
