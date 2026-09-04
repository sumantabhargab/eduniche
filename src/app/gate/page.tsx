"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PAPERS } from "@/lib/gate/config";
import { type GATEPaper } from "@/lib/gate/config";
import GateNav from "@/components/GateNav";
import SearchInput from "@/components/SearchInput";
import BillboardSlot from "@/components/BillboardSlot";
import { useGateEvent } from "@/lib/tracking/useGateEvent";

const STATUS_STYLES: Record<GATEPaper["processingStatus"], { label: string; className: string }> = {
  available: { label: "Available", className: "text-green-600 bg-green-50 border-green-200" },
  processing: { label: "Processing", className: "text-amber-600 bg-amber-50 border-amber-200" },
  unavailable: { label: "Coming Soon", className: "text-muted bg-muted/5 border-muted/10" },
};

const BRAND_COLORS: Record<string, { bg: string; text: string }> = {
  "CS": { bg: "bg-blue-50", text: "text-blue-600" },
  "EE": { bg: "bg-emerald-50", text: "text-emerald-600" },
  "ME": { bg: "bg-orange-50", text: "text-orange-600" },
  "CE": { bg: "bg-cyan-50", text: "text-cyan-600" },
  "ECE": { bg: "bg-purple-50", text: "text-purple-600" },
  "IN": { bg: "bg-pink-50", text: "text-pink-600" },
};

function getCodeColor(code: string) {
  return BRAND_COLORS[code] || { bg: "bg-gray-50", text: "text-gray-600" };
}

export default function GateLandingPage() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  useGateEvent("gate_page_opened");

  const filteredPapers = useMemo(() => {
    if (!search.trim()) return PAPERS;
    const q = search.toLowerCase();
    return PAPERS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q)
    );
  }, [search]);

  const handlePaperClick = useCallback(
    (paper: GATEPaper) => {
      if (paper.processingStatus === "available") {
        router.push(`/gate/${paper.id}`);
      }
    },
    [router]
  );

  return (
    <>
      <GateNav />
      <main>
        {/* Hero */}
        <section className="pt-12 pb-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-3">
              Explore GATE Intelligence
            </h1>
            <p className="text-base text-muted max-w-2xl mb-4">
              Understand what years of GATE questions can tell you — historical
              patterns, topic trends, and intelligent practice.
            </p>
            <p className="text-sm text-muted-light italic">
              No exam can be predicted perfectly. Historical data reveals
              patterns worth understanding, not guaranteed outcomes.
            </p>
          </div>
        </section>

        {/* Paper Selection */}
        <section className="pb-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-sm font-mono tracking-widest text-muted uppercase mb-3">
                Choose Your Paper
              </h2>
              <SearchInput
                onSearch={setSearch}
                placeholder="Search papers..."
                className="max-w-md"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPapers.map((paper) => {
                const status = STATUS_STYLES[paper.processingStatus];
                const colorStyle = getCodeColor(paper.code);

                return (
                  <button
                    key={paper.id}
                    onClick={() => handlePaperClick(paper)}
                    disabled={paper.processingStatus === "unavailable"}
                    className={`text-left p-4 border transition-all duration-200 group ${
                      paper.processingStatus === "available"
                        ? "bg-card border-border hover:border-accent cursor-pointer hover:shadow-sm"
                        : paper.processingStatus === "processing"
                        ? "bg-amber-50/30 border-amber-200/60 cursor-default"
                        : "bg-muted/5 border-muted/10 cursor-default opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span
                          className={`inline-block text-xs font-mono px-1.5 py-0.5 border ${colorStyle.bg} ${colorStyle.text} border-current/10 mr-2`}
                        >
                          {paper.code}
                        </span>
                        <span
                          className={`inline-block text-xs px-1.5 py-0.5 border ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <h3
                      className={`text-sm font-medium mb-1 transition-colors ${
                        paper.processingStatus === "available"
                          ? "text-foreground group-hover:text-accent"
                          : "text-muted"
                      }`}
                    >
                      {paper.name}
                    </h3>
                    {paper.description && (
                      <p className="text-xs text-muted-light line-clamp-2">
                        {paper.description}
                      </p>
                    )}
                    {paper.processingStatus === "available" && (
                      <div className="mt-3 flex items-center text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                        Explore
                        <svg
                          className="ml-1 w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {filteredPapers.length === 0 && (
              <p className="text-sm text-muted mt-6">
                No papers match your search.
              </p>
            )}
          </div>
        </section>

        {/* Sponsored Partner */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <BillboardSlot slotId="learning_secondary" intervalMs={14_000} />
          </div>
        </section>
      </main>
    </>
  );
}
