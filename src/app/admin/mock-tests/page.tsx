/**
 * Admin Mock Tests Management Page
 *
 * Allows admins to:
 * - View all mock tests in the system
 * - Ingest new mock tests from local filesystem
 * - Toggle visibility (draft/published/archived)
 * - Delete mock tests
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { EduNeuroLoader } from "@/components/loading";

interface MockTest {
  id: string;
  branch: string;
  branch_code: string;
  branch_name: string;
  mock_number: number;
  title: string;
  storage_path: string;
  question_count: number;
  maximum_marks: number;
  duration_minutes: number;
  access_tier: string;
  visibility: string;
  created_at: string;
}

export default function AdminMockTestsPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchTests = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/mock-tests");
      if (res.ok) {
        const { tests } = await res.json();
        setTests(tests || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleIngest = async () => {
    setIngesting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/mock-tests/ingest", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setMessage({ text: `Ingestion complete! ${data.ingested} tests ingested.`, type: "success" });
        await fetchTests();
      } else {
        setMessage({ text: data.error || "Ingestion failed.", type: "error" });
      }
    } catch {
      setMessage({ text: "Ingestion failed. Please try again.", type: "error" });
    } finally {
      setIngesting(false);
    }
  };

  const toggleVisibility = async (id: string, current: string) => {
    const next = current === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/admin/mock-tests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: next }),
      });

      if (res.ok) {
        await fetchTests();
      }
    } catch {
      // Silently fail
    }
  };

  const deleteTest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mock test? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/mock-tests/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchTests();
      }
    } catch {
      // Silently fail
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <EduNeuroLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl mb-1">Mock Tests</h1>
          <p className="text-sm text-muted">
            Manage premium mock test PDFs. {tests.length} tests in system.
          </p>
        </div>
        <button
          onClick={handleIngest}
          disabled={ingesting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {ingesting ? (
            <>
              <EduNeuroLoader size="sm" />
              <span>Ingesting…</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Ingest from Filesystem</span>
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl text-sm ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600"
              : "bg-red-500/10 border border-red-500/20 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {tests.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <svg className="w-12 h-12 text-muted/40 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-sm text-muted mb-2">No mock tests in the system yet.</p>
          <p className="text-xs text-muted/60">Use the ingestion script to add PDFs from the premium_mock_tests/ directory.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests
            .sort((a, b) => a.branch.localeCompare(b.branch) || a.mock_number - b.mock_number)
            .map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-foreground/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted">{test.branch_code}</span>
                    <span className="text-xs text-muted/40">·</span>
                    <span className="text-xs font-medium">Mock {String(test.mock_number).padStart(2, "0")}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      test.visibility === "published"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : test.visibility === "draft"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-gray-500/10 text-gray-500"
                    }`}>
                      {test.visibility}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium truncate">{test.title}</h3>
                  <p className="text-xs text-muted mt-0.5">
                    {test.question_count} questions · {test.duration_minutes} min · {test.maximum_marks} marks
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => toggleVisibility(test.id, test.visibility)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      test.visibility === "published"
                        ? "border border-border hover:bg-foreground/5 text-muted"
                        : "bg-foreground text-background hover:opacity-90"
                    }`}
                  >
                    {test.visibility === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => deleteTest(test.id)}
                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.061-.94-1.75-1.816-1.618l-2.567.524a2.25 2.25 0 01-1.916-1.917l.524-2.567C15.876 1.672 14.186 1.732 13.125 2.793m-2.25 0V1.5m0 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
