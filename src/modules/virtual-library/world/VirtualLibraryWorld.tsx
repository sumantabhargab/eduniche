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
import type { WorldPlayer, WorldChatMessage, ConnectionState, RoomId, EmojiReaction, SystemNotice } from "./types";
import { useStudySession } from "../hooks/use-study-session";
import { getChatSupabase } from "@/modules/chat/services/supabase";
import { EduNeuroLoader } from "@/components/loading";
import { useAmbientMusic } from "./ambient-music";
import { useProximityVoice } from "./proximity-voice";
import { MobileControls } from "./MobileControls";

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

// Map in-app room IDs (map.ts / ROOM_ZONES) → database room IDs (virtual_library_* tables).
const ROOM_ID_DB_MAP: Record<string, string> = {
  "entrance":      "main",
  "group-study":   "group",
  "discussion-room": "discussion",
};

function toDbRoomId(appRoomId: string): string {
  return ROOM_ID_DB_MAP[appRoomId] ?? appRoomId;
}

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
  const [showResourcePanel, setShowResourcePanel] = useState(false);
  const [resources, setResources] = useState<Array<{ id: string; title: string; type: string; description?: string }>>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesError, setResourcesError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<{ id: string; title: string; type: string } | null>(null);
  // Multiplayer social features
  const [emojiReactions, setEmojiReactions] = useState<EmojiReaction[]>([]);
  const [systemNotices, setSystemNotices] = useState<SystemNotice[]>([]);
  const [roomPopulations, setRoomPopulations] = useState<Record<string, number>>({});
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const showEmojiBarRef = useRef(false);
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(typeof navigator !== "undefined" ? navigator.userAgent : "");

  const collisionRef = useRef<CollisionSystem | null>(null);
  const roomInfoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localPlayerRef = useRef<WorldPlayer | null>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const movementInputRef = useRef<{
    press: (key: string) => void;
    release: (key: string) => void;
    setClickTarget: (t: { x: number; y: number } | null) => void;
  } | null>(null);

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

  // ─── System Notice Helper ──────────────────────────────────────────────────────

  const addSystemNotice = useCallback((text: string) => {
    const id = `notice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const ttl = 5000;
    setSystemNotices((prev) => [...prev, { id, text, timestamp: Date.now(), ttl }]);
    setTimeout(() => {
      setSystemNotices((prev) => prev.filter((n) => n.id !== id));
    }, ttl);
  }, []);

  // ─── Emoji Handlers ───────────────────────────────────────────────────────────

  const handleEmoji = useCallback((emoji: string) => {
    multiplayerManager.broadcastEmoji(emoji);
    setShowEmojiBar(false);
  }, []);

  // ─── Room Population ──────────────────────────────────────────────────────────

  useEffect(() => {
    const allPlayers = [localPlayer, ...remotePlayers].filter(Boolean) as WorldPlayer[];
    const counts: Record<string, number> = {};
    for (const p of allPlayers) {
      const room = p.roomId || "entrance";
      counts[room] = (counts[room] || 0) + 1;
    }
    setRoomPopulations(counts);
  }, [localPlayer, remotePlayers]);

  // ─── Side Effects ────────────────────────────────────────────────────────────

  // Keep ref in sync
  useEffect(() => {
    localPlayerRef.current = localPlayer;
  }, [localPlayer]);

  // Keep emoji bar ref in sync for keyboard handler
  useEffect(() => {
    showEmojiBarRef.current = showEmojiBar;
  }, [showEmojiBar]);

  // Stable ref for handleEmoji
  const handleEmojiRef = useRef(handleEmoji);
  handleEmojiRef.current = handleEmoji;

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

  // Fetch published resources for the library
  useEffect(() => {
    let cancelled = false;

    const fetchResources = async () => {
      setResourcesLoading(true);
      setResourcesError(null);

      try {
        const res = await fetch("/api/content/resources?visibility=published&limit=50");

        if (!res.ok) {
          throw new Error(`Failed to fetch resources (${res.status})`);
        }

        const data = await res.json();
        if (!cancelled) {
          const items = (data.resources || []).map((r: { id: string; name: string; mime_type: string; description?: string }) => ({
            id: r.id,
            title: r.name,
            type: r.mime_type.includes("pdf") ? "PDF" : r.mime_type.includes("text") ? "Text" : "Document",
            description: r.description || undefined,
          }));
          setResources(items);
        }
      } catch (err) {
        if (!cancelled) {
          setResourcesError(err instanceof Error ? err.message : "Failed to load resources");
        }
      } finally {
        if (!cancelled) {
          setResourcesLoading(false);
        }
      }
    };

    fetchResources();

    return () => { cancelled = true; };
  }, []);

  // Track fullscreen state
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Resolve user identity — only sets userId and userLabel, not localPlayer
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = getChatSupabase();
        if (!supabase || !(await supabase.auth.getUser()).data.user) {
          // Demo / unauthenticated mode
          if (!cancelled) {
            setUserId("demo-" + Math.random().toString(36).slice(2, 10));
            setUserLabel("You");
          }
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled || !user) return;

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
        // If anything fails, fall back to demo mode so the user isn't stuck
        if (!cancelled) {
          setUserId("demo-" + Math.random().toString(36).slice(2, 10));
          setUserLabel("You");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [devMode]);

  // Initialize player once user is resolved — this is the SOLE place localPlayer is set
  useEffect(() => {
    if (!userId) return;

    collisionRef.current = new CollisionSystem(WORLD_CONFIG);
    const spawn = collisionRef.current.getSpawnPosition();

    const hash =
      userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;

    const player: WorldPlayer = {
      id: userId,
      label: userLabel || "there",
      x: spawn.x,
      y: spawn.y,
      targetX: spawn.x,
      targetY: spawn.y,
      dx: 0,
      dy: 0,
      displayX: spawn.x,
      displayY: spawn.y,
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

    // Pre-warm: broadcast a wave to already-present players
    multiplayerManager.connect({
      ...player,
      displayX: spawn.x,
      displayY: spawn.y,
    });

    // Wave on join
    setTimeout(() => {
      multiplayerManager.broadcastEmoji("👋");
      setEmojiReactions((prev) => [
        ...prev,
        {
          id: `emoji-local-${Date.now()}`,
          emoji: "👋",
          playerId: userId,
          playerLabel: userLabel,
          x: spawn.x,
          y: spawn.y,
          timestamp: Date.now(),
          ttl: 4000,
        },
      ]);
      setTimeout(() => {
        setEmojiReactions((prev) => prev.filter((e) => !e.id.startsWith("emoji-local-")));
      }, 4000);
    }, 1500);

    setConnectionState("connected");

    // Mark presence in the correct database room
    (async () => {
      const supabase = getChatSupabase();
      if (!supabase) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // skip in demo mode
        await supabase
          .from("study_room_presence")
          .upsert(
            {
              room_id: toDbRoomId(currentRoom || "entrance"),
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
      setRemotePlayers((prev) => {
        const idx = prev.findIndex((p) => p.id === player.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...player, isLocal: false };
          return next;
        }
        return [...prev, { ...player, isLocal: false }];
      });
    });

    const unsubLeave = multiplayerManager.onPlayerLeave((playerId) => {
      const leftPlayer = multiplayerManager.getPlayer(playerId);
      setRemotePlayers((prev) => prev.filter((p) => p.id !== playerId));
      // Show leave notice
      if (leftPlayer) {
        addSystemNotice(`${leftPlayer.label} left the library`);
      }
    });

    const unsubJoin = multiplayerManager.onPlayerJoin((player) => {
      // Show join notice
      addSystemNotice(`${player.label} joined the library`);
    });

    const unsubEmoji = multiplayerManager.onEmoji((emoji) => {
      setEmojiReactions((prev) => [...prev, emoji]);
      // Auto-remove after TTL
      setTimeout(() => {
        setEmojiReactions((prev) => prev.filter((e) => e.id !== emoji.id));
      }, emoji.ttl);
    });

    return () => {
      unsubPos();
      unsubLeave();
      unsubJoin();
      unsubEmoji();
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
            room_id: toDbRoomId(currentRoom || "entrance"),
            status: "completed",
            duration: Math.round(session.totalFocusMs / 60000),
            branch: currentRoom || "entrance",
          });
        } catch {
          // ignore
        }
      })();
    },
  });

  // Movement via WASD/arrows + virtual D-pad + click-to-move
  // Runs once on mount. Reads position from localPlayerRef each frame.
  // Exposes the keys set and click-target on a ref so the on-screen D-pad and
  // the canvas can drive the same movement pipeline as the keyboard.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const keys = new Set<string>();
    const touchInputRef = { active: false };
    let clickTarget: { x: number; y: number } | null = null;
    let lastBroadcast = 0;
    let currentRoomId: string | null = null;

    // Expose for D-pad / click-to-move components
    movementInputRef.current = {
      press: (key: string) => keys.add(key.toLowerCase()),
      release: (key: string) => keys.delete(key.toLowerCase()),
      setClickTarget: (t: { x: number; y: number } | null) => {
        clickTarget = t;
      },
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("input, textarea")) return;
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        e.preventDefault();
        keys.add(k);
      }
      // Emoji shortcuts (1-5) when emoji bar is visible
      if (["1", "2", "3", "4", "5"].includes(k) && showEmojiBarRef.current) {
        const emojis = ["👋", "🔥", "💡", "📚", "🎯"];
        const idx = parseInt(k) - 1;
        handleEmojiRef.current(emojis[idx]);
      }
      if (k === "e" && !target?.closest?.("input, textarea")) {
        setShowEmojiBar((v) => !v);
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
      const collision = collisionRef.current;
      if (!current || !collision) {
        raf = requestAnimationFrame(tick);
        return;
      }

      let dx = 0, dy = 0;
      if (keys.has("w") || keys.has("arrowup")) dy -= 1;
      if (keys.has("s") || keys.has("arrowdown")) dy += 1;
      if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
      if (keys.has("d") || keys.has("arrowright")) dx += 1;

      // Click-to-move: if no keyboard input, walk toward the last click target
      if ((dx === 0 && dy === 0) && clickTarget) {
        const dxC = clickTarget.x - current.x;
        const dyC = clickTarget.y - current.y;
        const dist = Math.sqrt(dxC * dxC + dyC * dyC);
        if (dist > 4) {
          dx = dxC / dist;
          dy = dyC / dist;
        } else {
          clickTarget = null;
        }
      }

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

        localPlayerRef.current = { ...current, x: result.x, y: result.y, dx, dy, isMoving: true, displayX: result.x, displayY: result.y };

        setLocalPlayer((prev) => {
          if (!prev) return prev;
          return { ...prev, x: result.x, y: result.y, displayX: result.x, displayY: result.y, dx, dy, isMoving: true, targetX, targetY, lastUpdate: Date.now() };
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
        localPlayerRef.current = { ...current, dx: 0, dy: 0, isMoving: false, displayX: current.x, displayY: current.y };
        setLocalPlayer((prev) => {
          if (!prev) return prev;
          return { ...prev, dx: 0, dy: 0, isMoving: false, displayX: prev.x, displayY: prev.y, lastUpdate: Date.now() };
        });
      }

      // Smoothly interpolate remote player positions
      multiplayerManager.interpolatePlayers();

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

  // Cleanup on unmount — guard against partial-initialization states
  useEffect(() => {
    return () => {
      try {
        if (multiplayerManager.isConnected) {
          multiplayerManager.disconnect();
        }
      } catch {
        // swallow — channel may be null if connect() failed mid-way
      }
      try { music.stop(); } catch { /* ignore */ }
      try { voice.stopMic(); } catch { /* ignore */ }
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
        emojiReactions={emojiReactions}
        roomPopulations={roomPopulations}
      />

      {/* Click-to-move overlay for desktop (and as fallback everywhere) */}
      <div
        className="absolute inset-0 z-10 cursor-crosshair hidden md:block"
        onClick={(e) => {
          const canvas = worldRef.current?.querySelector("canvas");
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          // Convert click from screen → world tile coords
          const worldPixelSize = WORLD_CONFIG.mapWidth * WORLD_CONFIG.tileSize;
          const wx = ((e.clientX - rect.left) / rect.width) * worldPixelSize;
          const wy = ((e.clientY - rect.top) / rect.height) * worldPixelSize;
          movementInputRef.current?.setClickTarget({ x: wx, y: wy });
        }}
        onContextMenu={(e) => e.preventDefault()}
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

            <button
              onClick={() => setShowResourcePanel((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-foreground-dark/80 border border-border-light text-foreground-light hover:bg-foreground-dark transition-colors"
              title="Library resources"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 014 17V5a2 2 0 012-2h14v2H6.5A2.5 2.5 0 004 7.5v12z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Resources {resources.length > 0 && `(${resources.length})`}</span>
            </button>

            <button
              onClick={() => setShowEmojiBar((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-foreground-dark/80 border border-border-light text-foreground-light hover:bg-foreground-dark transition-colors"
              title="React"
            >
              <span className="text-sm leading-none">+</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resource panel overlay */}
      <AnimatePresence>
        {showResourcePanel && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute right-4 top-20 z-30 w-80 max-h-[60vh] bg-background-dark/90 backdrop-blur-sm border border-border-light rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-light/50">
              <h3 className="text-sm font-semibold text-foreground-light">Library Resources</h3>
              <button
                onClick={() => setShowResourcePanel(false)}
                className="p-1 rounded-md text-muted-light hover:text-foreground-light transition-colors"
                aria-label="Close resources"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {resourcesLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                </div>
              )}
              {resourcesError && (
                <div className="text-center py-6">
                  <p className="text-xs text-red-400 mb-2">{resourcesError}</p>
                  <button
                    onClick={() => {
                      setResourcesError(null);
                      setResourcesLoading(true);
                      fetch("/api/content/resources?visibility=published&limit=50")
                        .then((r) => r.json())
                        .then((data) => {
                          const items = (data.resources || []).map((r: { id: string; name: string; mime_type: string; description?: string }) => ({
                            id: r.id,
                            title: r.name,
                            type: r.mime_type.includes("pdf") ? "PDF" : "Document",
                            description: r.description || undefined,
                          }));
                          setResources(items);
                        })
                        .catch(() => setResourcesError("Failed to load resources"))
                        .finally(() => setResourcesLoading(false));
                    }}
                    className="text-xs text-accent hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              {!resourcesLoading && !resourcesError && resources.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-muted-light">No published resources yet.</p>
                </div>
              )}
              {!resourcesLoading && !resourcesError && resources.map((resource) => (
                <button
                  key={resource.id}
                  onClick={() => {
                    setSelectedResource(resource);
                    window.open(`/library/document/${resource.id}`, "_blank");
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-foreground-dark/60 transition-colors mb-1 group"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-medium shrink-0 mt-0.5">
                      {resource.type}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-foreground-light font-medium truncate group-hover:text-accent transition-colors">
                        {resource.title}
                      </p>
                      {resource.description && (
                        <p className="text-[10px] text-muted-light mt-0.5 line-clamp-2">
                          {resource.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji bar */}
      <AnimatePresence>
        {showEmojiBar && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-24 right-4 z-30 bg-background-dark/90 backdrop-blur-md border border-border-light rounded-2xl p-2 shadow-2xl"
          >
            <div className="flex items-center gap-1">
              {["👋", "🔥", "💡", "📚", "🎯"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmoji(emoji)}
                  className="w-10 h-10 flex items-center justify-center text-lg rounded-xl hover:bg-foreground/10 transition-colors"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-light text-center mt-1.5">or press 1-5</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System notices (join/leave) */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-none">
        <AnimatePresence>
          {systemNotices.map((notice) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="bg-background-dark/70 backdrop-blur-sm border border-border-light/60 rounded-full px-4 py-1.5"
            >
              <p className="text-[11px] text-foreground-light/80 whitespace-nowrap">{notice.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile touch controls */}
      {isMobile && (
        <MobileControls
          movementInputRef={movementInputRef}
          worldRef={worldRef}
          worldPixelSize={WORLD_CONFIG.mapWidth * WORLD_CONFIG.tileSize}
        />
      )}
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
