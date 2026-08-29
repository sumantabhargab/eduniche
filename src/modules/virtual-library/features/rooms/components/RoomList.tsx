/**
 * RoomList — grid of available study rooms.
 *
 * Supports branch filtering and responsive layout.
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { roomServiceInstance } from "../../../services/room-service";
import { RoomCard } from "./RoomCard";
import { getAllBranches } from "../../../config/syllabus";
import type { StudyRoom } from "../../../types/index";

const FILTERS = [
  { id: "all", label: "All Rooms" },
  { id: "focus", label: "Focus" },
  { id: "discussion", label: "Discussion" },
  { id: "video", label: "Video" },
] as const;

export function RoomList() {
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const branches = useMemo(() => getAllBranches(), []);

  useEffect(() => {
    roomServiceInstance.getRooms().then(setRooms).catch(() => setRooms([]));
  }, []);

  const filtered = useMemo(() => {
    return rooms.filter((r) => {
      if (modeFilter !== "all" && r.mode !== modeFilter) return false;
      if (branchFilter !== "all" && r.branchId !== branchFilter && r.branchId !== "all") return false;
      return true;
    });
  }, [rooms, modeFilter, branchFilter]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Mode filters */}
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setModeFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${modeFilter === f.id
                  ? "bg-foreground text-background"
                  : "bg-card border border-border text-muted hover:text-foreground"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Branch filter */}
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
        >
          <option value="all">All Branches</option>
          <option value="all">General</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Room grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${modeFilter}-${branchFilter}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted">
          <p className="text-lg mb-1">No rooms found</p>
          <p className="text-sm">Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
}
