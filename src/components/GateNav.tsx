"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BREADCRUMB_COLORS: Record<string, string> = {
  "gate-cse": "CS",
  "gate-ee": "EE",
  "gate-me": "ME",
  "gate-ce": "CE",
  "gate-ece": "ECE",
  "gate-in": "IN",
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
  for (const seg of segments) {
    if (seg === "gate") continue;
    currentPath += `/${seg}`;
    const fullHref = `/gate${currentPath}`;
    const label = BREADCRUMB_COLORS[seg] || decodeURIComponent(seg).replace(/-/g, " ");
    crumbs.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      href: fullHref,
    });
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
            {crumbs.slice(1).map((crumb, i) => (
              <div key={crumb.href} className="flex items-center gap-1 min-w-0">
                <span className="text-muted-light shrink-0">/</span>
                <Link
                  href={crumb.href}
                  className={`text-xs truncate transition-colors ${
                    i === crumbs.length - 2
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
