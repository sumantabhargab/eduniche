"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const navLinks = [
  { href: "/gate", label: "GATE", matchPrefix: true },
  { href: "/how-it-works", label: "How it works", matchPrefix: false },
  { href: "/skills", label: "Skills", matchPrefix: false },
  { href: "/neuroscience", label: "Neuroscience", matchPrefix: false },
  { href: "/library", label: "Library", matchPrefix: true },
];

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (link: typeof navLinks[0]) => {
    if (link.matchPrefix) return pathname?.startsWith(link.href) ?? false;
    return pathname === link.href;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl text-foreground">
          Eduneuro
        </Link>

        {/* Desktop nav */}
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors duration-200 ${
                  isActive(link)
                    ? "text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="text-sm text-muted hover:text-foreground transition-colors duration-200"
              title="Admin"
            >
              Admin
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/#waitlist"
              className="inline-flex items-center px-5 py-2 bg-accent hover:bg-accent-hover text-background text-sm font-medium transition-colors duration-200"
            >
              Join early access
            </Link>
            <ThemeToggle />
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden flex items-center justify-center w-9 h-9 text-muted hover:text-foreground"
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
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block text-sm transition-colors ${
                  isActive(link) ? "text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-muted hover:text-foreground"
            >
              Admin
            </Link>
            <Link
              href="/#waitlist"
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-accent font-medium"
            >
              Join early access
            </Link>
            <div className="pt-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
