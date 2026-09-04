"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ============================================
// BillboardSlot — Reusable rotating ad slot
// ============================================
// Props:
//   slotId: stable identifier from billboard_slots (e.g. "landing_main")
//   intervalMs: rotation interval in ms (default 12_000)
//   maxHeight: optional max-height class
//   className: optional additional classes
// ============================================

interface Creative {
  id: string;
  brand_name: string;
  creative_url: string;
  creative_type: string;
  destination_url: string;
}

export default function BillboardSlot({
  slotId,
  intervalMs = 12_000,
  maxHeight,
  className = "",
}: {
  slotId: string;
  intervalMs?: number;
  maxHeight?: string;
  className?: string;
}) {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prefersReducedMotion = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  // Fetch eligible creatives
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/billboard?slot=${encodeURIComponent(slotId)}`);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setCreatives(data.creatives ?? []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slotId]);

  // Rotation
  const advance = useCallback(() => {
    if (creatives.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % creatives.length);
  }, [creatives.length]);

  useEffect(() => {
    if (creatives.length <= 1) return;

    // Don't rotate if user prefers reduced motion (still show, just static)
    if (prefersReducedMotion.current) return;

    intervalRef.current = setInterval(advance, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [creatives.length, intervalMs, advance]);

  // Empty state — render nothing
  if (!loading && creatives.length === 0) return null;
  if (error) return null;

  const creative = creatives[currentIndex];
  if (!creative) return null;

  const handleClick = () => {
    if (!creative.destination_url) return;
    window.open(creative.destination_url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={`w-full max-w-4xl mx-auto ${className}`}
      role="link"
      tabIndex={0}
      aria-label={`Sponsored content from ${creative.brand_name}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div
        className="text-center mb-2.5"
        style={{ opacity: isTransitioning ? 0.6 : 1, transition: "opacity 0.3s ease" }}
      >
        <span className="inline-flex items-center text-[10px] font-medium tracking-widest uppercase text-muted select-none">
          <svg className="w-3 h-3 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Sponsored
        </span>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden bg-background-alt border border-border/50 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        style={{
          maxHeight: maxHeight || undefined,
          aspectRatio: "21 / 9",
        }}
      >
        <img
          key={creative.id}
          src={creative.creative_url}
          alt={`Sponsored content from ${creative.brand_name}`}
          className="w-full h-full object-contain transition-opacity duration-500"
          style={{ opacity: isTransitioning ? 0 : 1 }}
          onLoad={() => setIsTransitioning(false)}
          draggable={false}
          loading={currentIndex === 0 ? "eager" : "lazy"}
        />

        {/* Subtle hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.03] transition-colors duration-300" />

        {/* Click indicator */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div
          className="rounded-2xl bg-background-alt border border-border/50 animate-pulse"
          style={{ aspectRatio: "21 / 9" }}
        />
      )}
    </div>
  );
}
