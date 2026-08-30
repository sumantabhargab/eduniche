"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, Suspense } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/lib/hooks/useAuth";

function NavInner() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useAuth();
  const isAuthenticated = !!user && !loading;

  const isActive = (href: string, matchPrefix?: boolean) => {
    if (matchPrefix) return pathname?.startsWith(href) ?? false;
    return pathname === href;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl text-foreground">
          Eduneuro
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/gate"
            className={`text-sm transition-colors ${
              isActive("/gate", true) ? "text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            GATE
          </Link>
          <Link
            href="/library"
            className={`text-sm transition-colors ${
              isActive("/library", true) ? "text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            Library
          </Link>
          {isAuthenticated && (
            <Link
              href="/leaderboard"
              className={`text-sm transition-colors ${
                isActive("/leaderboard") ? "text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              Leaderboard
            </Link>
          )}
          {isAuthenticated && (
            <Link
              href="/chat"
              className={`text-sm transition-colors ${
                isActive("/chat") ? "text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              Chat
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className={`text-sm transition-colors ${
                  isActive("/dashboard") ? "text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                Dashboard
              </Link>
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-sm text-accent hover:text-foreground transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/pricing"
                className="inline-flex items-center px-5 py-2 bg-foreground text-background text-sm font-medium transition-colors hover:opacity-90"
              >
                Get Premium
              </Link>
              <ThemeToggle />
            </>
          ) : (
            <>
              <Link
                href="/pricing"
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-5 py-2 bg-foreground text-background text-sm font-medium transition-colors hover:opacity-90"
              >
                Sign In
              </Link>
              <ThemeToggle />
            </>
          )}
        </div>

        {/* Mobile auth action + hamburger */}
        {isAuthenticated ? (
          <Link
            href="/dashboard"
            className="text-sm font-medium text-foreground md:hidden"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-accent md:hidden"
          >
            Sign In
          </Link>
        )}
        <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex items-center justify-center w-9 h-9 text-muted hover:text-foreground"
            aria-label="Toggle menu"
          >
          {mobileOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-6 py-4 space-y-3">
            <Link href="/gate" onClick={() => setMobileOpen(false)} className="block text-sm text-muted hover:text-foreground">GATE</Link>
            <Link href="/library" onClick={() => setMobileOpen(false)} className="block text-sm text-muted hover:text-foreground">Library</Link>
            {isAuthenticated && (
              <>
                <Link href="/leaderboard" onClick={() => setMobileOpen(false)} className="block text-sm text-muted hover:text-foreground">Leaderboard</Link>
                <Link href="/chat" onClick={() => setMobileOpen(false)} className="block text-sm text-muted hover:text-foreground">Chat</Link>
                {user?.role === "admin" && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="block text-sm text-accent font-medium">Admin</Link>
                )}
              </>
            )}
            <div className="pt-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function Nav() {
  return (
    <Suspense fallback={
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl text-foreground">Eduneuro</Link>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/library" className="text-sm text-muted hover:text-foreground">Library</Link>
            <Link href="/pricing" className="text-sm text-muted hover:text-foreground">Pricing</Link>
            <Link href="/login" className="inline-flex items-center px-5 py-2 bg-foreground text-background text-sm font-medium">Sign In</Link>
          </div>
        </div>
      </nav>
    }>
      <NavInner />
    </Suspense>
  );
}
