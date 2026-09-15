# PadhaiShuru Virtual Library — Multiplayer Game Architecture
## VLIB.md

**Version:** 1.0  
**Date:** 2026-09-15  
**Status:** Design Document  
**Author:** PadhaiShuru Architecture Team

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Game World Module Structure](#3-game-world-module-structure)
4. [Data Flow](#4-data-flow)
5. [API Contracts](#5-api-contracts)
6. [State Machine](#6-state-machine)
7. [Networking Protocol](#7-networking-protocol)
8. [Proximity Chat Algorithm](#8-proximity-chat-algorithm)
9. [Voice Chat Flow](#9-voice-chat-flow)
10. [Migration Plan](#10-migration-plan)
11. [File Manifest](#11-file-manifest)
12. [Testing Strategy](#12-testing-strategy)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BROWSER / CAPACITOR WEBVIEW                         │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Next.js 16 App Router (Turbopack)                 │  │
│  │                                                                      │  │
│  │  Route: /library/world                                               │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │              VirtualLibraryProvider (React Context)             │ │  │
│  │  │  ┌──────────────────────────────────────────────────────────┐  │ │  │
│  │  │  │                   VirtualLibraryWorld                      │  │  │
│  │  │  │  ┌────────────────────────────────────────────────────┐  │  │  │
│  │  │  │  │              GameEngine (State Machine)            │  │  │  │
│  │  │  │  │                                                     │  │  │  │
│  │  │  │  │  ┌──────────────┐  ┌──────────────┐               │  │  │  │
│  │  │  │  │  │ Input Layer  │  │ Game Loop    │               │  │  │  │
│  │  │  │  │  │ WASD/Touch   │→ │ rAF 60fps    │               │  │  │  │
│  │  │  │  │  └──────────────┘  └──────┬───────┘               │  │  │  │
│  │  │  │  │                           │                        │  │  │  │
│  │  │  │  │  ┌──────────────┐  ┌──────▼────────────────────┐  │  │  │  │
│  │  │  │  │  │ Systems      │  │ EntityManager              │  │  │  │
│  │  │  │  │  │ ──────────── │  │ - Player(s)                │  │  │  │
│  │  │  │  │  │ Movement     │→ │ - Remote players           │  │  │  │
│  │  │  │  │  │ Proximity    │  │ - Interactables            │  │  │  │
│  │  │  │  │  │ Chat         │  │ - NPCs                     │  │  │  │
│  │  │  │  │  │ Voice        │  │                            │  │  │  │
│  │  │  │  │  │ Interaction  │  └────────────────────────────┘  │  │  │  │
│  │  │  │  │  └──────────────┘                                    │  │  │  │
│  │  │  │  │                           │                        │  │  │  │
│  │  │  │  │  ┌──────────────┐  ┌──────▼────────────────────┐  │  │  │  │
│  │  │  │  │  │ Networking   │  │ CanvasRenderer             │  │  │  │
│  │  │  │  │  │ ──────────── │  │ - WorldMap tiles           │  │  │  │
│  │  │  │  │  │ PositionSync │  │ - Players (circles + name) │  │  │  │
│  │  │  │  │  │ Presence     │  │ - Interactables            │  │  │  │
│  │  │  │  │  │ ChatSignaling│  │ - Chat bubbles             │  │  │  │
│  │  │  │  │  │ WebRTC ICE   │  │ - Voice indicators         │  │  │  │
│  │  │  │  │  └──────┬───────┘  │ - Lighting/shadow           │  │  │  │
│  │  │  │  │         │          └────────────────────────────┘  │  │  │  │
│  │  │  │  │  ┌──────▼─────────────────────────────────────────┐  │  │  │
│  │  │  │  │  │ UI Overlay (GameHUD)                           │  │  │  │
│  │  │  │  │  │ - Chat panel (proximity messages)              │  │  │  │
│  │  │  │  │  │ - Voice indicator                              │  │  │  │
│  │  │  │  │  │ - Minimap                                      │  │  │  │
│  │  │  │  │  │ - Room name                                    │  │  │  │
│  │  │  │  │  │ - Player list (nearby)                        │  │  │  │
│  │  │  │  │  │ - Study timer                                  │  │  │  │
│  │  │  │  │  └────────────────────────────────────────────────┘  │  │  │
│   │  │  │  └───────────────────────────────────────────────────────┘  │  │  │
│   │  │  └───────────────────────────────────────────────────────────┘  │  │
│   │  └────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                      │  │
│   │  Audio:                                                              │  │
│   │  ┌────────────────┐    ┌──────────────────────────────────────┐    │  │
│   │  │ AmbientAudio   │    │ ProximityAudio                       │    │  │
│   │  │ Web Audio API  │    │ distance-based volume attenuation   │    │  │
│   │  │ Cmaj7 drone    │    │ WebRTC streams → AudioContext        │    │  │
│   │  └────────────────┘    └──────────────────────────────────────┘    │  │
│   │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
         ┌──────────▼──────────┐           ┌───────────▼──────────┐
         │   Supabase Realtime │           │   Supabase Database  │
         │                     │           │                      │
         │  Broadcast Channel  │           │  chat_messages       │
         │  padhaishuru:world: │           │  study_room_presence │
         │  positions          │           │  study_sessions      │
         │                     │           │  study_rooms         │
         │  Message types:     │           │  profiles            │
         │  - PLAYER_MOVE      │           │                      │
         │  - PLAYER_JOIN      │           │                      │
         │  - PLAYER_LEAVE     │           │                      │
         │  - VOICE_OFFER      │           │                      │
         │  - VOICE_ANSWER     │           │                      │
         │  - VOICE_ICE        │           │                      │
         │  - EMOJI_REACTION   │           │                      │
         └─────────────────────┘           └──────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 16 App Router + React 19 | Existing stack, SSR support |
| **Language** | TypeScript 5 (strict) | Type safety for game entities |
| **Rendering** | HTML5 Canvas 2D (custom engine) | Lightweight, no external game engine dependency |
| **State Management** | React Context + useReducer | Game state within React tree |
| **Networking** | Supabase Realtime (Broadcast + Presence) | Already integrated, low latency |
| **Voice Transport** | WebRTC (RTCPeerConnection, direct) | No heavy SDK, peer-to-peer audio |
| **Signaling** | Supabase Realtime Broadcast | Reuses existing channel |
| **Auth** | Supabase Auth (email/password + Google) | Existing auth system |
| **Database** | Supabase PostgreSQL | Existing schema |
| **Styling** | Tailwind CSS v4 + CSS variables | Existing styling approach |
| **Fonts** | Inter (body), Playfair Display (headings) | Existing brand fonts |
| **Animation** | Framer Motion 13 | Existing animation library |
| **Mobile** | Capacitor 8 (Android wrapper) | Existing mobile packaging |
| **Audio** | Web Audio API | Procedural ambient sound, no audio files needed |

### What We Do NOT Use

- No PixiJS / Phaser / Unity — we build a minimal custom renderer
- No LiveKit / Agora — direct WebRTC for voice
- No Socket.io — Supabase Realtime replaces it
- No external sprite assets — procedural generation only

---

## 3. Game World Module Structure

### Directory Tree

```
src/modules/virtual-library/game/
├── engine/
│   ├── GameEngine.ts           # Main loop, state machine, entity management
│   ├── GameLoop.ts             # requestAnimationFrame loop with delta time
│   └── EntityManager.ts        # Create/update/destroy game entities
├── renderer/
│   ├── CanvasRenderer.ts       # HTML5 Canvas 2D rendering pipeline
│   ├── SpriteSheet.ts          # Procedural sprite generation (no assets)
│   └── Camera.ts               # Viewport camera following player
├── world/
│   ├── WorldMap.ts             # Library map definition (rooms, walls, objects)
│   ├── Room.ts                 # Room/zone definition with metadata
│   └── Tile.ts                 # Tile type enum and properties
├── entities/
│   ├── Player.ts               # Player entity (position, color, name, avatar)
│   ├── NPC.ts                  # Non-player characters (optional, Phase 2)
│   └── Interactable.ts         # Objects you can interact with (desks, books)
├── systems/
│   ├── MovementSystem.ts       # WASD/click/touch movement, collision
│   ├── ProximitySystem.ts      # Calculate nearby entities, room detection
│   ├── ChatSystem.ts           # Proximity text chat with chat bubbles
│   ├── VoiceSystem.ts          # Proximity voice chat (WebRTC)
│   └── InteractionSystem.ts    # Room entry, object interaction, study timer
├── networking/
│   ├── NetworkSync.ts          # Position broadcast via Supabase Realtime
│   ├── PresenceManager.ts      # Player presence in rooms
│   └── PositionBroadcaster.ts  # Throttled position updates
├── ui/
│   ├── GameHUD.ts              # Overlay UI (chat, minimap, player list)
│   ├── ChatBubble.ts           # Proximity chat bubbles above heads
│   ├── PlayerNameTag.ts        # Names above player heads
│   └── VoiceIndicator.ts       # Speaking indicator pulse
├── audio/
│   ├── AmbientAudio.ts         # Library ambient sounds (Web Audio synthesis)
│   └── ProximityAudio.ts       # Distance-based audio attenuation
└── utils/
    ├── geometry.ts             # Distance, AABB, circle-circle collision
    ├── throttle.ts             # Debounce/throttle utilities
    └── colors.ts               # Color utilities (palette, contrast)
```

### File-by-File Contracts

#### `engine/GameEngine.ts`

**Purpose:** Central orchestrator. Owns the game loop, holds all systems, manages state transitions.

```typescript
export interface GameEngineConfig {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  localPlayerId: string;
  localPlayerName: string;
  localPlayerColor: number;
  map: TileType[][];
  rooms: RoomZone[];
  onStateChange?: (state: GameState) => void;
  onChatMessage?: (message: ChatBubbleData) => void;
}

export interface GameState {
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'error';
  localPlayer: WorldPlayer;
  remotePlayers: Map<string, WorldPlayer>;
  currentRoom: RoomId | null;
  nearbyPlayers: WorldPlayer[];
  chatMessages: ChatBubbleData[];
  studyTimer: StudyTimerState | null;
  connectionState: ConnectionState;
}

export class GameEngine {
  constructor(config: GameEngineConfig);
  
  // Lifecycle
  start(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
  
  // State access
  getState(): Readonly<GameState>;
  getPlayer(id: string): WorldPlayer | undefined;
  getRemotePlayers(): WorldPlayer[];
  getNearbyPlayers(): WorldPlayer[];
  getCurrentRoom(): RoomId | null;
  
  // Actions
  movePlayer(dx: number, dy: number): void;
  sendChatMessage(text: string): void;
  toggleMic(): void;
  startStudySession(branchId: string, subjectId?: string): void;
  endStudySession(): void;
  
  // Events
  onStateChange(handler: (state: GameState) => void): () => void;
  onChatMessage(handler: (msg: ChatBubbleData) => void): () => void;
  onPlayerJoin(handler: (player: WorldPlayer) => void): () => void;
  onPlayerLeave(handler: (playerId: string) => void): () => void;
}
```

**Imports:** GameLoop, EntityManager, all systems, Camera, WorldMap  
**Exports:** GameEngine class, GameEngineConfig, GameState

---

#### `engine/GameLoop.ts`

**Purpose:** requestAnimationFrame loop with delta-time, fixed timestep, pause/resume.

```typescript
export interface GameLoopCallbacks {
  update(dt: number): void;      // Fixed-timestep update
  render(interpolatedDt: number): void;  // Render with interpolation
}

export class GameLoop {
  constructor(callbacks: GameLoopCallbacks, targetFPS = 60);
  
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  isRunning(): boolean;
  
  // Visibility API integration
  handleVisibilityChange(): void;
}
```

**Design:**  
- Accumulator pattern: `accumulator += dt; while (accumulator >= fixedDt) { update(fixedDt); accumulator -= fixedDt; }`  
- Render uses `accumulator / fixedDt` for interpolation between last two physics steps  
- Automatically pauses when tab hidden, resumes when visible (existing behavior)

---

#### `engine/EntityManager.ts`

**Purpose:** Central registry for all game entities. Owns creation, updates, destruction, queries.

```typescript
export interface Entity {
  id: string;
  type: 'player' | 'npc' | 'interactable';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  data: Record<string, any>;
}

export class EntityManager {
  private entities: Map<string, Entity> = new Map();
  
  add(entity: Entity): void;
  remove(id: string): boolean;
  update(id: string, props: Partial<Entity>): void;
  get(id: string): Entity | undefined;
  getAll(): Entity[];
  getByType(type: Entity['type']): Entity[];
  getInRadius(x: number, y: number, radius: number): Entity[];
  getInRoom(roomId: string): Entity[];
  clear(): void;
  
  // Queries
  query(bounds: { x: number; y: number; w: number; h: number }): Entity[];
}
```

---

#### `renderer/CanvasRenderer.ts`

**Purpose:** HTML5 Canvas 2D rendering. Draws tiles, entities, effects, UI overlays.

```typescript
export interface CanvasRendererConfig {
  canvas: HTMLCanvasElement;
  map: TileType[][];
  tileSize: number;
  camera: Camera;
  dpr: number;
}

export interface DrawableEntity {
  x: number;
  y: number;
  radius: number;
  color: string;
  label?: string;
  isLocal?: boolean;
  isMoving?: boolean;
  isMuted?: boolean;
  isSpeaking?: boolean;
  chatBubble?: string;
  roomId?: string | null;
}

export class CanvasRenderer {
  constructor(config: CanvasRendererConfig);
  
  // Render pipeline (called each frame)
  drawTiles(map: TileType[][], offsetX: number, offsetY: number): void;
  drawLighting(time: number): void;
  drawEntities(entities: DrawableEntity[]): void;
  drawChatBubbles(bubbles: ChatBubbleData[]): void;
  drawHUD(hud: HUDState): void;
  drawMinimap(entities: DrawableEntity[], currentRoom: RoomId | null): void;
  
  // Utilities
  resize(): void;
  clear(): void;
  worldToScreen(wx: number, wy: number): { x: number; y: number };
  screenToWorld(sx: number, sy: number): { x: number; y: number };
}
```

**Rendering Order (back to front):**  
1. Floor tiles with noise texture  
2. Wall tiles  
3. Decorative objects (plants, bookshelves, lamps)  
4. Shadows under entities  
5. Entities sorted by Y (depth sorting for pseudo-3D)  
6. Lighting/lamp glow overlays  
7. Chat bubbles above entities  
8. HUD overlay (minimap, player list, timer)

---

#### `renderer/SpriteSheet.ts`

**Purpose:** Procedural sprite generation. Draws players, objects as canvas paths — no image assets.

```typescript
export interface SpriteSheet {
  drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, 
             radius: number, color: string, options: PlayerSpriteOptions): void;
  drawNPC(ctx: CanvasRenderingContext2D, x: number, y: number,
          radius: number, color: string): void;
  drawInteractable(ctx: CanvasRenderingContext2D, x: number, y: number,
                   type: InteractableType, state: InteractableState): void;
  drawTile(ctx: CanvasRenderingContext2D, type: TileType, x: number, y: number,
           tileSize: number, time: number): void;
}

interface PlayerSpriteOptions {
  label?: string;
  isLocal?: boolean;
  isMoving?: boolean;
  isMuted?: boolean;
  isSpeaking?: boolean;
  hasBubble?: boolean;
  direction?: 'up' | 'down' | 'left' | 'right';
}
```

**Procedural Generation Strategy:**  
- Players: Filled circle + directional shadow + name label above  
- Speaking indicator: Pulsing ring around player  
- Muted indicator: Small slash icon over mic area  
- Chat bubble: Rounded rect with tail pointing to player  
- Desks: Brown rectangle with items on top  
- Bookshelves: Tall brown rectangle with colored "book" rectangles  
- Lamps: Pole + glow circle (radial gradient)  
- Plants: Green circle + brown stem

---

#### `renderer/Camera.ts`

**Purpose:** Viewport that follows the local player, clamped to world bounds.

```typescript
export interface CameraConfig {
  viewportWidth: number;
  viewportHeight: number;
  worldWidth: number;
  worldHeight: number;
  tileSize: number;
}

export class Camera {
  constructor(config: CameraConfig);
  
  // Follow target with optional smoothing
  follow(targetX: number, targetY: number, smoothing: number): void;
  
  // Clamp to world bounds
  clamp(): void;
  
  // Transform world → screen coordinates
  worldToScreen(wx: number, wy: number): { x: number; y: number };
  screenToWorld(sx: number, sy: number): { x: number; y: number };
  
  // Current viewport in world coords
  getViewport(): { x: number; y: number; w: number; h: number };
  
  // Current offset for rendering
  getOffset(): { x: number; y: number };
  
  // Immediately teleport camera
  setPosition(x: number, y: number): void;
}
```

---

#### `world/Tile.ts`

**Purpose:** Tile type definitions and per-tile metadata.

```typescript
export const TILE_TYPES = {
  FLOOR:          { walkable: true, render: 'floor' },
  FLOOR_DARK:     { walkable: true, render: 'floor_dark' },
  FLOOR_WOOD:     { walkable: true, render: 'floor_wood' },
  WALL:           { walkable: false, render: 'wall', blocksVoice: true },
  WALL_BOOKSHELF: { walkable: false, render: 'wall_bookshelf', blocksVoice: true },
  BOOKSHELF:      { walkable: false, render: 'bookshelf', blocksVoice: true },
  DESK:           { walkable: false, render: 'desk' },
  CHAIR:          { walkable: false, render: 'chair' },
  PLANT:          { walkable: true, render: 'plant' },
  LAMP:           { walkable: false, render: 'lamp', emitsLight: true },
  WINDOW:         { walkable: true, render: 'window' },
  DOOR:           { walkable: true, render: 'door' },
  CARPET:         { walkable: true, render: 'carpet' },
  PILLAR:         { walkable: false, render: 'pillar', blocksVoice: true },
  COUNTER:        { walkable: false, render: 'counter' },
} as const;

export type TileType = keyof typeof TILE_TYPES;

export function isWalkable(type: TileType): boolean;
export function blocksVoice(type: TileType): boolean;
export function emitsLight(type: TileType): boolean;
```

---

#### `world/Room.ts`

**Purpose:** Room/zone definition with bounds, metadata, and voice/chat configuration.

```typescript
export interface RoomZone {
  id: RoomId;
  name: string;
  description: string;
  // Bounding box in tile coordinates [col, row, width, height]
  bounds: [number, number, number, number];
  // Entry point in tile coordinates [col, row]
  entryPoint: [number, number];
  // Feature flags
  voiceEnabled: boolean;
  chatEnabled: boolean;
  studyMode: boolean;
  // Optional branch/subject filter
  branchId?: string;
  subjectId?: string;
  // Visual
  bgColor?: string;
  accentColor?: string;
  // Max players (0 = unlimited)
  maxPlayers?: number;
  // Music/ambient
  ambientTrack?: string;
}

export type RoomId =
  | 'entrance'
  | 'main-reading'
  | 'quiet-zone'
  | 'group-study'
  | 'discussion-room'
  | 'booth-1'
  | 'booth-2'
  | 'booth-3'
  | 'booth-4';

// Predefined rooms (same as existing ROOM_ZONES in map.ts, enriched)
export const ROOMS: Record<RoomId, RoomZone> = { ... };
```

---

#### `world/WorldMap.ts`

**Purpose:** Complete map definition — 40×30 tile grid + room zones + spawn points + decorations.

```typescript
export interface WorldMap {
  width: number;      // 40 tiles
  height: number;     // 30 tiles
  tileSize: number;   // 40px
  tiles: TileType[][];
  rooms: RoomZone[];
  spawnPoints: Record<RoomId, [number, number]>;  // tile coords
  interactables: Interactable[];
  lights: LightSource[];
}

export interface LightSource {
  x: number;      // tile col
  y: number;      // tile row
  radius: number; // in pixels
  color: string;
  intensity: number;
}

export interface Interactable {
  id: string;
  type: 'desk' | 'bookshelf' | 'whiteboard' | 'timer' | 'door';
  x: number;      // pixel position
  y: number;
  width: number;
  height: number;
  roomId: RoomId;
  label?: string;
  action?: 'study' | 'browse' | 'join-room';
}

export function createWorldMap(): WorldMap;
```

---

#### `entities/Player.ts`

**Purpose:** Player entity — local or remote. Stores position, movement state, appearance.

```typescript
export interface PlayerData {
  id: string;
  label: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  radius: number;
  colorIndex: number;
  isLocal: boolean;
  isMoving: boolean;
  direction: 'up' | 'down' | 'left' | 'right';
  roomId: RoomId | null;
  isMuted: boolean;
  isSpeaking: boolean;
  isVideoOn: boolean;
  lastUpdate: number;
  // Study state
  isStudying: boolean;
  studyBranchId?: string;
  studySubjectId?: string;
  studyStartTime?: number;
}

export class Player {
  readonly data: PlayerData;
  
  constructor(data: PlayerData);
  
  // Movement
  setTarget(tx: number, ty: number): void;
  update(dt: number, speed: number, collision: CollisionSystem): void;
  
  // State
  setPosition(x: number, y: number): void;
  setRoom(roomId: RoomId | null): void;
  setSpeaking(speaking: boolean): void;
  setMuted(muted: boolean): void;
  startStudying(branchId: string, subjectId?: string): void;
  stopStudying(): void;
  
  // Interpolation (for remote players)
  interpolate(t: number): { x: number; y: number };
  
  // Distance to another point/player
  distanceTo(x: number, y: number): number;
  distanceToPlayer(other: Player): number;
}
```

---

#### `entities/NPC.ts`

**Purpose:** Optional non-player characters for ambient life (Phase 2).

```typescript
export interface NPCData {
  id: string;
  label: string;
  x: number;
  y: number;
  path: [number, number][];   // Waypoints
  pathIndex: number;
  colorIndex: number;
  activity: 'reading' | 'walking' | 'studying' | 'idle';
  roomId: RoomId;
}

export class NPC {
  readonly data: NPCData;
  
  update(dt: number): void;
  setPath(path: [number, number][]): void;
}
```

---

#### `entities/Interactable.ts`

**Purpose:** Objects in the world players can interact with.

```typescript
export type InteractableType = 'desk' | 'bookshelf' | 'whiteboard' | 'timer' | 'door';

export interface InteractableData {
  id: string;
  type: InteractableType;
  x: number;
  y: number;
  width: number;
  height: number;
  roomId: RoomId;
  label?: string;
  action?: 'study' | 'browse' | 'join-room' | 'exit';
  state: 'available' | 'occupied' | 'locked';
  occupiedBy?: string;  // player id
}

export class Interactable {
  readonly data: InteractableData;
  
  canInteract(player: Player): boolean;
  interact(player: Player): InteractionResult;
  occupy(playerId: string): void;
  vacate(): void;
}

export interface InteractionResult {
  success: boolean;
  action?: string;
  message?: string;
}
```

---

#### `systems/MovementSystem.ts`

**Purpose:** Handles WASD/arrow/touch input, applies velocity, resolves collision, detects room changes.

```typescript
export interface MovementConfig {
  speed: number;           // pixels per second
  collision: CollisionSystem;
  mapBounds: { w: number; h: number };
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export class MovementSystem {
  constructor(config: MovementConfig);
  
  // Input
  handleKeyDown(key: string): void;
  handleKeyUp(key: string): void;
  handleTouch(dx: number, dy: number): void;
  getInputState(): InputState;
  
  // Update
  update(entity: Player, dt: number): void;
  
  // Room detection
  detectRoom(entity: Player, rooms: RoomZone[]): RoomId | null;
  
  // Cleanup
  destroy(): void;
}
```

**Key behaviors:**
- Diagonal normalization: `if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }`
- Step-based collision resolution (same as existing CollisionSystem)
- Room change triggers event on crossing room boundary

---

#### `systems/ProximitySystem.ts`

**Purpose:** Calculates which entities are nearby each frame. Powers proximity chat/voice.

```typescript
export interface ProximityConfig {
  chatRange: number;       // 150px
  voiceRange: number;      // 200px
  roomVoiceRange: number;  // 600px (for voice-enabled rooms)
  voiceEnabledRooms: Set<RoomId>;
  mapTiles: TileType[][];
  tileSize: number;
}

export interface NearbySet {
  chat: Player[];     // Within chat range, line-of-sight
  voice: Player[];    // Within voice range, line-of-sight
  interactables: Interactable[];  // Within interaction range
}

export class ProximitySystem {
  constructor(config: ProximityConfig);
  
  // Query
  getNearby(localPlayer: Player, allPlayers: Player[], interactables: Interactable[]): NearbySet;
  
  // Line-of-sight (tile-based)
  hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean;
  
  // Room-aware range
  getEffectiveVoiceRange(roomId: RoomId | null): number;
}
```

**Line-of-sight algorithm:**
- Cast ray from player to target through tile grid
- If any intermediate tile is WALL/WALL_BOOKSHELF/PILLAR, break LOS
- Use Bresenham's line algorithm for tile sampling

---

#### `systems/ChatSystem.ts`

**Purpose:** Proximity text chat. Messages only visible to nearby players. Renders chat bubbles.

```typescript
export interface ChatBubbleData {
  id: string;
  playerId: string;
  playerLabel: string;
  playerColor: number;
  text: string;
  timestamp: number;
  ttl: number;      // ms before bubble fades
  x: number;        // world position
  y: number;
}

export interface ChatConfig {
  maxBubbleLength: number;      // chars
  bubbleTTL: number;            // 6000ms
  maxVisibleBubbles: number;    // 20
  maxChatHistory: number;       // 50 messages
}

export class ChatSystem {
  constructor(config: ChatConfig);
  
  // Send
  sendMessage(player: Player, text: string): ChatBubbleData | null;
  
  // Receive
  receiveMessage(message: ChatBubbleData): void;
  
  // Query
  getVisibleMessages(localPlayer: Player, allMessages: ChatBubbleData[]): ChatBubbleData[];
  getChatHistory(): ChatBubbleData[];
  
  // Persistence (Supabase)
  persistMessage(message: ChatBubbleData, roomId: RoomId): Promise<void>;
  loadRecentMessages(roomId: RoomId, limit: number): Promise<ChatBubbleData[]>;
  
  // Cleanup
  cleanup(): void;
}
```

**Persistence flow:**
1. Local send → create ChatBubbleData → immediately show locally
2. Persist to `chat_messages` table via Supabase
3. Remote clients receive via Supabase Realtime INSERT subscription
4. On receive → add to local bubble list with position from sender's last known position

---

#### `systems/VoiceSystem.ts`

**Purpose:** Proximity voice chat via WebRTC peer connections. Manages mic permissions, peer connections, audio routing.

```typescript
export interface VoicePeer {
  playerId: string;
  peerConnection: RTCPeerConnection;
  audioElement: HTMLAudioElement;
  remoteStream: MediaStream | null;
  state: 'connecting' | 'connected' | 'disconnected' | 'failed';
}

export interface VoiceConfig {
  proximityRange: number;
  roomVoiceRange: number;
  iceServers: RTCIceServer[];
  maxPeers: number;
}

export class VoiceSystem {
  constructor(config: VoiceConfig);
  
  // Lifecycle
  async requestMicPermission(): Promise<boolean>;
  async startLocalStream(): Promise<MediaStream | null>;
  stopLocalStream(): void;
  destroy(): void;
  
  // Peer management
  onNearbyChange(nearbyPlayers: Player[]): void;
  
  // Signaling (via Supabase Realtime)
  async sendOffer(playerId: string, offer: RTCSessionDescriptionInit): Promise<void>;
  async sendAnswer(playerId: string, answer: RTCSessionDescriptionInit): Promise<void>;
  async sendIceCandidate(playerId: string, candidate: RTCIceCandidateInit): Promise<void>;
  
  // Incoming signaling (called by NetworkSync)
  handleOffer(fromId: string, offer: RTCSessionDescriptionInit): Promise<void>;
  handleAnswer(fromId: string, answer: RTCSessionDescriptionInit): Promise<void>;
  handleIceCandidate(fromId: string, candidate: RTCIceCandidateInit): Promise<void>;
  
  // Audio control
  setMasterVolume(volume: number): void;
  mutePeer(playerId: string): void;
  unmutePeer(playerId: string): void;
  getActivePeers(): VoicePeer[];
  
  // State
  isMicOn(): boolean;
  isStreaming(): boolean;
}
```

**WebRTC Configuration:**
```
ICE Servers:
  - stun:stun.l.google.com:19302
  - stun:stun1.l.google.com:19302
  
Media Constraints:
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000
  }
```

---

#### `systems/InteractionSystem.ts`

**Purpose:** Handles interaction with world objects and room entry/exit.

```typescript
export interface InteractionConfig {
  interactionRange: number;   // 50px
  interactables: Map<string, Interactable>;
  rooms: Record<RoomId, RoomZone>;
}

export interface InteractionResult {
  type: 'desk' | 'bookshelf' | 'study-session' | 'room-change' | 'none';
  success: boolean;
  data?: any;
}

export class InteractionSystem {
  constructor(config: InteractionConfig);
  
  // Query
  getInteractableNear(player: Player): Interactable | null;
  
  // Execute
  interact(player: Player): Promise<InteractionResult>;
  enterRoom(roomId: RoomId, player: Player): Promise<void>;
  exitRoom(player: Player): Promise<void>;
  
  // Study session
  startStudySession(player: Player, branchId: string, subjectId?: string): Promise<void>;
  endStudySession(player: Player): Promise<void>;
}
```

---

#### `networking/NetworkSync.ts`

**Purpose:** Bridges game engine to Supabase Realtime. Sends/receives position updates, signaling messages.

```typescript
export type NetworkMessageType =
  | 'PLAYER_MOVE'
  | 'PLAYER_JOIN'
  | 'PLAYER_LEAVE'
  | 'PLAYER_INTERACT'
  | 'VOICE_OFFER'
  | 'VOICE_ANSWER'
  | 'VOICE_ICE'
  | 'EMOJI_REACTION';

export interface PlayerMoveMessage {
  type: 'PLAYER_MOVE';
  playerId: string;
  x: number;
  y: number;
  roomId: string | null;
  timestamp: number;
}

export interface PlayerJoinMessage {
  type: 'PLAYER_JOIN';
  playerId: string;
  label: string;
  colorIndex: number;
  roomId: string | null;
}

// ... other message types

export class NetworkSync {
  constructor(
    private broadcaster: PositionBroadcaster,
    private presence: PresenceManager,
    private voiceSystem: VoiceSystem,
    private onMessage: (msg: any) => void
  ) {}
  
  // Position
  broadcastPosition(player: Player): void;
  
  // Lifecycle
  broadcastJoin(player: Player): void;
  broadcastLeave(playerId: string, roomId: string | null): void;
  
  // Interaction
  broadcastInteract(playerId: string, action: string, target: string): void;
  
  // Voice signaling
  sendVoiceOffer(playerId: string, offer: RTCSessionDescriptionInit): void;
  sendVoiceAnswer(playerId: string, answer: RTCSessionDescriptionInit): void;
  sendIceCandidate(playerId: string, candidate: RTCIceCandidateInit): void;
  
  // Reactions
  sendEmojiReaction(playerId: string, emoji: string, x: number, y: number): void;
  
  // Subscribe to incoming
  subscribe(): () => void;
}
```

---

#### `networking/PresenceManager.ts`

**Purpose:** Tracks which players are in which rooms. Uses Supabase Realtime Presence.

```typescript
export interface PresenceState {
  playerId: string;
  label: string;
  colorIndex: number;
  roomId: string | null;
  joinedAt: number;
}

export class PresenceManager {
  constructor(supabaseChannel: RealtimeChannel);
  
  // Subscribe to presence changes
  subscribe(onChange: (players: PresenceState[]) => void): () => void;
  
  // Update own presence
  updatePresence(roomId: string | null): void;
  
  // Get current presence list
  getPresenceList(): PresenceState[];
  
  // Cleanup
  unsubscribe(): void;
}
```

---

#### `networking/PositionBroadcaster.ts`

**Purpose:** Throttled position broadcast. Only sends when position changes meaningfully.

```typescript
export interface BroadcasterConfig {
  broadcastInterval: number;  // 100ms
  minDistance: number;         // 5px minimum movement before broadcast
  channel: string;             // 'padhaishuru:world:positions'
}

export class PositionBroadcaster {
  constructor(private supabase: SupabaseClient, config: BroadcasterConfig);
  
  // Call every frame with current position
  broadcast(playerId: string, x: number, y: number, roomId: string | null): void;
  
  // Force broadcast (e.g., on room change)
  forceBroadcast(playerId: string, x: number, y: number, roomId: string | null): void;
  
  // Cleanup
  destroy(): void;
}
```

---

#### `ui/GameHUD.ts`

**Purpose:** Overlay UI for the game. Renders as HTML elements positioned over the canvas.

```typescript
export interface HUDState {
  currentRoom: RoomId | null;
  roomName: string;
  nearbyPlayers: Player[];
  chatMessages: ChatBubbleData[];
  studyTimer: StudyTimerState | null;
  isMicOn: boolean;
  isStudying: boolean;
  connectionState: ConnectionState;
  settingsOpen: boolean;
}

export interface GameHUDProps {
  state: HUDState;
  onSendChat: (text: string) => void;
  onToggleMic: () => void;
  onToggleSettings: () => void;
  onStartStudy: (branchId: string, subjectId?: string) => void;
  onEndStudy: () => void;
  onLeaveRoom: () => void;
}
```

**HUD Layout:**
```
┌──────────────────────────────────────────────────┐
│ [Room Name]              [Mic btn] [Settings ⚙] │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│ Players  │        CANVAS (game world)             │
│ list     │                                       │
│          │   [Chat bubbles above players]         │
│ ● Alice  │                                       │
│ ● Bob    │                                       │
│ ● Carol  │                                       │
│          │                                       │
├──────────┴───────────────────────────────────────┤
│ [Chat input...]                     [Study Timer] │
└──────────────────────────────────────────────────┘
```

---

#### `ui/ChatBubble.ts`

**Purpose:** Renders a single chat bubble as an HTML element positioned over the canvas.

```typescript
export interface ChatBubbleProps {
  message: ChatBubbleData;
  screenPosition: { x: number; y: number };
  isOwn: boolean;
  maxWidth: number;
}

// Renders a positioned div with:
// - Rounded rectangle background
// - Player name (small, colored)
// - Message text
// - Fade-in/fade-out animation based on ttl
```

---

#### `ui/PlayerNameTag.ts`

**Purpose:** Renders player name above their head in the canvas.

```typescript
export interface NameTagProps {
  label: string;
  colorIndex: number;
  x: number;
  y: number;
  isLocal: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
}
```

---

#### `ui/VoiceIndicator.ts`

**Purpose:** Speaking indicator pulse animation.

```typescript
export interface VoiceIndicatorProps {
  isSpeaking: boolean;
  isMuted: boolean;
  x: number;
  y: number;
  radius: number;
}

// Renders: pulsing ring when speaking, muted icon when muted, nothing otherwise
```

---

#### `audio/AmbientAudio.ts`

**Purpose:** Web Audio API ambient library sounds. Builds on existing `ambient-music.ts`.

```typescript
export interface AmbientAudioConfig {
  enabled: boolean;
  volume: number;
  tracks: Record<string, string>;  // roomId → oscillator config
}

export class AmbientAudioManager {
  constructor(config: AmbientAudioConfig);
  
  // Tracks
  setTrack(trackId: string): void;
  fadeIn(duration: number): void;
  fadeOut(duration: number): void;
  
  // Volume
  setVolume(volume: number): void;
  
  // Persistence
  loadVolume(): number;
  saveVolume(volume: number): void;
  
  // Lifecycle
  start(): void;
  stop(): void;
}
```

**Existing implementation to extend:** `src/modules/virtual-library/world/ambient-music.ts` already creates a warm Cmaj7 drone using Web Audio oscillators. We will:
1. Move it to `audio/AmbientAudio.ts` under the game engine
2. Add per-room track switching
3. Add fade in/out transitions

---

#### `audio/ProximityAudio.ts`

**Purpose:** Distance-based audio attenuation for voice chat.

```typescript
export interface AudioAttenuationConfig {
  minDistance: number;    // Full volume within this range
  maxDistance: number;    // Silent beyond this range
  rolloffFactor: number;  // How quickly volume drops (1 = linear)
  maxVolume: number;      // 0.0 - 1.0
}

export class ProximityAudioManager {
  constructor(config: AudioAttenuationConfig);
  
  // Update volumes for all peers based on distance
  updateVolumes(localPlayer: Player, remotePlayers: Player[]): void;
  
  // Get volume for a specific peer
  getVolumeForPeer(peerId: string, localPlayer: Player, remotePlayers: Player[]): number;
  
  // Mute/unmute individual peers
  mutePeer(peerId: string): void;
  unmutePeer(peerId: string): void;
  
  // Master control
  setMasterVolume(volume: number): void;
}
```

---

#### `utils/geometry.ts`

**Purpose:** Geometry primitives for collision, distance, raycasting.

```typescript
// Distance
export function distance(x1: number, y1: number, x2: number, y2: number): number;
export function distanceSq(x1: number, y1: number, x2: number, y2: number): number;

// Circle vs Circle
export function circleCollidesCircle(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number
): boolean;

// Circle vs Tile
export function circleCollidesTile(
  cx: number, cy: number, radius: number,
  tx: number, ty: number, tileSize: number
): boolean;

// Raycasting (Bresenham through tile grid)
export function raycastTiles(
  x1: number, y1: number,
  x2: number, y2: number,
  tileSize: number
): { col: number; row: number }[];

// Clamp to bounds
export function clamp(value: number, min: number, max: number): number;
export function clampRect(x: number, y: number, w: number, h: number, bounds: { w: number; h: number }): { x: number; y: number };

// Lerp
export function lerp(a: number, b: number, t: number): number;
```

---

#### `utils/throttle.ts`

**Purpose:** Throttle/debounce utilities for network sends.

```typescript
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void;

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void;

export function throttleByDistance(
  fn: (x: number, y: number) => void,
  minDistance: number
): (x: number, y: number) => void;
```

---

#### `types.ts`

**Purpose:** All game-specific types in one place.

```typescript
// Already defined in this file — add:
export interface ChatBubbleData { /* as above */ }
export interface StudyTimerState {
  isRunning: boolean;
  elapsedMs: number;
  branchId?: string;
  subjectId?: string;
  startedAt: number;
}
export interface InteractionResult { /* as above */ }
export interface GameEngineConfig { /* as above */ }
export interface GameState { /* as above */ }
export interface DrawableEntity { /* as above */ }
export interface HUDState { /* as above */ }
```

---

## 4. Data Flow

### 4.1 Player Movement (Local)

```
Keyboard Input
     │
     ▼
MovementSystem.handleKeyDown/Up()
     │
     ▼
GameEngine.update(dt)
     │
     ├─► EntityManager.update(localPlayer)
     │       │
     │       └─► MovementSystem.update() → sets targetX/targetY, applies velocity
     │
     ├─► CollisionSystem.resolveMovement()
     │       └─► Clamps position to valid tiles
     │
     ├─► MovementSystem.detectRoom()
     │       └─► If room changed → GameEngine state update
     │
     └─► ProximitySystem.getNearby()
             └─► Updates HUD nearbyPlayers list
```

### 4.2 Player Movement (Networked to Others)

```
EntityManager.update(localPlayer)
     │
     ▼
PositionBroadcaster.broadcast(playerId, x, y, roomId)
     │
     │  [throttled to 100ms, min 5px movement]
     ▼
Supabase Realtime Broadcast
  channel: 'padhaishuru:world:positions'
  message: { type: 'PLAYER_MOVE', playerId, x, y, roomId, timestamp }
     │
     ▼
Remote clients receive via channel.on('broadcast', ...)
     │
     ▼
NetworkSync.onPositionUpdate(playerId, x, y, roomId)
     │
     ▼
EntityManager.update(remotePlayer)
     │
     └─► Sets targetX/targetY → CanvasRenderer interpolates display position
```

### 4.3 Proximity Text Chat

```
Local player types message
     │
     ▼
ChatSystem.sendMessage(player, text)
     │
     ├─► Create ChatBubbleData (shown immediately locally)
     │
     ├─► Persist to Supabase chat_messages table
     │       INSERT INTO chat_messages (room_id, user_id, content, content_type)
     │
     └─► Broadcast to room via Supabase Realtime
             └─► Remote ChatSystem.receiveMessage()
                     └─► Add to local bubble list
                             └─► CanvasRenderer.drawChatBubbles()
```

### 4.4 Proximity Voice Chat

```
ProximitySystem.getNearby() detects nearby player
     │
     ▼
VoiceSystem.onNearbyChange([remotePlayer])
     │
     ├─► If new nearby player:
     │       └─► Create RTCPeerConnection
     │               ├─► Add local MediaStream
     │               ├─► Create offer
     │               ├─► Set local description
     │               └─► NetworkSync.sendVoiceOffer(toId, offer)
     │                       └─► Supabase Broadcast
     │
     └─► If no longer nearby:
             └─► Close peer connection after 3s grace period
```

### 4.5 Room Entry

```
Player walks through doorway tile
     │
     ▼
MovementSystem.detectRoom() → new RoomId
     │
     ▼
GameEngine.onRoomChange(newRoomId)
     │
     ├─► PresenceManager.updatePresence(newRoomId)
     │       └─► Supabase Presence track update
     │
     ├─► NetworkSync.broadcastInteract('enter-room', newRoomId)
     │
     ├─► VoiceSystem.onRoomChange(newRoomId)
     │       └─► Close voice connections to players in old room
     │
     ├─► ChatSystem.onRoomChange(newRoomId)
     │       └─► Load recent messages for new room
     │
     └─► CanvasRenderer renders new room tiles
```

### 4.6 Study Session Flow

```
Player presses 'S' at desk or clicks "Start Studying"
     │
     ▼
InteractionSystem.startStudySession(player, branchId, subjectId)
     │
     ├─► Mark desk as occupied (Interactable.state = 'occupied')
     │
     ├─► Player.isStudying = true
     │
     ├─► Create study timer (StudyTimerState)
     │       └─► startedAt = Date.now()
     │
     ├─► Insert study_sessions row (Supabase)
     │       INSERT INTO study_sessions (user_id, room_id, branch_id, topic, started_at)
     │
     └─► GameHUD shows timer + "Press ESC to stop studying"
```

---

## 5. API Contracts

### 5.1 GameEngine

```typescript
// Input: Keyboard/touch events → Output: Player movement
// Input: Timer tick → Output: Frame update to all systems
// Input: Network messages → Output: Remote player state updates
// Output: HUD state → Consumed by GameHUD component
// Output: Chat bubbles → Consumed by ChatBubble renderer
// Output: Audio events → Consumed by AmbientAudio + ProximityAudio
```

### 5.2 EntityManager

```typescript
// Input: Entity creation request → Output: New entity in registry
// Input: Entity update (position, state) → Output: Updated entity
// Input: Entity removal → Output: Entity removed from registry
// Output: Entity queries → Consumed by ProximitySystem, Renderer
```

### 5.3 MovementSystem

```typescript
// Input: Keyboard state (WASD) → Output: Velocity vector
// Input: Collision map → Output: Clamped position
// Output: Room detection → Consumed by PresenceManager
// Output: Movement events → Consumed by PositionBroadcaster
```

### 5.4 ProximitySystem

```typescript
// Input: Local player position, all player positions
// Input: Tile map for LOS
// Output: NearbySet { chat: Player[], voice: Player[] }
// Consumed by: ChatSystem, VoiceSystem, HUD
```

### 5.5 ChatSystem

```typescript
// Input: Text message from local player
// Output: ChatBubbleData (local display)
// Side effect: INSERT to Supabase chat_messages
// Input: Realtime INSERT from Supabase
// Output: ChatBubbleData (remote message display)
```

### 5.6 VoiceSystem

```typescript
// Input: NearbySet from ProximitySystem
// Output: WebRTC peer connections established/closed
// Input: Microphone permission result
// Output: Local MediaStream
// Input: Voice signaling messages (offer/answer/ICE)
// Output: Audio playback through HTMLAudioElement
```

### 5.7 CanvasRenderer

```typescript
// Input: GameState snapshot
// Input: Camera offset
// Output: Rendered frame on HTMLCanvasElement
// Consumed by: GameLoop.render()
```

---

## 6. State Machine

### 6.1 Player States

```
  ┌─────────┐
  │  IDLE   │ ◄────────────────────┐
  └────┬────┘                       │
       │ start moving               │ stop moving
       ▼                            │
  ┌─────────┐   interact/press S   │
  │ WALKING │ ─────────────────────►│
  └────┬────┘                       │
       │ press Shift                │ release Shift
       ▼                            │
  ┌─────────┐                       │
  │ RUNNING │ ──────────────────────┘
  └────┬────┘
       │ interact with object / press E
       ▼
  ┌─────────────┐
  │ INTERACTING │ ──► completes/fails ──► WALKING
  └──────┬──────┘
         │ opens chat
         ▼
  ┌─────────────┐
  │  CHATTING   │ ──► message sent / ESC ──► WALKING
  └──────┬──────┘
         │ starts study session
         ▼
  ┌─────────────┐
  │  STUDYING   │ ──► timer ends / ESC ──► WALKING
  └─────────────┘
```

### 6.2 Room States

```
  ┌──────────┐
  │   OPEN   │ ──► maxPlayers reached ──► FULL
  └──────────┘ ──► admin closes ──► CLOSED

  ┌──────────┐
  │   FULL   │ ──► player leaves ──► OPEN
  └──────────┘ ──► admin closes ──► CLOSED

  ┌──────────┐
  │  CLOSED  │ ──► admin opens ──► OPEN
  └──────────┘
```

### 6.3 Session States (Study Session)

```
  ┌────────┐
  │  IDLE  │ ──► player starts studying ──► RUNNING
  └────────┘
         ▲
         │ player pauses timer
  ┌──────┴──────┐
  │   PAUSED    │ ──► player resumes ──► RUNNING
  └─────────────┘
         ▲
         │ player ends session
  ┌────────────┐
  │ COMPLETED  │ ──► session saved ──► IDLE
  └────────────┘
```

### 6.4 Voice Connection States

```
  ┌──────────────┐
  │  DISCONNECTED │ ──► proximity detects peer ──► CONNECTING
  └──────────────┘
         ▲
         │ connection fails / peer leaves
  ┌──────┴──────┐
  │   FAILED    │ ──► retry or give up ──► DISCONNECTED
  └─────────────┘
         ▲
         │ offer/answer exchanged
  ┌──────────────┐
  │ CONNECTING   │ ──► ICE connected ──► CONNECTED
  └──────────────┘
         ▲
         │ peer leaves proximity (3s grace)
  ┌──────────────┐
  │  CONNECTED   │ ──► connection closes ──► DISCONNECTED
  └──────────────┘
```

---

## 7. Networking Protocol

### 7.1 Message Types

All messages are sent via Supabase Realtime Broadcast channel `padhaishuru:world:positions`.

| Message Type | Direction | Payload | Rate Limit |
|-------------|-----------|---------|------------|
| `PLAYER_MOVE` | Client → Broadcast | `{ playerId, x, y, roomId, timestamp }` | 10/sec (throttled) |
| `PLAYER_JOIN` | Client → Broadcast | `{ playerId, label, colorIndex, roomId }` | Once per session |
| `PLAYER_LEAVE` | Client → Broadcast | `{ playerId, roomId }` | Once on leave |
| `PLAYER_INTERACT` | Client → Broadcast | `{ playerId, action, target }` | Per interaction |
| `PLAYER_STUDY_START` | Client → Broadcast | `{ playerId, branchId, subjectId }` | Once per session |
| `PLAYER_STUDY_END` | Client → Broadcast | `{ playerId, durationMs }` | Once per session |
| `VOICE_OFFER` | Client → Broadcast | `{ fromId, toId, offer: SDP }` | Per peer connect |
| `VOICE_ANSWER` | Client → Broadcast | `{ fromId, toId, answer: SDP }` | Per peer connect |
| `VOICE_ICE` | Client → Broadcast | `{ fromId, toId, candidate: ICE }` | Per ICE candidate |
| `VOICE_HANGUP` | Client → Broadcast | `{ fromId, toId }` | Per peer disconnect |
| `EMOJI_REACTION` | Client → Broadcast | `{ playerId, emoji, x, y }` | Per reaction |
| `PRESENCE_UPDATE` | Supabase → Client | `{ playerId, roomId, timestamp }` | On presence sync |

### 7.2 Message Schemas

```typescript
// PLAYER_MOVE
interface PlayerMoveMessage {
  type: 'PLAYER_MOVE';
  playerId: string;
  x: number;       // World X in pixels
  y: number;       // World Y in pixels
  roomId: string | null;  // Current room, null if in transit
  timestamp: number;      // Unix ms
}

// PLAYER_JOIN
interface PlayerJoinMessage {
  type: 'PLAYER_JOIN';
  playerId: string;
  label: string;       // Display name
  colorIndex: number;  // 0-7
  roomId: string | null;
}

// PLAYER_LEAVE
interface PlayerLeaveMessage {
  type: 'PLAYER_LEAVE';
  playerId: string;
  roomId: string | null;
}

// VOICE_OFFER / VOICE_ANSWER
interface VoiceSignalingMessage {
  type: 'VOICE_OFFER' | 'VOICE_ANSWER';
  fromId: string;
  toId: string;
  sdp: RTCSessionDescriptionInit;
}

// VOICE_ICE
interface VoiceIceMessage {
  type: 'VOICE_ICE';
  fromId: string;
  toId: string;
  candidate: RTCIceCandidateInit;
}
```

### 7.3 Channel Structure

```
Broadcast channel:   padhaishuru:world:positions
  - Lightweight, no DB writes
  - 10Hz position updates per player
  - Ephemeral — no persistence

Presence channel:    padhaishuru:presence:{roomId}
  - One per room
  - Tracks: user_id, user_name, joined_at
  - Auto-expires on disconnect

Postgres Changes:    chat_messages INSERT
  - Filtered by room_id
  - Persistent chat history
```

### 7.4 Existing Infrastructure Reuse

The existing `MultiplayerManager` class (`src/modules/virtual-library/world/multiplayer.ts`) already implements:

- Position broadcast at 10Hz
- Emoji reactions broadcast
- Presence-style join/leave (via custom event system, not Supabase Presence)
- Stale player cleanup (5s timeout)
- Interpolation factor (0.18)

**Migration:** Extend `MultiplayerManager` rather than replace it. Add voice signaling message types to its existing broadcast handler.

---

## 8. Proximity Chat Algorithm

### 8.1 Text Chat Proximity

```
For each local player:
  For each remote player:
    1. Calculate Euclidean distance: d = sqrt((x2-x1)² + (y2-y1)²)
    2. If d > 150px: not in range → skip
    3. Cast ray between players (Bresenham through tile grid)
    4. If ray intersects WALL, WALL_BOOKSHELF, or PILLAR:
       LOS blocked → not visible
    5. If ray clear AND d <= 150px:
       Show chat bubble for this player
```

### 8.2 Voice Chat Proximity

```
For each local player:
  For each remote player:
    1. Calculate Euclidean distance: d
    2. effectiveRange = roomVoiceEnabled ? 600px : 200px
    3. If d > effectiveRange: not in range → disconnect if connected
    4. If d <= effectiveRange:
       Cast ray for LOS check
       If LOS clear: eligible for voice connection
       If LOS blocked: eligible but volume reduced to 20%
```

### 8.3 Room-Based Modifiers

| Room | Chat Range | Voice Range | Voice Enabled | Notes |
|------|-----------|-------------|---------------|-------|
| entrance | 150px | 200px | No | Default ranges |
| main-reading | 150px | 200px | No | Quiet zone, no voice |
| quiet-zone | 150px | 150px | No | Reduced chat range for focus |
| group-study | 200px | 300px | Yes | Extended ranges |
| discussion-room | 200px | 600px | Yes | Full voice room |
| booth-1 through booth-4 | 100px | 150px | No | Private, reduced ranges |

### 8.4 LOS Blocking Tiles

```
BLOCKS_VOICE: ['wall', 'wall_bookshelf', 'pillar', 'bookshelf']
REDUCES_VOICE: ['desk', 'counter']  // volume × 0.5
NO_BLOCK: ['floor', 'floor_dark', 'floor_wood', 'window', 'door', 'carpet', 'plant', 'lamp', 'chair']
```

---

## 9. Voice Chat Flow

### 9.1 Complete Flow Diagram

```
User A                                  User B
  │                                       │
  │── ProximitySystem detects B within 200px ──►│
  │                                       │
  │── VoiceSystem.onNearbyChange([B]) ──►│
  │                                       │
  │── Create RTCPeerConnection ──►│
  │   │                                   │
  │   │── addTrack(localStream) ──►│
  │   │                                   │
  │   │── createOffer() ──►│
  │   │   setLocalDescription(offer)     │
  │   │                                   │
  │   │── NetworkSync.sendVoiceOffer(B, offer) ──►│
  │   │        └─► Supabase Broadcast     │
  │   │                                   │
  │   │◄── NetworkSync receives VOICE_OFFER from A ──│
  │   │                                   │
  │◄── VoiceSystem.handleOffer(B, offer) ──│
  │   │                                   │
  │   │── setRemoteDescription(offer)    │
  │   │── createAnswer()                 │
  │   │── setLocalDescription(answer)    │
  │   │                                   │
  │   │── NetworkSync.sendVoiceAnswer(A, answer) ──►│
  │   │        └─► Supabase Broadcast     │
  │   │                                   │
  │── VoiceSystem.handleAnswer(answer) ──│
  │   │── setRemoteDescription(answer)   │
  │   │                                   │
  │   │◄── Both sides exchange ICE candidates ──│
  │   │   (via VOICE_ICE messages)        │
  │   │                                   │
  │   │◄── RTCPeerConnection 'connected' ──│
  │   │                                   │
  │   │── Audio plays via HTMLAudioElement ──►│
  │◄── B hears A's voice ──│
  │                                       │
  │◄── A hears B's voice ──│
  │                                       │
  │──── Both players move out of range ────│
  │                                       │
  │── ProximitySystem: B no longer nearby ──►│
  │                                       │
  │── VoiceSystem.onNearbyChange([]) ──►│
  │   │                                   │
  │   │── Close peer connection after 3s grace ──►│
  │   │                                   │
  │   │── RTCPeerConnection 'closed' ──│
  │   │                                   │
  │   │◄── VOICE_HANGUP broadcast ──│
```

### 9.2 Permission Flow

```
User enables mic for first time:
  1. VoiceSystem.requestMicPermission()
  2. navigator.mediaDevices.getUserMedia({ audio: { echoCancellation, noiseSuppression } })
  3. Store permission result in localStorage ('padhaishuru:library:micPermission')
  4. On subsequent loads: check localStorage first, skip prompt if already granted
  5. User can toggle mic on/off without re-prompting
```

### 9.3 Grace Period for Disconnections

```
Player leaves proximity:
  t=0:   Mark peer as "leaving" (3s grace)
  t=0-3s: Keep connection alive, show "player walking away..." indicator
  t=3s:  Close RTCPeerConnection, remove audio element
  t=3s+: Player fully removed from voice peers
```

### 9.4 Audio Attenuation

```
Volume = masterVolume × distanceAttenuation × losModifier

distanceAttenuation:
  if d < minDistance: 1.0
  if d > maxDistance: 0.0
  else: (maxDistance - d) / (maxDistance - d)
  
losModifier:
  if hasLOS: 1.0
  if LOS blocked: 0.2
```

---

## 10. Migration Plan

### Phase 1: Foundation (Week 1-2)

**Goal:** Set up the game engine directory and core rendering.

| Step | Task | Files Created | Files Modified |
|------|------|--------------|----------------|
| 1.1 | Create `game/` directory structure | All new `game/` directories | None |
| 1.2 | Implement `utils/geometry.ts` + `utils/throttle.ts` | `utils/geometry.ts`, `utils/throttle.ts` | None |
| 1.3 | Implement `world/Tile.ts` | `world/Tile.ts` | None |
| 1.4 | Implement `world/Room.ts` | `world/Room.ts` | None |
| 1.5 | Implement `world/WorldMap.ts` | `world/WorldMap.ts` | Reuse logic from existing `map.ts` |
| 1.6 | Implement `entities/Player.ts` | `entities/Player.ts` | None |
| 1.7 | Implement `renderer/SpriteSheet.ts` | `renderer/SpriteSheet.ts` | None |
| 1.8 | Implement `renderer/Camera.ts` | `renderer/Camera.ts` | None |
| 1.9 | Implement `renderer/CanvasRenderer.ts` | `renderer/CanvasRenderer.ts` | Extend existing `WorldRenderer.tsx` |
| 1.10 | Implement `engine/GameLoop.ts` | `engine/GameLoop.ts` | None |
| 1.11 | Implement `engine/EntityManager.ts` | `engine/EntityManager.ts` | None |
| 1.12 | Implement `engine/GameEngine.ts` | `engine/GameEngine.ts` | None |

### Phase 2: Systems (Week 3-4)

**Goal:** Implement movement, collision, proximity, chat.

| Step | Task | Files Created | Files Modified |
|------|------|--------------|----------------|
| 2.1 | Implement `systems/MovementSystem.ts` | `systems/MovementSystem.ts` | Reuse existing `CollisionSystem` from `collision.ts` |
| 2.2 | Implement `systems/ProximitySystem.ts` | `systems/ProximitySystem.ts` | Extend proximity logic from existing `proximity-voice.ts` |
| 2.3 | Implement `systems/ChatSystem.ts` | `systems/ChatSystem.ts` | Reuse `chat_messages` table pattern |
| 2.4 | Implement `ui/ChatBubble.ts` | `ui/ChatBubble.ts` | None |
| 2.5 | Implement `ui/PlayerNameTag.ts` | `ui/PlayerNameTag.ts` | None |
| 2.6 | Implement `ui/GameHUD.ts` | `ui/GameHUD.ts` | None |

### Phase 3: Networking (Week 5)

**Goal:** Wire up multiplayer sync.

| Step | Task | Files Created | Files Modified |
|------|------|--------------|----------------|
| 3.1 | Implement `networking/PositionBroadcaster.ts` | `networking/PositionBroadcaster.ts` | Extend existing `multiplayer.ts` |
| 3.2 | Implement `networking/PresenceManager.ts` | `networking/PresenceManager.ts` | Extend existing `real-realtime.ts` |
| 3.3 | Implement `networking/NetworkSync.ts` | `networking/NetworkSync.ts` | Wraps broadcaster + presence + signaling |
| 3.4 | Add game view as new mode in StudyRoom | None | `StudyRoom.tsx` — add game canvas alongside existing UI |
| 3.5 | Wire up join/leave flow | None | `VirtualLibraryWorld.tsx` → migrate to `GameEngine` |

### Phase 4: Voice (Week 6)

**Goal:** Proximity voice chat.

| Step | Task | Files Created | Files Modified |
|------|------|--------------|----------------|
| 4.1 | Implement `systems/VoiceSystem.ts` | `systems/VoiceSystem.ts` | Extend existing `proximity-voice.ts` |
| 4.2 | Implement `audio/ProximityAudio.ts` | `audio/ProximityAudio.ts` | None |
| 4.3 | Add WebRTC signaling via broadcast channel | None | `NetworkSync.ts` |
| 4.4 | Add mic permission flow + settings toggle | None | `GameHUD.ts` |
| 4.5 | Add voice indicator UI | `ui/VoiceIndicator.ts` | None |

### Phase 5: Polish (Week 7-8)

**Goal:** Study timer, interaction, ambient audio, testing.

| Step | Task | Files Created | Files Modified |
|------|------|--------------|----------------|
| 5.1 | Implement `systems/InteractionSystem.ts` | `systems/InteractionSystem.ts` | Integrate with existing study session hooks |
| 5.2 | Implement `audio/AmbientAudio.ts` | `audio/AmbientAudio.ts` | Extend existing `ambient-music.ts` |
| 5.3 | Wire up study timer in HUD | None | `GameHUD.ts`, `StudyRoom.tsx` |
| 5.4 | Add mobile touch controls | None | Extend existing `MobileControls.tsx` |
| 5.5 | Implement `entities/Interactable.ts` | `entities/Interactable.ts` | None |
| 5.6 | Implement `entities/NPC.ts` (Phase 2) | `entities/NPC.ts` | None |
| 5.7 | Integration testing + Playwright | `game/__tests__/` | None |
| 5.8 | Performance profiling + optimization | None | `CanvasRenderer.ts`, `GameLoop.ts` |

---

## 11. File Manifest

### 11.1 New Files to Create

```
src/modules/virtual-library/game/
├── engine/
│   ├── GameEngine.ts
│   ├── GameLoop.ts
│   └── EntityManager.ts
├── renderer/
│   ├── CanvasRenderer.ts
│   ├── SpriteSheet.ts
│   └── Camera.ts
├── world/
│   ├── WorldMap.ts
│   ├── Room.ts
│   └── Tile.ts
├── entities/
│   ├── Player.ts
│   ├── NPC.ts
│   └── Interactable.ts
├── systems/
│   ├── MovementSystem.ts
│   ├── ProximitySystem.ts
│   ├── ChatSystem.ts
│   ├── VoiceSystem.ts
│   └── InteractionSystem.ts
├── networking/
│   ├── NetworkSync.ts
│   ├── PresenceManager.ts
│   └── PositionBroadcaster.ts
├── ui/
│   ├── GameHUD.tsx
│   ├── ChatBubble.tsx
│   ├── PlayerNameTag.tsx
│   └── VoiceIndicator.tsx
├── audio/
│   ├── AmbientAudio.ts
│   └── ProximityAudio.ts
├── utils/
│   ├── geometry.ts
│   └── throttle.ts
└── types.ts  (extended from existing)
```

**Total new files:** 27

### 11.2 Existing Files to Modify

| File | Change |
|------|--------|
| `src/modules/virtual-library/index.ts` | Export new game module |
| `src/modules/virtual-library/world/multiplayer.ts` | Extend with voice signaling |
| `src/modules/virtual-library/world/VirtualLibraryWorld.tsx` | Migrate to GameEngine |
| `src/modules/virtual-library/world/WorldRenderer.tsx` | Integrate with CanvasRenderer |
| `src/modules/virtual-library/world/map.ts` | Logic moves to `game/world/WorldMap.ts` |
| `src/modules/virtual-library/world/collision.ts` | Reuse as-is (CollisionSystem) |
| `src/modules/virtual-library/world/ambient-music.ts` | Move to `game/audio/AmbientAudio.ts` |
| `src/modules/virtual-library/world/proximity-voice.ts` | Move to `game/systems/VoiceSystem.ts` |
| `src/modules/virtual-library/types/index.ts` | Add game-specific types |
| `src/modules/virtual-library/config/feature-flags.ts` | Add `multiplayerGameEnabled` flag |
| `src/modules/virtual-library/hooks/use-virtual-library.ts` | Add game context |
| `src/app/library/layout.tsx` | Conditionally render game route |
| `src/app/(game)/library-world/game/page.tsx` | Update to use new GameEngine |
| `src/modules/chat/services/realtime.ts` | Add room-based message filtering |

### 11.3 Files to Keep Unchanged

| File | Reason |
|------|--------|
| `src/modules/virtual-library/world/types.ts` | Types still used by legacy code |
| `src/modules/virtual-library/world/colors.ts` | Color constants still valid |
| `src/modules/virtual-library/services/room-service.ts` | Room service unchanged |
| `src/modules/virtual-library/hooks/use-study-session.ts` | Study session hook unchanged |
| `src/modules/virtual-library/providers/real-realtime.ts` | Presence provider unchanged |

---

## 12. Testing Strategy

### 12.1 Unit Tests

**Location:** `src/modules/virtual-library/game/__tests__/`

```typescript
// utils/geometry.test.ts
describe('geometry', () => {
  test('distance calculation', () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
  });
  test('circle-circle collision', () => {
    expect(circleCollidesCircle(0, 0, 10, 15, 0, 10)).toBe(true);
    expect(circleCollidesCircle(0, 0, 10, 100, 0, 10)).toBe(false);
  });
  test('raycast tiles', () => {
    const tiles = raycastTiles(0, 0, 100, 100, 40);
    expect(tiles.length).toBeGreaterThan(0);
  });
});

// utils/throttle.test.ts
describe('throttle', () => {
  test('limits call frequency', async () => {
    let calls = 0;
    const fn = throttle(() => { calls++; }, 100);
    fn(); fn(); fn();
    expect(calls).toBe(1);
    await sleep(150);
    fn();
    expect(calls).toBe(2);
  });
});

// systems/ProximitySystem.test.ts
describe('ProximitySystem', () => {
  test('detects nearby players within range', () => {
    // Player at (100, 100), other at (200, 100) = 100px
    // With chatRange=150, should be detected
  });
  test('blocks LOS through walls', () => {
    // Player at (100, 100), other at (300, 100)
    // Wall at (200, 100) blocks LOS
  });
});

// entities/Player.test.ts
describe('Player', () => {
  test('updates position with collision', () => {
    // Player walks into wall → position clamped
  });
  test('interpolates remote player position', () => {
    // Remote player at (100, 100) with target (200, 200)
    // After interpolation t=0.5 → should be at (150, 150)
  });
});

// systems/ChatSystem.test.ts
describe('ChatSystem', () => {
  test('sends message and creates bubble', () => {
    // Send "hello" → ChatBubbleData with text "hello"
  });
  test('filters messages by proximity', () => {
    // Messages from far-away players not shown
  });
});

// networking/PositionBroadcaster.test.ts
describe('PositionBroadcaster', () => {
  test('throttles broadcasts to 100ms', async () => {
    // Rapid position changes → only 10 broadcasts per second
  });
  test('skips broadcast for < 5px movement', () => {
    // Small jitter doesn't trigger broadcast
  });
});
```

### 12.2 Integration Tests

```typescript
// engine/GameEngine.test.ts
describe('GameEngine', () => {
  test('initializes with local player at spawn', () => {
    // Engine created → local player at entrance spawn point
  });
  
  test('player movement updates entity position', () => {
    // Press 'D' for 1 second → player moves right
  });
  
  test('player enters room triggers presence update', () => {
    // Walk into main-reading → roomId changes in state
  });
  
  test('nearby players detected and shown in HUD', () => {
    // Two players within 150px → both appear in nearby list
  });
  
  test('study timer starts on interaction', () => {
    // Press 'S' at desk → studyTimer state populated
  });
});

// systems/MovementSystem.test.ts
describe('MovementSystem', () => {
  test('collision prevents walking through walls', () => {
    // Player walks toward wall → position clamped before wall
  });
  
  test('diagonal movement normalized', () => {
    // Press W+D → effective speed = speed * 0.707
  });
  
  test('detects room entry on crossing boundary', () => {
    // Walk through doorway → roomId changes
  });
});
```

### 12.3 E2E Tests (Playwright)

```typescript
// e2e/virtual-library-game.spec.ts
describe('Virtual Library Multiplayer Game', () => {
  test('player can move with WASD', async ({ page }) => {
    await page.goto('/library/world');
    await page.waitForSelector('canvas');
    
    // Press D key
    await page.keyboard.press('KeyD');
    await page.waitForTimeout(500);
    
    // Player should have moved right
    const playerX = await page.evaluate(() => {
      return (window as any).gameEngine.getState().localPlayer.x;
    });
    expect(playerX).toBeGreaterThan(0);
  });
  
  test('player sees nearby players', async ({ page }) => {
    // This requires a second browser context or mock
    // Verify HUD shows nearby player list
  });
  
  test('player can send proximity chat', async ({ page }) => {
    await page.goto('/library/world');
    await page.waitForSelector('canvas');
    
    // Type in chat input
    await page.fill('[data-testid="chat-input"]', 'Hello everyone!');
    await page.press('[data-testid="chat-input"]', 'Enter');
    
    // Chat bubble should appear above player
    await expect(page.locator('[data-testid="chat-bubble"]')).toBeVisible();
  });
  
  test('study timer can be started and stopped', async ({ page }) => {
    await page.goto('/library/world');
    await page.waitForSelector('canvas');
    
    // Walk to a desk and press S
    await page.keyboard.press('KeyS');
    
    // Timer should appear in HUD
    await expect(page.locator('[data-testid="study-timer"]')).toBeVisible();
    
    // Press ESC to stop
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="study-timer"]')).not.toBeVisible();
  });
  
  test('voice chat permission flow', async ({ page }) => {
    await page.goto('/library/world');
    
    // Click mic button
    await page.click('[data-testid="mic-toggle"]');
    
    // Should trigger permission prompt (mocked in test)
    // Verify mic state in HUD
  });
  
  test('mobile touch controls work', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto('/library/world');
    
    // Touch and drag on canvas
    const canvas = await page.locator('canvas');
    await canvas.dragTo(canvas, { sourcePosition: { x: 100, y: 100 }, targetPosition: { x: 200, y: 100 } });
    
    // Player should have moved
  });
});
```

### 12.4 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| FPS | 60fps steady | requestAnimationFrame timing |
| Frame time | < 16ms | PerformanceObserver |
| Position broadcast | 10/sec | NetworkSync throttle |
| Remote player interpolation | Smooth at 60fps | CanvasRenderer lerp |
| Memory | < 50MB additional | Chrome DevTools heap snapshot |
| First paint | < 2s | Lighthouse |
| Bundle size increase | < 50KB gzipped | Bundle analyzer |

### 12.5 Manual QA Checklist

- [ ] Player spawns at correct position in entrance
- [ ] WASD movement works smoothly
- [ ] Arrow keys also work
- [ ] Touch controls work on mobile
- [ ] Collision prevents walking through walls/desks
- [ ] Player enters rooms correctly (room name updates)
- [ ] Remote players appear with correct colors
- [ ] Remote players interpolate smoothly (no jitter)
- [ ] Chat bubbles appear above nearby players
- [ ] Chat messages persist in database
- [ ] Chat only visible to nearby players
- [ ] Mic permission flow works
- [ ] Voice connects between nearby players
- [ ] Voice disconnects when players move apart
- [ ] Study timer starts/stops correctly
- [ ] Study sessions persist to database
- [ ] Ambient audio plays and fades
- [ ] Fullscreen toggle works
- [ ] Connection state overlay shows on disconnect
- [ ] Player leaves room on tab close (cleanup)
- [ ] Feature flags toggle features correctly

---

## Appendix A: Reuse of Existing Code

### What to Keep As-Is

| Existing File | Why Keep |
|--------------|---------|
| `world/multiplayer.ts` | Position broadcast + emoji reactions already work |
| `world/collision.ts` | CollisionSystem is solid, reuse directly |
| `world/map.ts` | Tile map generation, move logic to WorldMap.ts |
| `world/ambient-music.ts` | Move to `game/audio/AmbientAudio.ts` |
| `world/proximity-voice.ts` | Move to `game/systems/VoiceSystem.ts` |
| `world/WorldRenderer.tsx` | Canvas rendering patterns, integrate into CanvasRenderer |
| `world/VirtualLibraryWorld.tsx` | React wrapper pattern, migrate to use GameEngine |
| `providers/real-realtime.ts` | Presence subscription pattern, extend |
| `types/index.ts` | Participant, StudyRoom, StudySession types still valid |
| `hooks/use-study-session.ts` | Study session logic, hook into from game |

### What to Replace

| Existing Pattern | Replacement |
|-----------------|-------------|
| VirtualLibraryWorld direct game loop | GameEngine with formal state machine |
| Inline state in VirtualLibraryWorld | EntityManager + separate systems |
| Direct canvas drawing in WorldRenderer | CanvasRenderer with render pipeline |
| Ad-hoc proximity checks | ProximitySystem with LOS raycasting |
| Mixed React + imperative canvas | Clear separation: React HUD + Canvas game |

---

## Appendix B: Database Considerations

### New RPC for Rate-Limited Broadcast

```sql
-- Throttle broadcast inserts per user
CREATE OR REPLACE FUNCTION check_broadcast_limit(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Allow max 100 position broadcasts per minute per user
  RETURN (
    SELECT count(*) < 100
    FROM broadcast_log
    WHERE user_id = $1
    AND created_at > now() - interval '1 minute'
  );
END;
$$ LANGUAGE plpgsql;
```

### chat_messages Schema (existing, verify)

```sql
-- Already exists per audit. Verify:
-- - room_id (matches RoomId enum)
-- - user_id (references auth.users)
-- - content (text)
-- - content_type ('text' | 'system')
-- - created_at (timestamptz)
-- Index on (room_id, created_at) for recent message queries
```

### study_sessions Schema (existing, verify)

```sql
-- Already exists per audit. Verify:
-- - user_id
-- - room_id
-- - branch_id
-- - topic
-- - started_at / ended_at
-- - duration_seconds
-- - validation_status
```

---

## Appendix C: Environment Variables

```env
# Existing (no changes needed)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# New (optional, for voice TURN server in future)
NEXT_PUBLIC_TURN_SERVER_URL=
NEXT_PUBLIC_TURN_USERNAME=
NEXT_PUBLIC_TURN_PASSWORD=
```

No new environment variables required for MVP. STUN servers (Google's public STUN) are sufficient. TURN servers needed only for restricted network environments.

---

*End of VLIB.md*
