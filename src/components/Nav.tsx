"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const navLinks = [
  { href: "/gate", label: "GATE" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/skills", label: "Skills" },
  { href: "/neuroscience", label: "Neuroscience" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl text-foreground">
          Eduneuro
        </Link>

        <div className="flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hidden md:block text-sm transition-colors duration-200 ${
                pathname === link.href
                  ? "text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/#waitlist"
            className="hidden sm:inline-flex items-center px-5 py-2 bg-accent hover:bg-accent-hover text-background text-sm font-medium transition-colors duration-200"
          >
            Join early access
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
