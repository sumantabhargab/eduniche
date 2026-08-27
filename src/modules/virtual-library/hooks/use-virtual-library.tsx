/**
 * Main context provider for the Virtual Library module.
 *
 * Wires together all services and providers, exposes a unified
 * context to the entire /library route tree.
 */

"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { virtualLibraryConfig } from "../config/feature-flags";
import { mockRealtimeProvider } from "../providers/mock-realtime";
import { mockChatProvider } from "../providers/mock-chat";
import { mockAIProvider } from "../providers/mock-ai";
import { noopVideoProvider } from "../providers/noop-video";
import { RoomService } from "../services/room-service";
import { ChatService } from "../services/chat-service";
import { AIService } from "../services/ai-service";
import { PlannerService } from "../services/planner-service";
import { libraryEventEmitter } from "../services/event-emitter";
import type {
  StudySession,
  ChatMessage,
  StudyPlan,
  Participant,
} from "../types/index";
import { createAnonymousId, createUserLabel } from "../services/session-service";
import { createSessionStateMachine, type SessionStateMachine } from "../services/session-service";
import { getAllBranches, getBranchById } from "../config/syllabus";

// ─── Context Shape ──────────────────────────────────────────────────────────

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

  // Session state machine
  sessionMachine: SessionStateMachine;
  setSessionTopic: (topic: string) => void;
  setSessionSubject: (subjectId: string) => void;

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

// ─── Provider ───────────────────────────────────────────────────────────────

const VirtualLibraryContext = createContext<VirtualLibraryContextValue | null>(null);

export function VirtualLibraryProvider({ children }: { children: ReactNode }) {
  const participantId = useMemo(() => createAnonymousId(), []);
  const userLabel = useMemo(() => createUserLabel(participantId), [participantId]);

  const roomService = useMemo(() => new RoomService(), []);
  const chatService = useMemo(
    () => new ChatService(mockChatProvider),
    [],
  );
  const aiService = useMemo(
    () => new AIService(mockAIProvider),
    [],
  );
  const plannerService = useMemo(() => new PlannerService(), []);

  // Session state
  const sessionMachine = useMemo(
    () =>
      createSessionStateMachine(
        participantId,
        "main-library",
        "all",
      ),
    [participantId],
  );

  // Branches
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
      sessionMachine,
      setSessionTopic: () => {},
      setSessionSubject: () => {},
      branches,
      getBranch,
      messages: [],
      setMessages: () => {},
      participants: [],
      currentPlan: null,
      setCurrentPlan: () => {},
    }),
    [
      participantId,
      userLabel,
      roomService,
      chatService,
      aiService,
      plannerService,
      sessionMachine,
      branches,
      getBranch,
    ],
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
