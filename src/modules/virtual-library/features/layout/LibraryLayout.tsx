/**
 * LibraryLayout — shared layout for /library/* routes.
 *
 * Provides a calm, focused visual shell with subdued navigation,
 * consistent structure, and theme integration.
 */

"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { virtualLibraryConfig } from "../../config/feature-flags";

interface LibraryLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/library", label: "Library", icon: "📚" },
  { href: "/library/room/main-library", label: "Rooms", icon: "🚪" },
  { href: "/library?tab=planner", label: "Planner", icon: "📋" },
  { href: "/library?tab=doubts", label: "Doubts", icon: "💡" },
];

export function LibraryLayout({ children }: LibraryLayoutProps) {
  const pathname = usePathname();

  if (!virtualLibraryConfig.enabled) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted text-lg">The Virtual Library is currently unavailable.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sub-navigation */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-1">
          <Link
            href="/library"
            className="flex items-center gap-2 mr-4 text-lg font-semibold tracking-tight"
          >
            <span className="text-2xl">📚</span>
            <span className="hidden sm:inline">Virtual Library</span>
          </Link>

          <div className="flex items-center gap-1 ml-auto">
            {navItems.map((item) => {
              const isActive =
                item.href === "/library"
                  ? pathname === "/library"
                  : pathname.startsWith(item.href.split("?")[0]);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? "bg-accent text-foreground"
                      : "text-muted hover:text-foreground hover:bg-accent/50"
                    }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
