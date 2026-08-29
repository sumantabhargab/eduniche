/**
 * StudyRoom — the room experience.
 *
 * Presence area, optional video grid, chat panel, timer display.
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "../../../hooks/use-chat";
import { useStudySession } from "../../../hooks/use-study-session";
import { useRooms } from "../../../hooks/use-rooms";
import { ChatPanel } from "../../../features/chat/components/ChatPanel";
import { VideoGrid } from "./VideoGrid";
import { StudyTimer } from "../../../features/study-session/components/StudyTimer";
import { virtualLibraryConfig } from "../../../config/feature-flags";
import { createAnonymousId } from "../../../services/session-service";
import { getChatSupabase } from "@/modules/chat/services/supabase";
import { realRealtimeProvider } from "../../../providers/real-realtime";

interface StudyRoomProps {
  roomId: string;
}

const modeTabs: Array<{ id: "focus" | "chat" | "video"; label: string }> = [
  { id: "focus", label: "Focus" },
  { id: "chat", label: "Chat" },
];
if (virtualLibraryConfig.videoEnabled) {
  modeTabs.push({ id: "video", label: "Video" });
}

export function StudyRoom({ roomId }: StudyRoomProps) {
  const participantId = useMemo(() => createAnonymousId(), []);
  const [activeTab, setActiveTab] = useState<"focus" | "chat" | "video">("focus");
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  const { rooms, activeRoom, participants, joinRoom, leaveRoom, setActiveRoom } = useRooms();

  // Set the active room from the URL param
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = getChatSupabase();
      let userId = participantId;

      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;

          // Ensure profile exists
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

          if (!profile) {
            const displayName = user.email?.split("@")[0] ?? "User";
            await supabase.from("profiles").upsert(
              { id: user.id, role: "student", display_name: displayName, full_name: displayName, email: user.email },
              { onConflict: "id", ignoreDuplicates: true }
            );
          }
        }
      }

      if (cancelled) return;

      setCurrentUserId(userId);

      // Load room from DB
      if (supabase) {
        const { data } = await supabase
          .from("study_rooms")
          .select("*")
          .eq("id", roomId)
          .maybeSingle();

        if (data && !cancelled) {
          const r = data as any;
          setActiveRoom({
            id: r.id,
            name: r.name,
            description: r.description ?? "",
            branchId: r.branch_id ?? "all",
            mode: r.mode ?? "focus",
            activeCount: 0,
            maxParticipants: r.max_participants ?? 50,
            createdAt: r.created_at,
            isOpen: r.is_open,
          });
        }
      }

      joinRoom(roomId);
    })();

    return () => {
      cancelled = true;
      leaveRoom(roomId, participantId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, participantId]);

  const { status: sessionStatus, focusSeconds, start, pause, resume, end } =
    useStudySession({
      roomId,
      branchId: activeRoom?.branchId,
      onSessionEnd: (session) => {
        console.log("Session completed:", session);
      },
    });

  const { messages, sendMessage } = useChat({ roomId });

  const mode = activeRoom?.mode ?? "focus";

  // Auto-switch to chat tab in discussion mode
  useEffect(() => {
    if (mode === "discussion") setActiveTab("chat");
    else if (mode === "video") setActiveTab("video");
    else setActiveTab("focus");
  }, [mode]);

  return (
    <div className="space-y-6">
      {/* Room header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{activeRoom?.name ?? roomId}</h1>
          <p className="text-muted text-sm mt-0.5">{activeRoom?.description}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Participant avatars */}
          <div className="flex -space-x-2">
            {participants.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="w-8 h-8 rounded-full bg-accent border-2 border-background flex items-center justify-center text-xs font-medium"
                title={p.label}
              >
                {p.label.charAt(0)}
              </div>
            ))}
            {participants.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-accent border-2 border-background flex items-center justify-center text-xs font-medium">
                +{participants.length - 5}
              </div>
            )}
          </div>

          <span className="text-sm text-muted">
            {participants.length} here
          </span>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-accent/50 rounded-xl w-fit">
        {modeTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "focus" | "chat" | "video")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex gap-4">
        {/* Main panel */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === "focus" && (
              <motion.div
                key="focus"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <StudyTimer
                  status={sessionStatus}
                  focusSeconds={focusSeconds}
                  onStart={() => start(activeRoom?.branchId ?? "all")}
                  onPause={pause}
                  onResume={resume}
                  onEnd={end}
                />

                {/* Room info cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="text-sm font-medium text-muted mb-2">Study Focus</h3>
                    <p className="text-sm">
                      {activeRoom?.description ?? "Focus on your preparation."}
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="text-sm font-medium text-muted mb-2">Community</h3>
                    <p className="text-sm text-muted">
                      {participants.length} students currently in this room.
                      Be respectful and maintain focus.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                {virtualLibraryConfig.chatEnabled ? (
                  <ChatPanel
                    messages={messages}
                    onSendMessage={sendMessage}
                    currentUserId={currentUserId}
                  />
                ) : (
                  <div className="text-center py-16 text-muted">
                    Chat is disabled for this room.
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "video" && (
              <motion.div
                key="video"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                {virtualLibraryConfig.videoEnabled ? (
                  <VideoGrid participants={participants} />
                ) : (
                  <div className="text-center py-16 text-muted">
                    Video presence is not enabled.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side chat panel (desktop) */}
        {virtualLibraryConfig.chatEnabled && (
          <div className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-[120px]">
              <ChatPanel
                messages={messages}
                onSendMessage={sendMessage}
                compact
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
