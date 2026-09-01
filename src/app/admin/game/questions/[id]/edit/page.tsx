"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BRANCHES, type BranchId } from "@/modules/game/branches";

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
};

type Errors = {
  question_text?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option?: string;
  branch?: string;
  _form?: string;
};

export default function EditGameQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [form, setForm] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A" as "A" | "B" | "C" | "D",
    branch: "" as BranchId | "",
    topic: "",
  });

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await fetch(`/api/admin/game/questions/${id}`);
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.push("/admin/login");
            return;
          }
          router.push("/admin/game/questions");
          return;
        }
        const data = await res.json();
        const q = data.question;
        setForm({
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          branch: q.branch,
          topic: q.topic || "",
        });
      } catch {
        router.push("/admin/game/questions");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const errs: Errors = {};
    if (!form.question_text.trim()) errs.question_text = "Question is required.";
    if (!form.option_a.trim()) errs.option_a = "Required.";
    if (!form.option_b.trim()) errs.option_b = "Required.";
    if (!form.option_c.trim()) errs.option_c = "Required.";
    if (!form.option_d.trim()) errs.option_d = "Required.";
    if (!form.branch) errs.branch = "Select a branch.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/game/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_text: form.question_text.trim(),
          option_a: form.option_a.trim(),
          option_b: form.option_b.trim(),
          option_c: form.option_c.trim(),
          option_d: form.option_d.trim(),
          correct_option: form.correct_option,
          branch: form.branch,
          topic: form.topic.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({ _form: data.error || "Failed to update." });
        setSaving(false);
        return;
      }

      router.push("/admin/game/questions");
    } catch {
      setErrors({ _form: "Network error. Try again." });
      setSaving(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 bg-gray-900/50 border rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-400/50 ${
      errors[field as keyof Errors] ? "border-rose-500" : "border-gray-800"
    }`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/game/questions"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-white">Edit Question</h1>
        </div>

        {errors._form && (
          <div className="mb-6 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400">
            {errors._form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Question *
            </label>
            <textarea
              rows={3}
              value={form.question_text}
              onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              placeholder="Enter the question..."
              className={inputClass("question_text")}
            />
            {errors.question_text && (
              <p className="mt-1 text-xs text-rose-400">{errors.question_text}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Option A *
              </label>
              <input
                type="text"
                value={form.option_a}
                onChange={(e) => setForm({ ...form, option_a: e.target.value })}
                placeholder="Option A"
                className={inputClass("option_a")}
              />
              {errors.option_a && (
                <p className="mt-1 text-xs text-rose-400">{errors.option_a}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Option B *
              </label>
              <input
                type="text"
                value={form.option_b}
                onChange={(e) => setForm({ ...form, option_b: e.target.value })}
                placeholder="Option B"
                className={inputClass("option_b")}
              />
              {errors.option_b && (
                <p className="mt-1 text-xs text-rose-400">{errors.option_b}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Option C *
              </label>
              <input
                type="text"
                value={form.option_c}
                onChange={(e) => setForm({ ...form, option_c: e.target.value })}
                placeholder="Option C"
                className={inputClass("option_c")}
              />
              {errors.option_c && (
                <p className="mt-1 text-xs text-rose-400">{errors.option_c}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Option D *
              </label>
              <input
                type="text"
                value={form.option_d}
                onChange={(e) => setForm({ ...form, option_d: e.target.value })}
                placeholder="Option D"
                className={inputClass("option_d")}
              />
              {errors.option_d && (
                <p className="mt-1 text-xs text-rose-400">{errors.option_d}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Correct Option *
              </label>
              <select
                value={form.correct_option}
                onChange={(e) =>
                  setForm({
                    ...form,
                    correct_option: e.target.value as "A" | "B" | "C" | "D",
                  })
                }
                className={`${inputClass("correct_option")} appearance-none`}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Branch *
              </label>
              <select
                value={form.branch}
                onChange={(e) =>
                  setForm({ ...form, branch: e.target.value as BranchId | "" })
                }
                className={`${inputClass("branch")} appearance-none`}
              >
                <option value="">Select branch</option>
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.shortName}
                  </option>
                ))}
              </select>
              {errors.branch && (
                <p className="mt-1 text-xs text-rose-400">{errors.branch}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Topic <span className="text-gray-600 normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="e.g., Data Structures, Algorithms"
              className={inputClass("topic")}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-cyan-500 text-gray-900 font-bold rounded-lg hover:bg-cyan-400 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Update Question"}
            </button>
            <Link
              href="/admin/game/questions"
              className="px-6 py-2.5 border border-gray-700 text-gray-400 rounded-lg hover:text-gray-200 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
