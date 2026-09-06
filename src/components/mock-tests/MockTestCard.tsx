/**
 * MockTestCard — displays a single mock test in a listing grid.
 */

"use client";

import Link from "next/link";
import type { MockTestListItem } from "@/lib/mock-tests/server";

interface MockTestCardProps {
  test: MockTestListItem;
}

const MOCK_LABELS = ["Mock 01", "Mock 02", "Mock 03", "Mock 04", "Mock 05"];
const MOCK_COLORS = [
  "from-amber-500/10 to-orange-500/5 border-amber-500/20",
  "from-blue-500/10 to-indigo-500/5 border-blue-500/20",
  "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
  "from-purple-500/10 to-pink-500/5 border-purple-500/20",
  "from-cyan-500/10 to-sky-500/5 border-cyan-500/20",
];

export default function MockTestCard({ test }: MockTestCardProps) {
  const mockIndex = test.mock_number - 1;
  const colorClass = MOCK_COLORS[mockIndex] || MOCK_COLORS[0];
  const label = MOCK_LABELS[mockIndex] || `Mock ${String(test.mock_number).padStart(2, "0")}`;

  const totalQuestions = test.question_count;
  const easy = test.difficulty_distribution?.easy || 25;
  const moderate = test.difficulty_distribution?.moderate || 50;
  const hard = test.difficulty_distribution?.hard || 25;

  return (
    <Link
      href={`/mock-tests/${test.branch}/mock-${test.mock_number}`}
      className={`group relative bg-card border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:border-foreground/20 bg-gradient-to-br ${colorClass}`}
    >
      {/* Mock badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-foreground/5 border border-border">
          <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium">{label}</span>
        </div>
        <span className="text-[10px] font-mono text-muted uppercase tracking-wider">
          Premium
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-sm mb-1 group-hover:text-accent transition-colors">
        {test.title}
      </h3>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.625c0-.621.504-1.125 1.125-1.125h4.286c.621 0 1.125.504 1.125 1.125v11.286c0 .621-.504 1.125-1.125 1.125h-4.286a1.125 1.125 0 01-1.125-1.125V5.625z" />
          </svg>
          <span>{totalQuestions} Questions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{test.duration_minutes} min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <span>{test.maximum_marks} Marks</span>
        </div>
      </div>

      {/* Difficulty bar */}
      <div className="mt-4">
        <div className="flex items-center gap-1 text-[10px] text-muted mb-1.5">
          <span className="text-emerald-500">Easy {easy}%</span>
          <span className="text-amber-500 ml-auto">Moderate {moderate}%</span>
          <span className="text-red-400 ml-2">Hard {hard}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden flex">
          <div className="bg-emerald-500/60" style={{ width: `${easy}%` }} />
          <div className="bg-amber-500/60" style={{ width: `${moderate}%` }} />
          <div className="bg-red-400/60" style={{ width: `${hard}%` }} />
        </div>
      </div>

      {/* Subject tags */}
      {test.subject_distribution && test.subject_distribution.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {test.subject_distribution.slice(0, 4).map((subject) => (
            <span
              key={subject.name}
              className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/5 border border-border text-muted"
            >
              {subject.name}
            </span>
          ))}
          {test.subject_distribution.length > 4 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/5 text-muted">
              +{test.subject_distribution.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Arrow */}
      <div className="mt-5 flex items-center text-xs text-muted group-hover:text-foreground transition-colors">
        <span>Start Mock Test</span>
        <svg className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </Link>
  );
}
