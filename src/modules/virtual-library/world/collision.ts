/**
 * CollisionSystem — tile-based collision detection for the library world.
 *
 * Determines which tiles are solid (blocked) and whether a player
 * can move to a given position.
 */

import { createWorldMap } from "./map";
import type { TileType } from "./types";
import type { WorldConfig } from "./types";

const SOLID_TILES: Set<TileType> = new Set([
  "wall",
  "wall_bookshelf",
  "bookshelf",
  "desk",
  "pillar",
  "counter",
]);

export class CollisionSystem {
  private map: TileType[][];
  private tileSize: number;
  private mapWidth: number;
  private mapHeight: number;

  /** Player hitbox radius in pixels (slightly smaller than tile for forgiving collision). */
  readonly playerRadius: number;

  constructor(config: WorldConfig) {
    this.map = createWorldMap();
    this.tileSize = config.tileSize;
    this.mapWidth = config.mapWidth;
    this.mapHeight = config.mapHeight;
    this.playerRadius = config.tileSize * 0.35;
  }

  /** Check if a tile is solid (blocked). */
  isSolid(tileType: TileType): boolean {
    return SOLID_TILES.has(tileType);
  }

  /** Get the tile at a given pixel position. */
  getTileAt(px: number, py: number): TileType | null {
    const col = Math.floor(px / this.tileSize);
    const row = Math.floor(py / this.tileSize);

    if (col < 0 || row < 0 || col >= this.mapWidth || row >= this.mapHeight) {
      return "wall";
    }

    return this.map[row][col];
  }

  /** Check if any part of a circle overlaps a solid tile. */
  collides(px: number, py: number, radius: number = this.playerRadius): boolean {
    // Check the four corners of the bounding box
    const checks = [
      { x: px - radius, y: py - radius },
      { x: px + radius, y: py - radius },
      { x: px - radius, y: py + radius },
      { x: px + radius, y: py + radius },
      { x: px, y: py - radius },
      { x: px, y: py + radius },
      { x: px - radius, y: py },
      { x: px + radius, y: py },
    ];

    for (const { x, y } of checks) {
      const tile = this.getTileAt(x, y);
      if (tile && this.isSolid(tile)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Attempt to move from (fromX, fromY) toward (toX, toY).
   * Returns the closest valid position to the target.
   */
  resolveMovement(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    radius: number = this.playerRadius
  ): { x: number; y: number; blocked: boolean } {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.01) {
      return { x: fromX, y: fromY, blocked: false };
    }

    const nx = dx / distance;
    const ny = dy / distance;

    // Step-based collision resolution
    const stepSize = this.tileSize * 0.1;
    const steps = Math.ceil(distance / stepSize);
    let curX = fromX;
    let curY = fromY;
    let blocked = false;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const testX = fromX + dx * t;
      const testY = fromY + dy * t;

      if (!this.collides(testX, testY, radius)) {
        curX = testX;
        curY = testY;
      } else {
        blocked = true;
        break;
      }
    }

    // Clamp to map bounds
    curX = Math.max(radius, Math.min(this.mapWidth * this.tileSize - radius, curX));
    curY = Math.max(radius, Math.min(this.mapHeight * this.tileSize - radius, curY));

    return { x: curX, y: curY, blocked };
  }

  /** Check if a position is within map bounds. */
  isInBounds(px: number, py: number, radius: number = 0): boolean {
    return (
      px - radius >= 0 &&
      py - radius >= 0 &&
      px + radius <= this.mapWidth * this.tileSize &&
      py + radius <= this.mapHeight * this.tileSize
    );
  }

  /** Get spawn position (center of entrance). */
  getSpawnPosition(): { x: number; y: number } {
    return {
      x: 21 * this.tileSize,
      y: 2 * this.tileSize + this.tileSize / 2,
    };
  }
}
