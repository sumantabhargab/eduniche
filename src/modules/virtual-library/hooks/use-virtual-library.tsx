/**
 * Main context provider for the Virtual Library module.
 *
 * Wires together all services and providers, exposes a unified
 * context to the entire /library route tree.
 *
 * Uses real Supabase-backed implementations for chat, realtime, and AI.
 */

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { virtualLibraryConfig } from "../config/feature-flags";
import { RoomService } from "../services/room-service";
import { ChatService } from "../services/chat-service";
import { AIService } from "../services/ai-service";
import { PlannerService } from "../services/planner-service";
import { RealChatProvider } from "../providers/real-chat";
import { groqAIProvider } from "../providers/real-ai";
import type {
  ChatMessage,
  StudyPlan,
  Participant,
} from "../types/index";
import { getAllBranches, getBranchById } from "../config/syllabus";

// ─── Context Shape ────────────────────────────────────────────────────────────

interface VirtualLibraryContextValue {
  /** Feature flag config */
  config: typeof virtualLibraryConfig;
  /** Whether the module is enabled */
  enabled: boolean;

  // Identity
  /** Stable anonymous participant ID */
  participantId: string;
  /** Human-readable label */
  userLabel: string;

  // Services
  roomService: RoomService;
  chatService: ChatService;
  aiService: AIService;
  plannerService: PlannerService;

  // Branches
  branches: ReturnType<typeof getAllBranches>;
  getBranch: (id: string) => ReturnType<typeof getBranchById>;

  // Live state (updated by hooks)
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  participants: Participant[];
  currentPlan: StudyPlan | null;
  setCurrentPlan: (plan: StudyPlan | null) => void;
}

// ─── Provider ────────────────────────────────────────────────────────────────

const VirtualLibraryContext = createContext<VirtualLibraryContextValue | null>(null);

export function VirtualLibraryProvider({ children }: { children: ReactNode }) {
  const [participantId, setParticipantId] = useState<string>("");
  const [userLabel, setUserLabel] = useState<string>("there");

  useEffect(() => {
    let cancelled = false;
    const resolveUser = async () => {
      try {
        const { getChatSupabase } = await import("@/modules/chat/services/supabase");
        const supabase = getChatSupabase();
        if (!supabase) {
          if (!cancelled) {
            setParticipantId(`anon-${Math.random().toString(36).slice(2, 10)}`);
          }
          return;
        }
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (data.user) {
          setParticipantId(data.user.id);
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, full_name, email")
            .eq("id", data.user.id)
            .maybeSingle();
          const label =
            profile?.display_name ||
            profile?.full_name ||
            data.user.user_metadata?.full_name ||
            data.user.email?.split("@")[0] ||
            "there";
          setUserLabel(label);
        } else {
          setParticipantId(`anon-${Math.random().toString(36).slice(2, 10)}`);
        }
      } catch {
        if (!cancelled) {
          setParticipantId(`anon-${Math.random().toString(36).slice(2, 10)}`);
        }
      }
    };
    resolveUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const roomService = useMemo(() => new RoomService(), []);
  const chatService = useMemo(() => new ChatService(), []);
  const aiService = useMemo(() => new AIService(groqAIProvider), []);
  const plannerService = useMemo(() => new PlannerService(), []);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null);

  const branches = useMemo(() => getAllBranches(), []);
  const getBranch = useMemo(() => getBranchById, []);

  const value = useMemo<VirtualLibraryContextValue>(
    () => ({
      config: virtualLibraryConfig,
      enabled: virtualLibraryConfig.enabled,
      participantId,
      userLabel,
      roomService,
      chatService,
      aiService,
      plannerService,
      branches,
      getBranch,
      messages,
      setMessages,
      participants,
      currentPlan,
      setCurrentPlan,
    }),
    [
      participantId,
      userLabel,
      roomService,
      chatService,
      aiService,
      plannerService,
      branches,
      getBranch,
      messages,
      participants,
      currentPlan,
    ]
  );

  if (!virtualLibraryConfig.enabled) {
    return <>{children}</>;
  }

  return (
    <VirtualLibraryContext.Provider value={value}>
      {children}
    </VirtualLibraryContext.Provider>
  );
}

/** Hook to access the Virtual Library context. */
export function useVirtualLibrary(): VirtualLibraryContextValue {
  const ctx = useContext(VirtualLibraryContext);
  if (!ctx) {
    throw new Error("useVirtualLibrary must be used within a VirtualLibraryProvider");
  }
  return ctx;
}
