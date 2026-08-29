/**
 * Public Library browser at /library
 * Shows folders and documents. Free users see free docs, premium users see all.
 */

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  branch: string | null;
  subject: string | null;
  depth: number;
  created_at: string;
}

interface Resource {
  id: string;
  name: string;
  description: string | null;
  mime_type: string;
  branch: string | null;
  subject: string | null;
  resource_type: string | null;
  access_tier: "free" | "premium";
  file_size: number;
  created_at: string;
}

function LibraryInner() {
  const searchParams = useSearchParams();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createBrowserClient();

  const folderId = searchParams.get("folder");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: sub } = await supabase
          .from("user_subscriptions")
          .select("status, expires_at")
          .eq("user_id", session.user.id)
          .eq("status", "active")
          .gte("expires_at", new Date().toISOString())
          .maybeSingle();

        setIsPremium(!!sub);
      }
    } catch (e) {
      // ignore
    }
  };

  const loadFolder = useCallback(async (fid: string | null) => {
    if (!supabase) { setLoading(false); return; }

    setLoading(true);

    try {
      // Load child folders
      let folderQuery = supabase
        .from("content_folders")
        .select("*")
        .order("name", { ascending: true });

      if (fid) {
        folderQuery = folderQuery.eq("parent_id", fid);
      } else {
        folderQuery = folderQuery.is("parent_id", null);
      }

      const { data: folderData } = await folderQuery;

      // Load resources
      let resQuery = supabase
        .from("content_resources")
        .select("id, name, description, mime_type, branch, subject, resource_type, access_tier, file_size, created_at")
        .eq("visibility", "published")
        .order("name", { ascending: true });

      if (fid) {
        resQuery = resQuery.eq("folder_id", fid);
      } else {
        resQuery = resQuery.is("folder_id", null);
      }

      const { data: resData } = await resQuery;

      setFolders(folderData || []);
      setResources(resData || []);

      // Load breadcrumbs
      if (fid) {
        try {
          const { data: breadcrumbData } = await supabase.rpc("get_folder_breadcrumbs", {
            folder_id: fid,
          });

          if (breadcrumbData) {
            setBreadcrumbs(breadcrumbData);
          } else {
            const { data: current } = await supabase
              .from("content_folders")
              .select("*")
              .eq("id", fid)
              .maybeSingle();
            setBreadcrumbs(current ? [current] : []);
          }
        } catch (e) {
          const { data: current } = await supabase
            .from("content_folders")
            .select("*")
            .eq("id", fid)
            .maybeSingle();
          setBreadcrumbs(current ? [current] : []);
        }
      } else {
        setBreadcrumbs([]);
      }
    } catch (e) {
      console.error("Load folder error:", e);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadFolder(folderId);
  }, [folderId, loadFolder]);

  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredResources = resources.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Library</h1>
        <p className="text-muted">Browse GATE study resources and content.</p>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 mb-6 text-sm flex-wrap">
          <Link href="/library" className="text-muted hover:text-foreground">Library</Link>
          {breadcrumbs.map((crumb, i) => (
            <div key={crumb.id} className="flex items-center gap-2">
              <span className="text-muted">/</span>
              <span className={i === breadcrumbs.length - 1 ? "font-medium" : "text-muted hover:text-foreground"}>
                {crumb.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search library..."
          className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/30"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse text-muted">Loading library...</div>
        </div>
      ) : (
        <>
          {/* Folders */}
          {filteredFolders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">
                Folders
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredFolders.map((folder) => (
                  <Link
                    key={folder.id}
                    href={`/library?folder=${folder.id}`}
                    className="bg-card border border-border rounded-xl p-4 hover:border-foreground/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📁</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{folder.name}</div>
                        <div className="text-xs text-muted">
                          {folder.subject || folder.branch || "Folder"}
                        </div>
                      </div>
                      <span className="text-muted group-hover:text-foreground">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {filteredResources.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">
                Documents
              </h2>
              <div className="space-y-2">
                {filteredResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    isPremium={isPremium}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredFolders.length === 0 && filteredResources.length === 0 && (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <p className="text-muted">
                {searchQuery ? "No results found." : "This folder is empty."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ResourceCard({ resource, isPremium }: { resource: Resource; isPremium: boolean }) {
  const isLocked = resource.access_tier === 'premium' && !isPremium;

  const icon = resource.mime_type.includes('pdf') ? '📄' :
               resource.mime_type.includes('markdown') || resource.mime_type.includes('text') ? '📝' :
               '📃';

  const fileSizeMB = resource.file_size ? (resource.file_size / (1024 * 1024)).toFixed(1) : '0';

  return (
    <Link
      href={isLocked ? "/pricing" : `/library/document/${resource.id}`}
      className="block bg-card border border-border rounded-xl p-4 hover:border-foreground/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="font-medium flex-1">{resource.name}</h3>
            {resource.access_tier === 'premium' && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isLocked
                  ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                  : "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400"
              }`}>
                {isLocked ? "🔒 Premium" : "✓ Premium"}
              </span>
            )}
          </div>
          {resource.description && (
            <p className="text-sm text-muted mt-1 line-clamp-2">{resource.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted mt-2">
            {resource.subject && <span>{resource.subject}</span>}
            {resource.resource_type && <span>• {resource.resource_type}</span>}
            <span>• {fileSizeMB} MB</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function LibraryLoading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="text-center py-12">
        <div className="animate-pulse text-muted">Loading library...</div>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<LibraryLoading />}>
      <LibraryInner />
    </Suspense>
  );
}
