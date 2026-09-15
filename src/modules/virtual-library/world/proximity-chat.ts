/**
 * ProximityChat — filters chat messages by distance and line-of-sight.
 *
 * Messages from players who are far away or behind walls are faded or hidden,
 * creating a spatial chat experience where you only "hear" people near you.
 *
 * Uses Bresenham's line algorithm for efficient line-of-sight checks against
 * the tile-based world map.
 */

import type { TileType, WorldPlayer, WorldChatMessage } from "./types";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ProximityChatOptions {
  /** Map data for LOS checks */
  map: TileType[][];
  /** Tile size in pixels */
  tileSize: number;
  /** Maximum chat hearing distance (pixels) */
  maxRange: number;
  /** Solid tile types that block LOS */
  solidTiles: TileType[];
}

export interface VisibleChatMessage extends WorldChatMessage {
  /** Distance from local player to sender (pixels) */
  distance: number;
  /** Whether line-of-sight is clear between sender and receiver */
  hasLOS: boolean;
  /** Opacity based on distance and LOS (0-1, where 1 = fully visible) */
  opacity: number;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SOLID_TILES: TileType[] = [
  "wall",
  "wall_bookshelf",
  "bookshelf",
  "desk",
  "chair",
  "pillar",
  "counter",
];

const DEFAULT_MAX_RANGE = 300;

// ─── Line-of-Sight (Bresenham's) ──────────────────────────────────────────────

/**
 * Check whether there is a clear line of sight between two pixel positions.
 *
 * Walks the tile grid using Bresenham's line algorithm and returns false
 * as soon as a solid tile is encountered between the two points.
 *
 * The start and end tiles are always considered passable (a speaker standing
 * next to a wall should still be heard from the other side of the room).
 */
export function hasLineOfSight(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  map: TileType[][],
  tileSize: number,
  solidTiles: TileType[]
): boolean {
  const mapHeight = map.length;
  const mapWidth = map[0]?.length ?? 0;

  // Convert pixel positions to tile coordinates
  const tx0 = Math.floor(x0 / tileSize);
  const ty0 = Math.floor(y0 / tileSize);
  const tx1 = Math.floor(x1 / tileSize);
  const ty1 = Math.floor(y1 / tileSize);

  // Same tile — always clear
  if (tx0 === tx1 && ty0 === ty1) return true;

  // Bresenham's line algorithm
  let x = tx0;
  let y = ty0;
  const dx = Math.abs(tx1 - tx0);
  const dy = Math.abs(ty1 - ty0);
  const sx = tx0 < tx1 ? 1 : -1;
  const sy = ty0 < ty1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    // Skip the start tile (sender's position) and end tile (receiver's position)
    if ((x !== tx1 || y !== ty1) && (x !== tx0 || y !== ty0)) {
      // Bounds check
      if (y < 0 || y >= mapHeight || x < 0 || x >= mapWidth) {
        return false; // Out of bounds = blocked
      }
      const tile = map[y][x];
      if (tile && solidTiles.includes(tile)) {
        return false; // Solid tile blocks line-of-sight
      }
    }

    if (x === tx1 && y === ty1) break;

    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }

  return true;
}

// ─── Opacity Calculation ──────────────────────────────────────────────────────

/**
 * Compute the visibility opacity for a message based on distance and LOS.
 *
 * Rules:
 *   - 0–50% of maxRange: full opacity (1.0)
 *   - 50–100% of maxRange: linear fade from 1.0 to 0.3
 *   - No LOS: additional 50% opacity penalty (min 0.1)
 */
export function computeOpacity(distance: number, maxRange: number, hasLOS: boolean): number {
  // Clamp distance to max range
  const clampedDist = Math.min(distance, maxRange);
  const ratio = clampedDist / maxRange; // 0 (close) → 1 (far)

  let opacity: number;

  if (ratio <= 0.5) {
    // Close range — full opacity
    opacity = 1.0;
  } else {
    // Far range — linear fade from 1.0 to 0.3
    const t = (ratio - 0.5) / 0.5; // 0 → 1 within the 50–100% band
    opacity = 1.0 - t * 0.7; // 1.0 → 0.3
  }

  // No line-of-sight penalty: halve the opacity (minimum 0.1)
  if (!hasLOS) {
    opacity = Math.max(0.1, opacity * 0.5);
  }

  return opacity;
}

// ─── Main Filter ──────────────────────────────────────────────────────────────

/**
 * Filter chat messages by proximity and line-of-sight.
 *
 * Returns only messages that are within hearing range, annotated with
 * distance, LOS status, and computed opacity for rendering.
 */
export function filterChatByProximity(
  messages: WorldChatMessage[],
  localPlayer: WorldPlayer,
  map: TileType[][],
  tileSize: number,
  maxRange: number = DEFAULT_MAX_RANGE,
  solidTiles: TileType[] = DEFAULT_SOLID_TILES
): VisibleChatMessage[] {
  // Ensure we have a valid map
  if (!map || map.length === 0 || !map[0]?.length) {
    return [];
  }

  const lx = localPlayer.x;
  const ly = localPlayer.y;
  const maxRangeSq = maxRange * maxRange;

  const result: VisibleChatMessage[] = [];

  for (const msg of messages) {
    // System messages are always visible
    if (msg.type === "system") {
      result.push({
        ...msg,
        distance: 0,
        hasLOS: true,
        opacity: 1.0,
      });
      continue;
    }

    // Skip own messages — you always see what you type
    if (msg.authorId === localPlayer.id) {
      result.push({
        ...msg,
        distance: 0,
        hasLOS: true,
        opacity: 1.0,
      });
      continue;
    }

    // We need the sender's position. Remote player positions aren't stored on
    // messages, so we approximate using the message timestamp position.
    // The caller (VirtualLibraryWorld) enriches messages with sender positions
    // before filtering. If no position data is available, we fall back to
    // showing the message at reduced opacity.
    //
    // For now, check if the message has embedded position data. The
    // VirtualLibraryWorld component will add `senderX`/`senderY` to messages
    // from remote players via the multiplayer manager.
    const senderX = (msg as any).senderX as number | undefined;
    const senderY = (msg as any).senderY as number | undefined;

    if (senderX === undefined || senderY === undefined) {
      // No position data — show at low opacity so the user isn't confused
      result.push({
        ...msg,
        distance: maxRange,
        hasLOS: false,
        opacity: 0.3,
      });
      continue;
    }

    // Distance check (squared for performance)
    const dx = senderX - lx;
    const dy = senderY - ly;
    const distSq = dx * dx + dy * dy;

    if (distSq > maxRangeSq) {
      // Too far to hear
      continue;
    }

    const distance = Math.sqrt(distSq);

    // Line-of-sight check
    const los = hasLineOfSight(senderX, senderY, lx, ly, map, tileSize, solidTiles);

    // Compute opacity
    const opacity = computeOpacity(distance, maxRange, los);

    result.push({
      ...msg,
      distance,
      hasLOS: los,
      opacity,
    });
  }

  // Sort by distance (closest messages render on top)
  result.sort((a, b) => a.distance - b.distance);

  return result;
}
