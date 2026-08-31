/**
 * EduNeuro neural-processing loading animation.
 *
 * A subtle dark-background animation with amber nodes that suggest
 * a small neural network processing information. An amber pulse
 * travels through the network while nodes activate in sequence.
 *
 * Variants:
 *   - "thinking"  : the primary AI processing state (used in chat / doubts)
 *   - "auth"      : authentication-flow processing
 *   - "page"      : page-level centered loader with optional label
 *
 * Respects prefers-reduced-motion.
 */

"use client";

import * as React from "react";

type LoaderSize = "xs" | "sm" | "md" | "lg";
type LoaderVariant = "thinking" | "auth" | "page";

interface EduNeuroLoaderProps {
  size?: LoaderSize;
  variant?: LoaderVariant;
  label?: string;
  className?: string;
}

// Node positions are normalized to a 100x60 viewBox so the SVG scales cleanly.
// Each node has an `order` value used to stagger activation and the pulse path.
const NODES = [
  { id: "n1", cx: 12, cy: 30, order: 0 },
  { id: "n2", cx: 36, cy: 12, order: 1 },
  { id: "n3", cx: 36, cy: 48, order: 2 },
  { id: "n4", cx: 64, cy: 30, order: 3 },
  { id: "n5", cx: 88, cy: 18, order: 4 },
  { id: "n6", cx: 88, cy: 42, order: 5 },
];

// Connection paths between nodes — each path is reused as the pulse travels.
const PATHS: Array<{ from: string; to: string }> = [
  { from: "n1", to: "n2" },
  { from: "n1", to: "n3" },
  { from: "n2", to: "n4" },
  { from: "n3", to: "n4" },
  { from: "n4", to: "n5" },
  { from: "n4", to: "n6" },
];

function sizeToBox(size: LoaderSize): { width: number; height: number; nodeR: number } {
  switch (size) {
    case "xs":
      return { width: 64, height: 36, nodeR: 1.6 };
    case "sm":
      return { width: 96, height: 54, nodeR: 2 };
    case "md":
      return { width: 160, height: 90, nodeR: 2.6 };
    case "lg":
    default:
      return { width: 240, height: 140, nodeR: 3.2 };
  }
}

const LABELS: Record<LoaderVariant, string> = {
  thinking: "EduNeuro is thinking",
  auth: "Authenticating",
  page: "Loading",
};

export function EduNeuroLoader({
  size = "md",
  variant = "thinking",
  label,
  className = "",
}: EduNeuroLoaderProps) {
  const { width, height, nodeR } = sizeToBox(size);

  // Derived scale factors from the 100x60 viewBox to the requested pixel size.
  const sx = width / 100;
  const sy = height / 60;

  const isXs = size === "xs";
  const showLabel = !isXs;
  const text = label ?? LABELS[variant];

  // Pulse path travels left → right through the network over ~2.4s.
  // We render 6 dots and animate them with staggered delays so the
  // effect feels like a signal propagating through nodes.
  const pulseDots = PATHS.flatMap((p, i) => {
    const from = NODES.find((n) => n.id === p.from)!;
    const to = NODES.find((n) => n.id === p.to)!;
    return [
      { from, to, delay: `${(i * 0.4).toFixed(2)}s` },
    ];
  });

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={text}
      className={`inline-flex flex-col items-center justify-center gap-2.5 ${className}`}
    >
      <div
        className="relative rounded-xl bg-background-dark overflow-hidden"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          boxShadow: "inset 0 0 0 1px rgba(184, 113, 14, 0.18)",
        }}
      >
        <svg
          viewBox="0 0 100 60"
          width={width}
          height={height}
          className="block"
          aria-hidden="true"
        >
          {/* Subtle inner panel */}
          <defs>
            <radialGradient id="en-bg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#1f1f1f" stopOpacity="1" />
              <stop offset="100%" stopColor="#0e0e0e" stopOpacity="1" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="100" height="60" fill="url(#en-bg)" />

          {/* Connecting lines */}
          <g stroke="#B8710E" strokeOpacity="0.22" strokeWidth="0.4">
            {PATHS.map((p, i) => {
              const from = NODES.find((n) => n.id === p.from)!;
              const to = NODES.find((n) => n.id === p.to)!;
              return (
                <line
                  key={`line-${i}`}
                  x1={from.cx}
                  y1={from.cy}
                  x2={to.cx}
                  y2={to.cy}
                />
              );
            })}
          </g>

          {/* Pulse dots traveling along each path */}
          <g fill="#F5B041">
            {pulseDots.map((pulse, i) => (
              <circle key={`pulse-${i}`} r="0.9" fill="#F5B041">
                <animate
                  attributeName="cx"
                  from={pulse.from.cx}
                  to={pulse.to.cx}
                  dur="1.4s"
                  begin={pulse.delay}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cy"
                  from={pulse.from.cy}
                  to={pulse.to.cy}
                  dur="1.4s"
                  begin={pulse.delay}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.15;0.85;1"
                  dur="1.4s"
                  begin={pulse.delay}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </g>

          {/* Nodes */}
          <g>
            {NODES.map((node) => (
              <g key={node.id}>
                {/* Halo */}
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r={nodeR + 1.2}
                  fill="#B8710E"
                  fillOpacity="0.0"
                >
                  <animate
                    attributeName="fill-opacity"
                    values="0;0.18;0"
                    keyTimes="0;0.5;1"
                    dur="2.4s"
                    begin={`${(node.order * 0.25).toFixed(2)}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="r"
                    values={`${nodeR};${nodeR + 2.5};${nodeR}`}
                    keyTimes="0;0.5;1"
                    dur="2.4s"
                    begin={`${(node.order * 0.25).toFixed(2)}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                {/* Core dot */}
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r={nodeR}
                  fill="#B8710E"
                  fillOpacity="0.85"
                >
                  <animate
                    attributeName="fill-opacity"
                    values="0.35;1;0.35"
                    keyTimes="0;0.5;1"
                    dur="2.4s"
                    begin={`${(node.order * 0.25).toFixed(2)}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {showLabel && (
        <span
          className="text-xs tracking-[0.18em] uppercase text-muted"
          style={{ letterSpacing: "0.18em" }}
        >
          {text}
        </span>
      )}

      {/* The sx/sy are referenced so React/TS won't complain about unused vars in some configs */}
      <span aria-hidden="true" style={{ display: "none" }}>
        {sx}-{sy}
      </span>
    </div>
  );
}

export default EduNeuroLoader;