/**
 * PDFViewer — custom document viewer for EduNeuro.
 *
 * Uses react-pdf (PDF.js) to render pages to canvas elements for
 * reliable, consistent rendering across browsers. The PDF bytes are
 * served through the /api/library/document/[id]/pdf proxy route,
 * so there are no CORS issues and no credentials are exposed to the
 * client.
 *
 * Features:
 *  - Full-page scrollable rendering
 *  - Zoom in / zoom out
 *  - Fit-to-width toggle
 *  - Page navigation (jump to page)
 *  - Fullscreen toggle
 *  - EduNeuro loading / error states
 *  - Responsive layout
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { EduNeuroLoader } from "@/components/loading";

// Use the bundled pdfjs-dist worker, served from /public/ as a static asset.
// This avoids CDN 404s and ensures the worker version matches the bundled library.
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PDFViewerProps {
  /** Trusted proxy URL (server-generated, short-lived) */
  url: string;
  /** Display name */
  title?: string;
  /** Original filename */
  filename?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.15;

// ---------------------------------------------------------------------------
// Icons (inline SVGs — no external deps)
// ---------------------------------------------------------------------------

function IconZoomIn() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function IconZoomOut() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function IconFitWidth() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 3H3v18h18V3z" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  );
}

function IconFullscreen() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
    </svg>
  );
}

function IconExitFullscreen() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconRetry() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Viewer
// ---------------------------------------------------------------------------

export default function PDFViewer({ url, title, filename }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fitToWidth, setFitToWidth] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [pageWidth, setPageWidth] = useState<number>(700);

  // Observe the page container width for fit-to-width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!fitToWidth) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          setPageWidth(Math.floor(w));
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [fitToWidth]);

  // Document loaded
  const onDocumentLoadSuccess = useCallback((pdf: { numPages: number }) => {
    setNumPages(pdf.numPages);
    setLoading(false);
    setError(null);
  }, []);

  // Document load error
  const onDocumentLoadError = useCallback((err: { message?: string }) => {
    setError(err?.message ?? "Failed to load document.");
    setLoading(false);
  }, []);

  // Loading timeout — prevent infinite loading
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      if (loading) {
        setError("Document is taking too long to load. The file may be unavailable or your browser does not support PDF viewing. Try opening the document directly.");
        setLoading(false);
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Page rendered — track which page is visible
  const onPageRenderSuccess = useCallback(
    (pageNum: number) => () => {
      pageRefs.current.set(pageNum, pageRefs.current.get(pageNum)!);
    },
    []
  );

  // Scroll spy — detect current page via IntersectionObserver
  useEffect(() => {
    if (loading || numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible page
        let topPage = currentPage;
        let topY = Infinity;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const num = Number(entry.target.getAttribute("data-page") || 1);
            const rect = entry.boundingClientRect;
            if (rect.top < topY) {
              topY = rect.top;
              topPage = num;
            }
          }
        }
        if (topPage !== currentPage) {
          setCurrentPage(topPage);
        }
      },
      {
        root: viewerRef.current,
        threshold: 0.3,
      }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loading, numPages, currentPage]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setFitToWidth(false);
    setScale((s) => Math.min(MAX_ZOOM, +(s + ZOOM_STEP).toFixed(2)));
  }, []);

  const zoomOut = useCallback(() => {
    setFitToWidth(false);
    setScale((s) => Math.max(MIN_ZOOM, +(s - ZOOM_STEP).toFixed(2)));
  }, []);

  const fitWidth = useCallback(() => {
    setFitToWidth(true);
  }, []);

  // Page navigation
  const goToPage = useCallback((page: number) => {
    const clamped = Math.max(1, Math.min(numPages, page));
    setCurrentPage(clamped);
    const el = pageRefs.current.get(clamped);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [numPages]);

  // Fullscreen
  const toggleFullscreen = useCallback(async () => {
    const target = viewerRef.current;
    if (!target) return;
    try {
      if (!document.fullscreenElement) {
        await target.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen denied — silently ignore
    }
  }, []);

  // Listen for fullscreen change (e.g. user pressed Esc)
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Retry
  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setNumPages(0);
    setCurrentPage(1);
  }, []);

  // Compute render scale
  const renderScale = fitToWidth ? undefined : scale;

  // ---- Loading State ----
  if (loading) {
    return (
      <div
        ref={viewerRef}
        className="flex flex-col items-center justify-center gap-5 bg-background-dark/50 rounded-2xl border border-border min-h-[500px]"
      >
        <EduNeuroLoader size="lg" variant="page" label="Loading document" />
      </div>
    );
  }

  // ---- Error State (viewer-level) ----
  if (error) {
    return (
      <div
        ref={viewerRef}
        className="flex flex-col items-center justify-center gap-6 bg-background-dark/50 rounded-2xl border border-border p-12 min-h-[400px]"
      >
        <div
          className="rounded-full bg-red-950/40 p-4 text-red-400"
        >
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-1">Unable to load document</h3>
          <p className="text-sm text-muted max-w-md">
            {error}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <IconRetry />
            Retry
          </button>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl font-medium text-sm hover:bg-foreground/5 transition-colors"
            >
              Open Directly
            </a>
          )}
        </div>
      </div>
    );
  }

  // ---- Viewer ----
  return (
    <div
      ref={viewerRef}
      data-fullscreen={isFullscreen}
      className="flex flex-col rounded-2xl overflow-hidden border border-border bg-background-dark/30"
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border flex-wrap">
        {/* Title / filename */}
        <div className="flex-1 min-w-0 mr-2">
          <p className="text-sm font-medium truncate" title={filename || title}>
            {filename || title}
          </p>
          {numPages > 0 && (
            <p className="text-xs text-muted">
              {numPages} {numPages === 1 ? "page" : "pages"}
            </p>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={fitToWidth}
            className="p-1.5 rounded-lg hover:bg-foreground/5 disabled:opacity-30 transition-colors"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <IconZoomOut />
          </button>
          <span className="text-xs text-muted w-12 text-center tabular-nums">
            {fitToWidth ? "Fit" : `${Math.round((scale ?? 1) * 100)}%`}
          </span>
          <button
            onClick={zoomIn}
            disabled={fitToWidth}
            className="p-1.5 rounded-lg hover:bg-foreground/5 disabled:opacity-30 transition-colors"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <IconZoomIn />
          </button>
          <button
            onClick={fitWidth}
            className={`p-1.5 rounded-lg hover:bg-foreground/5 transition-colors ${
              fitToWidth ? "bg-foreground/10 text-foreground" : "text-muted"
            }`}
            title="Fit to width"
            aria-label="Fit to width"
          >
            <IconFitWidth />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg hover:bg-foreground/5 disabled:opacity-30 transition-colors"
            title="Previous page"
            aria-label="Previous page"
          >
            <IconChevronLeft />
          </button>
          <div className="flex items-center gap-1 text-xs">
            <input
              type="number"
              min={1}
              max={numPages}
              value={currentPage}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) goToPage(v);
              }}
              className="w-10 text-center bg-transparent border border-border rounded-md py-1 text-foreground tabular-nums focus:outline-none focus:ring-1 focus:ring-foreground/30"
            />
            <span className="text-muted">/ {numPages}</span>
          </div>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="p-1.5 rounded-lg hover:bg-foreground/5 disabled:opacity-30 transition-colors"
            title="Next page"
            aria-label="Next page"
          >
            <IconChevronRight />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted hover:text-foreground transition-colors"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <IconExitFullscreen /> : <IconFullscreen />}
        </button>
      </div>

      {/* Document area */}
      <div
        ref={containerRef}
        className="overflow-y-auto overflow-x-hidden flex justify-center"
        style={{ maxHeight: "75vh", minHeight: "400px" }}
      >
        <Document
          key={url}
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          options={{
            cMapUrl: `/cmaps/`,
            cMapPacked: true,
          }}
          className="w-full"
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div
              key={`page-wrapper-${index + 1}`}
              ref={(el) => {
                if (el) pageRefs.current.set(index + 1, el);
              }}
              data-page={index + 1}
              className="my-4 mx-auto"
              style={{
                width: fitToWidth ? "100%" : undefined,
                maxWidth: fitToWidth ? undefined : `${700 * (scale ?? 1)}px`,
              }}
            >
              <Page
                key={`page-${index + 1}`}
                pageNumber={index + 1}
                scale={renderScale}
                width={fitToWidth ? pageWidth : undefined}
                renderAnnotationLayer
                renderTextLayer
                className="!shadow-lg !rounded-sm"
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
