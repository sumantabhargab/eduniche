"use client";

import Link from "next/link";

const footerLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/skills", label: "Skills" },
  { href: "/neuroscience", label: "Neuroscience" },
  { href: "/#waitlist", label: "Early access" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-[1fr_1fr_1fr] gap-12">
          <div>
            <div className="font-serif text-xl text-foreground mb-4">
              Eduneuro
            </div>
            <p className="text-sm text-muted leading-relaxed max-w-xs">
              An AI-powered, neuroscience-informed platform for learning real
              skills through active practice and personalized feedback.
            </p>
          </div>

          <div>
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-4">
              Platform
            </div>
            <div className="space-y-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-muted hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-4">
              Contact
            </div>
            <div className="space-y-2">
              <a
                href="mailto:sumantabhargab@gmail.com"
                className="block text-sm text-muted hover:text-foreground transition-colors"
              >
                sumantabhargab@gmail.com
              </a>
              <a
                href="https://www.linkedin.com/in/sumantabhargab/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-muted hover:text-foreground transition-colors"
              >
                LinkedIn — Sumanta Bhargab
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted">
            Eduneuro. All rights reserved.
          </div>
          <div className="text-xs text-muted">
            Learn. Practice. Get feedback. Improve.
          </div>
        </div>
      </div>
    </footer>
  );
}
