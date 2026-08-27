"use client";

import { useState, useMemo, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import GateNav from "@/components/GateNav";
import { getPaperById, type GATEPaper } from "@/lib/gate/config";
import { getPaperQuestions, type ECEQuestion } from "@/lib/gate/paper-data";

type FilterType = "all" | "MCQ" | "MSQ" | "NAT";
type FilterMarks = "all" | "1" | "2";
type FilterDifficulty = "all" | "easy" | "medium" | "hard";
type SortField = "year" | "topic" | "marks" | "difficulty" | "id";
type SortDir = "asc" | "desc";

type Question = ECEQuestion;

export default function QuestionsPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const resolvedParams = use(params);
  const paperId = resolvedParams.paperId;
  const searchParams = useSearchParams();
  const topicFilter = searchParams.get("topic") || "all";

  const paper = getPaperById(paperId);
  const allQuestions = getPaperQuestions(paperId);
  const paperName = paper?.shortName || paperId.toUpperCase();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [marksFilter, setMarksFilter] = useState<FilterMarks>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<FilterDifficulty>("all");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");

  const filtered = useMemo(() => {
    let result = [...allQuestions];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (x) =>
          x.question.toLowerCase().includes(q) ||
          x.topic.toLowerCase().includes(q) ||
          x.answer.toLowerCase().includes(q) ||
          x.explanation.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((x) => x.type === typeFilter);
    }

    if (marksFilter !== "all") {
      result = result.filter((x) => x.marks === parseInt(marksFilter));
    }

    if (difficultyFilter !== "all") {
      result = result.filter((x) => x.difficulty === difficultyFilter);
    }

    if (topicFilter !== "all") {
      result = result.filter((x) => x.topic.toLowerCase().replace(/[^a-z0-9]/g, "-") === topicFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "year":
          cmp = a.year - b.year;
          break;
        case "topic":
          cmp = a.topic.localeCompare(b.topic);
          break;
        case "marks":
          cmp = a.marks - b.marks;
          break;
        case "difficulty":
          const order = { easy: 0, medium: 1, hard: 2 };
          cmp = order[a.difficulty] - order[b.difficulty];
          break;
        case "id":
          cmp = a.id.localeCompare(b.id);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [query, typeFilter, marksFilter, difficultyFilter, sortField, sortDir, topicFilter]);

  const uniqueTopics = useMemo(() => {
    const map = new Map<string, string>();
    allQuestions.forEach((q) => {
      const key = q.topic.toLowerCase().replace(/[^a-z0-9]/g, "-");
      map.set(key, q.topic);
    });
    return map;
  }, [allQuestions]);

  const typeCounts = useMemo(() => {
    const counts = { all: allQuestions.length, MCQ: 0, MSQ: 0, NAT: 0 };
    allQuestions.forEach((q) => { counts[q.type]++; });
    return counts;
  }, [allQuestions]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 text-accent">
      {sortField === field ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  return (
    <>
      <GateNav />
      <main>
        {/* Header */}
        <section className="pt-8 pb-6 px-4 sm:px-6 border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 text-xs text-muted mb-3">
              <Link href={`/gate/${resolvedParams.paperId}`} className="hover:text-foreground transition-colors">
                GATE {paperName}
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">Questions</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
                  Previous Year Questions
                </h1>
                <p className="text-sm text-muted mt-1">
                  {allQuestions.length} questions from GATE {paperName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    viewMode === "list" ? "border-accent text-accent" : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    viewMode === "cards" ? "border-accent text-accent" : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  Cards
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-4 px-4 sm:px-6 border-b border-border bg-background-alt">
          <div className="max-w-6xl mx-auto">
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions, topics, answers..."
                className="w-full sm:w-96 px-3 py-2 text-sm bg-background border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Type filter */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted mr-1">Type:</span>
                {(["all", "MCQ", "MSQ", "NAT"] as FilterType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-2.5 py-1 text-xs border transition-colors ${
                      typeFilter === t
                        ? "border-accent text-accent bg-accent/5"
                        : "border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {t === "all" ? "All" : `${t} (${typeCounts[t]})`}
                  </button>
                ))}
              </div>

              {/* Marks filter */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted mr-1">Marks:</span>
                {(["all", "1", "2"] as FilterMarks[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMarksFilter(m)}
                    className={`px-2.5 py-1 text-xs border transition-colors ${
                      marksFilter === m
                        ? "border-accent text-accent bg-accent/5"
                        : "border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {m === "all" ? "All" : `${m} mark`}
                  </button>
                ))}
              </div>

              {/* Difficulty filter */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted mr-1">Level:</span>
                {(["all", "easy", "medium", "hard"] as FilterDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficultyFilter(d)}
                    className={`px-2.5 py-1 text-xs border transition-colors ${
                      difficultyFilter === d
                        ? "border-accent text-accent bg-accent/5"
                        : "border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {d === "all" ? "All" : d}
                  </button>
                ))}
              </div>

              {/* Topic filter */}
              {topicFilter !== "all" && (
                <button
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.delete("topic");
                    window.history.replaceState({}, "", url);
                    window.location.reload();
                  }}
                  className="px-2.5 py-1 text-xs border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  Clear topic filter
                </button>
              )}
            </div>

            <div className="mt-3 text-xs text-muted">
              Showing {filtered.length} of {allQuestions.length} questions
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="py-6 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-16 border border-border">
                <p className="text-sm text-muted">No questions match your filters.</p>
                <button
                  onClick={() => { setQuery(""); setTypeFilter("all"); setMarksFilter("all"); setDifficultyFilter("all"); }}
                  className="mt-3 text-xs text-accent hover:text-accent-hover transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : viewMode === "list" ? (
              /* List View */
              <div className="border border-border">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-2 px-4 py-2 bg-background-alt border-b border-border text-xs font-mono text-muted uppercase tracking-wider">
                  <button onClick={() => toggleSort("id")} className="text-left hover:text-foreground transition-colors">
                    Question <SortIcon field="id" />
                  </button>
                  <button onClick={() => toggleSort("year")} className="text-left hover:text-foreground transition-colors">
                    Year <SortIcon field="year" />
                  </button>
                  <button onClick={() => toggleSort("marks")} className="text-left hover:text-foreground transition-colors">
                    Marks <SortIcon field="marks" />
                  </button>
                  <span>Type</span>
                  <button onClick={() => toggleSort("difficulty")} className="text-left hover:text-foreground transition-colors">
                    Level <SortIcon field="difficulty" />
                  </button>
                </div>
                {filtered.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuestion(q)}
                    className="w-full text-left grid grid-cols-[1fr_80px_80px_80px_100px] gap-2 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors items-center"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{q.question.split("\n")[0]}</p>
                      <p className="text-xs text-muted mt-0.5 truncate">{q.topic}</p>
                    </div>
                    <span className="text-xs font-mono text-muted">{q.year}{q.set ? ` ${q.set}` : ""}</span>
                    <span className="text-xs font-mono text-muted">{q.marks}</span>
                    <span className={`text-xs font-mono px-1.5 py-0.5 border ${
                      q.type === "MCQ" ? "text-blue-600 border-blue-200 bg-blue-50" :
                      q.type === "MSQ" ? "text-amber-600 border-amber-200 bg-amber-50" :
                      "text-purple-600 border-purple-200 bg-purple-50"
                    }`}>
                      {q.type}
                    </span>
                    <span className={`text-xs capitalize ${
                      q.difficulty === "easy" ? "text-green-600" :
                      q.difficulty === "medium" ? "text-amber-600" : "text-red-600"
                    }`}>
                      {q.difficulty}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              /* Cards View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuestion(q)}
                    className="text-left p-4 border border-border hover:border-accent transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono px-1.5 py-0.5 border ${
                          q.type === "MCQ" ? "text-blue-600 border-blue-200 bg-blue-50" :
                          q.type === "MSQ" ? "text-amber-600 border-amber-200 bg-amber-50" :
                          "text-purple-600 border-purple-200 bg-purple-50"
                        }`}>
                          {q.type}
                        </span>
                        <span className="text-xs font-mono text-muted">{q.marks} marks</span>
                      </div>
                      <span className="text-xs font-mono text-muted">{q.year}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed line-clamp-3 mb-2">
                      {q.question.split("\n")[0]}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted truncate">{q.topic}</p>
                      <span className={`text-xs capitalize shrink-0 ml-2 ${
                        q.difficulty === "easy" ? "text-green-600" :
                        q.difficulty === "medium" ? "text-amber-600" : "text-red-600"
                      }`}>
                        {q.difficulty}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <QuestionDetailModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          paperId={resolvedParams.paperId}
          paperName={paperName}
        />
      )}
    </>
  );
}

function QuestionDetailModal({
  question,
  onClose,
  paperId,
  paperName,
}: {
  question: Question;
  onClose: () => void;
  paperId: string;
  paperName: string;
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-background border border-border my-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted">{question.id}</span>
            <span className={`text-xs font-mono px-2 py-0.5 border ${
              question.type === "MCQ" ? "text-blue-600 border-blue-200 bg-blue-50" :
              question.type === "MSQ" ? "text-amber-600 border-amber-200 bg-amber-50" :
              "text-purple-600 border-purple-200 bg-purple-50"
            }`}>
              {question.type}
            </span>
            <span className="text-xs font-mono text-muted">{question.marks} marks</span>
            <span className="text-xs font-mono text-muted">{paperName} {question.year}{question.set ? ` ${question.set}` : ""}</span>
            <span className={`text-xs capitalize ${
              question.difficulty === "easy" ? "text-green-600" :
              question.difficulty === "medium" ? "text-amber-600" : "text-red-600"
            }`}>
              {question.difficulty}
            </span>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors text-xl leading-none">
            ×
          </button>
        </div>

        <div className="px-6 py-6">
          {/* Topic & year */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted">{question.topic}</span>
            <span className="text-xs text-muted-light">·</span>
            <span className="text-xs text-muted">GATE {paperName} {question.year}</span>
          </div>

          {/* Question text */}
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-line mb-6">
            {question.question}
          </div>

          {/* Options */}
          {question.options && question.options.length > 0 && (
            <div className="space-y-2 mb-6">
              {question.options.map((opt, i) => {
                const labels = ["A", "B", "C", "D", "E"];
                const isCorrect = question.answer.includes(labels[i]);
                return (
                  <div
                    key={i}
                    className={`px-4 py-2.5 border text-sm ${
                      showAnswer && isCorrect
                        ? "border-green-300 bg-green-50 text-green-800"
                        : "border-border text-foreground"
                    }`}
                  >
                    <span className="font-medium mr-2">{labels[i]}.</span>
                    {opt}
                    {showAnswer && isCorrect && (
                      <span className="ml-2 text-xs text-green-600 font-medium">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* NAT answer */}
          {question.type === "NAT" && (
            <div className="border border-border p-4 mb-6">
              <p className="text-xs text-muted mb-1">Answer (Numerical)</p>
              {showAnswer ? (
                <p className="text-lg font-mono text-foreground">{question.answer}</p>
              ) : (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="text-sm text-accent hover:text-accent-hover transition-colors"
                >
                  Show answer
                </button>
              )}
            </div>
          )}

          {/* MCQ/MSQ answer */}
          {question.type !== "NAT" && (
            <div className="mb-6">
              {showAnswer ? (
                <div className="border border-green-200 bg-green-50 px-4 py-3">
                  <p className="text-xs text-green-700 mb-1">Answer</p>
                  <p className="text-sm font-medium text-green-800">{question.answer}</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="px-4 py-2 text-sm bg-foreground text-background hover:bg-foreground/90 transition-colors"
                >
                  Show Answer
                </button>
              )}
            </div>
          )}

          {/* Explanation */}
          {showExplanation ? (
            <div className="border border-border p-4 mb-6">
              <p className="text-xs text-muted mb-2">Explanation</p>
              <p className="text-sm text-foreground leading-relaxed">{question.explanation}</p>
            </div>
          ) : showAnswer && (
            <button
              onClick={() => setShowExplanation(true)}
              className="text-xs text-accent hover:text-accent-hover transition-colors"
            >
              Show explanation
            </button>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-border mt-6">
            <Link
              href={`/gate/${paperId}/doubt?q=${question.id}`}
              className="inline-flex items-center px-4 py-2 text-sm border border-accent text-accent hover:bg-accent/5 transition-colors"
            >
              Ask a Doubt
            </Link>
            <Link
              href={`/gate/${paperId}/practice?subject=${question.subjectId}`}
              className="inline-flex items-center px-4 py-2 text-sm border border-border text-muted hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              Practice This Topic
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
