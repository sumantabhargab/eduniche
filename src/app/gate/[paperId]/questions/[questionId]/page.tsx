import { notFound } from "next/navigation";
import Link from "next/link";
import GateNav from "@/components/GateNav";
import { getPaperById, type GATEPaper } from "@/lib/gate/config";
import { getPaperQuestions } from "@/lib/gate/paper-data";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ paperId: string; questionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { questionId, paperId } = await params;
  const paper = getPaperById(paperId);
  const paperName = paper?.shortName || paperId.toUpperCase();
  const questions = getPaperQuestions(paperId);
  const q = questions.find((x) => x.id === questionId);
  if (!q) return { title: "Question Not Found — Eduneuro" };
  return {
    title: `${q.topic} — GATE ${paperName} ${q.year} — Eduneuro`,
    description: q.question.split("\n")[0],
  };
}

export default async function QuestionDetailPage({ params }: PageProps) {
  const { paperId, questionId } = await params;
  const paper = getPaperById(paperId);
  const paperName = paper?.shortName || paperId.toUpperCase();
  const questions = getPaperQuestions(paperId);
  const q = questions.find((x) => x.id === questionId);

  if (!q) {
    notFound();
  }

  return (
    <>
      <GateNav />
      <main>
        <section className="pt-8 pb-6 px-4 sm:px-6 border-b border-border">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 text-xs text-muted mb-3">
              <Link href={`/gate/${paperId}`} className="hover:text-foreground transition-colors">GATE {paperName}</Link>
              <span>/</span>
              <Link href={`/gate/${paperId}/questions`} className="hover:text-foreground transition-colors">Questions</Link>
              <span>/</span>
              <span className="text-foreground font-medium">{q.id}</span>
            </div>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`text-xs font-mono px-2 py-0.5 border ${
                q.type === "MCQ" ? "text-blue-600 border-blue-200 bg-blue-50" :
                q.type === "MSQ" ? "text-amber-600 border-amber-200 bg-amber-50" :
                "text-purple-600 border-purple-200 bg-purple-50"
              }`}>
                {q.type}
              </span>
              <span className="text-xs font-mono text-muted">{q.marks} marks</span>
              <span className="text-xs font-mono text-muted">GATE {paperName} {q.year}{q.set ? ` ${q.set}` : ""}</span>
              <span className={`text-xs capitalize ${
                q.difficulty === "easy" ? "text-green-600" :
                q.difficulty === "medium" ? "text-amber-600" : "text-red-600"
              }`}>
                {q.difficulty}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-foreground">
              {q.topic}
            </h1>
          </div>
        </section>

        <section className="py-8 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            {/* Question */}
            <div className="border border-border p-6 mb-6">
              <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-4">Question</h2>
              <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {q.question}
              </div>
            </div>

            {/* Options */}
            {q.options && q.options.length > 0 && (
              <div className="border border-border p-6 mb-6">
                <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-4">Options</h2>
                <div className="space-y-2">
                  {q.options.map((opt, i) => {
                    const labels = ["A", "B", "C", "D"];
                    const isCorrect = q.answer.includes(labels[i]);
                    return (
                      <div
                        key={i}
                        className={`px-4 py-3 border text-sm ${
                          isCorrect
                            ? "border-green-300 bg-green-50 text-green-800"
                            : "border-border text-foreground"
                        }`}
                      >
                        <span className="font-medium mr-2">{labels[i]}.</span>
                        {opt}
                        {isCorrect && (
                          <span className="ml-2 text-xs text-green-600 font-medium">✓ Correct</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Answer */}
            <div className="border border-green-200 bg-green-50 p-6 mb-6">
              <h2 className="text-xs font-mono text-green-700 uppercase tracking-widest mb-2">Answer</h2>
              <p className="text-lg font-mono text-green-800">{q.answer}</p>
            </div>

            {/* Explanation */}
            <div className="border border-border p-6 mb-6">
              <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-3">Explanation</h2>
              <p className="text-sm text-foreground leading-relaxed">{q.explanation}</p>
            </div>

            {/* Tags */}
            <div className="border border-border p-6 mb-6">
              <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {q.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 text-xs bg-muted/5 border border-border text-muted">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/gate/${paperId}/questions`}
                className="inline-flex items-center px-4 py-2 text-sm border border-border text-muted hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                ← All Questions
              </Link>
              <Link
                href={`/gate/${paperId}/doubt?q=${q.id}`}
                className="inline-flex items-center px-4 py-2 text-sm bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                Ask a Doubt About This
              </Link>
              <Link
                href={`/gate/${paperId}/practice?subject=${q.subjectId}`}
                className="inline-flex items-center px-4 py-2 text-sm border border-border text-muted hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                Practice This Topic
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
