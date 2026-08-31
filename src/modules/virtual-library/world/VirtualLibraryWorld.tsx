/**
 * VirtualLibraryWorld — the main multiplayer library experience.
 *
 * Entry point for the full 2D explorable library.
 * Wires together:
 *   - WorldRenderer (2D canvas rendering)
 *   - MultiplayerManager (Supabase Realtime broadcast)
 *   - Room chat (Supabase messages)
 *   - Study timer
 *   - Connection state UI
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { multiplayerManager } from "./multiplayer";
import { WorldRenderer } from "./WorldRenderer";
import { CollisionSystem } from "./collision";
import { ROOM_ZONES } from "./map";
import { WORLD_CONFIG } from "./types";
import type { WorldPlayer, WorldChatMessage, ConnectionState, RoomId } from "./types";
import { useStudySession } from "../hooks/use-study-session";
import { getChatSupabase } from "@/modules/chat/services/supabase";
import { EduNeuroLoader } from "@/components/loading";

// ─── Constants ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#B8710E",
  "#4A7A5A",
  "#6A5A8A",
  "#8A4A4A",
  "#4A6A8A",
  "#8A7A3A",
  "#7A5A6A",
  "#5A8A7A",
];

// ─── Loading Screen ───────────────────────────────────────────────────────────

function LibraryLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <EduNeuroLoader size="lg" variant="page" label="Entering the library..." />
        <p className="text-sm text-muted animate-pulse">
          Preparing your study space...
        </p>
      </div>
    </div>
  );
}

// ─── Connection Overlay ───────────────────────────────────────────────────────

function ConnectionOverlay({ state }: { state: ConnectionState }) {
  if (state === "connected") return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-muted">
          {state === "connecting" && "Entering the library..."}
          {state === "reconnecting" && "Reconnecting to the library..."}
          {state === "disconnected" && "Connection lost"}
        </p>
      </div>
    </div>
  );
}

// ─── Room Info Overlay ────────────────────────────────────────────────────────

function RoomInfoOverlay({ roomId, onClose }: { roomId: string; onClose: () => void }) {
  const room = ROOM_ZONES.find((r) => r.id === roomId);
  if (!room) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.25 }}
      className="absolute top-4 left-4 z-30 bg-background-dark/90 backdrop-blur-sm border border-border-light rounded-xl p-4 max-w-xs shadow-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground-light">{room.name}</h3>
          <p className="text-xs text-muted-light mt-1">{room.description}</p>
          <div className="flex items-center gap-2 mt-2">
            {room.voiceEnabled && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                Voice
              </span>
            )}
            {room.videoEnabled && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                Video
              </span>
            )}
            {!room.voiceEnabled && !room.videoEnabled && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/20 text-muted-light">
                Quiet
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-light hover:text-foreground-light text-xs"
          aria-label="Close room info"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}

// ─── Format Time ──────────────────────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VirtualLibraryWorld({ devMode }: { devMode?: boolean } = {}) {
  const [loading, setLoading] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [localPlayer, setLocalPlayer] = useState<WorldPlayer | null>(null);
  const [remotePlayers, setRemotePlayers] = useState<WorldPlayer[]>([]);
  const [messages, setMessages] = useState<WorldChatMessage[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [userLabel, setUserLabel] = useState("there");
  const [userId, setUserId] = useState<string | null>(null);

  const collisionRef = useRef<CollisionSystem | null>(null);
  const roomInfoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localPlayerRef = useRef<WorldPlayer | null>(null);

  // Keep ref in sync
  useEffect(() => {
    localPlayerRef.current = localPlayer;
  }, [localPlayer]);

  // Resolve user identity
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = getChatSupabase();
        if (!supabase) {
          // No Supabase — enter demo mode with a local-only player
          if (!cancelled) {
            const demoId = "demo-user-" + Math.random().toString(36).slice(2, 10);
            const spawn = collisionRef.current?.getSpawnPosition() || { x: 300, y: 300 };
            const player: WorldPlayer = {
              id: demoId,
              label: "You",
              x: spawn.x,
              y: spawn.y,
              targetX: spawn.x,
              targetY: spawn.y,
              dx: 0,
              dy: 0,
              isLocal: true,
              colorIndex: 0,
              roomId: "entrance",
              lastUpdate: Date.now(),
              isMuted: true,
              isVideoOn: false,
              isMoving: false,
            };
            setUserId(demoId);
            setUserLabel("You");
            setLocalPlayer(player);
            setConnectionState("connected");
            setLoading(false);
          }
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) {
          if (devMode) {
            if (!cancelled) {
              const demoId = "demo-user-" + Math.random().toString(36).slice(2, 10);
              const spawn = collisionRef.current?.getSpawnPosition() || { x: 300, y: 300 };
              const player: WorldPlayer = {
                id: demoId, label: "You", x: spawn.x, y: spawn.y,
                targetX: spawn.x, targetY: spawn.y, dx: 0, dy: 0,
                isLocal: true, colorIndex: 0, roomId: "entrance",
                lastUpdate: Date.now(), isMuted: true, isVideoOn: false, isMoving: false,
              };
              setUserId(demoId);
              setUserLabel("You");
              setLocalPlayer(player);
              setConnectionState("connected");
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, full_name, email")
          .eq("id", user.id)
          .maybeSingle();

        const label =
          profile?.display_name ||
          profile?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "there";

        if (!cancelled) {
          setUserId(user.id);
          setUserLabel(label);
        }
      } catch {
        // ignore
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Initialize player once user is resolved
  useEffect(() => {
    if (!userId) return;

    collisionRef.current = new CollisionSystem(WORLD_CONFIG);
    const spawn = collisionRef.current.getSpawnPosition();

    const hash =
      userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;

    const player: WorldPlayer = {
      id: userId,
      label: userLabel,
      x: spawn.x,
      y: spawn.y,
      targetX: spawn.x,
      targetY: spawn.y,
      dx: 0,
      dy: 0,
      isLocal: true,
      colorIndex: hash,
      roomId: "entrance",
      lastUpdate: Date.now(),
      isMuted: true,
      isVideoOn: false,
      isMoving: false,
    };

    setLocalPlayer(player);
    setConnectionState("connecting");
    multiplayerManager.connect(player);
    setConnectionState("connected");

    // Mark presence
    (async () => {
      const supabase = getChatSupabase();
      if (!supabase) return;
      await supabase
        .from("study_room_presence")
        .upsert(
          {
            room_id: "main-library",
            user_id: userId,
            participant_label: userLabel,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "room_id,user_id" }
        );
    })();

    setLoading(false);
  }, [userId, userLabel]);

  // Listen for multiplayer updates
  useEffect(() => {
    const unsubPos = multiplayerManager.onPositionUpdate((player) => {
      if (!player.isLocal) {
        setRemotePlayers((prev) => {
          const idx = prev.findIndex((p) => p.id === player.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...player, isLocal: false };
            return next;
          }
          return [...prev, { ...player, isLocal: false }];
        });
      }
    });

    const unsubLeave = multiplayerManager.onPlayerLeave((playerId) => {
      setRemotePlayers((prev) => prev.filter((p) => p.id !== playerId));
    });

    return () => {
      unsubPos();
      unsubLeave();
    };
  }, []);

  // Handle local player updates from world (called by WorldRenderer indirectly via broadcast)
  const handlePlayerUpdate = useCallback((updates: Partial<WorldPlayer>) => {
    setLocalPlayer((prev) => (prev ? { ...prev, ...updates } : prev));

    // Broadcast to other players
    multiplayerManager.updateLocalPlayer(updates);
  }, []);

  // Handle room changes
  const handleRoomChange = useCallback((roomId: string | null) => {
    if (roomId && roomId !== currentRoom) {
      setCurrentRoom(roomId);
      setShowRoomInfo(true);

      if (roomInfoTimeoutRef.current) clearTimeout(roomInfoTimeoutRef.current);
      roomInfoTimeoutRef.current = setTimeout(() => {
        setShowRoomInfo(false);
      }, 5000);
    } else if (!roomId && currentRoom) {
      setCurrentRoom(null);
    }
  }, [currentRoom]);

  // Handle chat messages
  const handleChatMessage = useCallback((content: string) => {
    const current = localPlayerRef.current;
    if (!current) return;

    const newMsg: WorldChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: current.id,
      authorLabel: current.label,
      content,
      timestamp: Date.now(),
      type: "text",
      roomId: (currentRoom as RoomId) || "main-reading",
    };
    setMessages((prev) => [...prev, newMsg]);

    // Persist via Supabase global chat_messages table
    (async () => {
      const supabase = getChatSupabase();
      if (!supabase || !userId) return;
      try {
        await supabase.from("chat_messages").insert({
          user_id: userId,
          content,
          content_type: "text",
        });
      } catch {
        // ignore
      }
    })();
  }, [currentRoom, userId]);

  // Subscribe to incoming chat messages via Supabase Realtime
  useEffect(() => {
    const supabase = getChatSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel("eduneuro:world:chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        async (payload) => {
          const record = payload.new as any;
          if (record.user_id === userId) return; // skip own messages

          // Fetch sender name from profiles
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, full_name")
            .eq("id", record.user_id)
            .maybeSingle();

          const label =
            profile?.display_name ||
            profile?.full_name ||
            record.user_id?.slice(0, 8) ||
            "Student";

          setMessages((prev) => [
            ...prev,
            {
              id: record.id,
              authorId: record.user_id,
              authorLabel: label,
              content: record.content,
              timestamp: record.created_at,
              type: "text",
              roomId: (currentRoom as RoomId) || "main-reading",
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [userId, currentRoom]);

  // Study session
  const { status: sessionStatus, focusSeconds, start, pause, resume, end } = useStudySession({
    roomId: currentRoom || "global",
    onSessionEnd: (session) => {
      (async () => {
        const supabase = getChatSupabase();
        if (!supabase || !userId) return;
        try {
          await supabase.from("study_sessions").insert({
            participant_id: userId,
            room_id: currentRoom || "main-library",
            status: "completed",
            duration: Math.round(session.totalFocusMs / 60000),
            branch: currentRoom || "general",
          });
        } catch {
          // ignore
        }
      })();
    },
  });

  // Movement via WASD/arrows
  useEffect(() => {
    if (!localPlayer) return;

    const collision = collisionRef.current;
    if (!collision) return;

    const keys = new Set<string>();
    let lastBroadcast = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        e.preventDefault();
        keys.add(k);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let raf = 0;
    let lastTime = performance.now();

    const tick = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      let dx = 0, dy = 0;
      if (keys.has("w") || keys.has("arrowup")) dy -= 1;
      if (keys.has("s") || keys.has("arrowdown")) dy += 1;
      if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
      if (keys.has("d") || keys.has("arrowright")) dx += 1;

      if (dx !== 0 && dy !== 0) {
        const inv = 1 / Math.sqrt(2);
        dx *= inv;
        dy *= inv;
      }

      const current = localPlayerRef.current;
      if (!current) {
        raf = requestAnimationFrame(tick);
        return;
      }

      if (dx !== 0 || dy !== 0) {
        const speed = WORLD_CONFIG.playerSpeed;
        const targetX = current.x + dx * speed * dt;
        const targetY = current.y + dy * speed * dt;

        const result = collision.resolveMovement(current.x, current.y, targetX, targetY);

        const newPlayer: Partial<WorldPlayer> = {
          x: result.x,
          y: result.y,
          dx,
          dy,
          isMoving: true,
          targetX,
          targetY,
          lastUpdate: Date.now(),
        };

        setLocalPlayer((prev) => (prev ? { ...prev, ...newPlayer } : prev));

        // Detect room change
        const room = collision.getTileAt(result.x, result.y);
        // Use a simple room lookup from current tile
        const newRoom = findRoomFromPosition(result.x, result.y);
        if (newRoom && newRoom !== currentRoom) {
          handleRoomChange(newRoom);
        }

        // Throttle broadcast
        const now = Date.now();
        if (now - lastBroadcast > WORLD_CONFIG.broadcastInterval) {
          lastBroadcast = now;
          multiplayerManager.updateLocalPlayer(newPlayer);
        }
      } else if (current.isMoving) {
        const newPlayer: Partial<WorldPlayer> = {
          dx: 0,
          dy: 0,
          isMoving: false,
          lastUpdate: Date.now(),
        };
        setLocalPlayer((prev) => (prev ? { ...prev, ...newPlayer } : prev));
        multiplayerManager.updateLocalPlayer(newPlayer);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(raf);
    };
  }, [localPlayer, currentRoom, handleRoomChange]);

  // Cleanup
  useEffect(() => {
    return () => {
      multiplayerManager.disconnect();
      if (roomInfoTimeoutRef.current) clearTimeout(roomInfoTimeoutRef.current);
    };
  }, []);

  if (loading || !localPlayer) {
    return <LibraryLoading />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background-dark">
      <WorldRenderer
        localPlayer={localPlayer}
        remotePlayers={remotePlayers}
        messages={messages}
        connectionState={connectionState}
        onRoomChange={handleRoomChange}
        onMessageSend={handleChatMessage}
      />

      <ConnectionOverlay state={connectionState} />

      <AnimatePresence>
        {showRoomInfo && currentRoom && (
          <RoomInfoOverlay roomId={currentRoom} onClose={() => setShowRoomInfo(false)} />
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="bg-gradient-to-b from-background/90 to-transparent pt-3 pb-8 px-4 pointer-events-none">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-3 pointer-events-auto">
              <Link href="/">
                <span className="font-serif text-lg text-foreground-light hover:text-accent transition-colors">
                  Eduneuro
                </span>
              </Link>
              <span className="text-muted-light text-xs">/</span>
              <span className="text-xs text-foreground-light/70">Virtual Library</span>
            </div>
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="flex items-center gap-2 bg-foreground-dark/70 backdrop-blur-sm border border-border-light rounded-full px-3 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs text-foreground-light">
                  {remotePlayers.length + 1} studying
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="bg-gradient-to-t from-background/90 to-transparent pt-8 pb-4 px-4">
          <div className="flex items-center justify-center gap-3 max-w-6xl mx-auto pointer-events-auto">
            {sessionStatus === "running" && (
              <div className="flex items-center gap-2 bg-foreground-dark/80 backdrop-blur-sm border border-border-light rounded-full px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs text-foreground-light font-mono">
                  Studying {formatTime(focusSeconds)}
                </span>
              </div>
            )}

            {sessionStatus === "idle" && (
              <button
                onClick={() => start(currentRoom || "general")}
                className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                Start Studying
              </button>
            )}

            {sessionStatus === "running" && (
              <button
                onClick={pause}
                className="flex items-center gap-2 bg-foreground-dark/80 backdrop-blur-sm border border-border-light text-foreground-light px-4 py-2 rounded-xl text-sm hover:bg-foreground-dark transition-colors"
              >
                Pause
              </button>
            )}
            {sessionStatus === "paused" && (
              <button
                onClick={resume}
                className="flex items-center gap-2 bg-accent text-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90"
              >
                Resume
              </button>
            )}

            {(sessionStatus === "running" || sessionStatus === "paused") && (
              <button
                onClick={end}
                className="flex items-center gap-2 bg-foreground-dark/80 backdrop-blur-sm border border-border-light text-foreground-light px-4 py-2 rounded-xl text-sm hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                End
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Room Lookup Helper ────────────────────────────────────────────────────────

function findRoomFromPosition(px: number, py: number): string | null {
  const tileSize = WORLD_CONFIG.tileSize;
  const col = Math.floor(px / tileSize);
  const row = Math.floor(py / tileSize);

  for (const zone of ROOM_ZONES) {
    const [rx, ry, rw, rh] = zone.bounds;
    if (col >= rx && col < rx + rw && row >= ry && row < ry + rh) {
      return zone.id;
    }
  }
  return null;
}