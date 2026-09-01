"use client";

import { useState, useTransition } from "react";
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

type FormState = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  branch: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  status: "active" | "inactive";
};

const empty: FormState = {
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "A",
  branch: "cse",
  topic: "",
  difficulty: "medium",
  status: "active",
};

type GameQuestion = {
  id?: string;
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
};

export default function GameQuestionEditor({
  initial,
}: {
  initial?: GameQuestion;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>({
    ...empty,
    ...(initial
      ? {
          question_text: initial.question_text,
          option_a: initial.option_a,
          option_b: initial.option_b,
          option_c: initial.option_c,
          option_d: initial.option_d,
          correct_option: initial.correct_option as FormState["correct_option"],
          branch: initial.branch,
          topic: initial.topic,
          difficulty: initial.difficulty as FormState["difficulty"],
          status: initial.status as FormState["status"],
        }
      : {}),
  });

  const update = (patch: Partial<FormState>) =>
    setForm((f) => ({ ...f, ...patch }));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.question_text.trim()) errs.question_text = "Question is required.";
    if (!form.option_a.trim()) errs.option_a = "Option A is required.";
    if (!form.option_b.trim()) errs.option_b = "Option B is required.";
    if (!form.option_c.trim()) errs.option_c = "Option C is required.";
    if (!form.option_d.trim()) errs.option_d = "Option D is required.";
    if (!form.branch) errs.branch = "Branch is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      const url = initial?.id
        ? `/api/admin/game/questions/${initial.id}`
        : "/api/admin/game/questions";
      const method = initial?.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error || "Failed to save question.");
        return;
      }

      router.push("/admin/game/questions");
    });
  };

  const fieldClass = (field: string) =>
    `w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-accent ${
      errors[field] ? "border-error" : "border-border"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Question */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Question
        </label>
        <textarea
          value={form.question_text}
          onChange={(e) => update({ question_text: e.target.value })}
          rows={3}
          className={fieldClass("question_text")}
          placeholder="Enter the question text..."
        />
        {errors.question_text && (
          <p className="text-xs text-error mt-1">{errors.question_text}</p>
        )}
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-4">
        {(["A", "B", "C", "D"] as const).map((letter) => (
          <div key={letter}>
            <label className="block text-sm font-medium text-foreground mb-1">
              Option {letter}
            </label>
            <input
              type="text"
              value={
                letter === "A"
                  ? form.option_a
                  : letter === "B"
                    ? form.option_b
                    : letter === "C"
                      ? form.option_c
                      : form.option_d
              }
              onChange={(e) =>
                update({
                  [letter === "A"
                    ? "option_a"
                    : letter === "B"
                      ? "option_b"
                      : letter === "C"
                        ? "option_c"
                        : "option_d"]: e.target.value,
                } as any)
              }
              className={fieldClass(`option_${letter.toLowerCase()}`)}
              placeholder={`Option ${letter}`}
            />
            {errors[`option_${letter.toLowerCase()}`] && (
              <p className="text-xs text-error mt-1">
                {errors[`option_${letter.toLowerCase()}`]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Correct option */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Correct Option
        </label>
        <div className="flex gap-2">
          {(["A", "B", "C", "D"] as const).map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => update({ correct_option: letter })}
              className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                form.correct_option === letter
                  ? "bg-accent text-background"
                  : "border border-border hover:bg-background-alt"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Branch + Difficulty + Status */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Branch
          </label>
          <select
            value={form.branch}
            onChange={(e) => update({ branch: e.target.value })}
            className={fieldClass("branch")}
          >
            {BRANCHES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
          {errors.branch && (
            <p className="text-xs text-error mt-1">{errors.branch}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Difficulty
          </label>
          <select
            value={form.difficulty}
            onChange={(e) =>
              update({ difficulty: e.target.value as FormState["difficulty"] })
            }
            className={fieldClass("difficulty")}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              update({ status: e.target.value as FormState["status"] })
            }
            className={fieldClass("status")}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Topic */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Topic (optional)
        </label>
        <input
          type="text"
          value={form.topic}
          onChange={(e) => update({ topic: e.target.value })}
          className={fieldClass("topic")}
          placeholder="e.g. Data Structures, DBMS..."
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 text-sm font-medium text-background bg-accent rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          {pending ? "Saving..." : initial?.id ? "Update Question" : "Save Question"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium border border-border rounded-lg hover:bg-background-alt transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
