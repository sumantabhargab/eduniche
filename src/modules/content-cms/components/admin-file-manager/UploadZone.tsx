"use client";

import { useState, useCallback, useRef } from "react";
import {
  ALLOWED_EXTENSIONS,
  FILE_INPUT_ACCEPT,
  MAX_FILE_SIZE_BYTES,
} from "@/modules/content-cms/config/file-types";
import { ACCESS_TIER_OPTIONS, VISIBILITY_OPTIONS } from "@/modules/content-cms/config/constants";
import { FolderInfo } from "./FileManagerClient";
import FolderSelect from "./FolderSelect";

interface UploadProgress {
  status: "pending" | "signing" | "uploading" | "confirming" | "done" | "error";
  progress: number; // 0–100
  error?: string;
}

interface UploadZoneProps {
  folderId: string | null;
  onUploadComplete: () => void;
  onError?: (message: string) => void;
  /** All folders for the destination selector dropdown */
  allFolders?: FolderInfo[];
  /** Folder selected from the dropdown (takes precedence over folderId) */
  selectedFolderId?: string | null;
  /** Called when the user picks a folder from the dropdown */
  onFolderChange?: (folderId: string) => void;
}

export default function UploadZone({
  folderId,
  onUploadComplete,
  onError,
  allFolders,
  selectedFolderId,
  onFolderChange,
}: UploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, UploadProgress>>(
    {}
  );
  const [dragOver, setDragOver] = useState(false);
  const [accessTier, setAccessTier] = useState<string>("free");
  const [visibility, setVisibility] = useState<string>("draft");
  const inputRef = useRef<HTMLInputElement>(null);

  // The effective folder: dropdown selection takes precedence, fallback to sidebar folderId
  const effectiveFolderId = selectedFolderId ?? folderId;

  const handleError = useCallback((msg: string) => {
    onError?.(msg);
  }, [onError]);

  function updateProgress(fileName: string, update: Partial<UploadProgress>) {
    setProgressMap((prev) => ({
      ...prev,
      [fileName]: { ...prev[fileName], ...update } as UploadProgress,
    }));
  }

  async function uploadOne(file: File) {
    const name = file.name;

    // ── Local pre-flight checks ──────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        ok: false as const,
        error: `File exceeds ${Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))} MB limit.`,
      };
    }

    const lowerName = name.toLowerCase();
    const ext = lowerName.includes(".")
      ? lowerName.slice(lowerName.lastIndexOf("."))
      : "";
    const extOk = ext ? ALLOWED_EXTENSIONS.includes(ext) : false;

    if (!extOk) {
      return {
        ok: false as const,
        error: `File type "${ext || name}" is not supported.`,
      };
    }

    if (!effectiveFolderId) {
      return { ok: false as const, error: "No folder selected." };
    }

    updateProgress(name, {
      status: "signing",
      progress: 0,
      error: undefined,
    });

    // ── Step 1: Request a signed upload URL from the server ──────────────
    let signRes: Response;
    try {
      signRes = await fetch("/api/admin/content/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: name,
          file_size: file.size,
          folder_id: effectiveFolderId,
          content_type: file.type || "application/octet-stream",
        }),
      });
    } catch {
      return { ok: false as const, error: "Network error while requesting upload." };
    }

    if (!signRes.ok) {
      let err = "Could not prepare upload.";
      try {
        const body = await signRes.json();
        err = body.error || err;
      } catch {
        err = `Server error (${signRes.status}).`;
      }
      return { ok: false as const, error: err };
    }

    const signData: { signedUrl: string; path: string } =
      await signRes.json();
    updateProgress(name, { status: "uploading", progress: 5 });

    // ── Step 2: PUT file binary directly to the signed URL ───────────────
    let putRes: Response;
    try {
      putRes = await fetch(signData.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
    } catch {
      return { ok: false as const, error: "Network error during upload." };
    }

    if (!putRes.ok) {
      let err = `Upload failed (${putRes.status}).`;
      if (putRes.status === 413) {
        err = `File is too large. Maximum allowed size is ${Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))} MB.`;
      }
      return { ok: false as const, error: err };
    }

    updateProgress(name, { status: "confirming", progress: 90 });

    // ── Step 3: Create database metadata row ─────────────────────────────
    let confirmRes: Response;
    try {
      confirmRes = await fetch("/api/admin/content/upload-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: signData.path,
          folder_id: effectiveFolderId,
          original_filename: name,
          file_size: file.size,
          content_type: file.type || "application/octet-stream",
          visibility,
          access_tier: accessTier,
        }),
      });
    } catch {
      return { ok: false as const, error: "Network error while saving metadata." };
    }

    if (!confirmRes.ok) {
      let err = "Upload saved but metadata could not be saved.";
      try {
        const body = await confirmRes.json();
        err = body.error || err;
      } catch {
        // Use default error
      }
      return { ok: false as const, error: err };
    }

    updateProgress(name, { status: "done", progress: 100 });
    return { ok: true as const };
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!effectiveFolderId) {
      handleError("Please select a folder first.");
      return;
    }

    setUploading(true);
    const fileArray = Array.from(files);

    for (const f of fileArray) {
      updateProgress(f.name, { status: "pending", progress: 0 });
    }

    const results: { name: string; ok: boolean; error?: string }[] = [];
    for (const file of fileArray) {
      const result = await uploadOne(file);
      results.push({ name: file.name, ...result });
    }

    const failures = results.filter((r) => !r.ok);
    if (failures.length > 0) {
      handleError(`${failures[0].name}: ${failures[0].error}`);
    }

    setTimeout(() => {
      setProgressMap({});
      setUploading(false);
      if (files.length > 0) {
        onUploadComplete();
      }
    }, failures.length > 0 ? 2000 : 600);
  }

  const uploadDisabled = !effectiveFolderId || uploading;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={FILE_INPUT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleUpload(e.target.files);
          e.target.value = "";
        }}
        disabled={uploadDisabled}
      />

      {!effectiveFolderId ? (
        <button
          onClick={() => {}}
          disabled
          className="px-4 py-2 bg-accent text-background text-sm font-medium rounded-lg opacity-50 cursor-not-allowed"
          title="Select a folder first"
        >
          Upload Files
        </button>
      ) : dragOver ? (
        <div
          className="px-4 py-2 border-2 border-dashed border-accent bg-accent-subtle text-accent text-sm font-medium rounded-lg"
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleUpload(e.dataTransfer.files);
          }}
        >
          Drop files here...
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Folder selector dropdown */}
          {allFolders && allFolders.length > 0 && (
            <FolderSelect
              folders={allFolders}
              value={selectedFolderId ?? null}
              onChange={(fid) => onFolderChange?.(fid)}
              placeholder="Choose destination folder..."
              disabled={uploading}
            />
          )}

          {/* Access tier and visibility selects */}
          <div className="flex items-center gap-3">
            <select
              value={accessTier}
              onChange={(e) => setAccessTier(e.target.value)}
              disabled={uploading}
              className="text-sm border border-border rounded-lg px-2 py-1.5 bg-background text-foreground disabled:opacity-60"
              title="Access tier"
            >
              {ACCESS_TIER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              disabled={uploading}
              className="text-sm border border-border rounded-lg px-2 py-1.5 bg-background text-foreground disabled:opacity-60"
              title="Visibility"
            >
              {VISIBILITY_OPTIONS.filter((v) => v.value !== "archived").map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Upload button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploadDisabled}
              className="px-4 py-2 bg-accent text-background text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-60 transition-colors"
            >
              {uploading ? "Uploading..." : "Upload Files"}
            </button>
            <span className="text-xs text-muted">
              PDF, MD, TXT, DOC, PPT, XLS, CSV, Images, ZIP
            </span>
          </div>

          {/* Drag-and-drop area (hidden, used as drop target) */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleUpload(e.dataTransfer.files);
            }}
            className="hidden"
          />

          {/* Per-file progress rows */}
          {Object.keys(progressMap).length > 0 && (
            <div className="space-y-2 max-h-64 overflow-auto">
              {Object.entries(progressMap).map(([fileName, state]) => (
                <div
                  key={fileName}
                  className="flex items-center gap-3 bg-background-alt rounded-lg px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {fileName}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {state.status === "done" && "Done"}
                      {state.status === "error" && state.error}
                      {state.status === "signing" && "Preparing..."}
                      {state.status === "uploading" && "Uploading..."}
                      {state.status === "confirming" && "Saving..."}
                      {state.status === "pending" && "Queued"}
                    </p>
                  </div>
                  <div className="w-24">
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${
                          state.status === "error"
                            ? "bg-red-500"
                            : state.status === "done"
                            ? "bg-green-500"
                            : "bg-accent"
                        }`}
                        style={{ width: `${state.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted w-9 text-right">
                    {state.status === "done"
                      ? "✓"
                      : state.status === "error"
                      ? "✗"
                      : `${state.progress}%`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
