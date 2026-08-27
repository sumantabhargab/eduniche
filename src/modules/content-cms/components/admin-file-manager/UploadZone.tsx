"use client";

import { useState, useEffect, useRef } from "react";

interface UploadZoneProps {
  folderId: string | null;
  onUploadComplete: () => void;
}

export default function UploadZone({ folderId, onUploadComplete }: UploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!folderId) {
      alert("Please select a folder first.");
      return;
    }

    setUploading(true);
    const newProgress: Record<string, number> = {};

    for (const file of Array.from(files)) {
      newProgress[file.name] = 0;
      setProgress({ ...newProgress });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder_id", folderId);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/admin/content/upload");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          setProgress((prev) => ({ ...prev, [file.name]: pct }));
        }
      };

      const result = await new Promise<{ ok: boolean }>((resolve) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ ok: true });
          } else {
            resolve({ ok: false });
          }
        };
        xhr.onerror = () => resolve({ ok: false });
        xhr.send(formData);
      });

      if (result.ok) {
        newProgress[file.name] = 100;
      } else {
        delete newProgress[file.name];
      }
      setProgress({ ...newProgress });
    }

    setUploading(false);
    setProgress({});
    onUploadComplete();
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handleUpload(e.target.files);
          e.target.value = "";
        }}
        disabled={!folderId || uploading}
      />

      {!folderId ? (
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
        <>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-accent text-background text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-60 transition-colors"
          >
            {uploading ? "Uploading..." : "Upload Files"}
          </button>
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
        </>
      )}
    </div>
  );
}
