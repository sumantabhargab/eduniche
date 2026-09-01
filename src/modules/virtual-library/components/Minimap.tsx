/**
 * Minimap — compact map in the bottom-right corner showing the library layout,
 * room zones, furniture as blocks, and other players as dots.
 */

"use client";

import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";

interface MinimapProps {
  /** Library width in world units */
  worldWidth: number;
  /** Library height in world units */
  worldHeight: number;
  /** Rooms with their bounding boxes */
  rooms: {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  /** Other players' positions */
  players: { id: string; x: number; y: number; roomId: string }[];
  /** Current player's position */
  playerX: number;
  playerY: number;
  /** Current room the player is in */
  currentRoomId: string;
  /** Whether minimap is expanded */
  expanded?: boolean;
  onToggleExpand?: () => void;
}

const MAP_SIZE = 140;
const PADDING = 8;

function worldToMap(
  wx: number,
  wy: number,
  worldWidth: number,
  worldHeight: number,
  mapSize: number,
  padding: number
) {
  const inner = mapSize - padding * 2;
  return {
    mx: padding + (wx / worldWidth) * inner,
    my: padding + (wy / worldHeight) * inner,
  };
}

export function Minimap({
  worldWidth,
  worldHeight,
  rooms,
  players,
  playerX,
  playerY,
  currentRoomId,
  expanded = false,
  onToggleExpand,
}: MinimapProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!onToggleExpand) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * worldWidth;
      const y = ((e.clientY - rect.top) / rect.height) * worldHeight;
      // In a full implementation, this would teleport the player
      onToggleExpand();
    },
    [onToggleExpand, worldWidth, worldHeight]
  );

  const playerPos = useMemo(
    () => worldToMap(playerX, playerY, worldWidth, worldHeight, MAP_SIZE, PADDING),
    [playerX, playerY, worldWidth, worldHeight]
  );

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-40"
      animate={{ width: expanded ? 280 : MAP_SIZE, height: expanded ? 210 : MAP_SIZE }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <svg
        viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
        className="w-full h-full rounded-xl bg-accent/80 backdrop-blur-md border border-border shadow-lg cursor-pointer"
        onClick={handleClick}
        style={{ overflow: "visible" }}
      >
        {/* Rooms */}
        {rooms.map((room) => {
          const { mx, my } = worldToMap(
            room.x,
            room.y,
            worldWidth,
            worldHeight,
            MAP_SIZE,
            PADDING
          );
          const mw = (room.width / worldWidth) * (MAP_SIZE - PADDING * 2);
          const mh = (room.height / worldHeight) * (MAP_SIZE - PADDING * 2);
          const isCurrentRoom = room.id === currentRoomId;

          return (
            <g key={room.id}>
              <rect
                x={mx}
                y={my}
                width={mw}
                height={mh}
                rx={2}
                fill={isCurrentRoom ? "rgba(245, 158, 11, 0.15)" : "rgba(0,0,0,0.05)"}
                stroke={isCurrentRoom ? "rgba(245, 158, 11, 0.4)" : "rgba(0,0,0,0.1)"}
                strokeWidth={isCurrentRoom ? 1.5 : 0.5}
              />
              {expanded && (
                <text
                  x={mx + mw / 2}
                  y={my + mh / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[7px] font-medium fill-foreground/60"
                >
                  {room.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Other players */}
        {players.map((p) => {
          if (p.roomId !== currentRoomId) return null;
          const { mx, my } = worldToMap(
            p.x,
            p.y,
            worldWidth,
            worldHeight,
            MAP_SIZE,
            PADDING
          );
          return (
            <circle
              key={p.id}
              cx={mx}
              cy={my}
              r={expanded ? 3 : 2}
              fill="rgba(99, 102, 241, 0.6)"
              stroke="white"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Current player */}
        <circle
          cx={playerPos.mx}
          cy={playerPos.my}
          r={expanded ? 4 : 3}
          fill="#f59e0b"
          stroke="white"
          strokeWidth={1}
        />
      </svg>
    </motion.div>
  );
}
