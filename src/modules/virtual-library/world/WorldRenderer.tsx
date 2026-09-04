/**
 * WorldRenderer — renders the 2D top-down library environment on a canvas.
 *
 * Pure canvas rendering for performance. Draws tiles, furniture,
 * decorations, players, and UI overlays with atmospheric lighting.
 */

"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import {
  createWorldMap,
  TILE,
  MAP_WIDTH,
  MAP_HEIGHT,
  ROOM_ZONES,
  getRoomAtPosition,
} from "./map";
import type { WorldPlayer, WorldChatMessage, ConnectionState, RoomId, EmojiReaction } from "./types";
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
  playerShadow: "rgba(0, 0, 0, 0.25)",
  connectionDot: "#4ADE80",
  connectionDotPulse: "rgba(74, 222, 128, 0.4)",
} as const;

const AVATAR_COLORS = [
  "#B8710E", "#4A7A5A", "#6A5A8A", "#8A4A4A",
  "#4A6A8A", "#8A7A3A", "#7A5A6A", "#5A8A7A",
];

const BOOK_SPINES = [
  "#8B0000","#006400","#00008B","#8B4513","#4B0082",
  "#2F4F4F","#800000","#556B2F","#191970","#8B6914",
  "#A0522D","#2E8B57","#6A5ACD","#CD853F","#4682B4",
  "#B22222","#228B22","#483D8B","#B8860B","#696969",
  "#D2691E","#3CB371","#7B68EE","#BC8F8F","#5F9EA0",
];

const ZONE_AMBIENT: Record<string, string> = {
  entrance:       "rgba(255, 248, 231, 0.025)",
  "main-reading": "rgba(255, 251, 230, 0.03)",
  "quiet-zone":   "rgba(232, 238, 255, 0.025)",
  "group-study":  "rgba(255, 245, 230, 0.04)",
  "discussion-room": "rgba(255, 232, 240, 0.04)",
  "booth-1": "rgba(240, 244, 255, 0.02)",
  "booth-2": "rgba(240, 244, 255, 0.02)",
  "booth-3": "rgba(240, 244, 255, 0.02)",
  "booth-4": "rgba(240, 244, 255, 0.02)",
};

// Pure color helpers — stable references, no re-creation
function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#",""), 16);
  const r = Math.min(255, (n>>16)+amt);
  const g = Math.min(255, ((n>>8)&0xFF)+amt);
  const b = Math.min(255, (n&0xFF)+amt);
  return `rgb(${r},${g},${b})`;
}
function darken(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#",""), 16);
  const r = Math.max(0, (n>>16)-amt);
  const g = Math.max(0, ((n>>8)&0xFF)-amt);
  const b = Math.max(0, (n&0xFF)-amt);
  return `rgb(${r},${g},${b})`;
}

// Seeded pseudo-random — stable, no re-creation
function srand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface WorldRendererProps {
  localPlayer: WorldPlayer;
  remotePlayers: WorldPlayer[];
  messages: WorldChatMessage[];
  connectionState: ConnectionState;
  tileSize?: number;
  className?: string;
  onRoomChange?: (roomId: string | null) => void;
  onMessageSend?: (content: string) => void;
  emojiReactions?: EmojiReaction[];
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

  // Texture caches
  const noiseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const wallCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pre-generate textures when tileSize changes
  useEffect(() => {
    // Floor noise texture
    const nSize = tileSize * 2;
    const nc = document.createElement("canvas");
    nc.width = nSize; nc.height = nSize;
    const nctx = nc.getContext("2d");
    if (nctx) {
      const img = nctx.createImageData(nSize, nSize);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 16;
        img.data[i] = v; img.data[i+1] = v; img.data[i+2] = v; img.data[i+3] = 14;
      }
      nctx.putImageData(img, 0, 0);
      noiseCanvasRef.current = nc;
    }

    // Wall brick texture
    const wc = document.createElement("canvas");
    wc.width = nSize; wc.height = nSize;
    const wctx = wc.getContext("2d");
    if (wctx) {
      wctx.fillStyle = "#3A3330";
      wctx.fillRect(0, 0, nSize, nSize);
      const bh = nSize / 6;
      for (let row = 0; row < 6; row++) {
        const off = row % 2 === 0 ? 0 : nSize / 8;
        for (let col = -1; col < 4; col++) {
          const bx = col * nSize/4 + off;
          const by = row * bh;
          wctx.fillStyle = row % 2 === 0 ? "#423a36" : "#36302c";
          wctx.fillRect(bx+1, by+1, nSize/4-2, bh-2);
        }
      }
      wctx.strokeStyle = "rgba(0,0,0,0.12)";
      wctx.lineWidth = 1;
      for (let row = 0; row <= 6; row++) {
        wctx.beginPath(); wctx.moveTo(0, row*bh); wctx.lineTo(nSize, row*bh); wctx.stroke();
      }
      const wimg = wctx.getImageData(0, 0, nSize, nSize);
      for (let i = 0; i < wimg.data.length; i += 4) {
        const v = (Math.random()-0.5)*6;
        wimg.data[i] = Math.max(0,Math.min(255,wimg.data[i]+v));
        wimg.data[i+1] = Math.max(0,Math.min(255,wimg.data[i+1]+v));
        wimg.data[i+2] = Math.max(0,Math.min(255,wimg.data[i+2]+v));
      }
      wctx.putImageData(wimg, 0, 0);
      wallCanvasRef.current = wc;
    }
  }, [tileSize]);

  // Lamp positions for lighting
  const lampPositions = useMemo(() => {
    const lamps: { x: number; y: number }[] = [];
    const map = mapRef.current;
    for (let row = 0; row < MAP_HEIGHT; row++) {
      for (let col = 0; col < MAP_WIDTH; col++) {
        if (map[row]?.[col] === "lamp") {
          lamps.push({ x: col * tileSize + tileSize/2, y: row * tileSize + tileSize/2 });
        }
      }
    }
    return lamps;
  }, [tileSize]);

  useEffect(() => { localPlayerRef.current = localPlayer; }, [localPlayer]);
  useEffect(() => { remotePlayersRef.current = remotePlayers; }, [remotePlayers]);

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
    if (ctx) { ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr, dpr); }
    const scaleX = rect.width / (MAP_WIDTH * tileSize);
    const scaleY = rect.height / (MAP_HEIGHT * tileSize);
    scaleRef.current = Math.max(0.4, Math.min(1.5, Math.min(scaleX, scaleY) * 0.9));
  }, [tileSize]);

  // ─── Seeded Random ──────────────────────────────────────────────────────────

  // (srand is now a stable module-level function)

  // ─── Color Helpers (module-level, stable refs) ───────────────────────────────
  // (lightenColor / darkenColor / srand defined above)

  // ─── Tile Drawing ───────────────────────────────────────────────────────────

  const drawTile = useCallback(
    (ctx: CanvasRenderingContext2D, col: number, row: number, tileType: string, animTime: number) => {
      const s = tileSize * scaleRef.current;
      const x = col * s;
      const y = row * s;
      const sc = scaleRef.current;
      const seed = col * 73 + row * 137;

      switch (tileType) {
        case "floor": {
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          if (noiseCanvasRef.current) { ctx.globalAlpha = 0.35; ctx.drawImage(noiseCanvasRef.current, x, y, s, s); ctx.globalAlpha = 1; }
          // Parquet lines
          if (srand(seed) > 0.5) {
            ctx.strokeStyle = "rgba(0,0,0,0.022)";
            ctx.lineWidth = sc * 0.4;
            ctx.beginPath(); ctx.moveTo(x, y+s*0.5); ctx.lineTo(x+s, y+s*0.5); ctx.stroke();
          }
          break;
        }
        case "floor_dark": {
          ctx.fillStyle = COLORS.floorDark;
          ctx.fillRect(x, y, s, s);
          if (noiseCanvasRef.current) { ctx.globalAlpha = 0.25; ctx.drawImage(noiseCanvasRef.current, x, y, s, s); ctx.globalAlpha = 1; }
          // Crosshatch
          ctx.strokeStyle = "rgba(0,0,0,0.035)";
          ctx.lineWidth = sc * 0.3;
          for (let i = 1; i < 4; i++) {
            const px = x + (s/4)*i;
            ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y+s); ctx.stroke();
          }
          break;
        }
        case "floor_wood": {
          ctx.fillStyle = COLORS.floorWood;
          ctx.fillRect(x, y, s, s);
          ctx.strokeStyle = "rgba(0,0,0,0.05)";
          ctx.lineWidth = sc;
          for (let i = 1; i < 3; i++) {
            const ly = y + (s/3)*i;
            ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x+s, ly); ctx.stroke();
          }
          if (srand(seed) > 0.85) {
            const kx = x + srand(seed+1)*s, ky = y + srand(seed+2)*s;
            ctx.fillStyle = "rgba(0,0,0,0.035)";
            ctx.beginPath(); ctx.ellipse(kx, ky, s*0.07, s*0.04, 0, 0, Math.PI*2); ctx.fill();
          }
          break;
        }
        case "wall": {
          if (wallCanvasRef.current) ctx.drawImage(wallCanvasRef.current, x, y, s, s);
          else { ctx.fillStyle = COLORS.wall; ctx.fillRect(x, y, s, s); }
          ctx.fillStyle = "rgba(255,255,255,0.02)";
          ctx.fillRect(x, y, s, sc * 1.5);
          break;
        }
        case "wall_bookshelf": {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = "#3D2E24";
          ctx.fillRect(x+sc*1.5, y+sc*1.5, s-sc*3, s-sc*3);
          ctx.fillStyle = "#6B4226";
          ctx.fillRect(x+sc*1.5, y+s*0.3, s-sc*3, sc*1.2);
          ctx.fillRect(x+sc*1.5, y+s*0.6, s-sc*3, sc*1.2);
          for (let shelf = 0; shelf < 2; shelf++) {
            let bx = x + sc*2.5;
            const by = shelf === 0 ? y+sc*1.5 : y+s*0.38;
            for (let b = 0; b < 5 && bx < x+s-sc*3; b++) {
              const bw = sc*(1+srand(seed+b*7+shelf*13)*1.5);
              ctx.fillStyle = BOOK_SPINES[Math.floor(srand(seed+b*3+shelf*17)*BOOK_SPINES.length)];
              ctx.fillRect(bx, by, bw, shelf===0 ? s*0.22 : s*0.2);
              ctx.fillStyle = "rgba(255,255,255,0.06)";
              ctx.fillRect(bx+bw*0.4, by, sc*0.3, shelf===0?s*0.22:s*0.2);
              bx += bw + sc*0.3;
            }
          }
          break;
        }
        case "bookshelf": {
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = "rgba(0,0,0,0.04)";
          ctx.fillRect(x+sc*0.5, y+sc*0.5, s-sc, s-sc);
          ctx.fillStyle = COLORS.bookshelf;
          ctx.fillRect(x+sc, y+sc, s-2*sc, s-2*sc);
          ctx.fillStyle = COLORS.bookshelfDark;
          ctx.fillRect(x+sc, y+s*0.35, s-2*sc, sc*1.5);
          ctx.fillRect(x+sc, y+s*0.7, s-2*sc, sc*1.5);
          for (let i = 0; i < 5; i++) {
            ctx.fillStyle = BOOK_SPINES[(col*3+i*7+row) % BOOK_SPINES.length];
            const bw = sc*1+srand(seed+i*5)*sc*0.7;
            ctx.fillRect(x+sc*2+i*sc*1.4, y+sc*2, bw, s*0.28);
            ctx.fillStyle = "rgba(218,185,130,0.12)";
            ctx.fillRect(x+sc*2.3+i*sc*1.4, y+sc*3.2, bw*0.4, sc*0.4);
          }
          break;
        }
        case "desk": {
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = "rgba(0,0,0,0.04)";
          ctx.beginPath(); ctx.roundRect(x+sc*1.5, y+sc*1.5, s-3*sc, s-3*sc, sc*2); ctx.fill();
          ctx.fillStyle = COLORS.desk;
          ctx.beginPath(); ctx.roundRect(x+sc*2, y+sc*2, s-4*sc, s-4*sc, sc*1.5); ctx.fill();
          // Wood grain
          ctx.strokeStyle = "rgba(0,0,0,0.035)";
          ctx.lineWidth = sc*0.3;
          for (let i = 1; i < 4; i++) { const gy = y+sc*2+(s-4*sc)*(i/4); ctx.beginPath(); ctx.moveTo(x+sc*2,gy); ctx.lineTo(x+s-sc*2,gy); ctx.stroke(); }
          // Open book
          ctx.fillStyle = "#F5F0E8";
          ctx.beginPath(); ctx.ellipse(x+s*0.5, y+s*0.42, s*0.22, s*0.1, 0, 0, Math.PI*2); ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.08)";
          ctx.lineWidth = sc*0.3;
          ctx.beginPath(); ctx.moveTo(x+s*0.5, y+s*0.33); ctx.lineTo(x+s*0.5, y+s*0.51); ctx.stroke();
          // Pen
          ctx.strokeStyle = "#2a4a8a";
          ctx.lineWidth = sc*0.5;
          ctx.beginPath(); ctx.moveTo(x+s*0.55, y+s*0.44); ctx.lineTo(x+s*0.72, y+s*0.52); ctx.stroke();
          // Drawer knob
          ctx.fillStyle = "#D4AF37";
          ctx.beginPath(); ctx.arc(x+s*0.6, y+s*0.69, sc*0.8, 0, Math.PI*2); ctx.fill();
          break;
        }
        case "chair": {
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = "#6B5D4A";
          ctx.beginPath(); ctx.roundRect(x+sc*3, y+sc*2, s-6*sc, s*0.3, sc*0.5); ctx.fill();
          ctx.fillStyle = "#7A6C58";
          ctx.beginPath(); ctx.roundRect(x+sc*3, y+sc*0.5, s-6*sc, s*0.28, sc*0.5); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.03)";
          ctx.fillRect(x+sc*4, y+sc*1, s-8*sc, sc*0.8);
          break;
        }
        case "plant": {
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          // Pot
          ctx.fillStyle = "#B8956A";
          ctx.beginPath();
          ctx.moveTo(x+s*0.32, y+s*0.55);
          ctx.lineTo(x+s*0.68, y+s*0.55);
          ctx.lineTo(x+s*0.62, y+s*0.82);
          ctx.lineTo(x+s*0.38, y+s*0.82);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = "#C4A87A";
          ctx.fillRect(x+s*0.28, y+s*0.52, s*0.44, sc*1.2);
          // Leaves
          const leafColors = ["#4A8A3A","#3D7A2E","#5A9A4A","#4D8A3D"];
          for (let i = 0; i < 4; i++) {
            const a = (i/4)*Math.PI*2+0.3;
            const lx = x+s*0.5+Math.cos(a)*s*0.2;
            const ly = y+s*0.38+Math.sin(a)*s*0.1;
            ctx.fillStyle = leafColors[i];
            ctx.beginPath(); ctx.ellipse(lx, ly, s*0.16, s*0.1, a, 0, Math.PI*2); ctx.fill();
          }
          ctx.fillStyle = "#3D7A2E";
          ctx.beginPath(); ctx.ellipse(x+s*0.5, y+s*0.25, s*0.1, s*0.18, 0, 0, Math.PI*2); ctx.fill();
          break;
        }
        case "lamp": {
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          // Base
          ctx.fillStyle = "#9B8B75";
          ctx.fillRect(x+s*0.42, y+s-sc*2, sc*1.6, sc*2);
          // Pole
          ctx.fillStyle = "#B8A880";
          ctx.fillRect(x+s*0.47, y+s*0.2, sc*0.6, s*0.75);
          // Shade
          ctx.fillStyle = COLORS.lamp;
          ctx.beginPath();
          ctx.moveTo(x+sc*2.5, y+s*0.22);
          ctx.lineTo(x+s-sc*2.5, y+s*0.22);
          ctx.lineTo(x+s-sc*5, y+s*0.08);
          ctx.lineTo(x+sc*5, y+s*0.08);
          ctx.closePath(); ctx.fill();
          // Inner shadow
          ctx.fillStyle = "rgba(180,140,90,0.25)";
          ctx.beginPath();
          ctx.moveTo(x+sc*3.5, y+s*0.22);
          ctx.lineTo(x+s-sc*3.5, y+s*0.22);
          ctx.lineTo(x+s-sc*5.5, y+s*0.1);
          ctx.lineTo(x+sc*5.5, y+s*0.1);
          ctx.closePath(); ctx.fill();
          // Light cone
          const ga = 0.055 + Math.sin(animTime*0.002)*0.015;
          const grad = ctx.createRadialGradient(x+s*0.5, y+s*0.3, s*0.05, x+s*0.5, y+s*0.5, s*1.5);
          grad.addColorStop(0, `rgba(245,225,180,${ga})`);
          grad.addColorStop(1, "rgba(245,225,180,0)");
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(x+s*0.5, y+s*0.5, s*1.5, 0, Math.PI*2); ctx.fill();
          break;
        }
        case "window": {
          const skyGrad = ctx.createLinearGradient(x, y, x, y+s);
          skyGrad.addColorStop(0, "#4A90C4");
          skyGrad.addColorStop(0.4, "#87CEEB");
          skyGrad.addColorStop(1, "#B0D4E8");
          ctx.fillStyle = skyGrad;
          ctx.fillRect(x+sc*2, y+sc*2, s-4*sc, s-4*sc);
          // Sun
          const sunGrad = ctx.createRadialGradient(x+s*0.65, y+s*0.25, sc, x+s*0.65, y+s*0.25, s*0.3);
          sunGrad.addColorStop(0, "rgba(255,255,230,0.3)");
          sunGrad.addColorStop(1, "rgba(255,255,230,0)");
          ctx.fillStyle = sunGrad;
          ctx.fillRect(x+sc*2, y+sc*2, s-4*sc, s-4*sc);
          // Frame
          ctx.strokeStyle = "#5A4A3A";
          ctx.lineWidth = sc*0.8;
          ctx.strokeRect(x+sc*2, y+sc*2, s-4*sc, s-4*sc);
          ctx.beginPath();
          ctx.moveTo(x+s*0.5, y+sc*2); ctx.lineTo(x+s*0.5, y+s-sc*2);
          ctx.moveTo(x+sc*2, y+s*0.5); ctx.lineTo(x+s-sc*2, y+s*0.5);
          ctx.stroke();
          // Floor light
          const fl = ctx.createLinearGradient(x, y+s, x, y+s+s*1.5);
          fl.addColorStop(0, "rgba(135,206,235,0.035)");
          fl.addColorStop(1, "rgba(135,206,235,0)");
          ctx.fillStyle = fl;
          ctx.fillRect(x, y+s, s, s*1.5);
          break;
        }
        case "door": {
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = "#5C4A38";
          ctx.fillRect(x+sc*1.5, y+sc*1.5, s-3*sc, s-3*sc);
          ctx.fillStyle = "#7A5C3E";
          ctx.fillRect(x+sc*2, y+sc*2, s-4*sc, s-2*sc);
          ctx.strokeStyle = "rgba(0,0,0,0.12)";
          ctx.lineWidth = sc*0.4;
          ctx.strokeRect(x+sc*2.5, y+sc*2.5, s*0.35, s*0.35);
          ctx.strokeRect(x+sc*2.5, y+s*0.5, s*0.35, s*0.35);
          ctx.fillStyle = "#D4AF37";
          ctx.beginPath(); ctx.arc(x+s-sc*4, y+s*0.52, sc*0.9, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.2)";
          ctx.beginPath(); ctx.arc(x+s-sc*4.3, y+s*0.49, sc*0.3, 0, Math.PI*2); ctx.fill();
          // Floor mat
          ctx.fillStyle = "#C8B898";
          ctx.beginPath(); ctx.roundRect(x+sc*3, y+s-sc*1.5, s-6*sc, sc*1.2, sc*0.3); ctx.fill();
          break;
        }
        case "carpet": {
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          const cg = ctx.createLinearGradient(x, y, x+s, y+s);
          cg.addColorStop(0, COLORS.carpet);
          cg.addColorStop(0.5, COLORS.carpetDark);
          cg.addColorStop(1, COLORS.carpet);
          ctx.fillStyle = cg;
          ctx.beginPath(); ctx.roundRect(x+sc, y+sc, s-2*sc, s-2*sc, sc*1.5); ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.05)";
          ctx.lineWidth = sc*0.5;
          ctx.beginPath(); ctx.roundRect(x+sc*2.5, y+sc*2.5, s-5*sc, s-5*sc, sc); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x+s*0.5, y+sc*3); ctx.lineTo(x+s*0.7, y+s*0.5);
          ctx.lineTo(x+s*0.5, y+s-sc*3); ctx.lineTo(x+s*0.3, y+s*0.5);
          ctx.closePath(); ctx.stroke();
          break;
        }
        case "pillar": {
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = "rgba(0,0,0,0.05)";
          ctx.beginPath(); ctx.roundRect(x+sc*2, y+sc*2, s-4*sc, s-4*sc, sc*2); ctx.fill();
          const pg = ctx.createLinearGradient(x, y, x+s, y+s);
          pg.addColorStop(0, "#6A6560");
          pg.addColorStop(0.3, "#5A5550");
          pg.addColorStop(0.7, "#4A4540");
          pg.addColorStop(1, "#55504B");
          ctx.fillStyle = pg;
          ctx.beginPath(); ctx.roundRect(x+sc*2, y+sc*2, s-4*sc, s-4*sc, sc*2); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.04)";
          ctx.fillRect(x+sc*3, y+sc*3, sc*1.5, s-6*sc);
          ctx.fillStyle = "#6A6560";
          ctx.fillRect(x+sc, y+sc*1.2, s-2*sc, sc*1.3);
          ctx.fillRect(x+sc, y+s-sc*2.5, s-2*sc, sc*1.3);
          break;
        }
        case "counter": {
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = COLORS.counter;
          ctx.fillRect(x+sc, y+sc, s-2*sc, s-2*sc);
          ctx.fillStyle = "#7B6B5A";
          ctx.fillRect(x+sc, y+sc, s-2*sc, sc*1.5);
          ctx.fillStyle = "rgba(255,255,255,0.04)";
          ctx.fillRect(x+sc*2, y+sc*2, s-4*sc, sc);
          break;
        }
      }
    },
    [tileSize, srand]
  );

  // ─── Lighting Pass ──────────────────────────────────────────────────────────

  const drawLighting = useCallback((
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    camX: number, camY: number,
    scale: number,
    time: number
  ) => {
    // Vignette
    const vig = ctx.createRadialGradient(w/2, h/2, w*0.25, w/2, h/2, w*0.78);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    // Lamp glows
    for (const lamp of lampPositions) {
      const sx = lamp.x * scale - camX;
      const sy = lamp.y * scale - camY;
      if (sx < -150 || sx > w+150 || sy < -150 || sy > h+150) continue;
      const flicker = 0.07 + Math.sin(time*0.003+lamp.x*0.1)*0.015 + Math.sin(time*0.007+lamp.y*0.13)*0.01;
      const lg = ctx.createRadialGradient(sx, sy, 0, sx, sy, tileSize*scale*3.5);
      lg.addColorStop(0, `rgba(245,225,180,${flicker})`);
      lg.addColorStop(0.3, `rgba(245,225,180,${flicker*0.35})`);
      lg.addColorStop(1, "rgba(245,225,180,0)");
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(sx, sy, tileSize*scale*3.5, 0, Math.PI*2); ctx.fill();
    }

    // Zone ambient tint
    const room = getRoomAtPosition(localPlayerRef.current.x, localPlayerRef.current.y, tileSize);
    if (room) {
      const ambient = ZONE_AMBIENT[room.id];
      if (ambient) {
        ctx.fillStyle = ambient;
        ctx.fillRect(0, 0, w, h);
      }
    }
  }, [tileSize, lampPositions]);

  // ─── Player Drawing ──────────────────────────────────────────────────────────

  const drawPlayer = useCallback(
    (ctx: CanvasRenderingContext2D, player: WorldPlayer, scale: number, isLocal: boolean, animTime: number) => {
      const px = (player.displayX ?? player.x) * scale;
      const py = (player.displayY ?? player.y) * scale;
      const r = 10 * scale;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath(); ctx.ellipse(px, py+r*0.85, r*0.75, r*0.22, 0, 0, Math.PI*2); ctx.fill();

      // Body with gradient
      const color = AVATAR_COLORS[player.colorIndex % AVATAR_COLORS.length];
      const bg = ctx.createRadialGradient(px-r*0.2, py-r*0.3, r*0.1, px, py, r);
      bg.addColorStop(0, lighten(color, 30));
      bg.addColorStop(0.7, color);
      bg.addColorStop(1, darken(color, 25));
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill();

      // Direction arc
      if (player.dx !== 0 || player.dy !== 0) {
        const angle = Math.atan2(player.dy, player.dx);
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1.5*scale;
        ctx.beginPath(); ctx.arc(px, py, r+1.5*scale, angle-0.5, angle+0.5); ctx.stroke();
      }

      // Border
      if (isLocal) {
        ctx.strokeStyle = "#F5E6C8";
        ctx.lineWidth = 2.5*scale;
        ctx.beginPath(); ctx.arc(px, py, r+2*scale, 0, Math.PI*2); ctx.stroke();
        const pulseR = r+5*scale+Math.sin(animTime*0.004)*2*scale;
        ctx.strokeStyle = "rgba(245,230,200,0.1)";
        ctx.lineWidth = 1.5*scale;
        ctx.beginPath(); ctx.arc(px, py, pulseR, 0, Math.PI*2); ctx.stroke();
      } else {
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = scale;
        ctx.beginPath(); ctx.arc(px, py, r+scale, 0, Math.PI*2); ctx.stroke();
      }

      // Initial letter
      ctx.fillStyle = "#FFF";
      ctx.font = `bold ${Math.round(8*scale)}px Inter, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText((player.label||"?").charAt(0).toUpperCase(), px, py);

      // Mute indicator
      if (player.isMuted) {
        ctx.fillStyle = "#C43E3E";
        ctx.beginPath(); ctx.arc(px+r*0.7, py-r*0.7, 4*scale, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#FFF";
        ctx.font = `${Math.round(5*scale)}px Inter, sans-serif`;
        ctx.fillText("✕", px+r*0.7, py-r*0.7);
      }

      // Video indicator
      if (player.isVideoOn) {
        ctx.fillStyle = "#3B82F6";
        ctx.beginPath(); ctx.arc(px-r*0.7, py-r*0.7, 3.5*scale, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#FFF";
        ctx.font = `${Math.round(4.5*scale)}px Inter, sans-serif`;
        ctx.fillText("▶", px-r*0.7, py-r*0.7+0.5*scale);
      }

      // Name tag
      const label = player.label || "Student";
      ctx.font = `500 ${Math.round(10*scale)}px Inter, sans-serif`;
      const tw = ctx.measureText(label).width;
      const tpx = 5*scale, tpy = 2.5*scale;
      const tw2 = tw+tpx*2, th = 14*scale+tpy*2;
      const ty = py+r+7*scale;

      ctx.fillStyle = isLocal ? "rgba(245,230,200,0.14)" : "rgba(0,0,0,0.5)";
      ctx.beginPath(); ctx.roundRect(px-tw2/2, ty, tw2, th, 3*scale); ctx.fill();

      ctx.fillStyle = isLocal ? "#F5E6C8" : "rgba(255,255,255,0.88)";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(label, px, ty+th/2);
    },
    []
  );

  // ─── Room Label Drawing ──────────────────────────────────────────────────────

  const drawRoomLabel = useCallback(
    (ctx: CanvasRenderingContext2D, zone: typeof ROOM_ZONES[0], scale: number) => {
      const [rx, ry, rw, rh] = zone.bounds;
      const cx = (rx+rw/2)*tileSize*scale;
      const cy = (ry+rh/2)*tileSize*scale;
      ctx.fillStyle = "rgba(20,18,15,0.5)";
      ctx.beginPath(); ctx.roundRect(cx-52, cy-9, 104, 18, 5); ctx.fill();
      ctx.fillStyle = "rgba(250,248,245,0.6)";
      ctx.font = `500 ${Math.round(9*scale)}px Inter, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(zone.name, cx, cy);
    },
    [tileSize]
  );

  // ─── Minimap Drawing ─────────────────────────────────────────────────────────

  const drawMinimap = useCallback((
    ctx: CanvasRenderingContext2D,
    localPlayer: WorldPlayer,
    remotePlayers: WorldPlayer[],
    w: number, h: number,
    scale: number,
    roomPopulations: Record<string, number> = {}
  ) => {
    const mmW = 120, mmH = 90;
    const mmX = w-mmW-16, mmY = h-mmH-16;
    const mmScale = mmW / (MAP_WIDTH*tileSize*scale);

    ctx.fillStyle = "rgba(20,18,15,0.82)";
    ctx.beginPath(); ctx.roundRect(mmX-2, mmY-2, mmW+4, mmH+4, 6); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1; ctx.stroke();

    const map = mapRef.current;
    for (let row = 0; row < MAP_HEIGHT; row++) {
      for (let col = 0; col < MAP_WIDTH; col++) {
        const tile = map[row]?.[col];
        if (tile === "wall" || tile === "wall_bookshelf") ctx.fillStyle = "rgba(255,255,255,0.18)";
        else if (tile==="desk"||tile==="bookshelf"||tile==="pillar") ctx.fillStyle = "rgba(255,255,255,0.07)";
        else if (tile==="carpet") ctx.fillStyle = "rgba(255,255,255,0.04)";
        else ctx.fillStyle = "rgba(255,255,255,0.015)";
        ctx.fillRect(mmX+col*tileSize*scale*mmScale, mmY+row*tileSize*scale*mmScale, tileSize*scale*mmScale+0.5, tileSize*scale*mmScale+0.5);
      }
    }

    // Room population dots
    for (const [roomId, count] of Object.entries(roomPopulations)) {
      if (count <= 0) continue;
      const zone = ROOM_ZONES.find(z => z.id === roomId);
      if (!zone) continue;
      const [rx, ry, rw, rh] = zone.bounds;
      const dx = mmX+(rx+rw/2)*tileSize*scale*mmScale;
      const dy = mmY+(ry+rh/2)*tileSize*scale*mmScale;
      const dr = Math.min(5, 2+count*0.8);
      ctx.fillStyle = "rgba(245,230,200,0.15)";
      ctx.beginPath(); ctx.arc(dx, dy, dr+3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "rgba(245,230,200,0.8)";
      ctx.beginPath(); ctx.arc(dx, dy, dr, 0, Math.PI*2); ctx.fill();
      if (count > 1) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.font = `bold 7px Inter, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(count), dx, dy+0.5);
      }
    }

    for (const p of remotePlayers) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath(); ctx.arc(mmX+p.x*mmScale, mmY+p.y*mmScale, 2, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = "#F5E6C8";
    ctx.beginPath(); ctx.arc(mmX+localPlayer.x*mmScale, mmY+localPlayer.y*mmScale, 3, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "8px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Map", mmX+mmW/2, mmY-6);
  }, [tileSize]);

  // ─── Main Render Loop ────────────────────────────────────────────────────────
  // Use refs for all draw functions so the effect only runs once and never
  // restarts (avoids tearing down/restarting rAF on every prop change).

  const drawTileRef = useRef(drawTile);
  const drawPlayerRef = useRef(drawPlayer);
  const drawRoomLabelRef = useRef(drawRoomLabel);
  const drawMinimapRef = useRef(drawMinimap);
  const drawLightingRef = useRef(drawLighting);

  useEffect(() => { drawTileRef.current = drawTile; }, [drawTile]);
  useEffect(() => { drawPlayerRef.current = drawPlayer; }, [drawPlayer]);
  useEffect(() => { drawRoomLabelRef.current = drawRoomLabel; }, [drawRoomLabel]);
  useEffect(() => { drawMinimapRef.current = drawMinimap; }, [drawMinimap]);
  useEffect(() => { drawLightingRef.current = drawLighting; }, [drawLighting]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    resizeCanvas();

    const render = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      lastTimeRef.current = time;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const scale = scaleRef.current;

      ctx.save();
      ctx.fillStyle = "#1A1714";
      ctx.fillRect(0, 0, w, h);

      // Camera
      const cl = localPlayerRef.current;
      const cr = remotePlayersRef.current;
      const tcx = cl.x * scale - w / 2;
      const tcy = cl.y * scale - h / 2;
      cameraRef.current.x += (tcx - cameraRef.current.x) * 0.1;
      cameraRef.current.y += (tcy - cameraRef.current.y) * 0.1;
      const camX = cameraRef.current.x;
      const camY = cameraRef.current.y;

      // Tiles
      const sc = Math.max(0, Math.floor(camX / (tileSize * scale)));
      const sr = Math.max(0, Math.floor(camY / (tileSize * scale)));
      const ec = Math.min(MAP_WIDTH, Math.ceil((camX + w) / (tileSize * scale)) + 1);
      const er = Math.min(MAP_HEIGHT, Math.ceil((camY + h) / (tileSize * scale)) + 1);
      const map = mapRef.current;

      ctx.save();
      ctx.translate(-camX, -camY);
      for (let row = sr; row < er; row++) {
        for (let col = sc; col < ec; col++) {
          const tileType = map[row]?.[col];
          if (tileType) drawTileRef.current(ctx, col, row, tileType, time);
        }
      }

      // Room labels
      for (const zone of ROOM_ZONES) {
        const [rx, ry, rw, rh] = zone.bounds;
        if ((rx+rw)*tileSize*scale >= camX && rx*tileSize*scale <= camX+w
            && (ry+rh)*tileSize*scale >= camY && ry*tileSize*scale <= camY+h) {
          drawRoomLabelRef.current(ctx, zone, scale);
        }
      }

      // Players
      for (const p of cr) drawPlayerRef.current(ctx, p, scale, false, time);
      drawPlayerRef.current(ctx, cl, scale, true, time);

      // Emoji reactions
      const now = Date.now();
      for (const emoji of emojiReactions) {
        const elapsed = now - emoji.timestamp;
        const progress = elapsed / emoji.ttl;
        if (progress > 1) continue;
        const player = [...cr, cl].find(p => p.id === emoji.playerId);
        if (!player) continue;
        const ex = (player.displayX ?? player.x) * scale;
        const ey = (player.displayY ?? player.y) * scale;
        const floatY = -30 * scale - progress * 25 * scale;
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.font = `${Math.round(16*scale+(1-progress)*4*scale)}px Inter, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(emoji.emoji, ex, ey + floatY);
        ctx.restore();
      }
      ctx.restore();

      // Lighting
      drawLightingRef.current(ctx, w, h, camX, camY, scale, time);

      // Connection status
      const dotColor = connectionState==="connected" ? COLORS.connectionDot
        : connectionState==="connecting"||connectionState==="reconnecting" ? "#F5B041" : "#C43E3E";
      ctx.fillStyle = dotColor;
      ctx.beginPath(); ctx.arc(w-20, 20, 5, 0, Math.PI*2); ctx.fill();
      if (connectionState==="connecting"||connectionState==="reconnecting") {
        ctx.strokeStyle = COLORS.connectionDotPulse;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(w-20, 20, 10+Math.sin(time*0.005)*3, 0, Math.PI*2); ctx.stroke();
      }
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(
        connectionState==="connected"?"Connected":connectionState==="connecting"?"Entering library...":connectionState==="reconnecting"?"Reconnecting...":"Offline",
        w-30, 24
      );

      // Room name
      const curRoom = getRoomAtPosition(localPlayer.x, localPlayer.y, tileSize);
      if (curRoom) {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.font = "11px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(curRoom.name, 16, 24);
      }

      // Minimap
      drawMinimapRef.current(ctx, localPlayer, remotePlayers, w, h, scale, roomPopulations);

      ctx.restore();
      animationRef.current = requestAnimationFrame(render);
    };

    const frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [tileSize, resizeCanvas]); // Only restart when tileSize actually changes

  // ─── Resize Handler ─────────────────────────────────────────────────────────

  useEffect(() => {
    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);
    const obs = new ResizeObserver(() => resizeCanvas());
    const container = containerRef.current;
    if (container) obs.observe(container);
    return () => { window.removeEventListener("resize", onResize); obs.disconnect(); };
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

  // ─── Keyboard ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.key === "Enter" && !target?.closest?.("input, textarea")) setShowChat(p => !p);
      if (e.key === "Escape") setShowChat(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSendMessage = () => {
    if (chatInput.trim() && onMessageSend) { onMessageSend(chatInput.trim()); setChatInput(""); }
  };

  // ─── Chat Overlay ───────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden bg-[#1A1714] ${className}`}>
      <canvas ref={canvasRef} className="block w-full h-full" />

      {showChat && (
        <div className="absolute bottom-4 right-4 w-80 bg-background-dark/90 backdrop-blur-md border border-border-light rounded-xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border-light">
            <span className="text-xs font-medium text-foreground-light">Library Chat</span>
            <button onClick={() => setShowChat(false)} className="text-muted-light hover:text-foreground-light text-xs">✕</button>
          </div>
          <div className="h-64 overflow-y-auto px-3 py-2 space-y-1.5">
            {messages.length === 0 && <p className="text-xs text-muted-light text-center py-4">No messages yet. Say hello!</p>}
            {messages.map((msg) => (
              <div key={msg.id} className={`text-xs ${msg.type==="system"?"text-center":""}`}>
                {msg.type === "system" ? (
                  <span className="text-muted-light bg-foreground/5 px-2 py-1 rounded-full">{msg.content}</span>
                ) : (
                  <div className={msg.authorId===localPlayer.id?"text-right":"text-left"}>
                    <span className="text-muted-light text-[10px]">{msg.authorLabel}</span>
                    <p className={`inline-block px-2.5 py-1 rounded-xl max-w-[90%] ${msg.authorId===localPlayer.id?"bg-accent text-foreground":"bg-foreground/10 text-foreground-light"}`}>{msg.content}</p>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="px-3 py-2 border-t border-border-light">
            <div className="flex gap-2">
              <input type="text" value={chatInput} onChange={(e)=>setChatInput(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"){e.preventDefault();handleSendMessage();}}} placeholder="Type a message..." className="flex-1 px-2.5 py-1.5 bg-foreground/10 border border-border-light rounded-lg text-xs text-foreground-light placeholder:text-muted-light focus:outline-none focus:ring-1 focus:ring-accent/50" />
              <button onClick={handleSendMessage} disabled={!chatInput.trim()} className="px-3 py-1.5 bg-accent text-foreground rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-40">Send</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat toggle */}
      <button onClick={()=>setShowChat(p=>!p)} className="absolute bottom-4 right-4 w-10 h-10 bg-foreground-dark/80 backdrop-blur-md border border-border-light rounded-full flex items-center justify-center text-foreground-light hover:bg-foreground-dark transition-colors shadow-lg" title="Toggle chat (Enter)">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M2.25 12.76c0 1.06.84 1.97 1.98 2.18a47.01 47.01 0 005.7 1.13c1.06.12 2.12.17 3.2.12a1 1 0 01.85 1v1.88a1 1 0 01-1 1h-1.05a4.97 4.97 0 01-2.44-.65 50.06 50.06 0 01-8.63-4.37A7.97 7.97 0 012.25 12V8.25m0 0a7.97 7.97 0 0112.53-3.13L21 6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 bg-foreground-dark/60 backdrop-blur-sm border border-border-light/50 rounded-lg px-3 py-2">
        <p className="text-[10px] text-muted-light leading-relaxed">
          <span className="text-foreground-light/70">WASD</span> Move {" · "}
          <span className="text-foreground-light/70">Enter</span> Chat
        </p>
      </div>
    </div>
  );
}
