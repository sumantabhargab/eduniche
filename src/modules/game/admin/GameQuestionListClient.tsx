"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const BRANCHES = [
  { value: "cse", label: "CSE" },
  { value: "ece", label: "ECE" },
  { value: "ee", label: "EE" },
  { value: "me", label: "Mechanical" },
  { value: "civil", label: "Civil" },
  { value: "in", label: "IN" },
  { value: "pi", label: "PI" },
  { value: "ch", label: "CH" },
  { value: "bt", label: "Biotech" },
  { value: "mt", label: "Metallurgy" },
  { value: "xe", label: "XE" },
  { value: "xl", label: "XL" },
  { value: "tf", label: "Textile" },
  { value: "pe", label: "Petroleum" },
  { value: "ey", label: "EY" },
  { value: "ma", label: "Mathematics" },
  { value: "ar", label: "Architecture" },
  { value: "ag", label: "Agriculture" },
  { value: "gg", label: "Geology" },
  { value: "ph", label: "Physics" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

interface Filters {
  branch: string;
  status: string;
  search: string;
}

interface QuestionRow {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  branch: string;
  topic: string;
  difficulty: string;
  status: string;
  created_at: string;
}

export default function GameQuestionListClient({
  initialFilters,
}: {
  initialFilters: Filters;
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const filtersRef = useRef(initialFilters);
  const pageSize = 20;

  const buildUrl = useCallback(
    (f: Filters, p: number) => {
      const params = new URLSearchParams();
      if (f.branch) params.set("branch", f.branch);
      if (f.status) params.set("status", f.status);
      if (f.search) params.set("search", f.search);
      params.set("page", String(p));
      params.set("pageSize", String(pageSize));
      return `/api/admin/game/questions?${params.toString()}`;
    },
    [pageSize]
  );

  const fetchQuestions = useCallback(
    async (f: Filters, p: number) => {
      setLoading(true);
      try {
        const res = await fetch(buildUrl(f, p));
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setQuestions(data.questions || []);
        setTotal(data.total || 0);
        setPage(p);
      } catch {
        setQuestions([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [buildUrl]
  );

  useEffect(() => {
    fetchQuestions(filtersRef.current, 1);
  }, []);

  const updateFilters = (patch: Partial<Filters>) => {
    const next = { ...filtersRef.current, ...patch };
    filtersRef.current = next;
    router.replace(`/admin/game/questions?${new URLSearchParams(
      Object.fromEntries(Object.entries(next).filter(([, v]) => v))
    ).toString()}`);
    fetchQuestions(next, 1);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/game/questions/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setQuestions((prev) => prev.filter((q) => q.id !== deleteId));
      setTotal((t) => t - 1);
      setDeleteId(null);
    } catch {
      alert("Failed to delete question.");
    } finally {
      setDeleting(false);
    }
  };

  const truncate = (text: string, max = 60) =>
    text.length > max ? text.slice(0, max) + "..." : text;

  const totalPages = Math.ceil(total / pageSize) || 1;
  const branchLabel = (b: string) => BRANCHES.find((x) => x.value === b)?.label || b;

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search questions..."
          defaultValue={initialFilters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-accent w-64"
        />
        <select
          value={initialFilters.branch}
          onChange={(e) => updateFilters({ branch: e.target.value })}
          className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Branches</option>
          {BRANCHES.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        <select
          value={initialFilters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background-alt text-left">
              <th className="px-4 py-2.5 font-medium text-muted">Question</th>
              <th className="px-4 py-2.5 font-medium text-muted">Branch</th>
              <th className="px-4 py-2.5 font-medium text-muted">Correct</th>
              <th className="px-4 py-2.5 font-medium text-muted">Difficulty</th>
              <th className="px-4 py-2.5 font-medium text-muted">Status</th>
              <th className="px-4 py-2.5 font-medium text-muted">Created</th>
              <th className="px-4 py-2.5 font-medium text-muted text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Loading...
                </td>
              </tr>
            ) : questions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No questions found.
                </td>
              </tr>
            ) : (
              questions.map((q) => (
                <tr key={q.id} className="hover:bg-background-alt/50 transition-colors">
                  <td className="px-4 py-2.5 max-w-xs">
                    <p className="truncate" title={q.question_text}>
                      {truncate(q.question_text)}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{branchLabel(q.branch)}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-accent-subtle text-accent font-bold text-xs">
                      {q.correct_option}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted capitalize">{q.difficulty}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        q.status === "active"
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted">
                    {new Date(q.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() =>
                          router.push(`/admin/game/questions/${q.id}/edit`)
                        }
                        className="px-2 py-1 text-xs text-accent hover:bg-accent-subtle rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(q.id)}
                        className="px-2 py-1 text-xs text-error hover:bg-red-50 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted">
            {total} questions &middot; Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() =>
                fetchQuestions(filtersRef.current, page - 1)
              }
              className="px-3 py-1 text-xs border border-border rounded hover:bg-background-alt disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() =>
                fetchQuestions(filtersRef.current, page + 1)
              }
              className="px-3 py-1 text-xs border border-border rounded hover:bg-background-alt disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-serif text-foreground mb-2">
              Delete Question
            </h3>
            <p className="text-sm text-muted mb-4">
              This action cannot be undone. Are you sure?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-background-alt transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-error text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
