/**
 * LibraryHome — entry point for the Virtual Library.
 *
 * Calm, focused design. Greeting, plan summary, CTA, live count.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { RoomService } from "../../../services/room-service";
import type { StudyRoom } from "../../../types/index";
import { StudyPlanSummary } from "./StudyPlanSummary";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export function LibraryHome() {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [userLabel, setUserLabel] = useState<string>("there");
  const [participantId, setParticipantId] = useState<string>("");

  useEffect(() => {
    const svc = new RoomService();
    svc.getRooms().then(setRooms).catch(() => setRooms([]));

    // Resolve display name
    (async () => {
      try {
        const { getChatSupabase } = await import("@/modules/chat/services/supabase");
        const supabase = getChatSupabase();
        if (supabase) {
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            const { data: profile } = await supabase
              .from("profiles").select("display_name, full_name, email").eq("id", data.user.id).maybeSingle();
            const label =
              profile?.display_name || profile?.full_name ||
              data.user.user_metadata?.full_name ||
              data.user.email?.split("@")[0] || "there";
            setUserLabel(label);
            setParticipantId(data.user.id);
            return;
          }
        }
      } catch {}
      // Anonymous fallback (no fake name)
      const id = (typeof crypto !== "undefined" && "randomUUID" in crypto)
        ? crypto.randomUUID() : `guest-${Math.random().toString(36).slice(2, 10)}`;
      setParticipantId(id);
      setUserLabel("there");
    })();
  }, []);

  const totalStudents = rooms.reduce((sum: number, r) => sum + (r.activeCount ?? 0), 0);

  // Get hour-based greeting
  const hour = typeof window !== "undefined" ? new Date().getHours() : 12;
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* Hero greeting */}
      <motion.div {...fadeUp} className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {greeting}, {userLabel}
        </h1>
        <p className="text-muted text-lg max-w-xl">
          A calm space to focus, learn, and grow together with fellow GATE aspirants.
        </p>
      </motion.div>

      {/* Live stats */}
      <motion.div
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.1 }}
        className="flex flex-wrap gap-4"
      >
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-sm">
            <span className="font-semibold">{totalStudents}</span>{" "}
            <span className="text-muted">students studying now</span>
          </span>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5">
          <span className="text-lg">🚪</span>
          <span className="text-sm">
            <span className="font-semibold">{rooms.length}</span>{" "}
            <span className="text-muted">active rooms</span>
          </span>
        </div>
      </motion.div>

      {/* Plan summary */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }}>
        <StudyPlanSummary />
      </motion.div>

      {/* CTA */}
      <motion.div
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Link
          href="/library/room/main-library"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          <span>Enter the Library</span>
          <span className="text-lg">→</span>
        </Link>
        <Link
          href="/library?tab=planner"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-xl font-medium hover:bg-accent transition-colors"
        >
          <span>📋</span>
          <span>Plan Your Day</span>
        </Link>
      </motion.div>

      {/* Quick room links */}
      <motion.div
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.4 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
          Quick Access
        </h3>
        <div className="flex flex-wrap gap-2">
          {rooms.slice(0, 5).map((room) => (
            <Link
              key={room.id}
              href={`/library/room/${room.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg text-sm hover:border-foreground/30 transition-colors"
            >
              <span>{room.activeCount}</span>
              <span className="text-muted">·</span>
              <span>{room.name}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
