/**
 * Library home page — entry point at /library.
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LibraryHome } from "@/modules/virtual-library/features/home/components/LibraryHome";
import { DoubtPanel } from "@/modules/virtual-library/features/ai-doubt-engine/components/DoubtPanel";
import { DailyPlanner } from "@/modules/virtual-library/features/planner/components/DailyPlanner";
import { RoomService } from "@/modules/virtual-library/services/room-service";
import { RoomList } from "@/modules/virtual-library/features/rooms/components/RoomList";
import { virtualLibraryConfig } from "@/modules/virtual-library/config/feature-flags";
import type { StudyRoom } from "@/modules/virtual-library/types/index";

export default function LibraryPage() {
  const [doubtOpen, setDoubtOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("library");
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const router = useRouter();
  const roomService = useMemo(() => new RoomService(), []);

  // Parse URL tab param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["planner", "doubts", "library", "rooms"].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Load rooms from DB
  useEffect(() => {
    let cancelled = false;
    setIsLoadingRooms(true);
    roomService.getRooms().then((r) => {
      if (!cancelled) {
        setRooms(r);
        setIsLoadingRooms(false);
      }
    }).catch(() => {
      if (!cancelled) setIsLoadingRooms(false);
    });
    return () => { cancelled = true; };
  }, [roomService]);

  if (!virtualLibraryConfig.enabled) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted text-lg">The Virtual Library is currently unavailable.</p>
      </div>
    );
  }

  const tabs = [
    { key: "library", label: "Library" },
    { key: "rooms", label: "Study Rooms" },
    { key: "planner", label: "Study Planner" },
    { key: "doubts", label: "AI Doubts" },
  ];

  const switchTab = (key: string) => {
    setActiveTab(key);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", key);
    router.replace(url.pathname + url.search);
  };

  return (
    <div className="space-y-8">
      {/* Tab bar */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab content area */}
      <div className="max-w-6xl mx-auto px-6">
        {activeTab === "library" && <LibraryHome />}

        {activeTab === "rooms" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Study Rooms</h2>
            <RoomList />
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
    </div>
  );
}
