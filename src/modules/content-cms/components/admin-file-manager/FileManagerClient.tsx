"use client";

import { useState, useEffect, useCallback } from "react";
import ContentTree from "./ContentTree";
import BreadcrumbNav from "./BreadcrumbNav";
import ResourceGrid from "./ResourceGrid";
import SearchBar from "./SearchBar";

export interface FolderInfo {
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  depth: number;
  branch: string | null;
  subject: string | null;
  resource_type: string | null;
}

export interface ResourceInfo {
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
  visibility: string;
  tags: string[];
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminFileManagerProps {
  initialFolders: FolderInfo[];
  initialFolderId: string | null;
}

export default function AdminFileManager({
  initialFolders,
  initialFolderId,
}: AdminFileManagerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
  const [folders, setFolders] = useState<FolderInfo[]>(initialFolders);
  const [resources, setResources] = useState<ResourceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderInfo[]>([]);
  const [allFolders, setAllFolders] = useState<FolderInfo[]>([]);
  const [searchResults, setSearchResults] = useState<{ folders: FolderInfo[]; resources: ResourceInfo[] } | null>(null);

  // Load all folders for the sidebar tree
  useEffect(() => {
    fetch("/api/admin/content/folders?all=true")
      .then((r) => r.json())
      .then((data) => {
        if (data.folders) {
          setAllFolders(data.folders);
        }
      })
      .catch(() => {});
  }, []);

  // Load folder contents when currentFolderId changes
  useEffect(() => {
    if (searchResults) {
      setSearchResults(null);
      return;
    }

    loadFolderContents(currentFolderId);
  }, [currentFolderId]);

  async function loadFolderContents(folderId: string | null) {
    setLoading(true);
    try {
      const url = folderId
        ? `/api/admin/content/folders/${folderId}`
        : "/api/admin/content/folders";

      const res = await fetch(url);
      const data = await res.json();

      if (data.folders) {
        setFolders(data.folders);
      } else {
        setFolders([]);
      }
      if (data.resources) {
        setResources(data.resources);
      } else {
        setResources([]);
      }

      // Load breadcrumbs
      if (folderId) {
        const bcRes = await fetch(`/api/admin/content/folders/${folderId}/breadcrumbs`);
        const bcData = await bcRes.json();
        if (bcData.breadcrumbs) {
          setBreadcrumbs(bcData.breadcrumbs);
        }
      } else {
        setBreadcrumbs([]);
      }
    } catch {
      setFolders([]);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      loadFolderContents(currentFolderId);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/content/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setSearchResults(data);
      setFolders(data.folders || []);
      setResources(data.resources || []);
    } catch {
      setFolders([]);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId]);

  const handleNavigateToFolder = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleNavigateToBreadcrumb = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };

  const handleRefresh = () => {
    loadFolderContents(currentFolderId);
  };

  const handleCreateFolder = async (name: string) => {
    const res = await fetch("/api/admin/content/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parent_id: currentFolderId }),
    });
    if (res.ok) {
      loadFolderContents(currentFolderId);
      // Refresh tree
      fetch("/api/admin/content/folders?all=true")
        .then((r) => r.json())
        .then((data) => {
          if (data.folders) setAllFolders(data.folders);
        });
    }
  };

  const handleUploadComplete = () => {
    loadFolderContents(currentFolderId);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar tree */}
      <div className="w-64 border-r border-border shrink-0 overflow-auto">
        <ContentTree
          folders={allFolders}
          currentFolderId={currentFolderId}
          onNavigate={handleNavigateToFolder}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-border px-6 py-3 space-y-3">
          <BreadcrumbNav
            breadcrumbs={breadcrumbs}
            currentFolderId={currentFolderId}
            onNavigate={handleNavigateToBreadcrumb}
          />
          <div className="flex items-center gap-3">
            <SearchBar onSearch={handleSearch} />
            <button
              onClick={handleRefresh}
              className="text-muted hover:text-foreground p-1.5 rounded-lg hover:bg-background-alt transition-colors"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992h4.992m12.988 0h4.986v4.986M2.985 15.652v4.992h4.992" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <ResourceGrid
            folders={folders}
            resources={resources}
            currentFolderId={currentFolderId}
            loading={loading}
            onNavigate={handleNavigateToFolder}
            onCreateFolder={handleCreateFolder}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      </div>
    </div>
  );
}
