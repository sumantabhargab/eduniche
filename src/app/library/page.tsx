/**
 * Library home page — entry point at /library.
 */

"use client";

import { useState, useMemo } from "react";
import { LibraryHome } from "@/modules/virtual-library/features/home/components/LibraryHome";
import { DoubtPanel } from "@/modules/virtual-library/features/ai-doubt-engine/components/DoubtPanel";
import { DailyPlanner } from "@/modules/virtual-library/features/planner/components/DailyPlanner";
import { roomService } from "@/modules/virtual-library/services/room-service";
import { virtualLibraryConfig } from "@/modules/virtual-library/config/feature-flags";

export default function LibraryPage() {
  const [doubtOpen, setDoubtOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("library");

  const rooms = useMemo(() => roomService.getRooms(), []);

  // Parse URL tab param
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["planner", "doubts", "library", "rooms"].includes(tab)) {
      setActiveTab(tab);
    }
  }

  if (!virtualLibraryConfig.enabled) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted text-lg">The Virtual Library is currently unavailable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tab content */}
      {activeTab === "library" && <LibraryHome />}

      {activeTab === "rooms" && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Study Rooms</h2>
          {/* RoomList would go here — importing would cause circular deps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <a
                key={room.id}
                href={`/library/room/${room.id}`}
                className="block bg-card border border-border rounded-2xl p-5 hover:border-foreground/30 transition-colors"
              >
                <h3 className="font-semibold mb-1">{room.name}</h3>
                <p className="text-sm text-muted mb-3">{room.description}</p>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>{room.activeCount} studying</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {activeTab === "planner" && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Study Planner</h2>
          <DailyPlanner />
        </div>
      )}

      {activeTab === "doubts" && (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">AI Doubt Engine</h2>
          <DoubtPanel isOpen={true} onClose={() => {}} />
        </div>
      )}

      {/* Floating Doubt button */}
      <button
        onClick={() => setDoubtOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-foreground text-background rounded-full shadow-lg flex items-center justify-center text-2xl hover:opacity-90 transition-opacity"
        title="Ask a doubt"
      >
        💡
      </button>

      {doubtOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px]">
          <DoubtPanel isOpen={doubtOpen} onClose={() => setDoubtOpen(false)} />
        </div>
      )}
    </div>
  );
}
