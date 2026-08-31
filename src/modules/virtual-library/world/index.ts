/**
 * World module — 2D explorable multiplayer library environment.
 *
 * Provides:
 * - Tile-based map system
 * - Collision detection
 *   Canvas rendering
 * - Player movement controller
 * - Multiplayer synchronization via Supabase Realtime
 */

export { createWorldMap, MAP_WIDTH, MAP_HEIGHT, ROOM_ZONES, TILE, getRoomAtPosition, getEntryPoint } from "./map";
export { CollisionSystem } from "./collision";
export { MultiplayerManager, multiplayerManager } from "./multiplayer";
export { WorldRenderer } from "./WorldRenderer";
export { PlayerController } from "./PlayerController";
export { default as VirtualLibraryWorld } from "./VirtualLibraryWorld";
export { WORLD_CONFIG } from "./types";
export type { WorldPlayer, WorldChatMessage, ConnectionState, RoomId, WorldConfig } from "./types";
