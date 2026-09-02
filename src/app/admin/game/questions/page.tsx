"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BRANCHES } from "@/modules/game/branches";

type Question = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  branch: string;
  topic: string | null;
  created_at: string;
  updated_at: string;
};

function AdminGameQuestionsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [branchFilter, setBranchFilter] = useState(searchParams.get("branch") || "");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchQuestions = useCallback(async (p: number, s?: string, b?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      if (s) params.set("search", s);
      if (b) params.set("branch", b);

      const res = await fetch(`/api/admin/game/questions?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push("/admin/login");
          return;
        }
        return;
      }
      const data = await res.json();
      setQuestions(data.questions);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setPage(data.page);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchQuestions(1, search, branchFilter);
  }, []);

  const handleSearchChange = (v: string) => {
    setSearch(v);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchQuestions(1, v, branchFilter);
    }, 400);
  };

  const handleBranchChange = (b: string) => {
    setBranchFilter(b);
    fetchQuestions(1, search, b);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/game/questions/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setQuestions((qs) => qs.filter((q) => q.id !== deleteId));
        setTotal((t) => t - 1);
        setDeleteId(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getBranchLabel = (id: string) => {
    return BRANCHES.find((b) => b.id === id)?.shortName || id;
  };

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-white">GATE Questions</h1>
            <p className="text-sm text-gray-500 mt-1">
              {total} question{total !== 1 ? "s" : ""} total
            </p>
          </div>
          <button
            onClick={() => router.push("/admin/game/questions/new")}
            className="px-4 py-2 bg-cyan-500 text-gray-900 font-bold text-sm rounded-lg hover:bg-cyan-400 transition-colors"
          >
            + New Question
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 max-w-md px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-400/50"
          />
          <select
            value={branchFilter}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-cyan-400/50"
          >
            <option value="">All branches</option>
            {BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.shortName}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/30">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Correct
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                    Loading...
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                    No questions found.
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-900/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-200 truncate max-w-md">
                        {q.question_text}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400">{getBranchLabel(q.branch)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-cyan-400/10 text-cyan-400 text-xs font-bold">
                        {q.correct_option}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{formatDate(q.created_at)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/game/questions/${q.id}/edit`)}
                          className="px-2 py-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(q.id)}
                          className="px-2 py-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
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
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => fetchQuestions(page - 1, search, branchFilter)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-800 rounded text-gray-400 hover:text-gray-200 disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => fetchQuestions(page + 1, search, branchFilter)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm border border-gray-800 rounded text-gray-400 hover:text-gray-200 disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111827] border border-gray-800 rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Delete Question</h3>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-rose-500 text-white font-bold rounded-lg hover:bg-rose-400 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminGameQuestionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0e17] flex items-center justify-center text-gray-500 text-sm">Loading...</div>}>
      <AdminGameQuestionsInner />
    </Suspense>
  );
}
