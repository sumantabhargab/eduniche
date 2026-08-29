/**
 * Public API for the Virtual Library module.
 *
 * Import from this file when consuming the module from outside.
 * Within the module, import directly from sub-files.
 */

// ─── Provider Component ──────────────────────────────────────────────────────

export { VirtualLibraryProvider } from "./hooks/use-virtual-library";

// ─── Config ──────────────────────────────────────────────────────────────────

export { virtualLibraryConfig, type VirtualLibraryConfig } from "./config/feature-flags";
export {
  SYLLABUS,
  getBranchById,
  getSubjectById,
  getAllBranches,
  getSubjectsForBranch,
} from "./config/syllabus";

// ─── Services ────────────────────────────────────────────────────────────────

import { RoomService } from "./services/room-service";

export { RoomService };

/** Backward-compatible singleton instance */
export const roomService = new RoomService();
export { plannerService } from "./services/planner-service";
export { libraryEventEmitter, emitLibraryEvent } from "./services/event-emitter";

// Note: ChatService and AIService require constructor injection.
// Import them directly from their service files:
//   import { ChatService } from "@/modules/virtual-library/services/chat-service";

// ─── Hooks ───────────────────────────────────────────────────────────────────

export { useVirtualLibrary } from "./hooks/use-virtual-library";
export { useStudySession } from "./hooks/use-study-session";
export { useChat } from "./hooks/use-chat";
export { useRooms } from "./hooks/use-rooms";
export { usePlanner } from "./hooks/use-planner";
export { useDoubt } from "./hooks/use-doubt";

export type {
  UseStudySessionOptions,
  UseStudySessionReturn,
} from "./hooks/use-study-session";
export type {
  UseChatOptions,
  UseChatReturn,
} from "./hooks/use-chat";
export type {
  UseRoomsOptions,
  UseRoomsReturn,
} from "./hooks/use-rooms";
export type {
  UsePlannerOptions,
  UsePlannerReturn,
} from "./hooks/use-planner";
export type {
  UseDoubtOptions,
  UseDoubtReturn,
} from "./hooks/use-doubt";

// ─── Types ───────────────────────────────────────────────────────────────────

export type {
  StudyRoom as StudyRoomData,
  ChatMessage,
  StudySession,
  StudyTask,
  StudyPlan,
  DoubtRequest,
  DoubtResponse,
  Participant,
  LearningEvent,
  SessionStatus,
  TaskPriority,
  PlanGranularity,
  PaperDataSource,
  Question,
} from "./types/index";

// ─── Adapter Interfaces ─────────────────────────────────────────────────────

export type {
  LibraryAuthContext,
  VideoProvider,
  ChatProvider,
  AIProvider,
  RealtimeProvider,
  DatabaseAdapter,
  AnalyticsAdapter,
} from "./types/adapters";

// ─── Event Types ─────────────────────────────────────────────────────────────

export type {
  LibraryEventName,
  LibraryEventContext,
  LibraryEvent,
} from "./types/events";

export { createBaseLibraryContext } from "./types/events";
