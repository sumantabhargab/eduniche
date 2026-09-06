/**
 * PDFViewerClient — renders the mock test PDF with controls and premium checks.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { EduNeuroLoader } from "@/components/loading";

interface MockTest {
  id: string;
  branch: string;
  branch_code: string;
  branch_name: string;
  mock_number: number;
  title: string;
  question_count: number;
  maximum_marks: number;
  duration_minutes: number;
  subject_distribution: Array<{ name: string; questions: number; marks: number }>;
  difficulty_distribution: { easy: number; moderate: number; hard: number };
}

interface PDFViewerClientProps {
  test: MockTest;
}

export default function PDFViewerClient({ test }: PDFViewerClientProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [checkingPremium, setCheckingPremium] = useState(true);

  // Check premium access
  useEffect(() => {
    const checkPremium = async () => {
      try {
        const res = await fetch("/api/auth/profile");
        if (res.ok) {
          const { user } = await res.json();
          setIsPremium(user?.isPremium || false);
        }
      } catch {
        setIsPremium(false);
      } finally {
        setCheckingPremium(false);
      }
    };
    checkPremium();
  }, []);

  // Generate PDF URL
  useEffect(() => {
    if (!isPremium && !checkingPremium) return;

    const fetchPdfUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/mock-tests/${test.id}/pdf`);
        if (!res.ok) {
          if (res.status === 401) {
            setError("Please sign in to access this mock test.");
          } else if (res.status === 403) {
            setError("Premium access required. Please upgrade your plan.");
          } else {
            setError("Failed to load mock test. Please try again.");
          }
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch {
        setError("Failed to load mock test. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (isPremium && !checkingPremium) {
      fetchPdfUrl();
    }
  }, [test.id, isPremium, checkingPremium]);

  // Premium lock screen
  if (!checkingPremium && !isPremium) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl mb-4">Premium Content</h1>
          <p className="text-muted mb-2">
            <strong className="text-foreground">{test.title}</strong> is available exclusively for EduNeuro Premium members.
          </p>
          <p className="text-sm text-muted mb-8">
            Upgrade your plan to access all mock tests, detailed solutions, and unlimited practice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/pricing" className="inline-flex items-center gap-2 px-8 py-3.5 bg-foreground text-background font-medium text-sm rounded-xl transition-all hover:opacity-90">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345h5.441a.562.562 0 01.321 1.014l-4.357 3.363a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557L3.15 9.368a.562.562 0 01.321-1.014h5.44a.563.563 0 00.475-.345L11.48 3.499z" />
              </svg>
              <span>Upgrade to Premium</span>
            </Link>
            <Link href="/mock-tests" className="inline-flex items-center gap-2 px-6 py-3.5 border border-border text-foreground text-sm rounded-xl hover:bg-foreground/5 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span>Back to Library</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || checkingPremium) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <EduNeuroLoader size="lg" />
        <p className="text-sm text-muted mt-4">Loading mock test…</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm font-medium mb-1">{error}</p>
        <Link href="/mock-tests" className="text-xs text-accent hover:underline mt-2">Back to Library</Link>
      </div>
    );
  }

  if (!pdfUrl) return null;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-border shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/mock-tests" className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted hover:text-foreground transition-colors shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm font-medium truncate">{test.title}</h1>
            <p className="text-xs text-muted">{test.question_count} questions · {test.duration_minutes} min · {test.maximum_marks} marks</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <a href={pdfUrl} download={`${test.title.replace(/\s+/g, "_")}.pdf`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span>Download</span>
          </a>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="mx-auto py-6" style={{ width: "100%" }}>
          <iframe src={pdfUrl} title={test.title} className="w-full border-0 shadow-lg" style={{ height: "calc(100vh - 120px)", minHeight: "600px" }} />
        </div>
      </div>
    </div>
  );
}
