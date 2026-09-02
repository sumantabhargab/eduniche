"use client";

import { useState, useRef, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import GateNav from "@/components/GateNav";
import MarkdownRenderer from "@/modules/virtual-library/features/ai-doubt-engine/components/MarkdownRenderer";
import { getPaperById, type GATEPaper } from "@/lib/gate/config";
import { fetchPaperData, type Question } from "@/lib/gate/paper-data-client";

function IconSparkles({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

const DOUBT_SUGGESTIONS = [
  "Explain the core concept behind this question",
  "Show a step-by-step solution",
  "What topics should I study for this?",
  "What are common mistakes in this type of question?",
  "Give me a similar practice question",
  "Explain why other options are wrong",
];

let msgCounter = 0;

function nextId(): string {
  return `msg-${Date.now()}-${++msgCounter}`;
}

export default function DoubtEnginePage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const questionId = searchParams.get("q");

  const paper = getPaperById(resolvedParams.paperId);
  const paperName = paper?.shortName || resolvedParams.paperId.toUpperCase();
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchPaperData(resolvedParams.paperId)
      .then((data) => {
        if (!cancelled) setQuestions(data.questions || []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [resolvedParams.paperId, paper]);

  const allQuestions = questions;

  const selectedQuestion = questionId
    ? allQuestions.find((q) => q.id === questionId) || null
    : null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Re-initialize messages when selected question changes
  useEffect(() => {
    if (!selectedQuestion) {
      setMessages([]);
      return;
    }
    setMessages([
      {
        id: nextId(),
        role: "assistant",
        content: `I see you're asking about **${selectedQuestion.topic}** from GATE ${paperName} ${selectedQuestion.year}.\n\nHere's the question:\n\n> ${selectedQuestion.question.split("\n")[0]}...\n\nWhat would you like to understand about this question?`,
        timestamp: Date.now(),
      },
    ]);
  }, [selectedQuestion?.id, paperName]);

  const generateResponse = (userMessage: string): string => {
    if (!selectedQuestion) {
      return "Please select a specific question to discuss. You can browse questions from the Questions page.";
    }

    const msg = userMessage.toLowerCase();

    if (msg.includes("concept") || msg.includes("core") || msg.includes("explain") && !msg.includes("step")) {
      return `## Core Concept: ${selectedQuestion.topic}\n\nThis question tests your understanding of **${selectedQuestion.topic.toLowerCase()}**, which is a fundamental concept in ${selectedQuestion.subject}.\n\n**Key idea:** ${selectedQuestion.explanation}\n\n${selectedQuestion.type === "MSQ" ? "Note: This is a multiple-select question, so more than one option may be correct." : ""}\n\nWould you like me to elaborate on any specific part?`;
    }

    if (msg.includes("step") || msg.includes("solution") || msg.includes("solve")) {
      let steps = `## Step-by-Step Solution\n\n`;
      steps += `**Given:** ${selectedQuestion.type} question worth ${selectedQuestion.marks} marks.\n\n`;
      steps += `**Analysis:**\n`;
      steps += `${selectedQuestion.explanation}\n\n`;
      if (selectedQuestion.options && selectedQuestion.options.length > 0) {
        steps += `**Evaluating each option:**\n\n`;
        const labels = ["A", "B", "C", "D"];
        selectedQuestion.options.forEach((opt, i) => {
          const isCorrect = selectedQuestion.answer.includes(labels[i]);
          steps += `${labels[i]}. ${opt} — ${isCorrect ? "✓ Correct" : "✗ Incorrect"}\n`;
          if (!isCorrect) {
            steps += `   → This option is incorrect because...\n`;
          }
        });
      }
      steps += `\n**Answer:** ${selectedQuestion.answer}`;
      return steps;
    }

    if (msg.includes("topic") || msg.includes("study") || msg.includes("prepare") || msg.includes("learn")) {
      const relatedQuestions = allQuestions.filter(
        (q) => q.topic === selectedQuestion.topic && q.id !== selectedQuestion.id
      );
      let response = `## Study Guide for ${selectedQuestion.topic}\n\n`;
      response += `This topic is part of **${selectedQuestion.subject}** and appears frequently in GATE ${paperName}.\n\n`;
      response += `**Key areas to focus on:**\n`;
      response += `1. Understand the formal definitions and properties\n`;
      response += `2. Practice problem-solving with past GATE questions\n`;
      response += `3. Learn the theorems and their proofs\n`;
      response += `4. Apply concepts to different problem types\n\n`;
      if (relatedQuestions.length > 0) {
        response += `**Related questions in this topic:**\n`;
        relatedQuestions.slice(0, 5).forEach((q) => {
          response += `- ${q.year} (${q.type}, ${q.marks} marks)\n`;
        });
      }
      return response;
    }

    if (msg.includes("mistake") || msg.includes("common") || msg.includes("trap") || msg.includes("wrong")) {
      let response = `## Common Mistakes to Avoid\n\n`;
      response += `**For this question type (${selectedQuestion.type}):**\n\n`;
      if (selectedQuestion.type === "MSQ") {
        response += `1. **Partial marking confusion:** Remember that MSQ gives partial credit. If you select 3 out of 4 correct options, you get partial marks (not zero).\n`;
        response += `2. **Overthinking:** Don't second-guess yourself — if a statement is clearly true/false, commit to it.\n`;
      } else if (selectedQuestion.type === "NAT") {
        response += `1. **Precision:** NAT answers require exact numerical values. Rounding errors lead to zero marks.\n`;
        response += `2. **Units:** Always check if the answer requires a specific format or precision.\n`;
      } else {
        response += `1. **Elimination strategy:** Even if you don't know the answer, systematic elimination of wrong options improves your odds.\n`;
        response += `2. **Rereading:** Always reread the question — subtle wording like "NOT", "always", "never" changes everything.\n`;
      }
      response += `\n**Topic-specific pitfalls for ${selectedQuestion.topic}:**\n`;
      response += `- Make sure you understand the formal definitions before applying them\n`;
      response += `- Practice with a variety of question patterns in this topic\n`;
      return response;
    }

    if (msg.includes("similar") || msg.includes("practice") || msg.includes("like this")) {
      const related = allQuestions.filter(
        (q) => q.topic === selectedQuestion.topic && q.id !== selectedQuestion.id
      ).slice(0, 3);

      let response = `## Similar Practice Questions\n\n`;
      if (related.length > 0) {
        related.forEach((q, i) => {
          response += `**${i + 1}. GATE ${paperName} ${q.year}** (${q.type}, ${q.marks} marks)\n`;
          response += `${q.question.split("\n")[0]}\n\n`;
        });
      } else {
        response += `Try questions from the same topic (${selectedQuestion.topic}) in the Questions browser.\n`;
      }
      return response;
    }

    if (msg.includes("option") || msg.includes("why") || msg.includes("wrong") || msg.includes("correct")) {
      if (selectedQuestion.options && selectedQuestion.options.length > 0) {
        const labels = ["A", "B", "C", "D"];
        const correctLabels = selectedQuestion.answer.split(/[,\s]+/).filter(Boolean);

        let response = `## Why the Answer is "${selectedQuestion.answer}"\n\n`;
        response += `${selectedQuestion.explanation}\n\n`;
        response += `**Option analysis:**\n\n`;
        selectedQuestion.options.forEach((opt, i) => {
          const isCorrect = correctLabels.includes(labels[i]);
          response += `**${labels[i]}.** ${isCorrect ? "✓ Correct" : "✗ Incorrect"}\n`;
          response += `${opt}\n\n`;
        });
        return response;
      }
      return selectedQuestion.explanation;
    }

    // Default
    return `Here's what I can tell you about this question:\n\n**Question:** ${selectedQuestion.question.split("\n")[0]}\n\n**Answer:** ${selectedQuestion.answer}\n\n**Explanation:** ${selectedQuestion.explanation}\n\nWould you like me to explain a specific aspect in more detail? You can ask about:\n- Step-by-step solution\n- The core concepts involved\n- Common mistakes to avoid\n- Similar practice questions`;
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: nextId(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response: Message = {
        id: nextId(),
        role: "assistant",
        content: generateResponse(text),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 800 + Math.random() * 1200);
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => handleSend(), 50);
  };

  return (
    <>
      <GateNav />
      <main className="h-[calc(100vh-3rem)] flex flex-col">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2 text-xs text-muted mb-2">
            <Link href={`/gate/${resolvedParams.paperId}`} className="hover:text-foreground transition-colors">GATE {paperName}</Link>
            <span>/</span>
            <Link href={`/gate/${resolvedParams.paperId}/questions`} className="hover:text-foreground transition-colors">Questions</Link>
            <span>/</span>
            <span className="text-foreground">Doubt Engine</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-foreground">
                AI Doubt Engine
              </h1>
              <p className="text-xs text-muted mt-0.5">
                Ask anything about this question — concepts, solutions, mistakes, related topics
              </p>
            </div>
            {selectedQuestion && (
              <Link
                href={`/gate/${resolvedParams.paperId}/questions/${selectedQuestion.id}`}
                className="text-xs text-accent hover:text-accent-hover transition-colors"
              >
                View full question
              </Link>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {!selectedQuestion && messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-muted mb-4 inline-block">
                  <IconSparkles className="w-10 h-10" />
                </div>
                <h2 className="text-lg font-medium text-foreground mb-2">
                  Select a question to start
                </h2>
                <p className="text-sm text-muted max-w-md mx-auto mb-6">
                  Choose a specific question from the Questions page and click "Ask a Doubt"
                  to get personalized AI explanations.
                </p>
                <Link
                  href={`/gate/${resolvedParams.paperId}/questions`}
                  className="inline-flex items-center px-4 py-2 text-sm bg-accent text-background hover:bg-accent-hover transition-colors"
                >
                  Browse Questions
                </Link>
              </div>
            ) : messages.length === 0 ? (
              /* Welcome state with suggestions */
              <div className="text-center py-8">
                <p className="text-sm text-muted mb-6">
                  Choose a question to discuss, or ask anything about {selectedQuestion?.topic}:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                  {DOUBT_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestion(s)}
                      className="text-left px-4 py-3 text-xs text-foreground border border-border hover:border-accent hover:bg-accent/5 transition-all duration-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Messages */
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-foreground text-background"
                          : "bg-background-alt border border-border"
                      }`}
                    >
                      <div className={`text-sm leading-relaxed`}>
                        {msg.role === "assistant" ? <MarkdownRenderer content={msg.content} /> : msg.content}
                      </div>
                      <p className={`text-[10px] mt-2 ${msg.role === "user" ? "text-background/50" : "text-muted-light"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 bg-background-alt border border-border">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-muted rounded-full animate-pulse" />
                        <div className="w-1.5 h-1.5 bg-muted rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                        <div className="w-1.5 h-1.5 bg-muted rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border px-4 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask about this question..."
                className="flex-1 px-4 py-2.5 text-sm bg-background border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="px-5 py-2.5 text-sm bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
            <p className="text-[10px] text-muted-light mt-2">
              AI-generated responses based on question data. Always verify with authoritative sources.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
