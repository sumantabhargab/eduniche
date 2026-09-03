/**
 * WorldRenderer — renders the 2D top-down library environment on a canvas.
 *
 * Pure canvas rendering for performance. Draws tiles, furniture,
 * decorations, players, and UI overlays.
 */

"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  createWorldMap,
  TILE,
  MAP_WIDTH,
  MAP_HEIGHT,
  ROOM_ZONES,
  getRoomAtPosition,
} from "./map";
import type { WorldPlayer, WorldChatMessage, ConnectionState, RoomId, EmojiReaction } from "./types";
import { CollisionSystem } from "./collision";
import { WORLD_CONFIG } from "./types";

// ─── Color Palette ─────────────────────────────────────────────────────────────

const COLORS = {
  floor: "#E8DCC8",
  floorDark: "#D4C8B0",
  floorWood: "#C4A882",
  wall: "#3A3330",
  wallLight: "#4A4440",
  wallBookshelf: "#4A3C30",
  bookshelf: "#5C3D2E",
  bookshelfDark: "#4A2E1E",
  desk: "#8B7355",
  deskDark: "#6B5535",
  chair: "#7A6A55",
  counter: "#6B5B4A",
  lamp: "#F5E6C8",
  plant: "#5A7A4A",
  plantDark: "#3A5A2A",
  carpet: "#B8A888",
  carpetDark: "#A89878",
  pillar: "#5A5550",
  window: "#87CEEB",
  door: "#6B5B4A",
  roomLabel: "rgba(250, 248, 245, 0.7)",
  roomLabelBg: "rgba(26, 26, 26, 0.6)",
  playerShadow: "rgba(0, 0, 0, 0.2)",
  connectionDot: "#4ADE80",
  connectionDotPulse: "rgba(74, 222, 128, 0.4)",
} as const;

const AVATAR_COLORS = [
  "#B8710E",
  "#4A7A5A",
  "#6A5A8A",
  "#8A4A4A",
  "#4A6A8A",
  "#8A7A3A",
  "#7A5A6A",
  "#5A8A7A",
];

interface WorldRendererProps {
  localPlayer: WorldPlayer;
  remotePlayers: WorldPlayer[];
  messages: WorldChatMessage[];
  connectionState: ConnectionState;
  tileSize?: number;
  className?: string;
  onRoomChange?: (roomId: string | null) => void;
  onMessageSend?: (content: string) => void;
  /** Emoji reactions to render floating above players */
  emojiReactions?: EmojiReaction[];
  /** Room IDs for minimap population dots */
  roomPopulations?: Record<string, number>;
}

export function WorldRenderer({
  localPlayer,
  remotePlayers,
  messages,
  connectionState,
  tileSize = WORLD_CONFIG.tileSize,
  className = "",
  onRoomChange,
  onMessageSend,
  emojiReactions = [],
  roomPopulations = {},
}: WorldRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef(createWorldMap());
  const cameraRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef<number>(0);
  const animationRef = useRef<number>(0);
  const currentRoomRef = useRef<string | null>(null);
  const scaleRef = useRef(1);
  const localPlayerRef = useRef(localPlayer);
  const remotePlayersRef = useRef(remotePlayers);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync with latest props so the render loop always reads
  // current player positions without needing to re-subscribe the effect.
  useEffect(() => {
    localPlayerRef.current = localPlayer;
  }, [localPlayer]);

  useEffect(() => {
    remotePlayersRef.current = remotePlayers;
  }, [remotePlayers]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    // Calculate scale to fit the map
    const scaleX = rect.width / (MAP_WIDTH * tileSize);
    const scaleY = rect.height / (MAP_HEIGHT * tileSize);
    scaleRef.current = Math.max(0.4, Math.min(1.5, Math.min(scaleX, scaleY) * 0.9));
  }, [tileSize]);

  // ─── Tile Drawing ───────────────────────────────────────────────────────────

  const drawTile = useCallback(
    (ctx: CanvasRenderingContext2D, col: number, row: number, tileType: string, animTime: number) => {
      const s = tileSize * scaleRef.current;
      const x = col * s;
      const y = row * s;
      const sc = scaleRef.current;

      switch (tileType) {
        case "floor":
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          if ((col + row) % 4 === 0) {
            ctx.fillStyle = "rgba(0,0,0,0.015)";
            ctx.fillRect(x, y, s, s);
          }
          break;

        case "floor_dark":
          ctx.fillStyle = COLORS.floorDark;
          ctx.fillRect(x, y, s, s);
          break;

        case "floor_wood":
          ctx.fillStyle = COLORS.floorWood;
          ctx.fillRect(x, y, s, s);
          ctx.strokeStyle = "rgba(0,0,0,0.04)";
          ctx.lineWidth = sc;
          for (let i = 1; i < 3; i++) {
            const ly = y + (s / 3) * i;
            ctx.beginPath();
            ctx.moveTo(x, ly);
            ctx.lineTo(x + s, ly);
            ctx.stroke();
          }
          break;

        case "wall":
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = "rgba(255,255,255,0.03)";
          ctx.fillRect(x, y, s, sc);
          break;

        case "wall_bookshelf":
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = COLORS.wallBookshelf;
          ctx.fillRect(x + sc, y + sc, s - 2 * sc, s - 2 * sc);
          ctx.fillStyle = "#8B4513";
          ctx.fillRect(x + sc * 1.5, y + sc * 1.5, sc * 4, s - sc * 3);
          ctx.fillStyle = "#654321";
          ctx.fillRect(x + sc * 3, y + sc * 1.5, sc * 3, s - sc * 3);
          ctx.fillStyle = "#8B6914";
          ctx.fillRect(x + sc * 4.5, y + sc * 1.5, sc * 5, s - sc * 3);
          ctx.fillStyle = "#6B4226";
          ctx.fillRect(x + sc * 7, y + sc * 1.5, sc * 4, s - sc * 3);
          ctx.fillStyle = "#7B5B3A";
          ctx.fillRect(x + sc * 9.5, y + sc * 1.5, sc * 3, s - sc * 3);
          break;

        case "bookshelf":
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = COLORS.bookshelf;
          ctx.fillRect(x + sc, y + sc, s - 2 * sc, s - 2 * sc);
          ctx.fillStyle = COLORS.bookshelfDark;
          ctx.fillRect(x + sc, y + s * 0.35, s - 2 * sc, sc * 1.5);
          ctx.fillRect(x + sc, y + s * 0.7, s - 2 * sc, sc * 1.5);
          const bc = ["#8B4513", "#654321", "#8B6914", "#6B4226", "#7B5B3A", "#5B3A1A"];
          for (let i = 0; i < 5; i++) {
            ctx.fillStyle = bc[i];
            ctx.fillRect(x + sc * 2 + i * sc * 1.3, y + sc * 2, sc * 0.9, s * 0.28);
          }
          break;

        case "desk":
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = COLORS.desk;
          ctx.fillRect(x + sc * 2, y + sc * 2, s - 4 * sc, s - 4 * sc);
          ctx.fillStyle = COLORS.deskDark;
          ctx.fillRect(x + sc * 2, y + s - 3 * sc, s - 4 * sc, sc);
          ctx.fillStyle = "#8B7355";
          ctx.fillRect(x + sc * 6, y + sc * 4, sc * 8, sc * 4);
          ctx.fillStyle = "#333";
          ctx.fillRect(x + sc * 7, y + sc * 3, sc * 6, sc * 1.5);
          break;

        case "chair":
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = COLORS.chair;
          ctx.fillRect(x + sc * 3, y + sc * 2, s - 6 * sc, s * 0.35);
          ctx.fillRect(x + sc * 3, y + s * 0.42, s - 6 * sc, s * 0.35);
          break;

        case "plant":
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = "#8B7355";
          ctx.fillRect(x + s * 0.3, y + s * 0.65, s * 0.4, s * 0.25);
          ctx.fillStyle = "#6B5335";
          ctx.fillRect(x + s * 0.3, y + s * 0.85, s * 0.4, sc);
          ctx.fillStyle = COLORS.plant;
          ctx.beginPath();
          ctx.arc(x + s * 0.5, y + s * 0.4, s * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = COLORS.plantDark;
          ctx.beginPath();
          ctx.arc(x + s * 0.38, y + s * 0.33, s * 0.18, 0, Math.PI * 2);
          ctx.fill();
          break;

        case "lamp":
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = "#B8A070";
          ctx.fillRect(x + s * 0.45, y + s - sc * 2, sc * 1.2, sc * 2.5);
          ctx.fillStyle = COLORS.lamp;
          ctx.beginPath();
          ctx.moveTo(x + sc * 2, y + s * 0.4);
          ctx.lineTo(x + s - sc * 2, y + s * 0.4);
          ctx.lineTo(x + s - sc * 5, y + s * 0.1);
          ctx.lineTo(x + sc * 5, y + s * 0.1);
          ctx.closePath();
          ctx.fill();
          const ga = 0.06 + Math.sin(animTime * 0.002) * 0.015;
          ctx.fillStyle = `rgba(245, 230, 200, ${ga})`;
          ctx.beginPath();
          ctx.arc(x + s * 0.5, y + s * 0.5, s * 1.3, 0, Math.PI * 2);
          ctx.fill();
          break;

        case "window":
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = COLORS.window;
          ctx.fillRect(x + sc * 2, y + sc * 2, s - 4 * sc, s - 4 * sc);
          ctx.fillStyle = "rgba(255,255,230,0.08)";
          ctx.fillRect(x + sc * 2, y + sc * 2, s - 4 * sc, s - 4 * sc);
          ctx.strokeStyle = COLORS.wallLight;
          ctx.lineWidth = sc;
          ctx.strokeRect(x + sc * 2, y + sc * 2, s - 4 * sc, s - 4 * sc);
          ctx.beginPath();
          ctx.moveTo(x + s * 0.5, y + sc * 2);
          ctx.lineTo(x + s * 0.5, y + s - sc * 2);
          ctx.moveTo(x + sc * 2, y + s * 0.5);
          ctx.lineTo(x + s - sc * 2, y + s * 0.5);
          ctx.stroke();
          break;

        case "door":
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = COLORS.door;
          ctx.fillRect(x + sc * 2, y + sc * 2, s - 4 * sc, s - 2 * sc);
          ctx.fillStyle = "#C8A860";
          ctx.beginPath();
          ctx.arc(x + s - sc * 5, y + s * 0.5, sc * 0.8, 0, Math.PI * 2);
          ctx.fill();
          break;

        case "carpet":
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = COLORS.carpet;
          ctx.fillRect(x + sc, y + sc, s - 2 * sc, s - 2 * sc);
          ctx.strokeStyle = COLORS.carpetDark;
          ctx.lineWidth = sc * 0.5;
          ctx.strokeRect(x + sc * 2, y + sc * 2, s - 4 * sc, s - 4 * sc);
          break;

        case "pillar":
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = COLORS.pillar;
          ctx.beginPath();
          ctx.roundRect(x + sc * 2, y + sc * 2, s - 4 * sc, s - 4 * sc, sc * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.04)";
          ctx.fillRect(x + sc * 3, y + sc * 3, sc, s - 6 * sc);
          break;

        case "counter":
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = COLORS.counter;
          ctx.fillRect(x + sc, y + sc, s - 2 * sc, s - 2 * sc);
          ctx.fillStyle = "rgba(255,255,255,0.04)";
          ctx.fillRect(x + sc * 2, y + sc * 2, s - 4 * sc, sc);
          break;
      }
    },
    [tileSize]
  );

  // ─── Player Drawing ─────────────────────────────────────────────────────────

  const drawPlayer = useCallback(
    (ctx: CanvasRenderingContext2D, player: WorldPlayer, scale: number, isLocal: boolean) => {
      // Use displayX/displayY for smooth interpolation
      const px = (player.displayX ?? player.x) * scale;
      const py = (player.displayY ?? player.y) * scale;
      const r = 10 * scale;

      // Shadow
      ctx.fillStyle = COLORS.playerShadow;
      ctx.beginPath();
      ctx.ellipse(px, py + r * 0.7, r * 0.8, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      const color = AVATAR_COLORS[player.colorIndex % AVATAR_COLORS.length];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();

      if (isLocal) {
        ctx.strokeStyle = "#F5E6C8";
        ctx.lineWidth = 2.5 * scale;
        ctx.beginPath();
        ctx.arc(px, py, r + 2 * scale, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.lineWidth = scale;
        ctx.beginPath();
        ctx.arc(px, py, r + scale, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Initial
      ctx.fillStyle = "#FFF";
      ctx.font = `bold ${Math.round(8 * scale)}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText((player.label || "?").charAt(0).toUpperCase(), px, py);

      // Mute indicator
      if (player.isMuted) {
        ctx.fillStyle = "#C43E3E";
        ctx.beginPath();
        ctx.arc(px + r * 0.7, py - r * 0.7, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Floating name tag
      const label = player.label || "Student";
      ctx.font = `${Math.round(10 * scale)}px Inter, sans-serif`;
      const textW = ctx.measureText(label).width;
      const tagPadX = 6 * scale;
      const tagPadY = 3 * scale;
      const tagW = textW + tagPadX * 2;
      const tagH = 14 * scale + tagPadY * 2;
      const tagY = py + r + 8 * scale;

      ctx.fillStyle = isLocal
        ? "rgba(245, 230, 200, 0.18)"
        : "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.roundRect(px - tagW / 2, tagY, tagW, tagH, 4 * scale);
      ctx.fill();

      ctx.fillStyle = isLocal ? "#F5E6C8" : "rgba(255,255,255,0.9)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, px, tagY + tagH / 2);
    },
    []
  );

  // ─── Room Label Drawing ─────────────────────────────────────────────────────

  const drawRoomLabel = useCallback(
    (ctx: CanvasRenderingContext2D, zone: typeof ROOM_ZONES[0], scale: number) => {
      const [rx, ry, rw, rh] = zone.bounds;
      const cx = (rx + rw / 2) * tileSize * scale;
      const cy = (ry + rh / 2) * tileSize * scale;

      ctx.fillStyle = COLORS.roomLabelBg;
      ctx.beginPath();
      ctx.roundRect(cx - 55, cy - 8, 110, 16, 4);
      ctx.fill();

      ctx.fillStyle = COLORS.roomLabel;
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(zone.name, cx, cy);
    },
    [tileSize]
  );

  // ─── Minimap Drawing ────────────────────────────────────────────────────────

  const drawMinimap = useCallback((
    ctx: CanvasRenderingContext2D,
    localPlayer: WorldPlayer,
    remotePlayers: WorldPlayer[],
    w: number,
    h: number,
    scale: number,
    roomPopulations: Record<string, number> = {}
  ) => {
      const mmW = 120;
      const mmH = 90;
      const mmX = w - mmW - 16;
      const mmY = h - mmH - 16;
      const mmScale = mmW / (MAP_WIDTH * tileSize * scale);

      ctx.fillStyle = "rgba(26, 26, 26, 0.85)";
      ctx.beginPath();
      ctx.roundRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const map = mapRef.current;
      for (let row = 0; row < MAP_HEIGHT; row++) {
        for (let col = 0; col < MAP_WIDTH; col++) {
          const tile = map[row]?.[col];
          if (tile === "wall" || tile === "wall_bookshelf") {
            ctx.fillStyle = "rgba(255,255,255,0.2)";
          } else if (tile === "desk" || tile === "bookshelf" || tile === "pillar") {
            ctx.fillStyle = "rgba(255,255,255,0.08)";
          } else if (tile === "carpet") {
            ctx.fillStyle = "rgba(255,255,255,0.05)";
          } else {
            ctx.fillStyle = "rgba(255,255,255,0.02)";
          }
          ctx.fillRect(
            mmX + col * tileSize * scale * mmScale,
            mmY + row * tileSize * scale * mmScale,
            tileSize * scale * mmScale + 0.5,
            tileSize * scale * mmScale + 0.5
          );
        }
      }

      for (const p of remotePlayers) {
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.beginPath();
        ctx.arc(mmX + p.x * mmScale, mmY + p.y * mmScale, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#F5E6C8";
      ctx.beginPath();
      ctx.arc(mmX + localPlayer.x * mmScale, mmY + localPlayer.y * mmScale, 3, 0, Math.PI * 2);
      ctx.fill();

      // Room population dots — one dot per person in each room
      const entries = Object.entries(roomPopulations).filter(([, count]) => count > 0);
      for (const [roomId, count] of entries) {
        const zone = ROOM_ZONES.find(z => z.id === roomId);
        if (!zone) continue;
        const [rx, ry, rw, rh] = zone.bounds;
        const dotX = mmX + (rx + rw / 2) * tileSize * scale * mmScale;
        const dotY = mmY + (ry + rh / 2) * tileSize * scale * mmScale;
        const dotR = Math.min(5, 2 + count * 0.8);

        // Pulsing glow — no 'now' param needed; use a fixed ambient pulse
        const glowAlpha = 0.18;
        ctx.fillStyle = `rgba(245, 230, 200, ${glowAlpha})`;
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotR + 3, 0, Math.PI * 2);
        ctx.fill();

        // Dot
        ctx.fillStyle = "rgba(245, 230, 200, 0.85)";
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
        ctx.fill();

        // Count label
        if (count > 1) {
          ctx.fillStyle = "rgba(0,0,0,0.8)";
          ctx.font = `bold ${Math.round(7)}px Inter, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(count), dotX, dotY + 0.5);
        }
      }

      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "8px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Map", mmX + mmW / 2, mmY - 6);
    },
    [tileSize]
  );

  // ─── Main Render Loop ───────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    resizeCanvas();

    const render = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const scale = scaleRef.current;

      ctx.save();

      // Background
      ctx.fillStyle = "#1A1A1A";
      ctx.fillRect(0, 0, w, h);

      // Camera — use refs for live-updated player positions
      const currentLocal = localPlayerRef.current;
      const currentRemote = remotePlayersRef.current;
      const targetCamX = currentLocal.x * scale - w / 2;
      const targetCamY = currentLocal.y * scale - h / 2;
      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.1;
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.1;
      const camX = cameraRef.current.x;
      const camY = cameraRef.current.y;

      // Tiles
      const startCol = Math.max(0, Math.floor(camX / (tileSize * scale)));
      const startRow = Math.max(0, Math.floor(camY / (tileSize * scale)));
      const endCol = Math.min(MAP_WIDTH, Math.ceil((camX + w) / (tileSize * scale)) + 1);
      const endRow = Math.min(MAP_HEIGHT, Math.ceil((camY + h) / (tileSize * scale)) + 1);

      const map = mapRef.current;
      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          const tileType = map[row]?.[col];
          if (tileType) {
            const drawX = col * tileSize * scale;
            const drawY = row * tileSize * scale;
            ctx.save();
            ctx.translate(-camX, -camY);
            drawTile(ctx, col, row, tileType, time);
            ctx.restore();
          }
        }
      }

      // Room labels
      ctx.save();
      ctx.translate(-camX, -camY);
      for (const zone of ROOM_ZONES) {
        const [rx, ry, rw, rh] = zone.bounds;
        if (
          (rx + rw) * tileSize * scale >= camX &&
          rx * tileSize * scale <= camX + w &&
          (ry + rh) * tileSize * scale >= camY &&
          ry * tileSize * scale <= camY + h
        ) {
          drawRoomLabel(ctx, zone, scale);
        }
      }
      ctx.restore();

      // Players
      ctx.save();
      ctx.translate(-camX, -camY);
      for (const p of currentRemote) {
        drawPlayer(ctx, p, scale, false);
      }
      drawPlayer(ctx, currentLocal, scale, true);

      // Emoji reactions (floating above heads)
      const now = Date.now();
      for (const emoji of emojiReactions) {
        const elapsed = now - emoji.timestamp;
        const progress = elapsed / emoji.ttl;
        if (progress > 1) continue;

        const player = [...currentRemote, currentLocal].find(p => p.id === emoji.playerId);
        if (!player) continue;

        const ex = (player.displayX ?? player.x) * scale;
        const ey = (player.displayY ?? player.y) * scale;
        const floatY = -30 * scale - progress * 25 * scale;
        const alpha = 1 - progress;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `${Math.round(16 * scale + (1 - progress) * 4 * scale)}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(emoji.emoji, ex, ey + floatY);
        ctx.restore();
      }
      ctx.restore();

      // Connection status
      const dotColor =
        connectionState === "connected"
          ? COLORS.connectionDot
          : connectionState === "connecting" || connectionState === "reconnecting"
          ? "#F5B041"
          : "#C43E3E";

      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(w - 20, 20, 5, 0, Math.PI * 2);
      ctx.fill();

      if (connectionState === "connecting" || connectionState === "reconnecting") {
        ctx.strokeStyle = COLORS.connectionDotPulse;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(w - 20, 20, 10 + Math.sin(time * 0.005) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "right";
      const statusText =
        connectionState === "connected"
          ? "Connected"
          : connectionState === "connecting"
          ? "Entering library..."
          : connectionState === "reconnecting"
          ? "Reconnecting..."
          : "Offline";
      ctx.fillText(statusText, w - 30, 24);

      // Room name (top-left)
      const currentRoom = getRoomAtPosition(localPlayer.x, localPlayer.y, tileSize);
      if (currentRoom) {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.font = "11px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(currentRoom.name, 16, 24);
      }

      // Minimap
      drawMinimap(ctx, localPlayer, remotePlayers, w, h, scale, roomPopulations);

      ctx.restore();

      animationRef.current = requestAnimationFrame(render);
    };

    const frameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [tileSize, drawTile, drawPlayer, drawRoomLabel, drawMinimap, resizeCanvas]);

  // ─── Resize Handler ─────────────────────────────────────────────────────────

  useEffect(() => {
    const handleResize = () => resizeCanvas();
    window.addEventListener("resize", handleResize);

    // Use ResizeObserver to catch layout settling after mount
    const observer = new ResizeObserver(() => resizeCanvas());
    const container = containerRef.current;
    if (container) observer.observe(container);

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [resizeCanvas]);

  // ─── Room Change Detection ──────────────────────────────────────────────────

  useEffect(() => {
    const room = getRoomAtPosition(localPlayer.x, localPlayer.y, tileSize);
    const roomId = room?.id ?? null;
    if (roomId !== currentRoomRef.current) {
      currentRoomRef.current = roomId;
      onRoomChange?.(roomId);
    }
  }, [localPlayer.x, localPlayer.y, tileSize, onRoomChange]);

  // ─── Keyboard: Enter to toggle chat ────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.key === "Enter" && !target?.closest?.("input, textarea")) {
        setShowChat((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowChat(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSendMessage = () => {
    if (chatInput.trim() && onMessageSend) {
      onMessageSend(chatInput.trim());
      setChatInput("");
    }
  };

  // ─── Chat Overlay ───────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden bg-[#1A1A1A] ${className}`}>
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Chat overlay */}
      {showChat && (
        <div className="absolute bottom-4 right-4 w-80 bg-background-dark/90 backdrop-blur-md border border-border-light rounded-xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border-light">
            <span className="text-xs font-medium text-foreground-light">Library Chat</span>
            <button
              onClick={() => setShowChat(false)}
              className="text-muted-light hover:text-foreground-light text-xs"
            >
              ✕
            </button>
          </div>
          <div className="h-64 overflow-y-auto px-3 py-2 space-y-1.5">
            {messages.length === 0 && (
              <p className="text-xs text-muted-light text-center py-4">No messages yet. Say hello!</p>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`text-xs ${msg.type === "system" ? "text-center" : ""}`}>
                {msg.type === "system" ? (
                  <span className="text-muted-light bg-foreground/5 px-2 py-1 rounded-full">
                    {msg.content}
                  </span>
                ) : (
                  <div className={msg.authorId === localPlayer.id ? "text-right" : "text-left"}>
                    <span className="text-muted-light text-[10px]">{msg.authorLabel}</span>
                    <p
                      className={`inline-block px-2.5 py-1 rounded-xl max-w-[90%] ${
                        msg.authorId === localPlayer.id
                          ? "bg-accent text-foreground"
                          : "bg-foreground/10 text-foreground-light"
                      }`}
                    >
                      {msg.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="px-3 py-2 border-t border-border-light">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 px-2.5 py-1.5 bg-foreground/10 border border-border-light rounded-lg text-xs text-foreground-light placeholder:text-muted-light focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className="px-3 py-1.5 bg-accent text-foreground rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat toggle button */}
      <button
        onClick={() => setShowChat((prev) => !prev)}
        className="absolute bottom-4 right-4 w-10 h-10 bg-foreground-dark/80 backdrop-blur-md border border-border-light rounded-full flex items-center justify-center text-foreground-light hover:bg-foreground-dark transition-colors shadow-lg"
        title="Toggle chat (Enter)"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M2.25 12.76c0 1.06.84 1.97 1.98 2.18a47.01 47.01 0 005.7 1.13c1.06.12 2.12.17 3.2.12a1 1 0 01.85 1v1.88a1 1 0 01-1 1h-1.05a4.97 4.97 0 01-2.44-.65 50.06 50.06 0 01-8.63-4.37A7.97 7.97 0 012.25 12V8.25m0 0a7.97 7.97 0 0112.53-3.13L21 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 bg-foreground-dark/60 backdrop-blur-sm border border-border-light/50 rounded-lg px-3 py-2">
        <p className="text-[10px] text-muted-light leading-relaxed">
          <span className="text-foreground-light/70">WASD</span> Move
          {" · "}
          <span className="text-foreground-light/70">Enter</span> Chat
        </p>
      </div>
    </div>
  );
}
