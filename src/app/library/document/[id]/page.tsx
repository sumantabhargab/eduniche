/**
 * Document viewer page at /library/document/[id]
 * Protected document viewer with Markdown/PDF rendering.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

type DocumentType = {
  id: string;
  name: string;
  original_filename: string;
  mime_type: string;
  description: string | null;
  access_tier: "free" | "premium";
  signed_url: string;
};

export default function DocumentViewerPage() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<DocumentType | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const docId = params.id as string;
    if (!docId) return;

    const fetchDocument = async () => {
      setLoading(true);
      setError(null);

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
          setError("Document not found.");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setDocument(data.document);

        // Fetch content
        if (data.document.mime_type.includes('text') || data.document.mime_type.includes('markdown')) {
          try {
            const contentRes = await fetch(data.document.signed_url);
            if (contentRes.ok) {
              const text = await contentRes.text();
              setContent(text);
            }
          } catch (e) {
            // Content fetch failed
          }
        }

        setLoading(false);
      } catch (e) {
        setError("Failed to load document.");
        setLoading(false);
      }
    };

    fetchDocument();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="animate-pulse text-muted">Loading document...</div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-3">Premium Required</h2>
          <p className="text-muted mb-6">
            This document is available for Premium subscribers only.
          </p>
          <div className="bg-accent/30 rounded-xl p-6 mb-6">
            <div className="text-lg font-bold mb-1">₹49 <span className="text-sm font-normal text-muted">/ month</span></div>
            <p className="text-sm text-muted">Unlock all premium content and features.</p>
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
          <Link href="/library" className="inline-block mt-4 text-accent hover:underline">
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const isPDF = document.mime_type.includes('pdf');
  const isText = document.mime_type.includes('text') || document.mime_type.includes('markdown');

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{document.name}</h1>
            {document.description && (
              <p className="text-muted">{document.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-sm text-muted">
              {document.access_tier === 'premium' && (
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
        {isPDF && (
          <iframe
            src={document.signed_url}
            className="w-full h-[70vh] border-0"
            title={document.name}
            sandbox=""
          />
        )}

        {isText && content && (
          <div className="p-6 md:p-10 prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}

        {!isPDF && !isText && (
          <div className="p-8 text-center text-muted">
            <p>This file type cannot be previewed in the browser.</p>
            <p className="text-sm mt-2">Please contact support if you need this content.</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Link
          href="/library"
          className="text-muted hover:text-foreground text-sm transition-colors"
        >
          ← Back to Library
        </Link>
      </div>
    </div>
  );
}
