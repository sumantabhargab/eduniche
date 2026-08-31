/**
 * World map definition — tile grid and room zones.
 *
 * The map is a 40×30 tile grid. Each cell is one TileType.
 * Rooms are defined as bounding boxes that map to areas of the tile grid.
 *
 * Map layout (0-indexed, [col, row]):
 *
 *   Row 0-1:  ┌──────────────────────────────┐  ← Top wall
 *   Row 2-3:  │  QUIET ZONE    │  GROUP STUDY │
 *   Row 4-11: │  (individual   │  (tables    │
 *   Row 12-13│   study booths) │  for groups) │
 *   Row 14-15│────────────────┼─────────────│
 *   Row 16-17│  MAIN READING  │  DISCUSSION │
 *   Row 18-26│  AREA          │  ROOM       │
 *   Row 27-28│  (open desks,  │  (round     │
 *   Row 29:   │   bookshelves) │   table)    │
 *             └──────────────────────────────┘  ← Bottom wall
 *              ←────── ENTRANCE ───────→
 *
 * Row 0-1:  Top wall
 * Row 2-3:  Quiet zone top, group study top
 * Row 4-10: Quiet zone desks/bookshelves, group study tables
 * Row 11:   Divider
 * Row 12-15: Main reading area + discussion room
 * Row 16-22: Main reading area (more desks/bookshelves) + discussion room interior
 * Row 23-26: Main reading area lower + discussion room
 * Row 27-28: Bottom area, private booths
 * Row 29:   Bottom wall
 */

import type { TileType, RoomZone, RoomId } from "./types";

// ─── Tile Constants ───────────────────────────────────────────────────────────

export const TILE = {
  FLOOR: "floor" as TileType,
  FLOOR_DARK: "floor_dark" as TileType,
  FLOOR_WOOD: "floor_wood" as TileType,
  WALL: "wall" as TileType,
  WALL_BOOKSHELF: "wall_bookshelf" as TileType,
  BOOKSHELF: "bookshelf" as TileType,
  DESK: "desk" as TileType,
  CHAIR: "chair" as TileType,
  PLANT: "plant" as TileType,
  LAMP: "lamp" as TileType,
  WINDOW: "window" as TileType,
  DOOR: "door" as TileType,
  CARPET: "carpet" as TileType,
  PILLAR: "pillar" as TileType,
  COUNTER: "counter" as TileType,
} as const;

// ─── Map Dimensions ───────────────────────────────────────────────────────────

export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 30;

// ─── Helper to create empty row ───────────────────────────────────────────────

function row(...types: TileType[]): TileType[] {
  return types;
}

function fillRow(type: TileType): TileType[] {
  return new Array(MAP_WIDTH).fill(type);
}

// ─── Generate the Map ─────────────────────────────────────────────────────────

export function createWorldMap(): TileType[][] {
  const map: TileType[][] = [];

  // Row 0: Top wall
  map.push(fillRow(TILE.WALL));

  // Row 1: Top wall with windows
  const r1: TileType[] = [];
  for (let c = 0; c < MAP_WIDTH; c++) {
    if (c >= 4 && c <= 6) r1.push(TILE.WINDOW);
    else if (c >= 14 && c <= 16) r1.push(TILE.WINDOW);
    else if (c >= 24 && c <= 26) r1.push(TILE.WINDOW);
    else if (c >= 34 && c <= 36) r1.push(TILE.WINDOW);
    else r1.push(TILE.WALL);
  }
  map.push(r1);

  // Row 2: Interior top - quiet zone header / group study header
  const r2: TileType[] = [];
  for (let c = 0; c < MAP_WIDTH; c++) {
    if (c === 0 || c === MAP_WIDTH - 1) r2.push(TILE.WALL);
    else if (c === 19) r2.push(TILE.WALL_BOOKSHELF);
    else if (c >= 3 && c <= 5) r2.push(TILE.PLANT);
    else if (c >= 14 && c <= 16) r2.push(TILE.LAMP);
    else if (c >= 24 && c <= 26) r2.push(TILE.PLANT);
    else if (c >= 34 && c <= 36) r2.push(TILE.LAMP);
    else r2.push(TILE.FLOOR);
  }
  map.push(r2);

  // Row 3: Labels row - bookshelves
  const r3: TileType[] = [];
  for (let c = 0; c < MAP_WIDTH; c++) {
    if (c === 0 || c === MAP_WIDTH - 1) r3.push(TILE.WALL);
    else if (c === 19) r3.push(TILE.WALL_BOOKSHELF);
    else if (c >= 2 && c <= 6) r3.push(TILE.BOOKSHELF);
    else if (c >= 8 && c <= 10) r3.push(TILE.LAMP);
    else if (c >= 14 && c <= 18) r3.push(TILE.BOOKSHELF);
    else if (c >= 21 && c <= 25) r3.push(TILE.BOOKSHELF);
    else if (c >= 27 && c <= 29) r3.push(TILE.LAMP);
    else if (c >= 33 && c <= 37) r3.push(TILE.BOOKSHELF);
    else r3.push(TILE.FLOOR);
  }
  map.push(r3);

  // Rows 4-10: Quiet zone + Group study (7 rows)
  for (let r = 0; r < 7; r++) {
    const row_: TileType[] = [];
    for (let c = 0; c < MAP_WIDTH; c++) {
      if (c === 0 || c === MAP_WIDTH - 1) {
        row_.push(TILE.WALL);
      } else if (c === 19) {
        row_.push(TILE.BOOKSHELF);
      } else if (c >= 3 && c <= 5 && r % 2 === 0) {
        // Individual study booths - desks along left wall
        if (r % 4 === 0) row_.push(TILE.DESK);
        else if (r % 4 === 2) row_.push(TILE.CHAIR);
        else row_.push(TILE.FLOOR);
      } else if (c >= 2 && c <= 6 && r % 2 === 1) {
        row_.push(TILE.CHAIR);
      } else if (c >= 7 && c <= 8 && r === 1) {
        row_.push(TILE.LAMP);
      } else if (c >= 13 && c <= 15 && r === 1) {
        row_.push(TILE.LAMP);
      } else if (c >= 14 && c <= 18 && r % 3 === 0) {
        row_.push(TILE.BOOKSHELF);
      } else if (c >= 21 && c <= 25 && r % 3 === 0) {
        row_.push(TILE.BOOKSHELF);
      } else if (c >= 33 && c <= 37 && r % 3 === 0) {
        row_.push(TILE.BOOKSHELF);
      } else if (c >= 27 && c <= 29 && r === 1) {
        row_.push(TILE.LAMP);
      } else if (c >= 9 && c <= 10 && r === 3) {
        row_.push(TILE.PLANT);
      } else if (c >= 30 && c <= 31 && r === 3) {
        row_.push(TILE.PLANT);
      } else if (c >= 9 && c <= 10 && r === 5) {
        row_.push(TILE.PLANT);
      } else if (c >= 30 && c <= 31 && r === 5) {
        row_.push(TILE.PLANT);
      } else if (r % 2 === 0 && c >= 11 && c <= 12) {
        row_.push(TILE.LAMP);
      } else if (r % 2 === 0 && c >= 30 && c <= 31) {
        row_.push(TILE.LAMP);
      } else {
        row_.push(TILE.FLOOR_DARK);
      }
    }
    map.push(row_);
  }

  // Row 11: Divider row (wall with doorways)
  const r11: TileType[] = [];
  for (let c = 0; c < MAP_WIDTH; c++) {
    if (c === 0 || c === MAP_WIDTH - 1) r11.push(TILE.WALL);
    else if (c === 19) r11.push(TILE.DOOR);
    else if (c >= 3 && c <= 5) r11.push(TILE.DOOR);
    else if (c >= 8 && c <= 10) r11.push(TILE.DOOR);
    else if (c >= 29 && c <= 31) r11.push(TILE.DOOR);
    else r11.push(TILE.WALL);
  }
  map.push(r11);

  // Rows 12-15: Main Reading Area top + Discussion Room
  for (let r = 0; r < 4; r++) {
    const row_: TileType[] = [];
    for (let c = 0; c < MAP_WIDTH; c++) {
      if (c === 0 || c === MAP_WIDTH - 1) {
        row_.push(TILE.WALL);
      } else if (c === 19) {
        row_.push(TILE.WALL);
      } else if (r === 1 && (c === 16 || c === 17)) {
        // Discussion room door
        row_.push(TILE.DOOR);
      } else if (c >= 20 && c <= 37) {
        // Discussion room interior
        if (r === 0 || r === 3) {
          row_.push(TILE.WALL);
        } else if (r === 1 && c >= 21 && c <= 36) {
          row_.push(TILE.CARPET);
        } else if (r === 2 && c >= 21 && c <= 36) {
          row_.push(TILE.CARPET);
        } else if (r === 1 && (c === 25 || c === 30)) {
          row_.push(TILE.CHAIR);
        } else if (r === 2 && (c === 25 || c === 30)) {
          row_.push(TILE.CHAIR);
        } else if (r === 1 && c === 28) {
          row_.push(TILE.DESK);
        } else if (r === 2 && c === 28) {
          row_.push(TILE.DESK);
        } else if (r === 1 && c === 33) {
          row_.push(TILE.LAMP);
        } else if (r === 2 && c === 33) {
          row_.push(TILE.LAMP);
        } else {
          row_.push(TILE.CARPET);
        }
      } else {
        // Main reading area
        row_.push(TILE.FLOOR);
      }
    }
    map.push(row_);
  }

  // Row 16: Main reading + discussion divider
  const r16: TileType[] = [];
  for (let c = 0; c < MAP_WIDTH; c++) {
    if (c === 0 || c === MAP_WIDTH - 1) r16.push(TILE.WALL);
    else if (c === 19) r16.push(TILE.WALL_BOOKSHELF);
    else if (c >= 20 && c <= 37) r16.push(TILE.WALL);
    else r16.push(TILE.FLOOR);
  }
  map.push(r16);

  // Rows 17-22: Main reading area with desks + bookshelves (6 rows)
  for (let r = 0; r < 6; r++) {
    const row_: TileType[] = [];
    for (let c = 0; c < MAP_WIDTH; c++) {
      if (c === 0 || c === MAP_WIDTH - 1) {
        row_.push(TILE.WALL);
      } else if (c === 19) {
        row_.push(TILE.BOOKSHELF);
      } else if (r === 2 && c >= 3 && c <= 5) {
        row_.push(TILE.BOOKSHELF);
      } else if (r === 2 && c >= 14 && c <= 16) {
        row_.push(TILE.BOOKSHELF);
      } else if (r === 2 && c >= 33 && c <= 35) {
        row_.push(TILE.BOOKSHELF);
      } else if (r === 0 && c >= 8 && c <= 10) {
        row_.push(TILE.DESK);
      } else if (r === 0 && c >= 9 && c <= 9) {
        row_.push(TILE.CHAIR);
      } else if (r === 1 && c >= 8 && c <= 10) {
        row_.push(TILE.DESK);
      } else if (r === 3 && c >= 8 && c <= 10) {
        row_.push(TILE.DESK);
      } else if (r === 3 && c >= 9 && c <= 9) {
        row_.push(TILE.CHAIR);
      } else if (r === 4 && c >= 8 && c <= 10) {
        row_.push(TILE.DESK);
      } else if (r === 0 && c >= 28 && c <= 30) {
        row_.push(TILE.DESK);
      } else if (r === 1 && c >= 28 && c <= 30) {
        row_.push(TILE.DESK);
      } else if (r === 3 && c >= 28 && c <= 30) {
        row_.push(TILE.DESK);
      } else if (r === 4 && c >= 28 && c <= 30) {
        row_.push(TILE.DESK);
      } else if (c === 5 && r === 0) {
        row_.push(TILE.LAMP);
      } else if (c === 5 && r === 5) {
        row_.push(TILE.LAMP);
      } else if (c === 11 && r === 1) {
        row_.push(TILE.LAMP);
      } else if (c === 11 && r === 4) {
        row_.push(TILE.LAMP);
      } else if (c === 25 && r === 1) {
        row_.push(TILE.LAMP);
      } else if (c === 25 && r === 4) {
        row_.push(TILE.LAMP);
      } else if (c === 36 && r === 0) {
        row_.push(TILE.LAMP);
      } else if (c === 36 && r === 5) {
        row_.push(TILE.LAMP);
      } else if (c === 3 && r === 4) {
        row_.push(TILE.PLANT);
      } else if (c === 16 && r === 4) {
        row_.push(TILE.PLANT);
      } else if (c === 14 && r === 1) {
        row_.push(TILE.PLANT);
      } else if (c === 35 && r === 1) {
        row_.push(TILE.PLANT);
      } else {
        row_.push(TILE.FLOOR);
      }
    }
    map.push(row_);
  }

  // Row 23: Bottom divider
  const r23: TileType[] = [];
  for (let c = 0; c < MAP_WIDTH; c++) {
    if (c === 0 || c === MAP_WIDTH - 1) r23.push(TILE.WALL);
    else if (c === 19) r23.push(TILE.WALL_BOOKSHELF);
    else if (c >= 20 && c <= 37) r23.push(TILE.WALL);
    else r23.push(TILE.FLOOR);
  }
  map.push(r23);

  // Rows 24-26: Main reading lower area (3 rows)
  for (let r = 0; r < 3; r++) {
    const row_: TileType[] = [];
    for (let c = 0; c < MAP_WIDTH; c++) {
      if (c === 0 || c === MAP_WIDTH - 1) {
        row_.push(TILE.WALL);
      } else if (c === 19) {
        row_.push(TILE.BOOKSHELF);
      } else if (r === 1 && c >= 3 && c <= 5) {
        row_.push(TILE.BOOKSHELF);
      } else if (r === 1 && c >= 14 && c <= 16) {
        row_.push(TILE.BOOKSHELF);
      } else if (r === 1 && c >= 33 && c <= 35) {
        row_.push(TILE.BOOKSHELF);
      } else if (c === 8 && r === 0) {
        row_.push(TILE.LAMP);
      } else if (c === 8 && r === 2) {
        row_.push(TILE.LAMP);
      } else if (c === 11 && r === 1) {
        row_.push(TILE.LAMP);
      } else if (c === 25 && r === 1) {
        row_.push(TILE.LAMP);
      } else if (c === 36 && r === 0) {
        row_.push(TILE.LAMP);
      } else if (c === 36 && r === 2) {
        row_.push(TILE.LAMP);
      } else if (c === 4 && r === 1) {
        row_.push(TILE.PLANT);
      } else if (c === 35 && r === 1) {
        row_.push(TILE.PLANT);
      } else if (c === 3 && r === 0) {
        row_.push(TILE.COUNTER);
      } else if (c === 4 && r === 0) {
        row_.push(TILE.COUNTER);
      } else if (c === 5 && r === 0) {
        row_.push(TILE.COUNTER);
      } else {
        row_.push(TILE.FLOOR);
      }
    }
    map.push(row_);
  }

  // Row 27: Bottom area with private booth entries
  const r27: TileType[] = [];
  for (let c = 0; c < MAP_WIDTH; c++) {
    if (c === 0 || c === MAP_WIDTH - 1) r27.push(TILE.WALL);
    else if (c === 19) r27.push(TILE.DOOR);
    else if (c >= 3 && c <= 5) r27.push(TILE.DOOR);
    else if (c >= 8 && c <= 10) r27.push(TILE.DOOR);
    else if (c >= 29 && c <= 31) r27.push(TILE.DOOR);
    else r27.push(TILE.WALL);
  }
  map.push(r27);

  // Row 28: Private booths area
  const r28: TileType[] = [];
  for (let c = 0; c < MAP_WIDTH; c++) {
    if (c === 0 || c === MAP_WIDTH - 1) r28.push(TILE.WALL);
    else if (c >= 3 && c <= 5) r28.push(TILE.CHAIR);
    else if (c >= 4 && c <= 4) r28.push(TILE.DESK);
    else if (c >= 8 && c <= 10) r28.push(TILE.CHAIR);
    else if (c >= 9 && c <= 9) r28.push(TILE.DESK);
    else if (c >= 29 && c <= 31) r28.push(TILE.CHAIR);
    else if (c >= 30 && c <= 30) r28.push(TILE.DESK);
    else if (c >= 34 && c <= 36) r28.push(TILE.CHAIR);
    else if (c >= 35 && c <= 35) r28.push(TILE.DESK);
    else if (c === 19) r28.push(TILE.PILLAR);
    else r28.push(TILE.FLOOR_DARK);
  }
  map.push(r28);

  // Row 29: Bottom wall
  const r29: TileType[] = [];
  for (let c = 0; c < MAP_WIDTH; c++) {
    if (c >= 3 && c <= 5) r29.push(TILE.DOOR);
    else if (c >= 8 && c <= 10) r29.push(TILE.DOOR);
    else if (c >= 29 && c <= 31) r29.push(TILE.DOOR);
    else if (c >= 34 && c <= 36) r29.push(TILE.DOOR);
    else r29.push(TILE.WALL);
  }
  map.push(r29);

  return map;
}

// ─── Room Zones ───────────────────────────────────────────────────────────────

export const ROOM_ZONES: RoomZone[] = [
  {
    id: "entrance",
    name: "Entrance Hall",
    bounds: [16, 0, 8, 2],
    entryPoint: [20, 2],
    voiceEnabled: false,
    videoEnabled: false,
    description: "Welcome to the EduNeuro Virtual Library.",
  },
  {
    id: "main-reading",
    name: "Main Reading Area",
    bounds: [1, 11, 18, 16],
    entryPoint: [10, 12],
    voiceEnabled: false,
    videoEnabled: false,
    branchId: "all",
    description: "Open study space for all branches. Quiet focus mode.",
  },
  {
    id: "quiet-zone",
    name: "Quiet Zone",
    bounds: [1, 2, 18, 9],
    entryPoint: [9, 5],
    voiceEnabled: false,
    videoEnabled: false,
    description: "Silent study. No conversation — just focus.",
  },
  {
    id: "group-study",
    name: "Group Study Area",
    bounds: [20, 2, 19, 9],
    entryPoint: [29, 5],
    voiceEnabled: true,
    videoEnabled: false,
    description: "Tables for collaborative study. Voice available.",
  },
  {
    id: "discussion-room",
    name: "Discussion Room",
    bounds: [20, 11, 18, 5],
    entryPoint: [28, 13],
    voiceEnabled: true,
    videoEnabled: true,
    description: "Active discussion space. Voice and video enabled.",
  },
  {
    id: "booth-1",
    name: "Private Booth 1",
    bounds: [1, 27, 6, 2],
    entryPoint: [4, 28],
    voiceEnabled: false,
    videoEnabled: false,
    description: "Individual study booth.",
  },
  {
    id: "booth-2",
    name: "Private Booth 2",
    bounds: [8, 27, 6, 2],
    entryPoint: [11, 28],
    voiceEnabled: false,
    videoEnabled: false,
    description: "Individual study booth.",
  },
  {
    id: "booth-3",
    name: "Private Booth 3",
    bounds: [29, 27, 6, 2],
    entryPoint: [32, 28],
    voiceEnabled: false,
    videoEnabled: false,
    description: "Individual study booth.",
  },
  {
    id: "booth-4",
    name: "Private Booth 4",
    bounds: [34, 27, 5, 2],
    entryPoint: [36, 28],
    voiceEnabled: false,
    videoEnabled: false,
    description: "Individual study booth.",
  },
];

// ─── Get Room at Position ─────────────────────────────────────────────────────

export function getRoomAtPosition(
  px: number,
  py: number,
  tileSize: number
): RoomZone | null {
  const col = Math.floor(px / tileSize);
  const row = Math.floor(py / tileSize);

  for (const room of ROOM_ZONES) {
    const [rx, ry, rw, rh] = room.bounds;
    if (col >= rx && col < rx + rw && row >= ry && row < ry + rh) {
      return room;
    }
  }
  return null;
}

// ─── Get Entry Point for Room ─────────────────────────────────────────────────

export function getEntryPoint(roomId: RoomId): [number, number] {
  const room = ROOM_ZONES.find((r) => r.id === roomId);
  if (!room) return [20, 2];
  const [rx, ry] = room.entryPoint;
  return [rx * 20 + 10, ry * 20 + 10];
}
