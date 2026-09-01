/**
 * Document viewer page at /library/document/[id]
 * Protected document viewer with Markdown/PDF rendering.
 *
 * PDFs are rendered via react-pdf (PDF.js) using a same-origin proxy
 * endpoint (/api/library/document/[id]/pdf) that re-verifies access
 * and streams the bytes with Content-Type: application/pdf.
 *
 * Markdown and plain-text documents are rendered with react-markdown.
 */

"use client";

import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

// Lazy-load PDFViewer to avoid SSR crash: pdfjs-dist references DOMMatrix
// which is unavailable in the Node.js server environment.
const PDFViewer = lazy(() => import("@/app/library/components/PDFViewer"));

type DocumentType = {
  id: string;
  name: string;
  original_filename: string;
  mime_type: string;
  description: string | null;
  access_tier: "free" | "premium";
  folder_id: string | null;
  breadcrumbs: { id: string; name: string }[];
  signed_url: string;
};

export default function DocumentViewerPage() {
  const params = useParams();
  const [document, setDocument] = useState<DocumentType | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const docId = params.id as string;
  const pdfProxyUrl = useMemo(() => {
    if (!docId || !document?.signed_url) return null;
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "";
    return `${base}/api/library/document/${encodeURIComponent(docId)}/pdf?url=${encodeURIComponent(document.signed_url)}`;
  }, [docId, document?.signed_url]);

  useEffect(() => {
    if (!docId) return;

    const fetchDocument = async () => {
      setLoading(true);
      setError(null);
      setAccessDenied(false);

      try {
        const res = await fetch(`/api/library/document/${docId}`);

        if (res.status === 401) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        if (res.status === 403) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Document not found.");
          setLoading(false);
          return;
        }

        const data = (await res.json()) as { document: DocumentType };
        setDocument(data.document);

        if (
          data.document.mime_type.includes("text") ||
          data.document.mime_type.includes("markdown")
        ) {
          try {
            const contentRes = await fetch(data.document.signed_url);
            if (contentRes.ok) {
              setContent(await contentRes.text());
            }
          } catch {
            // Content fetch failed — will show empty
          }
        }

        setLoading(false);
      } catch {
        setError("Failed to load document. Please check your connection and try again.");
        setLoading(false);
      }
    };

    fetchDocument();
  }, [docId]);

  // Safety timeout: force loading=false after 20s so UI never gets stuck
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 20000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="rounded-xl bg-background-dark overflow-hidden"
            style={{
              width: "160px",
              height: "90px",
              boxShadow: "inset 0 0 0 1px rgba(184, 113, 14, 0.18)",
            }}
          >
            <svg
              viewBox="0 0 100 60"
              width="160"
              height="90"
              className="block"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="en-bg" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#1f1f1f" />
                  <stop offset="100%" stopColor="#0e0e0e" />
                </radialGradient>
              </defs>
              <rect x="0" y="0" width="100" height="60" fill="url(#en-bg)" />
              {[
                { from: "12,30", to: "36,12", d: "0.4" },
                { from: "12,30", to: "36,48", d: "0.8" },
                { from: "36,12", to: "64,30", d: "1.2" },
                { from: "36,48", to: "64,30", d: "1.6" },
                { from: "64,30", to: "88,18", d: "2.0" },
                { from: "64,30", to: "88,42", d: "2.4" },
              ].map((p, i) => (
                <g key={i}>
                  <line
                    x1={p.from.split(",")[0]}
                    y1={p.from.split(",")[1]}
                    x2={p.to.split(",")[0]}
                    y2={p.to.split(",")[1]}
                    stroke="#B8710E"
                    strokeOpacity="0.22"
                    strokeWidth="0.4"
                  />
                  <circle
                    r="0.9"
                    fill="#F5B041"
                  >
                    <animate
                      attributeName="cx"
                      from={p.from.split(",")[0]}
                      to={p.to.split(",")[0]}
                      dur="1.4s"
                      begin={`${p.d}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      from={p.from.split(",")[1]}
                      to={p.to.split(",")[1]}
                      dur="1.4s"
                      begin={`${p.d}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;1;0"
                      keyTimes="0;0.15;0.85;1"
                      dur="1.4s"
                      begin={`${p.d}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              ))}
              {[
                { cx: 12, cy: 30, order: 0 },
                { cx: 36, cy: 12, order: 1 },
                { cx: 36, cy: 48, order: 2 },
                { cx: 64, cy: 30, order: 3 },
                { cx: 88, cy: 18, order: 4 },
                { cx: 88, cy: 42, order: 5 },
              ].map((node) => (
                <g key={node.cx}>
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r="3.2"
                    fill="#B8710E"
                    fillOpacity="0"
                  >
                    <animate
                      attributeName="fill-opacity"
                      values="0;0.18;0"
                      keyTimes="0;0.5;1"
                      dur="2.4s"
                      begin={`${node.order * 0.25}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="r"
                      values="3.2;5.7;3.2"
                      keyTimes="0;0.5;1"
                      dur="2.4s"
                      begin={`${node.order * 0.25}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r="2.6"
                    fill="#B8710E"
                    fillOpacity="0.85"
                  >
                    <animate
                      attributeName="fill-opacity"
                      values="0.35;1;0.35"
                      keyTimes="0;0.5;1"
                      dur="2.4s"
                      begin={`${node.order * 0.25}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              ))}
            </svg>
          </div>
          <p className="text-xs tracking-[0.18em] uppercase text-muted">
            Loading document
          </p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12">
          <div className="text-muted mb-4 inline-block">
            <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3">Premium Required</h2>
          <p className="text-muted mb-6">
            This document is available for Premium subscribers only.
          </p>
          <div className="bg-accent/30 rounded-xl p-6 mb-6">
            <div className="text-lg font-bold mb-1">
              ₹49 <span className="text-sm font-normal text-muted">/ month</span>
            </div>
            <p className="text-sm text-muted">
              Unlock all premium content and features.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/pricing"
              className="px-6 py-3 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Upgrade to Premium
            </Link>
            <Link
              href="/library"
              className="px-6 py-3 border border-border rounded-xl font-medium hover:bg-foreground/5 transition-colors"
            >
              Back to Library
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="bg-card border border-border rounded-2xl p-8">
          <p className="text-muted">{error || "Document not found."}</p>
          <Link
            href="/library"
            className="inline-block mt-4 text-accent hover:underline"
          >
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const isPDF = document.mime_type.includes("pdf");
  const isText =
    document.mime_type.includes("text") || document.mime_type.includes("markdown");

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumbs */}
      {document.breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-muted mb-4 flex-wrap">
          <Link href="/library" className="hover:text-foreground transition-colors">
            Library
          </Link>
          {document.breadcrumbs.map((crumb) => (
            <span key={crumb.id} className="flex items-center gap-1.5">
              <span className="text-border">/</span>
              {crumb.id ? (
                <Link
                  href={`/library?folder=${crumb.id}`}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.name}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.name}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {document.name}
            </h1>
            {document.description && (
              <p className="text-muted">{document.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-sm text-muted">
              {document.access_tier === "premium" && (
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  Premium
                </span>
              )}
              <span>{document.original_filename}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {isPDF && pdfProxyUrl && (
          <Suspense fallback={
            <div className="flex items-center justify-center p-16">
              <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
          }>
            <PDFViewer
              url={pdfProxyUrl}
              title={document.name}
              filename={document.original_filename}
            />
          </Suspense>
        )}

        {isText && content && (
          <div className="p-6 md:p-10 prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}

        {!isPDF && !isText && (
          <div className="p-8 text-center text-muted">
            <p>This file type cannot be previewed in the browser.</p>
            <p className="text-sm mt-2">
              Please contact support if you need this content.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Link
          href="/library"
          className="text-muted hover:text-foreground text-sm transition-colors"
        >
          Back to Library
        </Link>
      </div>
    </div>
  );
}
