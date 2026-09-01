/**
 * Virtual Library Lobby — the entry experience for the 2D multiplayer library.
 *
 * Landing page with a striking visual, room previews, and a "Enter Library" CTA.
 * Sets the calm, academic tone before entering the multiplayer world.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

const ROOMS = [
  {
    id: "main-reading",
    name: "Main Reading Area",
    description: "Large open study space with desks, bookshelves, and natural light. Perfect for focused individual study.",
    icon: "📖",
    capacity: "30+",
    features: ["Individual desks", "Natural light", "Study ambience"],
  },
  {
    id: "quiet-zone",
    name: "Quiet Zone",
    description: "A completely silent study environment. Microphones off. Maximum focus.",
    icon: "🔇",
    capacity: "15",
    features: ["No talking", "Individual booths", "Calm atmosphere"],
  },
  {
    id: "group-study",
    name: "Group Study",
    description: "Collaborative tables for small groups. Whisper with nearby students.",
    icon: "👥",
    capacity: "4-6 per table",
    features: ["Group tables", "Nearby voice", "Whiteboard access"],
  },
  {
    id: "discussion-room",
    name: "Discussion Room",
    description: "Dedicated space for active discussion, debate, and collaborative problem-solving.",
    icon: "💬",
    capacity: "8",
    features: ["Active discussion", "Voice & video", "Screen share"],
  },
];

function AnimatedLibraryIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5 rounded-full blur-3xl" />

      {/* Library "screenshot" mockup */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border bg-accent/30">
        {/* Grid floor */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0,0,0,0.03) 19px, rgba(0,0,0,0.03) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0,0,0,0.03) 19px, rgba(0,0,0,0.03) 20px)",
          }}
        />

        {/* Top wall */}
        <div className="absolute top-0 left-0 right-0 h-[15%] bg-gradient-to-b from-amber-900/20 to-transparent" />

        {/* Bookshelves - top row */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={`shelf-top-${i}`}
            className="absolute top-[8%] h-[12%] bg-gradient-to-b from-amber-800/40 to-amber-900/30 rounded-sm"
            style={{
              left: `${10 + i * 22}%`,
              width: "16%",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            {/* Books */}
            <div className="flex gap-[2px] px-[3px] pt-[2px]">
              {Array.from({ length: 6 }).map((_, j) => (
                <div
                  key={j}
                  className="h-[60%] w-[12%] rounded-[1px]"
                  style={{
                    backgroundColor: [
                      "#8B4513", "#654321", "#A0522D", "#6B3410",
                      "#8B6914", "#704214", "#9B6B3A", "#5C3317",
                    ][j % 8],
                    opacity: 0.7 + (j % 3) * 0.1,
                  }}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Bookshelves - bottom row */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={`shelf-bottom-${i}`}
            className="absolute bottom-[8%] h-[12%] bg-gradient-to-b from-amber-800/40 to-amber-900/30 rounded-sm"
            style={{
              left: `${10 + i * 22}%`,
              width: "16%",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div className="flex gap-[2px] px-[3px] pt-[2px]">
              {Array.from({ length: 6 }).map((_, j) => (
                <div
                  key={j}
                  className="h-[60%] w-[12%] rounded-[1px]"
                  style={{
                    backgroundColor: [
                      "#6B3410", "#8B4513", "#704214", "#A0522D",
                      "#5C3317", "#8B6914", "#654321", "#9B6B3A",
                    ][j % 8],
                    opacity: 0.7 + (j % 3) * 0.1,
                  }}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Windows - top */}
        {[0, 1, 2].map((i) => (
          <div
            key={`window-${i}`}
            className="absolute top-[3%] h-[10%] bg-gradient-to-b from-sky-300/50 to-sky-200/30 rounded-sm border border-sky-400/20"
            style={{ left: `${20 + i * 25}%`, width: "15%" }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full h-[1px] bg-sky-400/20" />
              <div className="absolute w-[1px] h-full bg-sky-400/20" />
            </div>
          </div>
        ))}

        {/* Center carpet */}
        <div
          className="absolute top-[20%] left-[15%] right-[15%] bottom-[20%] rounded-lg bg-gradient-to-br from-amber-100/20 to-amber-200/10"
          style={{ boxShadow: "inset 0 0 30px rgba(0,0,0,0.05)" }}
        />

        {/* Study tables */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={`table-${i}`}
            className="absolute bg-amber-700/30 rounded-md border border-amber-600/20"
            style={{
              top: `${25 + (i % 2) * 30}%`,
              left: `${20 + Math.floor(i / 2) * 35}%`,
              width: "12%",
              height: "8%",
            }}
          />
        ))}

        {/* Plants */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={`plant-${i}`}
            className="absolute"
            style={{
              top: `${20 + (i % 2) * 50}%`,
              left: `${8 + Math.floor(i / 2) * 75}%`,
            }}
          >
            <div className="w-5 h-5 rounded-full bg-green-600/30" />
            <div className="w-3 h-1.5 bg-amber-800/40 rounded-full -mt-1 mx-auto" />
          </div>
        ))}

        {/* Animated avatar */}
        <motion.div
          className="absolute w-5 h-5 rounded-full border-2 border-amber-200/60 shadow-lg z-10"
          style={{ top: "45%", left: "45%", backgroundColor: "#6366f1" }}
          animate={{
            y: [0, -2, 0],
            boxShadow: [
              "0 0 0 0 rgba(245, 158, 11, 0.3)",
              "0 0 0 6px rgba(245, 158, 11, 0)",
              "0 0 0 0 rgba(245, 158, 11, 0)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-bold">
            Y
          </div>
        </motion.div>

        {/* Other avatars */}
        {[
          { top: "30%", left: "25%", color: "#ec4899", delay: 0 },
          { top: "55%", left: "30%", color: "#10b981", delay: 0.5 },
          { top: "35%", left: "60%", color: "#f59e0b", delay: 1 },
          { top: "50%", left: "65%", color: "#8b5cf6", delay: 1.5 },
        ].map((avatar, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 rounded-full border-2 border-white/20 shadow-sm z-10"
            style={{ top: avatar.top, left: avatar.left, backgroundColor: avatar.color }}
            animate={{
              y: [0, -1.5, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: avatar.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: text */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/60 border border-border mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-foreground">
                  Live multiplayer study environment
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.1] tracking-tight mb-6"
              >
                The Virtual{" "}
                <span className="text-accent">Library</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base md:text-lg text-muted leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8"
              >
                Step into a quiet university library populated by fellow students.
                Move around, find your spot, study together, and communicate when you want to.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 items-center justify-center lg:justify-start"
              >
                <Link
                  href="/library/world"
                  className="group inline-flex items-center gap-2 px-8 py-3.5 bg-foreground text-background font-medium text-sm rounded-xl transition-all duration-200 hover:opacity-90 shadow-lg"
                >
                  <span>Enter the Library</span>
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
                <span className="text-xs text-muted">
                  Free • No sign-up required
                </span>
              </motion.div>
            </div>

            {/* Right: illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={mounted ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex-1 max-w-lg w-full"
            >
              <AnimatedLibraryIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="text-center mb-14">
            <div className="font-mono text-xs tracking-[0.2em] text-muted uppercase mb-4">
              Spaces
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl leading-[1.1] tracking-tight mb-4">
              Find your space.
            </h2>
            <p className="text-sm md:text-base text-muted max-w-lg mx-auto">
              The library has different zones for different study styles.
              Walk between them and choose where you want to be.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROOMS.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="group bg-card border border-border rounded-2xl p-5 hover:border-foreground/20 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-lg mb-4 group-hover:scale-105 transition-transform">
                  {room.icon}
                </div>
                <h3 className="font-semibold text-sm mb-1">{room.name}</h3>
                <p className="text-xs text-muted leading-relaxed mb-3">
                  {room.description}
                </p>
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {room.capacity}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-accent/50 text-foreground/70">
                    {room.features.length} features
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {room.features.map((f) => (
                    <span
                      key={f}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-accent/30 text-muted"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-20 md:py-28">
          <div className="text-center mb-14">
            <div className="font-mono text-xs tracking-[0.2em] text-muted uppercase mb-4">
              How it works
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl leading-[1.1] tracking-tight mb-4">
              Study with others, without the pressure.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                title: "Enter the library",
                desc: "Pick a name, walk in, and see other students already studying. Your avatar appears automatically.",
              },
              {
                num: "02",
                title: "Find your spot",
                desc: "Move around the library. Choose the quiet zone for deep focus, or the group area for collaboration.",
              },
              {
                num: "03",
                title: "Study your way",
                desc: "Start a timer, enable voice if you want, chat when helpful. The library adapts to your needs.",
              },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="font-mono text-3xl text-accent/30 mb-3">
                  {step.num}
                </div>
                <h3 className="font-semibold text-sm mb-2">{step.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-20 md:py-28 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl leading-[1.1] tracking-tight mb-4">
            Ready to study together?
          </h2>
          <p className="text-sm md:text-base text-muted max-w-md mx-auto mb-8">
            Join the virtual library now. Free, no account required for the demo.
          </p>
          <Link
            href="/library/world"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-foreground text-background font-medium text-sm rounded-xl transition-all duration-200 hover:opacity-90 shadow-lg"
          >
            <span>Enter the Library</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-sm font-medium text-foreground/60">
                EduNeuro Virtual Library
              </span>
            </div>
            <div className="text-xs text-muted">
              Study together. Focus better. Grow together.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
