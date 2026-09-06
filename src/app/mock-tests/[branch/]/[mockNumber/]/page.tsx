/**
 * Individual Mock Test page — renders the PDF with full viewer controls.
 *
 * Route: /mock-tests/[branch]/[mockNumber]
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import PDFViewerClient from "./PDFViewerClient";

interface Props {
  params: Promise<{ branch: string; mockNumber: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { branch, mockNumber } = await params;
  return {
    title: `Mock Test ${mockNumber} | ${branch.toUpperCase()} | EduNeuro`,
    description: `Premium full-length mock test for ${branch.toUpperCase()}. Practice with exam-realistic questions.`,
  };
}

async function getMockTest(branch: string, mockNumber: number) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/mock-tests`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;
    const { tests } = await res.json();

    return tests.find((t: any) => t.branch === branch && t.mock_number === mockNumber);
  } catch {
    return null;
  }
}

export default async function MockTestPage({ params }: Props) {
  const { branch, mockNumber } = await params;
  const mockNum = parseInt(mockNumber, 10);
  const test = await getMockTest(branch, mockNum);

  if (!test) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-sm text-muted">Loading mock test…</div>
        </div>
      }
    >
      <PDFViewerClient test={test} />
    </Suspense>
  );
}

export async function generateStaticParams() {
  const branches = [
    "cse", "ece", "ee", "me", "ce", "in", "pi", "da",
  ];

  return branches.flatMap((branch) =>
    [1, 2, 3].map((mockNum) => ({
      branch,
      mockNumber: String(mockNum),
    }))
  );
}
