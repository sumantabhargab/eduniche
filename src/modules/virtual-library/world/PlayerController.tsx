/**
 * PlayerController — handles WASD/arrow key input, collision-aware movement,
 * and local player state management.
 */

"use client";

import { useEffect, useCallback, useRef } from "react";
import { CollisionSystem } from "./collision";
import type { WorldPlayer, RoomId, ConnectionState } from "./types";
import { WORLD_CONFIG } from "./types";

interface PlayerControllerProps {
  onPlayerUpdate: (player: Partial<WorldPlayer>) => void;
  onRoomChange: (roomId: string | null) => void;
  onChatMessage: (content: string) => void;
  initialPosition?: { x: number; y: number };
  className?: string;
  children?: React.ReactNode;
}

export function PlayerController({
  onPlayerUpdate,
  onRoomChange,
  onChatMessage,
  initialPosition,
  className = "",
  children,
}: PlayerControllerProps) {
  const collisionRef = useRef<CollisionSystem | null>(null);
  const positionRef = useRef<{ x: number; y: number }>(
    initialPosition || { x: 0, y: 0 }
  );
  const keysRef = useRef<Set<string>>(new Set());
  const lastBroadcastRef = useRef<number>(0);
  const broadcastIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize collision system
  useEffect(() => {
    collisionRef.current = new CollisionSystem(WORLD_CONFIG);
    const spawn = collisionRef.current.getSpawnPosition();
    positionRef.current = { x: spawn.x, y: spawn.y };
  }, []);

  // Keyboard input handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        e.preventDefault();
        keysRef.current.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Game loop — movement + collision
  useEffect(() => {
    const collision = collisionRef.current;
    if (!collision) return;

    let lastTime = performance.now();

    const gameLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const keys = keysRef.current;
      let dx = 0;
      let dy = 0;

      if (keys.has("w") || keys.has("arrowup")) dy -= 1;
      if (keys.has("s") || keys.has("arrowdown")) dy += 1;
      if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
      if (keys.has("d") || keys.has("arrowright")) dx += 1;

      // Normalize diagonal movement
      if (dx !== 0 && dy !== 0) {
        const inv = 1 / Math.sqrt(2);
        dx *= inv;
        dy *= inv;
      }

      if (dx !== 0 || dy !== 0) {
        const speed = WORLD_CONFIG.playerSpeed;
        const newX = positionRef.current.x + dx * speed * dt;
        const newY = positionRef.current.y + dy * speed * dt;

        const result = collision.resolveMovement(
          positionRef.current.x,
          positionRef.current.y,
          newX,
          newY
        );

        positionRef.current = { x: result.x, y: result.y };

        // Check room change
        const room = collision.getTileAt(result.x, result.y);
        const currentRoom = getRoomAtPosition(result.x, result.y, WORLD_CONFIG.tileSize);
        onRoomChange(currentRoom?.id ?? null);

        // Broadcast position
        const now = Date.now();
        if (now - lastBroadcastRef.current > WORLD_CONFIG.broadcastInterval) {
          lastBroadcastRef.current = now;
          onPlayerUpdate({
            x: result.x,
            y: result.y,
            dx,
            dy,
            isMoving: true,
            targetX: newX,
            targetY: newY,
            lastUpdate: now,
          });
        }
      } else {
        // Not moving — send stop update periodically
        const now = Date.now();
        if (now - lastBroadcastRef.current > 500) {
          lastBroadcastRef.current = now;
          onPlayerUpdate({
            dx: 0,
            dy: 0,
            isMoving: false,
            lastUpdate: now,
          });
        }
      }

      return requestAnimationFrame(gameLoop);
    };

    const frameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameId);
  }, [onPlayerUpdate, onRoomChange, onChatMessage]);

  // Periodic position broadcast
  useEffect(() => {
    broadcastIntervalRef.current = setInterval(() => {
      const { x, y } = positionRef.current;
      onPlayerUpdate({
        x,
        y,
        isMoving: keysRef.current.size > 0,
        lastUpdate: Date.now(),
      });
    }, WORLD_CONFIG.broadcastInterval);

    return () => {
      if (broadcastIntervalRef.current) {
        clearInterval(broadcastIntervalRef.current);
      }
    };
  }, [onPlayerUpdate]);

  return (
    <div className={`${className}`} style={{ position: "relative" }}>
      {children}
    </div>
  );
}

/**
 * Get room at position (duplicated here to avoid circular import).
 */
function getRoomAtPosition(
  px: number,
  py: number,
  tileSize: number
): { id: string; name: string } | null {
  const col = Math.floor(px / tileSize);
  const row = Math.floor(py / tileSize);

  const zones: Array<{ id: string; name: string; bounds: [number, number, number, number] }> = [
    { id: "entrance", name: "Entrance Hall", bounds: [16, 0, 8, 2] },
    { id: "main-reading", name: "Main Reading Area", bounds: [1, 11, 18, 16] },
    { id: "quiet-zone", name: "Quiet Zone", bounds: [1, 2, 18, 9] },
    { id: "group-study", name: "Group Study Area", bounds: [20, 2, 19, 9] },
    { id: "discussion-room", name: "Discussion Room", bounds: [20, 11, 18, 5] },
    { id: "booth-1", name: "Private Booth 1", bounds: [1, 27, 6, 2] },
    { id: "booth-2", name: "Private Booth 2", bounds: [8, 27, 6, 2] },
    { id: "booth-3", name: "Private Booth 3", bounds: [29, 27, 6, 2] },
    { id: "booth-4", name: "Private Booth 4", bounds: [34, 27, 5, 2] },
  ];

  for (const zone of zones) {
    const [rx, ry, rw, rh] = zone.bounds;
    if (col >= rx && col < rx + rw && row >= ry && row < ry + rh) {
      return zone;
    }
  }
  return null;
}
