/**
 * MultiplayerPracticePanel — shows nearby students practicing the same
 * subject/branch in real time and exposes lightweight chat + reactions.
 *
 * Uses Supabase presence for join/leave + broadcast for chat + reactions.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ROOM_CHANNEL = "eduneuro:practice:room";

type ChatMessage = {
  id: string;
  senderId: string;
  userId: string;
  userName: string;
  text: string;
  ts: number;
};

type Reaction = {
  id: string;
  emoji: string;
  senderId: string;
  userId: string;
  ts: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RealtimeChannel = any;

export function MultiplayerPracticePanel({
  branch,
  subject,
  isOpen,
  onClose,
}: {
  branch: string;
  subject: string;
  isOpen: boolean;
  onClose?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [participants, setParticipants] = useState<{ id: string; name: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const myId = `practice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const avatarColors = ["#B8710E", "#4A7A5A", "#6A5A8A", "#8A4A4A", "#4A6A8A"];
  const color = avatarColors[(branch + subject).length % avatarColors.length];

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
      } catch {
        // ignore
      }
    }
    channelRef.current = null;
    setParticipants([]);
    setMessages([]);
    setReactions([]);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    let mounted = true;

    const init = async () => {
      try {
        // Dynamic import to avoid SSR
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const channel: RealtimeChannel = supabase.channel(ROOM_CHANNEL, {
          config: { presence: { key: myId } },
        });

        channelRef.current = channel;

        // Build participant list from presence state
        const updateParticipants = () => {
          if (!mounted) return;
          // presenceState returns Record<string, Presence[]>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const state: Record<string, any[]> = (channel as any).presenceState?.() ?? {};
          const users: { id: string; name: string }[] = [];
          for (const [key, value] of Object.entries(state)) {
            if (key === myId) continue;
            const arr = Array.isArray(value) ? value : [];
            const name = arr[0]?.name ?? "Anonymous";
            users.push({ id: key, name });
          }
          setParticipants(users);
        };

        // Presence events
        channel.on("presence", { event: "sync" }, () => {
          updateParticipants();
        });

        channel.on("presence", { event: "join" }, () => {
          updateParticipants();
        });

        // Chat broadcast
        channel.on("broadcast", { event: "chat" }, ({ payload }: { payload: ChatMessage }) => {
          if (!mounted || payload?.senderId === myId) return;
          setMessages((prev) => [...prev, payload]);
        });

        // Emoji reactions
        channel.on("broadcast", { event: "reaction" }, ({ payload }: { payload: Reaction }) => {
          if (!mounted || payload?.senderId === myId) return;
          setReactions((prev) => [...prev, payload].slice(-20));
        });

        await channel.subscribe(async (status: string) => {
          if (status !== "SUBSCRIBED" || !mounted) return;

          // Track presence
          await channel.track({
            id: myId,
            name: "You",
            branch,
            subject,
            joinedAt: Date.now(),
          });

          // System welcome
          setMessages((prev) => [
            ...prev,
            {
              id: `sys-${Date.now()}`,
              senderId: "system",
              userId: "system",
              userName: "System",
              text: `You joined practice: ${subject} (${branch}). Others in this room will appear below.`,
              ts: Date.now(),
            },
          ]);
        });
      } catch {
        cleanup();
      }
    };

    void init();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [isOpen, branch, subject, cleanup, myId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: myId,
      userId: myId,
      userName: "You",
      text,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    setChatInput("");

    // Broadcast
    if (channelRef.current) {
      try {
        await channelRef.current.send({ type: "broadcast", event: "chat", payload: msg });
      } catch {
        // ignore
      }
    }
  }, [chatInput, myId]);

  const sendReaction = useCallback(async (emoji: string) => {
    const r: Reaction = {
      id: `rxn-${Date.now()}`,
      emoji,
      senderId: myId,
      userId: myId,
      ts: Date.now(),
    };
    setReactions((prev) => [...prev, r].slice(-20));

    if (channelRef.current) {
      try {
        await channelRef.current.send({ type: "broadcast", event: "reaction", payload: r });
      } catch {
        // ignore
      }
    }
  }, [myId]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="fixed right-4 bottom-20 z-40 w-[300px] max-h-[70vh] flex flex-col bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-foreground-light">
            {participants.length + 1} studying now
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => sendReaction("👋")}
            className="px-2 py-1 text-xs bg-foreground/5 rounded-md hover:bg-foreground/10 transition-colors"
            title="Wave"
          >
            👋
          </button>
          {onClose && (
            <button onClick={onClose} className="px-2 py-1 text-xs text-muted hover:text-foreground transition-colors">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Practice subject label */}
      <div className="px-3 py-2 bg-foreground/5 border-b border-border">
        <p className="text-[11px] text-muted truncate">
          Practicing: <span className="text-foreground font-medium">{subject}</span> · {branch}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-[180px] max-h-[260px]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`text-xs ${m.senderId === "system" ? "text-muted italic" : m.senderId === myId ? "text-accent" : "text-foreground-light"}`}
          >
            {m.senderId !== myId && m.senderId !== "system" && (
              <span className="font-medium mr-1" style={{ color }}>{m.userName}:</span>
            )}
            {m.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reactions row */}
      <AnimatePresence initial={false}>
        {reactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="px-3 py-1.5 border-t border-border flex items-center gap-2 min-h-[28px]"
          >
            {reactions.slice(-6).map((r) => (
              <motion.span
                key={r.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-sm leading-none"
              >
                {r.emoji}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat input */}
      <div className="px-3 py-2 border-t border-border flex items-center gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendChat();
          }}
          placeholder="Say something…"
          maxLength={120}
          className="flex-1 bg-foreground/5 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted outline-none border border-transparent focus:border-border"
        />
        <button
          onClick={sendChat}
          disabled={!chatInput.trim()}
          className="px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          Send
        </button>
      </div>
    </motion.div>
  );
}
