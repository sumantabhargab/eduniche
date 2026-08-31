"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Paper code to display label mapping for breadcrumbs
const BREADCRUMB_LABELS: Record<string, string> = {
  "gate-cse": "CSE",
  "gate-ee": "EE",
  "gate-me": "ME",
  "gate-ce": "CE",
  "gate-ece": "ECE",
  "gate-in": "IN",
  "gate-ch": "CH",
  "gate-bt": "BT",
  "gate-mt": "MT",
  "gate-pi": "PI",
  "gate-xe": "XE",
  "gate-xl": "XL",
  "gate-tf": "TF",
  "gate-pe": "PE",
  "gate-ey": "EY",
  "gate-ma": "MA",
  "gate-ar": "AR",
  "gate-ag": "AG",
  "gate-gg": "GG",
  "gate-ph": "PH",
};

const PAGE_LABELS: Record<string, string> = {
  diagnostic: "Diagnostic",
  plan: "Study Plan",
  practice: "Practice",
  doubt: "Doubt Engine",
  questions: "Questions",
};

export default function GateNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb path
  const crumbs: { label: string; href: string }[] = [
    { label: "GATE", href: "/gate" },
  ];

  // Parse the path segments
  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg === "gate") continue;
    currentPath += `/${seg}`;
    const fullHref = `/gate${currentPath}`;

    // Check if it's a paper ID
    const paperKey = `gate-${seg}`;
    if (BREADCRUMB_LABELS[paperKey]) {
      crumbs.push({
        label: BREADCRUMB_LABELS[paperKey],
        href: fullHref,
      });
    } else if (PAGE_LABELS[seg]) {
      // It's a page name like diagnostic, plan, practice
      crumbs.push({
        label: PAGE_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
        href: fullHref,
      });
    } else if (!isNaN(Number(seg))) {
      // Skip numeric IDs (like questionId)
      continue;
    }
  }

  return (
    <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-12">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-sm min-w-0">
            <Link
              href="/gate"
              className="font-mono text-xs tracking-widest text-accent hover:text-accent-hover transition-colors shrink-0"
            >
              GATE
            </Link>
            {crumbs.slice(1).map((crumb) => (
              <div key={crumb.href} className="flex items-center gap-1 min-w-0">
                <span className="text-muted-light shrink-0">/</span>
                <Link
                  href={crumb.href}
                  className={`text-xs truncate transition-colors ${
                    crumb === crumbs[crumbs.length - 1]
                      ? "text-foreground font-medium"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {crumb.label}
                </Link>
              </div>
            ))}
          </div>

          {/* Back to EduNeuro */}
          <Link
            href="/"
            className="text-xs text-muted hover:text-foreground transition-colors shrink-0 ml-4"
          >
            Back to EduNeuro
          </Link>
        </div>
      </div>
    </nav>
  );
}
