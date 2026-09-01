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
 *   - Ambient music (Web Audio API)
 *   - Proximity-based voice
 *   - Fullscreen mode
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { COLORS } from "./colors";
import { multiplayerManager } from "./multiplayer";
import { WorldRenderer } from "./WorldRenderer";
import { CollisionSystem } from "./collision";
import { ROOM_ZONES } from "./map";
import { WORLD_CONFIG } from "./types";
import type { WorldPlayer, WorldChatMessage, ConnectionState, RoomId } from "./types";
import { useStudySession } from "../hooks/use-study-session";
import { getChatSupabase } from "@/modules/chat/services/supabase";
import { EduNeuroLoader } from "@/components/loading";
import { useAmbientMusic } from "./ambient-music";
import { useProximityVoice } from "./proximity-voice";

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
          className="p-1 rounded-md transition-colors"
          style={{ color: COLORS.hudMuted }}
          aria-label="Close room info"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
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

// ─── Music Control ────────────────────────────────────────────────────────────

function MusicControl({
  isPlaying,
  onToggle,
  onVolumeChange,
  volume,
}: {
  isPlaying: boolean;
  onToggle: () => void;
  onVolumeChange: (v: number) => void;
  volume: number;
}) {
  const [showSlider, setShowSlider] = useState(false);

  return (
    <div
      className="flex items-center gap-2 bg-foreground-dark/80 backdrop-blur-sm border border-border-light rounded-full pl-3 pr-1 py-1"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs text-foreground-light hover:text-accent transition-colors"
        aria-label={isPlaying ? "Mute music" : "Play music"}
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M19 9l-6 6-6-6M19 15l-6-6-6 6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        <span>Music</span>
      </button>
      <AnimatePresence>
        {showSlider && (
          <motion.input
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 60, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="h-1 accent-accent cursor-pointer"
            aria-label="Music volume"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Fullscreen Control ───────────────────────────────────────────────────────

function FullscreenControl({ isFullscreen, onToggle }: { isFullscreen: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-center w-9 h-9 bg-foreground-dark/80 backdrop-blur-sm border border-border-light rounded-full text-foreground-light hover:text-accent transition-colors"
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
    >
      {isFullscreen ? (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M9 9V5a2 2 0 00-2-2H4m0 6h6M15 9V5a2 2 0 012-2h3m0 6h-6m0 0v6a2 2 0 002 2h3m0-6v6m-9 0v-6a2 2 0 00-2-2H4m0 6h6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M3 8V5a2 2 0 012-2h3M3 16v3a2 2 0 002 2h3m8-16h3a2 2 0 012 2v3m0 8v3a2 2 0 01-2 2h-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ─── Mic Control ──────────────────────────────────────────────────────────────

function MicControl({
  isMicOn,
  nearbyCount,
  roomVoiceEnabled,
  onToggle,
  error,
}: {
  isMicOn: boolean;
  nearbyCount: number;
  roomVoiceEnabled: boolean;
  onToggle: () => void;
  error: string | null;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          isMicOn
            ? "bg-green-500/20 border border-green-500/40 text-green-300"
            : "bg-foreground-dark/80 border border-border-light text-foreground-light hover:bg-foreground-dark"
        }`}
        aria-label={isMicOn ? "Mute microphone" : "Enable microphone"}
        title={
          roomVoiceEnabled
            ? isMicOn ? `${nearbyCount} can hear you (room voice)` : "Room supports voice"
            : isMicOn ? `${nearbyCount} nearby` : "Click to talk near others"
        }
      >
        {isMicOn ? (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14a5 5 0 01-2 3.97M17 8a5 5 0 00-3-4.472" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {isMicOn && <span>{nearbyCount}</span>}
      </button>
      {error && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-1.5 whitespace-nowrap z-50">
          <p className="text-[10px] text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}

// ─── Proximity Indicator ──────────────────────────────────────────────────────

function ProximityIndicator({ visible, range }: { visible: boolean; range: number }) {
  if (!visible) return null;
  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 bg-foreground-dark/60 backdrop-blur-sm border border-border-light/40 rounded-full px-3 py-1.5 pointer-events-none">
      <p className="text-[10px] text-muted-light">
        <span className="text-foreground-light/70">{Math.round(range)}px</span> voice range
      </p>
    </div>
  );
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolumeState] = useState(0.3);
  const [musicHintShown, setMusicHintShown] = useState(false);

  const collisionRef = useRef<CollisionSystem | null>(null);
  const roomInfoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localPlayerRef = useRef<WorldPlayer | null>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  const music = useAmbientMusic();
  const voice = useProximityVoice(localPlayer, remotePlayers, currentRoom);

  // ─── Feature Handlers ─────────────────────────────────────────────────────────

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const handleMusicToggle = useCallback(() => {
    music.toggle();
    if (musicHintShown) {
      setMusicHintShown(false);
      localStorage.setItem("eduneuro:library:musicHint", "1");
    }
  }, [music, musicHintShown]);

  const handleVolumeChange = useCallback((v: number) => {
    music.setVolume(v);
  }, [music]);

  const handleMicToggle = useCallback(async () => {
    await voice.toggleMic();
    setVoiceError(voice.error);
  }, [voice]);

  // ─── Side Effects ────────────────────────────────────────────────────────────

  // Keep ref in sync
  useEffect(() => {
    localPlayerRef.current = localPlayer;
  }, [localPlayer]);

  // Sync music state from hook
  useEffect(() => {
    if (music.state === "playing") setMusicPlaying(true);
    else if (music.state === "idle") setMusicPlaying(false);
    setMusicVolumeState(music.volume);
  }, [music.state, music.volume]);

  // Show music hint on first visit
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem("eduneuro:library:musicHint");
    if (!seen) {
      setMusicHintShown(true);
    }
  }, []);

  // Track fullscreen state
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Resolve user identity
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = getChatSupabase();
        if (!supabase) {
          if (!cancelled) {
            const demoId = "demo-user-" + Math.random().toString(36).slice(2, 10);
            const spawn = { x: 300, y: 300 };
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
              const spawn = { x: 300, y: 300 };
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
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();

        const label =
          profile?.display_name ||
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
  }, [devMode]);

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
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // skip in dev mode
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
      } catch {
        // ignore
      }
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

    // Persist via Supabase
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

    let unsub: (() => void) | null = null;

    // Skip realtime subscriptions when there's no authenticated user.
    // Without an auth session, Realtime will reject the connection.
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;

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
            if (record.user_id === userId) return;

            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("id", record.user_id)
              .maybeSingle();

            const label =
              profile?.display_name ||
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

      unsub = () => {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore
        }
      };
    });

    return () => {
      if (unsub) unsub();
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
  // Runs once on mount. Reads position from localPlayerRef each frame.
  // The tick function handles the case where player/collision aren't ready yet.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const collision = collisionRef.current;
    const keys = new Set<string>();
    let lastBroadcast = 0;
    let currentRoomId: string | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("input, textarea")) return;
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

      const current = localPlayerRef.current;
      if (!current || !collision) {
        raf = requestAnimationFrame(tick);
        return;
      }

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

      if (dx !== 0 || dy !== 0) {
        const speed = WORLD_CONFIG.playerSpeed;
        const targetX = current.x + dx * speed * dt;
        const targetY = current.y + dy * speed * dt;

        const result = collision.resolveMovement(current.x, current.y, targetX, targetY);

        localPlayerRef.current = { ...current, x: result.x, y: result.y, dx, dy, isMoving: true };

        setLocalPlayer((prev) => {
          if (!prev) return prev;
          return { ...prev, x: result.x, y: result.y, dx, dy, isMoving: true, targetX, targetY, lastUpdate: Date.now() };
        });

        const newRoom = findRoomFromPosition(result.x, result.y);
        if (newRoom && newRoom !== currentRoomId) {
          currentRoomId = newRoom;
          setCurrentRoom(newRoom);
          setShowRoomInfo(true);
          if (roomInfoTimeoutRef.current) clearTimeout(roomInfoTimeoutRef.current);
          roomInfoTimeoutRef.current = setTimeout(() => setShowRoomInfo(false), 5000);
        }

        const now = Date.now();
        if (now - lastBroadcast > WORLD_CONFIG.broadcastInterval) {
          lastBroadcast = now;
          multiplayerManager.updateLocalPlayer({
            x: result.x, y: result.y, dx, dy, isMoving: true,
            targetX, targetY, lastUpdate: now,
          });
        }
      } else if (current.isMoving) {
        localPlayerRef.current = { ...current, dx: 0, dy: 0, isMoving: false };
        setLocalPlayer((prev) => {
          if (!prev) return prev;
          return { ...prev, dx: 0, dy: 0, isMoving: false, lastUpdate: Date.now() };
        });
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      multiplayerManager.disconnect();
      music.stop();
      voice.stopMic();
      if (roomInfoTimeoutRef.current) clearTimeout(roomInfoTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !localPlayer) {
    return <LibraryLoading />;
  }

  return (
    <div ref={worldRef} className="relative w-full h-screen overflow-hidden bg-background-dark">
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
        <div className="bg-gradient-to-b from-background/90 to-transparent pt-3 pb-8 px-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-3 pointer-events-auto">
              <Link href="/library" className="text-xs font-medium text-foreground-light hover:text-accent transition-colors bg-foreground-dark/70 backdrop-blur-sm border border-border-light rounded-full px-3 py-1">
                Library
              </Link>
              <Link href="/">
                <span className="font-serif text-lg text-foreground-light hover:text-accent transition-colors">
                  Eduneuro
                </span>
              </Link>
              <span className="text-muted-light text-xs">/</span>
              <span className="text-xs text-foreground-light/70">Virtual Library</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-foreground-dark/70 backdrop-blur-sm border border-border-light rounded-full px-3 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs text-foreground-light">
                  {remotePlayers.length + 1} studying
                </span>
              </div>
              <FullscreenControl isFullscreen={isFullscreen} onToggle={toggleFullscreen} />
            </div>
          </div>
        </div>
      </div>

      {/* Proximity indicator when mic is on */}
      <ProximityIndicator visible={voice.isMicOn} range={voice.proximityRange} />

      {/* First-time music hint */}
      <AnimatePresence>
        {musicHintShown && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-foreground-dark/80 backdrop-blur-sm border border-border-light rounded-full px-4 py-2 pointer-events-none"
          >
            <p className="text-xs text-foreground-light">
              <span className="text-accent">Tip</span> — enable ambient music below to set the mood
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="bg-gradient-to-t from-background/90 to-transparent pt-8 pb-4 px-4">
          <div className="flex items-center justify-center gap-3 max-w-6xl mx-auto pointer-events-auto flex-wrap">
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
              <>
                <button
                  onClick={end}
                  className="flex items-center gap-2 bg-foreground-dark/80 backdrop-blur-sm border border-border-light text-foreground-light px-4 py-2 rounded-xl text-sm hover:bg-red-500/20 hover:text-red-400 transition-colors"
                >
                  End
                </button>
                <div className="w-px h-6 bg-border-light/50" />
              </>
            )}

            <MicControl
              isMicOn={voice.isMicOn}
              nearbyCount={voice.nearbyPlayers.length}
              roomVoiceEnabled={voice.roomVoiceEnabled}
              onToggle={handleMicToggle}
              error={voiceError}
            />

            <MusicControl
              isPlaying={musicPlaying}
              onToggle={handleMusicToggle}
              onVolumeChange={handleVolumeChange}
              volume={musicVolume}
            />
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
