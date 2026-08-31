import { notFound } from "next/navigation";
import Link from "next/link";
import GateNav from "@/components/GateNav";
import { getPaperById, type GATEPaper } from "@/lib/gate/config";
import { fetchPaperData } from "@/lib/gate/paper-data-client";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ paperId: string; questionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { questionId, paperId } = await params;
  const paper = getPaperById(paperId);
  if (!paper || paper.processingStatus !== "available") return { title: "Question Not Found — Eduneuro" };

  const data = await fetchPaperData(paperId);
  const q = data.questions.find((x) => x.id === questionId);
  if (!q) return { title: "Question Not Found — Eduneuro" };

  const paperName = paper.shortName;
  return {
    title: `${q.topic} — GATE ${paperName} ${q.year} — Eduneuro`,
    description: q.question.split("\n")[0],
  };
}

export default async function QuestionDetailPage({ params }: PageProps) {
  const { paperId, questionId } = await params;
  const paper = getPaperById(paperId);
  const paperName = paper?.shortName || paperId.toUpperCase();

  let questions: any[] = [];
  let q: any = null;
  try {
    const data = await fetchPaperData(paperId);
    questions = data.questions || [];
    q = questions.find((x) => x.id === questionId);
  } catch {
    // questions not available
  }

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
              <span className="text-xs text-muted">
                {paperName} {q.year}{q.set ? ` · ${q.set}` : ""}
              </span>
              <span className={`text-xs capitalize px-2 py-0.5 ${
                q.difficulty === "easy" ? "text-green-600" :
                q.difficulty === "medium" ? "text-amber-600" : "text-red-600"
              }`}>
                {q.difficulty}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-foreground">
              {q.id}
            </h1>
            <p className="text-sm text-muted mt-1">{q.topic}</p>
          </div>
        </section>

        {/* Question body */}
        <section className="py-8 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            {/* Question text */}
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-line mb-8">
              {q.question}
            </div>

            {/* Options */}
            {q.options && q.options.length > 0 && (
              <div className="space-y-2 mb-8">
                {q.options.map((opt: string, i: number) => {
                  const labels = ["A", "B", "C", "D", "E"];
                  const isCorrect = q.answer.includes(labels[i]);
                  return (
                    <div
                      key={i}
                      className="px-4 py-3 border border-border text-sm"
                    >
                      <span className="font-medium mr-2">{labels[i]}.</span>
                      {opt}
                      <span className="text-xs text-muted-light ml-2">[{isCorrect ? "Correct" : ""}]</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* NAT answer */}
            {q.type === "NAT" && (
              <div className="border border-border p-4 mb-8">
                <p className="text-xs text-muted mb-1">Answer</p>
                <p className="text-lg font-mono text-foreground">{q.answer}</p>
              </div>
            )}

            {/* MCQ/MSQ answer */}
            {q.type !== "NAT" && (
              <div className="border border-border p-4 mb-8">
                <p className="text-xs text-muted mb-1">Answer</p>
                <p className="text-lg font-medium text-foreground">{q.answer}</p>
              </div>
            )}

            {/* Explanation */}
            <div className="border border-border p-4 mb-8">
              <p className="text-xs text-muted mb-2">Explanation</p>
              <p className="text-sm text-foreground leading-relaxed">{q.explanation}</p>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4">
              <Link
                href={`/gate/${paperId}/doubt?q=${q.id}`}
                className="inline-flex items-center px-4 py-2 text-sm border border-accent text-accent hover:bg-accent/5 transition-colors"
              >
                Ask a Doubt
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
