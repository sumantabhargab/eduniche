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
            href="/game"
            className={`text-sm transition-colors ${
              isActive("/game", true) ? "text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            GATE Arcade
          </Link>
          <Link
            href="/doubts"
            className={`text-sm transition-colors ${
              isActive("/doubts") ? "text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            Doubt Engine
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
          {isAuthenticated && (
            <Link
              href="/profile"
              className="flex items-center gap-2.5 hover:bg-background-alt rounded-xl px-2 py-1.5 transition-colors"
              title="View profile"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-border"
                />
              ) : (
                <span className="w-8 h-8 rounded-full bg-accent text-background text-xs font-medium flex items-center justify-center uppercase">
                  {(user?.display_name || user?.username || user?.email || "U")[0]}
                </span>
              )}
              <span className="text-sm text-foreground font-medium max-w-[120px] truncate">
                {user?.display_name || user?.username || user?.email?.split("@")[0]}
              </span>
            </Link>
          )}
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
              {user?.isPremium ? (
                <span
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border border-amber-400/40 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 text-amber-600 dark:text-amber-400 shadow-[0_0_12px_-2px_rgba(245,158,11,0.3)]"
                  title="Premium subscription active"
                  aria-label="Premium subscription active"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 2 14.5 8.5 21 9.5 16 14 17.5 21 12 17.5 6.5 21 8 14 3 9.5 9.5 8.5z" />
                  </svg>
                  <span className="tracking-wide">EduPremium</span>
                </span>
              ) : (
                <Link
                  href="/pricing"
                  className="inline-flex items-center px-5 py-2 bg-foreground text-background text-sm font-medium transition-colors hover:opacity-90"
                >
                  Get Premium
                </Link>
              )}
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
            <Link href="/game" onClick={() => setMobileOpen(false)} className="block text-sm text-muted hover:text-foreground">GATE Arcade</Link>
            <Link href="/doubts" onClick={() => setMobileOpen(false)} className="block text-sm text-muted hover:text-foreground">Doubt Engine</Link>
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
            <div className="pt-2 border-t border-border">
              {isAuthenticated && (
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm text-foreground font-medium mb-3">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-accent text-background text-xs font-medium flex items-center justify-center uppercase">
                      {(user?.display_name || user?.username || user?.email || "U")[0]}
                    </span>
                  )}
                  <span className="truncate">
                    {user?.display_name || user?.username || user?.email?.split("@")[0]}
                  </span>
                </Link>
              )}
              {isAuthenticated && <div className="border-t border-border my-2" />}
              {user?.isPremium ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-amber-400/40 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 text-amber-600 dark:text-amber-400 self-start">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2 14.5 8.5 21 9.5 16 14 17.5 21 12 17.5 6.5 21 8 14 3 9.5 9.5 8.5z" />
                  </svg>
                  <span className="tracking-wide">EduPremium</span>
                </span>
              ) : (
                <Link
                  href="/pricing"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center px-5 py-2.5 bg-foreground text-background text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
                >
                  Get Premium
                </Link>
              )}
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
            <Link href="/game" className="text-sm text-accent hover:text-foreground">GATE Arcade</Link>
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
