/**
 * Public Library browser at /library
 * Shows folders and documents. Free users see free folders/resources;
 * premium users see everything.
 */

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { EduNeuroLoader } from "@/components/loading";
import Link from "next/link";

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  branch: string | null;
  subject: string | null;
  depth: number;
  premium: boolean;
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

// Inline SVG icons for file types
function IconFolder({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconFile({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconFileText({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function LibraryLoading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="text-center py-12">
        <EduNeuroLoader size="sm" variant="page" label="Loading library" />
      </div>
    </div>
  );
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

  // Check premium status
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", session.user.id)
            .maybeSingle();

          const plan = (profile as any)?.plan;
          if (plan === "monthly_premium" || plan === "weekly_premium") {
            setIsPremium(true);
            return;
          }

          const { data: sub } = await supabase
            .from("user_subscriptions")
            .select("status, expires_at")
            .eq("user_id", session.user.id)
            .eq("status", "active")
            .gte("expires_at", new Date().toISOString())
            .maybeSingle();
          setIsPremium(!!sub);
        }
      } catch {
        // ignore
      }
    };
    checkAuth();
  }, [supabase]);

  const loadFolder = useCallback(async (fid: string | null) => {
    if (!supabase) { setLoading(false); return; }

    setLoading(true);
    try {
      let folderQuery = supabase
        .from("content_folders")
        .select("*")
        .order("name", { ascending: true });

      if (fid) {
        folderQuery = folderQuery.eq("parent_id", fid);
      } else {
        folderQuery = folderQuery.is("parent_id", null);
      }

      if (!isPremium) {
        folderQuery = folderQuery.eq("premium", false);
      }

      const { data: folderData } = await folderQuery;

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

      if (!isPremium) {
        resQuery = resQuery.eq("access_tier", "free");
      }

      const { data: resData } = await resQuery;

      setFolders(folderData || []);
      setResources(resData || []);

      if (fid) {
        try {
          const { data: breadcrumbData } = await supabase.rpc("get_folder_breadcrumbs", {
            start_folder_id: fid,
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
        } catch {
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
  }, [supabase, isPremium]);

  useEffect(() => {
    if (folderId) {
      const findFolder = async () => {
        if (!supabase) return;
        const { data } = await supabase
          .from("content_folders")
          .select("*")
          .eq("id", folderId)
          .maybeSingle();
        if (data) setCurrentFolder(data as Folder);
      };
      findFolder();
    } else {
      setCurrentFolder(null);
    }
    loadFolder(folderId);
  }, [folderId, loadFolder, supabase]);

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredResources = resources.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Library</h1>
        <p className="text-muted">Browse GATE study resources and content.</p>
        {!isPremium && (
          <Link href="/pricing" className="text-sm text-accent hover:underline mt-2 inline-block">
            Upgrade to Premium for full access &rarr;
          </Link>
        )}
      </div>

      {/* Breadcrumbs */}
      {(breadcrumbs.length > 0 || currentFolder) && (
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
          <EduNeuroLoader size="sm" variant="page" label="Loading library" />
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
                      <span className="text-muted"><IconFolder className="w-6 h-6" /></span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{folder.name}</div>
                        <div className="text-xs text-muted">
                          {folder.subject || folder.branch || "Folder"}
                        </div>
                      </div>
                      <span className="text-muted group-hover:text-foreground">&rarr;</span>
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
  const isLocked = resource.access_tier === "premium" && !isPremium;

  const fileIcon = resource.mime_type.includes("pdf")
    ? <IconFile className="w-5 h-5" />
    : resource.mime_type.includes("markdown") || resource.mime_type.includes("text")
      ? <IconFileText className="w-5 h-5" />
      : <IconFile className="w-5 h-5" />;

  const fileSizeMB = resource.file_size ? (resource.file_size / (1024 * 1024)).toFixed(1) : "0";

  return (
    <Link
      href={isLocked ? "/pricing" : `/library/document/${resource.id}`}
      className="block bg-card border border-border rounded-xl p-4 hover:border-foreground/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <span className="text-muted mt-0.5">{fileIcon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="font-medium flex-1">{resource.name}</h3>
            {resource.access_tier === "premium" && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isLocked
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                Premium
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

export default function LibraryPage() {
  return (
    <Suspense fallback={<LibraryLoading />}>
      <LibraryInner />
    </Suspense>
  );
}