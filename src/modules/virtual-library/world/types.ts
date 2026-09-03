/**
 * Core types for the Virtual Library World.
 */

// ─── Tile Types ───────────────────────────────────────────────────────────────

export type TileType =
  | "floor"           // Light floor
  | "floor_dark"      // Slightly darker floor (rug areas)
  | "floor_wood"      // Wood-patterned floor
  | "wall"            // Outer/inner wall
  | "wall_bookshelf"  // Wall with built-in bookshelves
  | "bookshelf"       // Free-standing bookshelf
  | "desk"            // Study desk
  | "chair"           // Chair (desk companion)
  | "plant"           // Decorative plant
  | "lamp"            // Standing/table lamp
  | "window"          // Window on wall
  | "door"            // Door/entrance
  | "carpet"          // Decorative carpet/rug
  | "pillar"          // Structural pillar
  | "counter";        // Reception/info counter

// ─── Room Zones ───────────────────────────────────────────────────────────────

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

export interface RoomZone {
  id: RoomId;
  name: string;
  /** Bounding box in tile coordinates [x, y, w, h] */
  bounds: [number, number, number, number];
  /** Tile coords of the entry point for this room */
  entryPoint: [number, number];
  /** Whether voice is enabled in this room */
  voiceEnabled: boolean;
  /** Whether video is enabled in this room */
  videoEnabled: boolean;
  /** Optional branch filter */
  branchId?: string;
  /** Short description */
  description: string;
}

// ─── World State ──────────────────────────────────────────────────────────────

export interface WorldPlayer {
  id: string;
  label: string;
  /** Position in pixels (networked / authoritative) */
  x: number;
  y: number;
  /** Target position for interpolation */
  targetX: number;
  targetY: number;
  /** Display position — smoothly interpolated toward x/y each frame */
  displayX: number;
  displayY: number;
  /** Movement direction (-1, 0, 1) */
  dx: number;
  dy: number;
  /** Is this the local player? */
  isLocal: boolean;
  /** Color index for avatar */
  colorIndex: number;
  /** Room the player is in */
  roomId: RoomId | null;
  /** Last update timestamp (for interpolation) */
  lastUpdate: number;
  /** Mic state */
  isMuted: boolean;
  /** Camera state */
  isVideoOn: boolean;
  /** Is currently moving */
  isMoving: boolean;
}

export interface WorldChatMessage {
  id: string;
  authorId: string;
  authorLabel: string;
  content: string;
  timestamp: number;
  type: "text" | "system";
  roomId: RoomId | "global";
}

// ─── Connection State ─────────────────────────────────────────────────────────

export type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface EmojiReaction {
  id: string;
  emoji: string;
  playerId: string;
  playerLabel: string;
  x: number;
  y: number;
  timestamp: number;
  /** Auto-expire after this ms (default 4000) */
  ttl: number;
}

export interface SystemNotice {
  id: string;
  text: string;
  timestamp: number;
  /** Auto-expire after this ms (default 5000) */
  ttl: number;
}

// ─── Map Configuration ────────────────────────────────────────────────────────

export interface WorldConfig {
  /** Tile size in pixels */
  tileSize: number;
  /** Map width in tiles */
  mapWidth: number;
  /** Map height in tiles */
  mapHeight: number;
  /** Player speed in pixels per second */
  playerSpeed: number;
  /** Multiplayer broadcast interval (ms) */
  broadcastInterval: number;
  /** Multiplayer timeout (ms) — remove player if no update within this */
  playerTimeout: number;
}

export const WORLD_CONFIG: WorldConfig = {
  tileSize: 40,
  mapWidth: 40,
  mapHeight: 30,
  playerSpeed: 180,
  broadcastInterval: 100,
  playerTimeout: 5000,
};
