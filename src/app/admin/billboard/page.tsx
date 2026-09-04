"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminLayoutClient from "@/modules/content-cms/components/admin-layout/AdminLayoutClient";

const SLOT_OPTIONS: { value: string; label: string }[] = [
  { value: "landing_main", label: "Landing Page — Main Billboard" },
  { value: "dashboard_featured", label: "Dashboard — Featured Partner" },
  { value: "learning_secondary", label: "Learning — Secondary Billboard" },
  { value: "resources_featured", label: "Resources — Featured Partner" },
];

type Creative = {
  id: string;
  slot_id: string;
  brand_name: string;
  creative_url: string;
  creative_type: string;
  destination_url: string;
  is_active: boolean;
  priority: number;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
  slot_label?: string;
};

export default function BillboardAdminPage() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    brand_name: "",
    destination_url: "",
    slot_id: "landing_main",
    is_active: true,
    priority: "0",
    start_at: "",
    end_at: "",
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);
  const existingCreativeRef = useRef<Creative | null>(null);

  const loadCreatives = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/billboard/creatives");
      if (res.ok) {
        const data = await res.json();
        setCreatives(data.creatives ?? []);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => {
    loadCreatives();
    // Poll every 30s for freshness
    const interval = setInterval(loadCreatives, 30_000);
    return () => clearInterval(interval);
  }, []);

  const resetForm = () => {
    setForm({
      brand_name: "",
      destination_url: "",
      slot_id: "landing_main",
      is_active: true,
      priority: "0",
      start_at: "",
      end_at: "",
    });
    setPreviewUrl(null);
    setUploadError(null);
    setEditingId(null);
    fileRef.current = null;
    existingCreativeRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startEdit = (c: Creative) => {
    setEditingId(c.id);
    existingCreativeRef.current = c;
    setForm({
      brand_name: c.brand_name,
      destination_url: c.destination_url,
      slot_id: c.slot_id,
      is_active: c.is_active,
      priority: String(c.priority),
      start_at: c.start_at ? c.start_at.slice(0, 16) : "",
      end_at: c.end_at ? c.end_at.slice(0, 16) : "",
    });
    setPreviewUrl(c.creative_url);
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileRef.current = file;
    setUploadError(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const uploadFile = async (file: File): Promise<{ path: string } | null> => {
    const targetId = editingId ?? "temp";
    const res = await fetch("/api/admin/billboard/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        file_size: file.size,
        content_type: file.type,
        creative_id: targetId,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Upload failed");
    }

    const data = await res.json();

    // PUT to signed URL
    const putRes = await fetch(data.signedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!putRes.ok) {
      throw new Error("Failed to upload file to storage.");
    }

    return { path: data.path };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setUploadError(null);

    try {
      let creativeUrl = "";
      let creativeType = "image/jpeg";

      // Upload file if provided
      if (fileRef.current) {
        setUploading(true);
        try {
          const result = await uploadFile(fileRef.current);
          if (result) {
            // path is like <slotId>/<uuid>.<ext>
            creativeUrl = result.path;
            creativeType = fileRef.current.type;
          }
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : "Upload failed.");
          setSaving(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      } else if (editingId && existingCreativeRef.current) {
        // Reuse existing URL for edits without new file
        creativeUrl = existingCreativeRef.current.creative_url;
        creativeType = existingCreativeRef.current.creative_type;
      }

      if (!creativeUrl && !editingId) {
        setUploadError("Please upload a creative image.");
        setSaving(false);
        return;
      }

      const payload: Record<string, unknown> = {
        brand_name: form.brand_name.trim(),
        destination_url: form.destination_url.trim(),
        slot_id: form.slot_id,
        is_active: form.is_active,
        priority: Number(form.priority) || 0,
        start_at: form.start_at || null,
        end_at: form.end_at || null,
        creative_type: creativeType,
      };

      if (creativeUrl) {
        payload.creative_url = creativeUrl;
      }

      const url = editingId
        ? `/api/admin/billboard/creatives/${editingId}`
        : "/api/admin/billboard/creatives";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Save failed.");
      }

      resetForm();
      setShowForm(false);
      await loadCreatives();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (c: Creative) => {
    await fetch(`/api/admin/billboard/creatives/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
    await loadCreatives();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/billboard/creatives/${id}`, { method: "DELETE" });
    if (res.ok) {
      setConfirmDelete(null);
      await loadCreatives();
    }
  };

  const getSlotLabel = (slotId: string) => {
    return SLOT_OPTIONS.find((s) => s.value === slotId)?.label ?? slotId;
  };

  return (
    <AdminLayoutClient
      admin={{
        user: {
          email: "",
          role: "admin",
        },
      }}
    >
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold">Brand Ads</h1>
            <p className="text-sm text-muted mt-1">
              Manage sponsored creatives and placements.
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="px-4 py-2 bg-foreground text-background text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            {showForm ? "Cancel" : "+ Add Brand"}
          </button>
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-8 space-y-6">
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit Brand Ad" : "New Brand Ad"}
            </h2>

            {/* Brand Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Brand Name</label>
              <input
                type="text"
                value={form.brand_name}
                onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                placeholder="e.g. Unacademy"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                maxLength={120}
                required
              />
            </div>

            {/* Creative Upload */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Creative {editingId ? "(leave blank to keep existing)" : ""}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-foreground file:text-background hover:file:opacity-90 file:cursor-pointer cursor-pointer"
              />
              {uploadError && <p className="text-xs text-red-600 mt-1.5">{uploadError}</p>}
              {previewUrl && (
                <div className="mt-3">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-40 rounded-lg border border-border object-contain bg-background-alt"
                  />
                </div>
              )}
              {editingId && !fileRef.current && (
                <p className="text-xs text-muted mt-1.5">Current creative will be kept.</p>
              )}
            </div>

            {/* Destination URL */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Destination URL</label>
              <input
                type="url"
                value={form.destination_url}
                onChange={(e) => setForm({ ...form, destination_url: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            {/* Placement */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Placement / Slot</label>
              <select
                value={form.slot_id}
                onChange={(e) => setForm({ ...form, slot_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {SLOT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Status</label>
                <select
                  value={form.is_active ? "active" : "inactive"}
                  onChange={(e) => setForm({ ...form, is_active: e.target.value === "active" })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Priority</label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  min={0}
                />
                <p className="text-xs text-muted mt-1">Higher priority = shown first in rotation.</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Start Date (optional)</label>
                <input
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">End Date (optional)</label>
                <input
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-foreground text-background font-medium text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? (uploading ? "Uploading..." : "Saving...") : editingId ? "Update Brand Ad" : "Save Brand Ad"}
            </button>
          </form>
        )}

        {/* Creative List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-card border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : creatives.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p className="text-lg mb-2">No brand ads yet</p>
            <p className="text-sm">Click &quot;Add Brand&quot; to create your first sponsored creative.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {creatives.map((c) => (
              <div
                key={c.id}
                className={`bg-card border rounded-2xl p-4 md:p-5 transition-colors ${
                  c.is_active ? "border-border" : "border-border/60 opacity-70"
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Preview */}
                  <div className="w-full sm:w-48 h-24 rounded-xl overflow-hidden bg-background-alt shrink-0">
                    <img
                      src={c.creative_url}
                      alt={c.brand_name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm">{c.brand_name}</h3>
                        <p className="text-xs text-muted mt-0.5">
                          {c.slot_label ?? getSlotLabel(c.slot_id)}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wider uppercase ${
                        c.is_active
                          ? "bg-green-500/10 text-green-600"
                          : "bg-muted/20 text-muted"
                      }`}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted">
                      <a
                        href={c.destination_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline truncate max-w-[200px]"
                      >
                        {c.destination_url}
                      </a>
                      <span>Priority: {c.priority}</span>
                      {c.start_at && <span>From: {new Date(c.start_at).toLocaleDateString()}</span>}
                      {c.end_at && <span>Until: {new Date(c.end_at).toLocaleDateString()}</span>}
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(c)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        c.is_active
                          ? "border-border hover:bg-background-alt text-muted"
                          : "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"
                      }`}
                    >
                      {c.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => startEdit(c)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-background-alt text-muted transition-colors"
                    >
                      Edit
                    </button>
                    {confirmDelete === c.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-background-alt text-muted transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(c.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-muted transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayoutClient>
  );
}
