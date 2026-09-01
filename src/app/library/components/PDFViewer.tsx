/**
 * PDFViewer — native PDF embedding for reliable cross-browser rendering.
 *
 * Uses the browser's built-in PDF viewer via <object> tag, with
 * zoom controls applied as CSS transforms. This avoids react-pdf /
 * pdfjs-dist compatibility issues entirely.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EduNeuroLoader } from "@/components/loading";

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
const ZOOM_STEP = 0.25;

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

function IconBack() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PDFViewer({ url, title, filename }: PDFViewerProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageInput, setPageInput] = useState("1");
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const objectRef = useRef<HTMLObjectElement>(null);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setLoaded(true);
    setError(null);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setLoaded(false);
    setError("Unable to load document. Please try again.");
  }, []);

  // Fallback timeout: clear loading after 8s if onLoad doesn't fire
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setLoaded(true);
      }
    }, 8000);
    return () => clearTimeout(t);
  }, [loading]);
  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setLoaded(false);
    setError(null);
    setPageInput("1");
    setTotalPages(null);

    // Try to get page count via fetch + pdfjs-dist
    const fetchMeta = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          // Let the object tag's onError handle it
          return;
        }
        const buf = await res.arrayBuffer();
        // Dynamic import of pdfjs-dist to avoid startup issues
        import("pdfjs-dist").then((mod) => {
          mod.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
          mod.getDocument({ data: buf }).promise.then((doc: any) => {
            setTotalPages(doc.numPages);
          }).catch(() => {
            // Silently ignore — page count is optional
          });
        }).catch(() => {
          // Silently ignore
        });
      } catch {
        // Silently ignore
      }
    };

    fetchMeta();
  }, [url]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(MAX_ZOOM, +(s + ZOOM_STEP).toFixed(2)));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(MIN_ZOOM, +(s - ZOOM_STEP).toFixed(2)));
  }, []);

  const resetZoom = useCallback(() => setScale(1.0), []);

  // Page jump (best-effort using URL fragment)
  const goToPage = useCallback((page: number) => {
    const p = Math.max(1, page);
    setPageInput(String(p));
    // Append #page=N to trigger browser scroll
    if (objectRef.current?.data) {
      const base = objectRef.current.data.split("#")[0];
      objectRef.current.data = `${base}#page=${p}`;
    }
  }, []);

  // Open in new tab
  const openDirectly = useCallback(() => {
    window.open(url, "_blank");
  }, [url]);

  // Retry
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setLoaded(false);
    if (objectRef.current) {
      objectRef.current.data = "";
      // Force re-render
      requestAnimationFrame(() => {
        if (objectRef.current) {
          objectRef.current.data = url;
        }
      });
    }
  }, [url]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "=") {
        e.preventDefault();
        zoomIn();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        e.preventDefault();
        zoomOut();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        e.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [zoomIn, zoomOut, resetZoom]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        {/* Left: back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => window.history.back()}
            className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted hover:text-foreground transition-colors shrink-0"
            title="Back to library"
            aria-label="Back to library"
          >
            <IconBack />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-medium truncate">{title || "Document"}</h1>
            {filename && (
              <p className="text-xs text-muted truncate">{filename}</p>
            )}
          </div>
        </div>

        {/* Right: zoom + page + fullscreen */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-muted tabular-nums mr-1">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={zoomOut}
            disabled={scale <= MIN_ZOOM}
            className="p-1.5 rounded-lg hover:bg-foreground/5 disabled:opacity-30 transition-colors"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <IconZoomOut />
          </button>
          <button
            onClick={zoomIn}
            disabled={scale >= MAX_ZOOM}
            className="p-1.5 rounded-lg hover:bg-foreground/5 disabled:opacity-30 transition-colors"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <IconZoomIn />
          </button>
          <button
            onClick={resetZoom}
            className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted hover:text-foreground transition-colors"
            title="Reset zoom"
            aria-label="Reset zoom"
          >
            <IconFitWidth />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {totalPages && (
            <>
              <button
                onClick={() => goToPage(Math.max(1, parseInt(pageInput) - 1))}
                disabled={parseInt(pageInput) <= 1}
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
                  max={totalPages}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={() => {
                    const v = parseInt(pageInput, 10);
                    if (isNaN(v) || v < 1) setPageInput("1");
                    if (v > totalPages) setPageInput(String(totalPages));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = parseInt(pageInput, 10);
                      if (!isNaN(v) && v >= 1) goToPage(v);
                    }
                  }}
                  className="w-10 text-center bg-transparent border border-border rounded-md py-1 text-foreground tabular-nums focus:outline-none focus:ring-1 focus:ring-foreground/30"
                />
                <span className="text-muted">/ {totalPages}</span>
              </div>
              <button
                onClick={() => goToPage(Math.min(totalPages, parseInt(pageInput) + 1))}
                disabled={parseInt(pageInput) >= totalPages}
                className="p-1.5 rounded-lg hover:bg-foreground/5 disabled:opacity-30 transition-colors"
                title="Next page"
                aria-label="Next page"
              >
                <IconChevronRight />
              </button>

              <div className="w-px h-6 bg-border mx-1" />
            </>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted hover:text-foreground transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <IconExitFullscreen /> : <IconFullscreen />}
          </button>
        </div>
      </div>

      {/* Document area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-black/20"
        style={{ minHeight: "500px" }}
      >
        {loading && (
          <div className="flex items-center justify-center h-64">
            <EduNeuroLoader size="md" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{error}</p>
              <p className="text-xs text-muted mt-1">The file may be unavailable or corrupted.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={retry}
                className="px-4 py-2 text-sm rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={openDirectly}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-foreground/5 transition-colors"
              >
                Open Directly
              </button>
            </div>
          </div>
        )}

        {!error && (
          <div
            style={{
              width: "100%",
              height: "calc(100vh - 220px)",
              minHeight: "600px",
              maxHeight: "85vh",
              position: "relative",
            }}
          >
            {!loaded && loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                <EduNeuroLoader size="md" />
              </div>
            )}
            <iframe
              src={url}
              title={title || "PDF Viewer"}
              className="w-full h-full border-0 rounded-lg bg-white"
              style={{ display: loaded ? "block" : "none" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
