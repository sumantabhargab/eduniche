/**
 * Shared types for the Among Us-style library game.
 */

export type RoomId =
  | "entrance"
  | "main-reading"
  | "quiet-zone"
  | "group-study"
  | "discussion-room"
  | "booth-1"
  | "booth-2"
  | "booth-3"
  | "booth-4";

export type GamePhase = "lobby" | "playing" | "discussion" | "voting" | "ended";

export type GameResult = "none" | "crew_win" | "impostor_win" | "draw";

export interface PlayerData {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  isReady: boolean;
  isDead?: boolean;
  joinedAt: number;
  /** World position (in pixels) */
  position?: { x: number; y: number };
  /** Current room */
  roomId?: RoomId;
  /** Assigned role — only present after game starts */
  role?: "crewmate" | "impostor";
  /** Assigned tasks — only present for crewmates after game starts */
  tasks?: Array<{ id: string; name: string; completed: boolean; progress: number }>;
}

export interface GameLobby {
  id: string;
  name: string;
  hostId: string;
  players: PlayerData[];
  maxPlayers: number;
  phase: GamePhase;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  text: string;
  timestamp: number;
}

export interface VoteState {
  /** playerId -> voted playerId (or null for skip) */
  votes: Map<string, string | null>;
  /** Time the voting ends */
  endsAt: number;
}
