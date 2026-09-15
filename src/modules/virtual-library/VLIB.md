# Virtual Library — Among Us Multiplayer Architecture

**Document:** Architecture, data contracts, state machines, and migration plan for the multiplayer Virtual Library module.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        REACT APPLICATION LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Library    │  │  ChatPanel   │  │ StudyTimer   │                  │
│  │   Canvas     │  │  Component   │  │  Component   │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                 │                           │
│         └─────────────────┼─────────────────┘                           │
│                           │                                             │
│                    React Context + useReducer                            │
│                           │                                             │
│              ┌────────────▼────────────┐                                 │
│              │   GameProvider.tsx      │                                 │
│              │  (state bridge)         │                                 │
│              └────────────┬────────────┘                                 │
└───────────────────────────┼─────────────────────────────────────────────┘
                            │
                            │ initialize / start / stop
                            │ update(delta) / render(ctx)
                            │ dispatch(action)
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         GAME ENGINE LAYER                                │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │                      GameEngine                              │       │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────────────────┐   │       │
│  │  │  World     │  │  Entity    │  │   SystemRunner        │   │       │
│  │  │  (rooms,   │  │  Manager   │  │  (fixed-timestep)     │   │       │
│  │  │  map)      │  │            │  │                       │   │       │
│  │  └─────┬──────┘  └─────┬──────┘  └──────────┬────────────┘   │       │
│  │        │               │                     │                  │       │
│  │  ┌─────▼──────┐  ┌─────▼──────┐  ┌──────────▼────────────┐   │       │
│  │  │ Movement   │  │ Proximity  │  │   ChatSystem          │   │       │
│  │  │ System     │  │ System     │  │                       │   │       │
│  │  └────────────┘  └────────────┘  └───────────────────────┘   │       │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────────────────┐   │       │
│  │  │ Study      │  │  Voice     │  │   NetworkingSystem    │   │       │
│  │  │ System     │  │ System     │  │                       │   │       │
│  │  └────────────┘  └────────────┘  └───────────────────────┘   │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                            │                                             │
│              ┌─────────────▼─────────────┐                               │
│              │    CanvasRenderer         │                               │
│              │  (raster, no DOM nodes)   │                               │
│              └─────────────┬─────────────┘                               │
└────────────────────────────┼─────────────────────────────────────────────┘
                             │
                    drawImage / fillRect / arc
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      HTML5 CANVAS 2D (browser)                          │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             │ Supabase Realtime broadcast
                             │ WebRTC (peer-to-peer)
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         NETWORKING LAYER                                │
│  ┌────────────────────────┐    ┌────────────────────────┐              │
│  │   Supabase Realtime    │    │   WebRTC (voice)       │              │
│  │  - Presence (online)   │    │   - Offer/Answer       │              │
│  │  - Broadcast (pos,     │    │   - ICE candidates     │              │
│  │    chat, study state)  │    │   - Audio tracks       │              │
│  │  - Postgres Changes    │    │   - Distance filter    │              │
│  └────────────┬───────────┘    └────────────────────────┘              │
│               │                                                          │
└───────────────┼──────────────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE BACKEND                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │  multiplayer_  │  │  player_pres-  │  │  study_sessions│            │
│  │  rooms         │  │  ence          │  │               │            │
│  │  - id          │  │  - room_id     │  │  - id         │            │
│  │  - slug        │  │  - user_id     │  │  - room_id    │            │
│  │  - name        │  │  - x, y       │  │  - user_id    │            │
│  │  - capacity    │  │  - direction  │  │  - start_time │            │
│  │  - is_active   │  │  - last_seen  │  │  - end_time   │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

### Core rendering

- HTML5 Canvas 2D API
- Custom minimal engine (`GameEngine`, `CanvasRenderer`)
- No PixiJS, no Phaser, no third-party game framework

### State management

- React Context + `useReducer`
- No Redux, no Zustand, no external state library

### Multiplayer networking

- Supabase Realtime (broadcast channel + presence)
- Direct WebRTC peer connections for voice
- No Socket.io, no custom WebSocket server

### Authentication

- Supabase Auth (reuses existing `useAuth` hook)
- Same user identity across app and game

### What we do NOT use

| Technology | Reason                                  |
| ---------- | ---------------------------------------- |
| PixiJS     | Canvas 2D is sufficient; adds 200KB+    |
| LiveKit    | We need peer-to-peer, not SFU           |
| Socket.io  | Supabase Realtime covers this           |
| Matter.js  | Simple grid movement, no physics needed |
| React Three Fiber | Game is 2D Canvas, not 3D DOM |

---

## 3. Game World Module Structure

All new code lives under `src/modules/virtual-library/game/`.

```
src/modules/virtual-library/game/
├── engine/
│   ├── GameEngine.ts          # Main loop, fixed-timestep, system orchestration
│   └── SystemRunner.ts        # Fixed-timestep accumulator, system ordering
├── renderer/
│   ├── CanvasRenderer.ts      # Canvas 2D rendering pipeline
│   └── SpriteCache.ts         # Pre-rendered sprite frames, image atlas
├── world/
│   ├── World.ts               # Room registry, tile map, spawn points
│   └── Room.ts                # Room definition, tile types, bounds
├── entities/
│   ├── EntityManager.ts       # Sparse set, entity creation/query/destruction
│   └── components.ts          # Component interfaces (Position, Velocity, etc.)
├── systems/
│   ├── MovementSystem.ts      # Grid movement, path following, interpolation
│   ├── ProximitySystem.ts     # Distance checks, LOS raycasting
│   ├── StudySessionSystem.ts  # Timer, focus tracking, XP accrual
│   ├── InteractionSystem.ts   # Bookshelf, whiteboard, desk interactions
│   └── CleanupSystem.ts       # Remove disconnected players after timeout
├── networking/
│   ├── MultiplayerClient.ts   # Supabase Realtime channel wrapper
│   ├── VoiceClient.ts         # WebRTC peer connection manager
│   └── NetworkThrottle.ts     # 50ms minimum between position broadcasts
├── ui/
│   ├── ChatSystem.ts          # Chat message state, send/receive
│   ├── StudyOverlay.ts        # Timer display, session controls
│   └── PlayerNametags.ts      # Name rendering above sprites
├── audio/
│   ├── AudioManager.ts        # Master volume, mute state, spatial mixer
│   └── SpatialAudio.ts        # Distance-based volume falloff
└── utils/
    ├── geometry.ts            # Point-in-rect, circle-rect, distance, LOS
    ├── throttle.ts            # Timestamp-gated function wrapper
    └── constants.ts           # Tile size, room ranges, broadcast rate
```

### TypeScript interface contracts

```typescript
// engine/GameEngine.ts
export interface GameEngineOptions {
  canvas: HTMLCanvasElement;
  world: World;
  localPlayerId: string;
  multiplayerClient: MultiplayerClient;
  voiceClient: VoiceClient;
}

export class GameEngine {
  constructor(options: GameEngineOptions);
  start(): void;
  stop(): void;
  update(delta: number): void;
  getState(): GameState;
  subscribe(listener: GameStateListener): Unsubscribe;
}

// entities/EntityManager.ts
export class EntityManager {
  createEntity(): number;
  addComponent<T>(entity: number, component: Component<T>): void;
  removeComponent<T>(entity: number, type: ComponentType): void;
  getComponent<T>(entity: number, type: ComponentType): T | undefined;
  getEntitiesWith(...types: ComponentType[]): number[];
  destroyEntity(entity: number): void;
  reset(): void;
}

// systems/MovementSystem.ts
export interface MovementSystem {
  update(entities: EntityQuery, delta: number): void;
}

// networking/MultiplayerClient.ts
export interface MultiplayerClient {
  connect(roomSlug: string): Promise<void>;
  disconnect(): void;
  sendPosition(x: number, y: number, direction: Direction): void;
  sendChat(message: string): void;
  sendStudyAction(action: StudyAction): void;
  onRemotePlayerUpdate(callback: RemotePlayerCallback): Unsubscribe;
  onRemoteChat(callback: ChatCallback): Unsubscribe;
  onPlayerJoined(callback: PlayerCallback): Unsubscribe;
  onPlayerLeft(callback: PlayerCallback): Unsubscribe;
}

// networking/VoiceClient.ts
export interface VoiceClient {
  requestMicPermission(): Promise<boolean>;
  start(): Promise<void>;
  stop(): void;
  mute(): void;
  unmute(): void;
  setVolume(distance: number, losBlocked: boolean): number;
  onRemoteStream(callback: StreamCallback): Unsubscribe;
}
```

---

## 4. Data Flow

### 4.1 Local player movement

```
KeyDown(W/A/S/D)
       │
       ▼
InputManager ──► setVelocity(dx, dy)
       │
       ▼
MovementSystem.update(delta)
  - Apply velocity to Position component
  - Clamp to room bounds
  - Snap to tile grid for diagonal movement
       │
       ▼
EntityManager (Position updated)
       │
       ▼
CanvasRenderer.draw()
  - Lerp render position toward entity Position
  - Draw sprite, nametag
```

### 4.2 Networked position broadcast

```
EntityManager Position updated
       │
       ▼
NetworkThrottle.sendPosition()
  - Throttle: max every 50ms
  - Only if moved > 2px from last sent position
       │
       ▼
MultiplayerClient.sendPosition(x, y, direction)
       │
       ▼
Supabase channel.send({ type: 'position', x, y, direction })
       │
       ▼
Remote clients receive broadcast
       │
       ▼
InterpolationSystem.update(delta)
  - Lerp remote Position toward received position
  - Smooth visual movement
```

### 4.3 Proximity chat (text)

```
Player sends chat message
       │
       ▼
ChatSystem.send(text)
       │
       ▼
MultiplayerClient.sendChat(text)
       │
       ▼
Supabase broadcast 'chat' event
       │
       ▼
All clients receive message
       │
       ▼
ProximitySystem.filterByProximity(message, senderEntity)
  - For each local player:
    - Euclidean distance check (room radius)
    - LOS raycast (Bresenham through tile map)
    - If in range AND LOS clear → show in chat panel
    - Otherwise → show "[distant voice]" placeholder
```

### 4.4 Proximity voice (WebRTC)

```
Local player presses mic / always-on
       │
       ▼
VoiceClient.getUserMedia({ audio: true })
       │
       ▼
Create RTCPeerConnection per nearby player
       │
       ▼
Local description (offer) → Supabase broadcast 'voice-offer'
       │
       ▼
Remote player receives offer → setRemoteDescription → createAnswer
       │
       ▼
Answer → Supabase broadcast 'voice-answer'
       │
       ▼
ICE candidates exchanged via Supabase broadcast
       │
       ▼
Audio track received → SpatialAudio.applyGain(distance, losBlocked)
       │
       ▼
GainNode connected to AudioContext destination
```

### 4.5 Room entry flow

```
User clicks "Enter Library" in VirtualLibraryPage
       │
       ▼
React component calls GameProvider.enterRoom(roomSlug)
       │
       ▼
GameProvider:
  1. Fetch room from Supabase multiplayer_rooms
  2. Check capacity (SELECT count FROM player_presence WHERE room_id = ?)
  3. If full → show error
  4. If available:
     a. Load World for roomSlug
     b. Initialize EntityManager
     c. Connect MultiplayerClient to room channel
     d. Request mic permission (VoiceClient)
     e. Start GameEngine loop
     f. Add local player entity
     g. Broadcast presence join
       │
       ▼
Remote players receive 'player-joined' event
       │
       ▼
Each remote client creates entity for new player
       │
       ▼
CanvasRenderer draws new player sprite at spawn point
```

### 4.6 Study session flow

```
Player clicks "Start Study Session" on desk entity
       │
       ▼
InteractionSystem.handleInteraction('start-study', playerEntity, deskEntity)
       │
       ▼
StudySessionSystem.createSession(playerEntity)
  - Set state to 'running'
  - Start countdown timer (configurable: 25min default)
       │
       ▼
MultiplayerClient.sendStudyAction({ type: 'session-start', deskId })
       │
       ▼
Supabase:
  1. Insert into study_sessions table
  2. Broadcast 'study-started' to room
       │
       ▼
Other clients receive broadcast
       │
       ▼
StudyOverlay component shows active session for this player
       │
       ▼
Timer completes:
  - StudySessionSystem.completeSession()
  - Broadcast 'session-complete'
  - Insert end_time into study_sessions
  - Grant XP/achievement (reuse existing gamification logic)
```

---

## 5. API Contracts

### GameEngine

| Method | Input | Output | Error |
|--------|-------|--------|-------|
| `constructor` | `GameEngineOptions` | `GameEngine` | Throws if canvas missing |
| `start()` | none | void | No-op if already running |
| `stop()` | none | void | Removes all entities |
| `update(delta)` | `number` (ms) | void | Throws if not started |
| `getState()` | none | `GameState` | Always returns state |
| `subscribe(listener)` | `GameStateListener` | `Unsubscribe` | None |

### EntityManager

| Method | Input | Output | Error |
|--------|-------|--------|-------|
| `createEntity()` | none | `number` (entity id) | Never fails |
| `addComponent(entity, component)` | `number`, `Component` | void | Throws if entity invalid |
| `removeComponent(entity, type)` | `number`, `ComponentType` | void | No-op if missing |
| `getComponent(entity, type)` | `number`, `ComponentType` | `T \| undefined` | Never throws |
| `getEntitiesWith(...types)` | `ComponentType[]` | `number[]` | Never throws |
| `destroyEntity(entity)` | `number` | void | No-op if already destroyed |
| `reset()` | none | void | Clears all entities |

### MovementSystem

```
Input:  EntityQuery with Position + Velocity components
        delta: number (ms since last frame)
Output: Updated Position components
Errors: None (clamps to world bounds silently)
Side effects: None (pure data transform)
```

### ProximitySystem

```
Input:  All player entities with Position
Output: ProximityPairs[] for this frame
Errors: None
Side effects: None (read-only)
```

### ChatSystem

```
Input:  { sender: Entity, text: string, timestamp: number }
Output: ChatMessage[] filtered by proximity
Errors: Throws if text > 500 chars
Side effects: Emits 'chat' network event
```

### VoiceSystem

```
Input:  Local media stream, list of nearby player IDs
Output: AudioBufferSourceNode[] connected to destination
Errors: Returns error callback if getUserMedia denied
Side effects: Creates RTCPeerConnection per nearby player
```

### CanvasRenderer

```
Input:  World, EntityManager, Camera (optional), Canvas context
Output: Rasterized frame on canvas
Errors: No-op if canvas not available
Performance target: < 12ms per frame at 1920x1080
```

---

## 6. State Machines

### 6.1 Player state machine

```
              ┌──────────────────────────────────┐
              │              IDLE                │
              └──────────────┬───────────────────┘
                             │ key pressed
                             ▼
                      ┌──────────────┐
                 ┌────│   WALKING    │────┐
                 │    └──────┬──────┘    │
                 │           │           │
                 │    key released      run key held
                 │           │           │
                 │           ▼           │
                 │    ┌──────────────┐    │
                 └───►│   RUNNING    │◄───┘
                      └──────┬──────┘
                             │ interact key
                             ▼
                      ┌──────────────┐
                      │ INTERACTING  │
                      └──────┬──────┘
                             │ interaction complete
                             ▼
                      ┌──────────────┐
                      │   STUDYING   │
                      └──────┬──────┘
                             │ timer complete / stop
                             ▼
                      ┌──────────────┐
                      │    IDLE      │
                      └──────────────┘
                             │ chat key
                             ▼
                      ┌──────────────┐
                      │   CHATTING   │
                      └──────┬──────┘
                             │ chat close
                             ▼
                      ┌──────────────┐
                      │    IDLE      │
                      └──────────────┘
```

### 6.2 Room state machine

```
              ┌──────────────┐
              │    OPEN      │◄─────────────────┐
              └──────┬──────┘                   │
                     │ player joins             │ player leaves
                     ▼                          │
              ┌──────────────┐                  │
              │    FULL      │──────────────────┘
              └──────┬──────┘
                     │ host leaves / closes
                     ▼
              ┌──────────────┐
              │   CLOSED     │
              └──────────────┘
```

### 6.3 Study session state machine

```
              ┌──────────────┐
              │    IDLE      │
              └──────┬──────┘
                     │ player starts session
                     ▼
              ┌──────────────┐
              │   RUNNING    │◄─────────────┐
              └──────┬──────┘               │
                     │ pause              unpause
                     ▼                     │
              ┌──────────────┐             │
              │   PAUSED     │─────────────┘
              └──────┬──────┘
                     │ timer completes / stop
                     ▼
              ┌──────────────┐
              │  COMPLETED   │
              └──────┬──────┘
                     │ record results
                     ▼
              ┌──────────────┐
              │    IDLE      │
              └──────────────┘
```

### 6.4 Voice connection state machine

```
                    ┌──────────────────┐
                    │  DISCONNECTED    │
                    └────────┬─────────┘
                             │ mic enabled
                             ▼
                      ┌──────────────┐
              ┌──────►│  CONNECTING  │◄───────┐
              │       └──────┬──────┘        │
              │              │               │
              │     offer/answer success    timeout / error
              │              │               │
              │              ▼               │
              │       ┌──────────────┐       │
              └──────►│  CONNECTED   │───────┘
                      └──────┬──────┘
                             │ network drop / 3s timeout
                             ▼
                      ┌──────────────┐
                      │   FAILED     │
                      └──────┬──────┘
                             │ retry
                             ▼
                      ┌──────────────┐
                      │ CONNECTING   │
                      └──────────────┘
```

---

## 7. Networking Protocol

### 7.1 Message types

All messages are broadcast via Supabase Realtime broadcast channel.

```typescript
// multiplayer-client.ts

type NetworkMessage =
  | { type: 'position'; x: number; y: number; direction: Direction; timestamp: number }
  | { type: 'chat'; senderId: string; text: string; timestamp: number }
  | { type: 'player-joined'; userId: string; displayName: string; spawnX: number; spawnY: number }
  | { type: 'player-left'; userId: string; timestamp: number }
  | { type: 'voice-offer'; fromUserId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'voice-answer'; fromUserId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; fromUserId: string; candidate: RTCIceCandidateInit }
  | { type: 'voice-mute'; userId: string; muted: boolean }
  | { type: 'study-start'; userId: string; deskId: string; timestamp: number }
  | { type: 'study-complete'; userId: string; durationMinutes: number; timestamp: number }
  | { type: 'study-pause'; userId: string; timestamp: number }
  | { type: 'interaction'; userId: string; targetId: string; action: string; timestamp: number };
```

### 7.2 Extension of existing MultiplayerManager

The existing `MultiplayerManager` in `src/modules/virtual-library/services/MultiplayerManager.ts` will be **extended**, not replaced.

```
Existing MultiplayerManager:
  - Room management (create, join, leave)
  - Supabase channel subscriptions
  - Presence tracking

New extension layer (MultiplayerClient):
  - Wraps existing MultiplayerManager instance
  - Adds game-specific broadcast subscriptions
  - Adds position throttling
  - Adds voice signaling passthrough
  - Reuses room connection logic unchanged
```

Changes to `MultiplayerManager.ts`:
- Add `broadcastPosition(x, y, direction)` method (throttled)
- Add `onPositionUpdate(callback)` channel subscription
- Add `onChatMessage(callback)` channel subscription
- Add `onStudyEvent(callback)` channel subscription
- Keep all existing room CRUD methods unchanged

---

## 8. Proximity Chat Algorithm

### 8.1 Distance calculation

```typescript
function getDistance(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
```

### 8.2 Per-room proximity ranges

```typescript
const PROXIMITY_RANGES: Record<RoomType, number> = {
  'reading-hall': 400,      // Large open space
  'study-room': 250,        // Medium enclosed
  'computer-lab': 300,      // Medium with desks
  'discussion-area': 200,   // Small, intimate
  'reference': 150,         // Narrow aisles
  'cafe': 350,              // Open with noise
};
```

### 8.3 Bresenham line-of-sight raycasting

```typescript
function hasLineOfSight(
  from: Position,
  to: Position,
  tileMap: TileMap
): boolean {
  const { x0, y0 } = from;
  const { x1, y1 } = to;

  let x = Math.floor(x0);
  let y = Math.floor(y0);
  const xEnd = Math.floor(x1);
  const yEnd = Math.floor(y1);

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (x !== xEnd || y !== yEnd) {
    const tile = tileMap.getTile(x, y);
    if (tile?.blocksSight) return false;

    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }

  return true;
}
```

### 8.4 Combined proximity check

```typescript
function canHear(sender: Entity, receiver: Entity, room: Room): boolean {
  const distance = getDistance(sender.position, receiver.position);
  if (distance > room.proximityRange) return false;
  return hasLineOfSight(sender.position, receiver.position, room.tileMap);
}
```

---

## 9. Voice Chat Flow

### 9.1 WebRTC connection lifecycle

```
1. Local player enables mic
   └─► VoiceClient.requestMicPermission()
       └─► navigator.mediaDevices.getUserMedia({ audio: true })
           ├── granted → store local stream
           └── denied → callback with error, disable mic UI

2. Player moves near another player
   └─► ProximitySystem detects pair within voice range
       └─► VoiceClient.connectToPeer(remoteUserId)
           ├── Create RTCPeerConnection(config)
           ├── Add local audio track
           ├── Create offer → setLocalDescription
           ├── Broadcast 'voice-offer' via Supabase
           └── Wait for 'voice-answer'

3. Remote player receives offer
   └─► VoiceClient.handleOffer(fromUserId, sdp)
       ├── Set remote description
       ├── Create answer → setLocalDescription
       ├── Broadcast 'voice-answer' via Supabase
       └── Wait for ICE candidates

4. ICE candidate exchange
   └─► Both sides broadcast 'ice-candidate' messages
       └─► Add to RTCPeerConnection

5. Connection established
   └─► ontrack event fires
       ├── Store remote MediaStream
       └── SpatialAudio.applyGain(distance, losBlocked)

6. Player moves away / 3s silence
   └─► ProximitySystem removes pair
       └─► VoiceClient.disconnectPeer(remoteUserId)
           ├── Close RTCPeerConnection
           └── Remove audio track from output

7. Reconnection
   └─► If within range again → fresh offer/answer cycle
```

### 9.2 Permission handling

```typescript
async function requestMicPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    localStream = stream;
    return true;
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      // User denied permission — show UI prompt
      showMicPermissionPrompt();
    }
    return false;
  }
}
```

### 9.3 Distance-based audio attenuation

```typescript
function calculateGain(distance: number, maxRange: number, losBlocked: boolean): number {
  const normalizedDist = Math.min(distance / maxRange, 1);

  // Inverse square falloff with minimum audible floor
  let gain = 1 - (normalizedDist * normalizedDist);
  gain = Math.max(gain, 0.05); // 5% minimum volume

  // LOS penalty: reduce volume if walls block direct sight
  if (losBlocked) gain *= 0.3;

  return gain;
}
```

### 9.4 3-second grace period for disconnections

```typescript
const VOICE_RECONNECT_GRACE_MS = 3000;
let reconnectTimers = new Map<string, number>();

function handleConnectionStateChange(peerId: string, state: RTCPeerConnectionState) {
  if (state === 'disconnected' || state === 'failed') {
    const timer = window.setTimeout(() => {
      // Clean up peer if not reconnected within grace period
      voiceClient.disconnectPeer(peerId);
    }, VOICE_RECONNECT_GRACE_MS);
    reconnectTimers.set(peerId, timer);
  } else if (state === 'connected') {
    const timer = reconnectTimers.get(peerId);
    if (timer) {
      clearTimeout(timer);
      reconnectTimers.delete(peerId);
    }
  }
}
```

---

## 10. Migration Plan

### Phase 1: Foundation (Week 1–2)

**Goal:** Set up the engine, renderer, and basic entity system. No networking yet.

| File | Action |
|------|--------|
| `src/modules/virtual-library/game/engine/GameEngine.ts` | Create |
| `src/modules/virtual-library/game/engine/SystemRunner.ts` | Create |
| `src/modules/virtual-library/game/renderer/CanvasRenderer.ts` | Create |
| `src/modules/virtual-library/game/renderer/SpriteCache.ts` | Create |
| `src/modules/virtual-library/game/world/World.ts` | Create |
| `src/modules/virtual-library/game/world/Room.ts` | Create |
| `src/modules/virtual-library/game/entities/EntityManager.ts` | Create |
| `src/modules/virtual-library/game/entities/components.ts` | Create |
| `src/modules/virtual-library/game/utils/geometry.ts` | Create |
| `src/modules/virtual-library/game/utils/throttle.ts` | Create |
| `src/modules/virtual-library/game/utils/constants.ts` | Create |
| `src/modules/virtual-library/game/systems/MovementSystem.ts` | Create |
| `src/modules/virtual-library/game/systems/ProximitySystem.ts` | Create |

**Deliverable:** Single-player movement on a tile map rendered to canvas. Player can walk around with WASD.

### Phase 2: Systems (Week 3–4)

**Goal:** Add game systems for study sessions and interactions. Still no networking.

| File | Action |
|------|--------|
| `src/modules/virtual-library/game/systems/StudySessionSystem.ts` | Create |
| `src/modules/virtual-library/game/systems/InteractionSystem.ts` | Create |
| `src/modules/virtual-library/game/systems/CleanupSystem.ts` | Create |
| `src/modules/virtual-library/game/ui/ChatSystem.ts` | Create |
| `src/modules/virtual-library/game/ui/StudyOverlay.ts` | Create |
| `src/modules/virtual-library/game/ui/PlayerNametags.ts` | Create |
| `src/modules/virtual-library/game/audio/AudioManager.ts` | Create |
| `src/modules/virtual-library/game/audio/SpatialAudio.ts` | Create |

**Deliverable:** Full local game loop. Player can interact with desks, start study sessions, use chat locally.

### Phase 3: Networking (Week 5)

**Goal:** Connect multiplayer via Supabase Realtime.

| File | Action |
|------|--------|
| `src/modules/virtual-library/game/networking/MultiplayerClient.ts` | Create |
| `src/modules/virtual-library/services/MultiplayerManager.ts` | Modify (extend) |
| `src/modules/virtual-library/game/networking/NetworkThrottle.ts` | Create |

**Changes to existing:**
- Add `broadcastPosition`, `onPositionUpdate`, `onChatMessage` to `MultiplayerManager`
- Add remote player interpolation in `MovementSystem`
- Add chat proximity filtering

**Deliverable:** Multiple players see each other move and chat in real time.

### Phase 4: Voice (Week 6)

**Goal:** Add proximity-based voice chat.

| File | Action |
|------|--------|
| `src/modules/virtual-library/game/networking/VoiceClient.ts` | Create |
| `src/modules/virtual-library/game/audio/SpatialAudio.ts` | Update (connect to VoiceClient) |

**Changes to existing:**
- Add WebRTC signaling via Supabase broadcast
- Add mic permission UI to `VirtualLibraryPage`
- Connect voice to proximity system

**Deliverable:** Players can talk to each other when nearby. Voice is attenuated by distance and walls.

### Phase 5: Polish (Week 7–8)

**Goal:** Polish, optimization, mobile support, and deployment.

| File | Action |
|------|--------|
| Touch controls for mobile | Add to `VirtualLibraryPage` |
| Loading states | Add skeleton screens |
| Error boundaries | Add React error boundary |
| Performance audit | Profile with React DevTools + Chrome Performance |
| Bundle analysis | Check for unused imports, optimize assets |
| Accessibility | Keyboard nav, screen reader labels for canvas |

**Deliverable:** Production-ready module. 60fps, <50KB bundle increase, mobile responsive.

---

## 11. File Manifest

### 13 new files to create

```
src/modules/virtual-library/game/engine/GameEngine.ts
src/modules/virtual-library/game/engine/SystemRunner.ts
src/modules/virtual-library/game/renderer/CanvasRenderer.ts
src/modules/virtual-library/game/renderer/SpriteCache.ts
src/modules/virtual-library/game/world/World.ts
src/modules/virtual-library/game/world/Room.ts
src/modules/virtual-library/game/entities/EntityManager.ts
src/modules/virtual-library/game/entities/components.ts
src/modules/virtual-library/game/systems/MovementSystem.ts
src/modules/virtual-library/game/systems/ProximitySystem.ts
src/modules/virtual-library/game/systems/StudySessionSystem.ts
src/modules/virtual-library/game/systems/InteractionSystem.ts
src/modules/virtual-library/game/systems/CleanupSystem.ts
src/modules/virtual-library/game/networking/MultiplayerClient.ts
src/modules/virtual-library/game/networking/VoiceClient.ts
src/modules/virtual-library/game/networking/NetworkThrottle.ts
src/modules/virtual-library/game/ui/ChatSystem.ts
src/modules/virtual-library/game/ui/StudyOverlay.ts
src/modules/virtual-library/game/ui/PlayerNametags.ts
src/modules/virtual-library/game/audio/AudioManager.ts
src/modules/virtual-library/game/audio/SpatialAudio.ts
src/modules/virtual-library/game/utils/geometry.ts
src/modules/virtual-library/game/utils/throttle.ts
src/modules/virtual-library/game/utils/constants.ts
```

### 14 existing files to modify

```
src/modules/virtual-library/services/MultiplayerManager.ts
  - Add broadcastPosition, onPositionUpdate, onChatMessage

src/modules/virtual-library/components/VirtualLibraryPage.tsx
  - Integrate GameProvider and canvas

src/modules/virtual-library/hooks/useGameEngine.ts
  - Create (bridge React to GameEngine)

src/modules/virtual-library/features/chat/
  - Extend for in-game chat messages

src/modules/virtual-library/features/study/
  - Connect study sessions to StudySessionSystem

src/modules/virtual-library/types/
  - Add game entity types, network message types

src/modules/virtual-library/config/
  - Add room definitions, tile maps

src/modules/virtual-library/providers/GameProvider.tsx
  - Create (React context for game state)

src/modules/virtual-library/index.ts
  - Export new modules
```

### 10 files to keep unchanged

```
src/modules/virtual-library/components/LibraryStats.tsx
src/modules/virtual-library/components/BookCatalog.tsx
src/modules/virtual-library/components/ReadingProgress.tsx
src/modules/virtual-library/hooks/useLibrary.ts
src/modules/virtual-library/services/SupabaseService.ts
src/modules/virtual-library/types/index.ts
src/modules/virtual-library/config/rooms.ts
src/modules/virtual-library/providers/AuthProvider.tsx
src/modules/virtual-library/world/
src/modules/virtual-library/index.ts
```

---

## 12. Testing Strategy

### 12.1 Unit tests

**Geometry utilities** (`utils/geometry.test.ts`)
- Distance calculation accuracy
- Point-in-rect collision
- Circle-rect collision
- Bresenham LOS through various tile configurations

**Throttle** (`networking/NetworkThrottle.test.ts`)
- Rate limiting to 50ms minimum
- Position change threshold (2px minimum)
- Correct passthrough when throttle window expires

**Proximity** (`systems/ProximitySystem.test.ts`)
- Distance check with known coordinates
- LOS blocking with mock tile map
- Combined proximity + LOS result accuracy

**Chat** (`ui/ChatSystem.test.ts`)
- Message creation and storage
- Proximity filtering
- Text length validation (500 char limit)

**Voice** (`networking/VoiceClient.test.ts`)
- Permission request flow (mocked)
- Gain calculation at various distances
- Grace period timer cleanup

### 12.2 Integration tests

**GameEngine integration** (`engine/GameEngine.integration.test.ts`)
- Start/stop lifecycle
- Entity creation and component assignment
- System execution order
- State change propagation

**MovementSystem integration** (`systems/MovementSystem.integration.test.ts`)
- WASD input → position update
- Grid snapping behavior
- Boundary clamping

### 12.3 Playwright E2E tests

**WASD movement** (`virtual-library.spec.ts`)
- Load library page
- Press W key → player sprite moves up
- Verify position on canvas

**Chat** (`virtual-library.spec.ts`)
- Enter library room
- Type message in chat panel
- Verify message appears in UI
- Verify message broadcasts (mock Supabase)

**Study timer** (`virtual-library.spec.ts`)
- Interact with desk
- Start study session
- Verify timer counts down
- Complete session → verify XP awarded

**Mic permissions** (`virtual-library.spec.ts`)
- Enter library with mic enabled
- Verify permission prompt appears
- Grant permission → verify mic icon active

**Mobile touch** (`virtual-library.spec.ts`)
- Emulate mobile viewport
- Touch and drag on canvas
- Verify player follows touch direction

### 12.4 Performance targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Frame rate | 60fps | Chrome DevTools Performance panel |
| Frame time | < 16ms per frame | `performance.now()` delta |
| Position broadcast rate | 20Hz max | Network throttle |
| Bundle size increase | < 50KB | `npm run build -- --analyze` |
| Memory usage | < 100MB heap | Chrome DevTools Memory |
| First paint | < 2s | Lighthouse |

---

## Appendices

### Appendix A: Reuse of existing code

**Keep as-is:**
- `src/modules/virtual-library/hooks/useLibrary.ts` — data fetching hooks
- `src/modules/virtual-library/services/SupabaseService.ts` — database queries
- `src/modules/virtual-library/types/index.ts` — shared TypeScript types
- `src/modules/virtual-library/components/LibraryStats.tsx` — stats display
- `src/modules/virtual-library/components/BookCatalog.tsx` — book grid

**Extend:**
- `src/modules/virtual-library/services/MultiplayerManager.ts` — add game broadcast methods
- `src/modules/virtual-library/features/chat/` — reuse message UI, add proximity filtering

**Replace:**
- Canvas rendering (new `CanvasRenderer`)
- Entity management (new `EntityManager`)
- State management for game loop (new `GameProvider`)

### Appendix B: Database considerations

**Broadcast rate limiting RPC:**

Create a Supabase RPC function to validate broadcast rate per client:

```sql
CREATE OR REPLACE FUNCTION check_broadcast_rate(
  p_room_id UUID,
  p_user_id UUID,
  p_min_interval_ms INTEGER DEFAULT 50
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- This is enforced client-side primarily.
  -- Server-side: use PostgREST rate limiting or edge functions
  -- if abuse is detected.
  RETURN TRUE;
END;
$$;
```

For production, consider a Supabase Edge Function that validates and logs broadcast frequency per connection.

### Appendix C: Environment variables

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Game configuration
VITE_VLIB_TILE_SIZE=32
VITE_VLIB_BROADCAST_RATE_MS=50
VITE_VLIB_PROXIMITY_DEFAULT_RANGE=300
VITE_VLIB_STUDY_SESSION_DURATION_MIN=25
VITE_VLIB_VOICE_GRACE_PERIOD_MS=3000

# Feature flags
VITE_VLIB_VOICE_ENABLED=true
VITE_VLIB_CHAT_ENABLED=true
VITE_VLIB_STUDY_ENABLED=true
```
