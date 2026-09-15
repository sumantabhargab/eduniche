/**
 * crewmate-renderer.ts — Among Us-style crewmate rendering for the Virtual Library.
 *
 * Draws a single crewmate on a Canvas 2D context in pixel space.
 *
 * Layering (back → front):
 *   shadow → backpack → body → legs → visor
 */

import type { WorldPlayer } from "./types";

// ─── 8 Among Us avatar colors ────────────────────────────────────────────────

export const CREWMATE_COLORS = [
  "#C92222", // Red
  "#134DFB", // Blue
  "#1BB316", // Green
  "#F0F0F0", // White
  "#F5A907", // Yellow
  "#F47D07", // Orange
  "#B44AD0", // Purple
  "#F38FB5", // Pink
] as const;

// ─── Render options ─────────────────────────────────────────────────────────

export interface CrewmateRenderOptions {
  ctx: CanvasRenderingContext2D;
  /** Crewmate center-x (already camera-transformed, in px) */
  x: number;
  /** Crewmate center-y (already camera-transformed, in px) */
  y: number;
  /** Full width of the crewmate in px */
  size: number;
  /** 0–7 → CREWMATE_COLORS */
  colorIndex: number;
  /** -1 = left, 1 = right (derived from dx/dy) */
  facing: number;
  /** Currently walking? */
  isMoving: boolean;
  /** Walk animation sub-frame (0 or 1) */
  walkFrame: number;
  /** Is this the local player? */
  isLocal: boolean;
  /** Is the player muted? */
  isMuted: boolean;
  /** Is the player broadcasting video? */
  isVideoOn: boolean;
  /** Display name */
  label: string;
  /** Animation timestamp (ms) for glow pulsing */
  animTime: number;
  /** Camera scale factor for responsive sizing */
  scale: number;
  /** Currently dead (ejected) */
  isDead?: boolean;
}

// ─── Color math helpers ─────────────────────────────────────────────────────

function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

function darken(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (n >> 16) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return `rgb(${r},${g},${b})`;
}

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Main export ────────────────────────────────────────────────────────────

/**
 * Draws an Among Us-style crewmate.
 *
 * All coordinates are in already-transformed pixel space.
 * The caller is responsible for ctx.save() / ctx.restore() around
 * any state changes (opacity, transforms, etc.).
 */
export function drawCrewmate(opts: CrewmateRenderOptions): void {
  const { ctx, x, y, size, colorIndex, facing, isMoving, walkFrame, isLocal, isMuted, isVideoOn, label, animTime, scale, isDead } = opts;

  const color = CREWMATE_COLORS[colorIndex % CREWMATE_COLORS.length];

  // ── Dimensions (proportional to size, with minimum floor for visibility) ──

  const w = Math.max(12, size);                      // body width
  const h = Math.max(16, size * 1.25);               // body height
  const legW = Math.max(4, w * 0.22);                // each leg width
  const legH = Math.max(5, h * 0.22);                // leg height
  const visorRx = w * 0.34;                          // visor horizontal radius
  const visorRy = h * 0.17;                          // visor vertical radius
  const visorCx = x + facing * w * 0.09;             // visor center-x (offset to front)
  const visorCy = y - h * 0.1;                       // visor center-y (upper body)
  const backpackW = Math.max(3, w * 0.15);
  const backpackH = h * 0.38;
  const backpackX = x - facing * (w * 0.5 + backpackW * 0.3);

  // ── Dead state: gray and semi-transparent ─────────────────────────────────

  if (isDead) {
    ctx.globalAlpha = 0.55;
  }

  // ── 1. Shadow (below the body) ────────────────────────────────────────────

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(x, y + h * 0.48, w * 0.48, h * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── 2. Backpack (on the back side, drawn before body so it clips behind) ──

  ctx.fillStyle = darken(color, 38);
  ctx.strokeStyle = darken(color, 55);
  ctx.lineWidth = Math.max(0.5, scale * 0.5);
  ctx.beginPath();
  ctx.roundRect(backpackX - backpackW / 2, y - backpackH * 0.25, backpackW, backpackH, Math.max(1, backpackW * 0.3));
  ctx.fill();
  ctx.stroke();

  // ── 3. Legs ───────────────────────────────────────────────────────────────

  const legBaseY = y + h * 0.32;
  const legSpread = isMoving ? (walkFrame === 0 ? 1 : -1) * w * 0.14 : 0;
  const legTopY = isMoving ? legBaseY - Math.abs(legSpread) * 0.3 : legBaseY;

  for (let i = -1; i <= 1; i += 2) {
    const lx = x + i * (w * 0.22 + legSpread * 0.5);
    ctx.fillStyle = darken(color, 20);
    ctx.strokeStyle = darken(color, 42);
    ctx.lineWidth = Math.max(0.5, scale * 0.5);
    ctx.beginPath();
    ctx.roundRect(lx - legW / 2, legTopY, legW, legH, Math.max(1, legW * 0.35));
    ctx.fill();
    ctx.stroke();
  }

  // ── 4. Body (pill shape) ──────────────────────────────────────────────────

  // Outer stroke
  ctx.strokeStyle = darken(color, 55);
  ctx.lineWidth = Math.max(0.8, scale * 0.8);
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, w * 0.38);
  ctx.stroke();

  // Gradient fill (light source top-left)
  const bodyGrad = ctx.createRadialGradient(
    x - w * 0.22, y - h * 0.25, w * 0.05,
    x, y, h * 0.55,
  );
  bodyGrad.addColorStop(0, lighten(color, 28));
  bodyGrad.addColorStop(0.65, color);
  bodyGrad.addColorStop(1, darken(color, 22));
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, w * 0.38);
  ctx.fill();

  // ── 5. Visor (glass oval on upper-front of body) ──────────────────────────

  // Outer border
  ctx.fillStyle = "#2A3A4A";
  ctx.beginPath();
  ctx.ellipse(visorCx, visorCy, visorRx + 1.2, visorRy + 1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glass body
  const visorGrad = ctx.createLinearGradient(visorCx, visorCy - visorRy, visorCx, visorCy + visorRy);
  visorGrad.addColorStop(0, "#B8E8FF");
  visorGrad.addColorStop(0.45, "#8DD8F8");
  visorGrad.addColorStop(0.55, "#6AC8EE");
  visorGrad.addColorStop(1, "#3AACDE");
  ctx.fillStyle = visorGrad;
  ctx.beginPath();
  ctx.ellipse(visorCx, visorCy, visorRx, visorRy, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner shadow (bottom edge darkening)
  const innerShadow = ctx.createLinearGradient(visorCx, visorCy - visorRy, visorCx, visorCy + visorRy * 0.6);
  innerShadow.addColorStop(0, "rgba(255,255,255,0)");
  innerShadow.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = innerShadow;
  ctx.beginPath();
  ctx.ellipse(visorCx, visorCy, visorRx, visorRy, 0, 0, Math.PI * 2);
  ctx.fill();

  // Top highlight
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.beginPath();
  ctx.ellipse(visorCx - visorRx * 0.15, visorCy - visorRy * 0.3, visorRx * 0.45, visorRy * 0.28, -0.25, 0, Math.PI * 2);
  ctx.fill();

  // Small sharp specular dot
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.beginPath();
  ctx.arc(visorCx - visorRx * 0.25, visorCy - visorRy * 0.4, Math.max(1, visorRx * 0.1), 0, Math.PI * 2);
  ctx.fill();

  // ── Reset dead alpha for remaining overlays ────────────────────────────────

  if (isDead) {
    ctx.globalAlpha = 1;
  }

  // ── 6. Local-player glow ring ─────────────────────────────────────────────

  if (isLocal) {
    const pulseR = w * 0.72 + Math.sin(animTime * 0.004) * w * 0.06;
    ctx.strokeStyle = "rgba(245,230,200,0.18)";
    ctx.lineWidth = Math.max(1, scale * 1.5);
    ctx.beginPath();
    ctx.arc(x, y, pulseR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ── 7. Mute indicator (top-right) ─────────────────────────────────────────

  if (isMuted) {
    const ix = x + w * 0.4;
    const iy = y - h * 0.42;
    const ir = Math.max(3.5, w * 0.1);
    // Red circle
    ctx.fillStyle = "#DC2626";
    ctx.beginPath();
    ctx.arc(ix, iy, ir + 1, 0, Math.PI * 2);
    ctx.fill();
    // White X
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = Math.max(1, ir * 0.35);
    ctx.lineCap = "round";
    const xOff = ir * 0.45;
    ctx.beginPath();
    ctx.moveTo(ix - xOff, iy - xOff);
    ctx.lineTo(ix + xOff, iy + xOff);
    ctx.moveTo(ix + xOff, iy - xOff);
    ctx.lineTo(ix - xOff, iy + xOff);
    ctx.stroke();
    ctx.lineCap = "butt";
  }

  // ── 8. Video indicator (top-left) ─────────────────────────────────────────

  if (isVideoOn) {
    const ix = x - w * 0.4;
    const iy = y - h * 0.42;
    const ir = Math.max(3, w * 0.09);
    // Blue circle
    ctx.fillStyle = "#2563EB";
    ctx.beginPath();
    ctx.arc(ix, iy, ir + 0.8, 0, Math.PI * 2);
    ctx.fill();
    // White play triangle
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.moveTo(ix - ir * 0.4, iy - ir * 0.5);
    ctx.lineTo(ix + ir * 0.5, iy);
    ctx.lineTo(ix - ir * 0.4, iy + ir * 0.5);
    ctx.closePath();
    ctx.fill();
  }
}

// ─── Name tag (drawn separately, above the head) ────────────────────────────

export function drawCrewmateNameTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bodyBottom: number,
  label: string,
  isLocal: boolean,
  scale: number,
): void {
  const fontSize = Math.max(9, Math.round(10 * scale));
  ctx.font = `500 ${fontSize}px Inter, sans-serif`;
  const tw = ctx.measureText(label).width;
  const px = 5 * scale;
  const py = 2.5 * scale;
  const tw2 = tw + px * 2;
  const th = fontSize + py * 2;
  const ty = bodyBottom + 7 * scale;

  // Background pill
  ctx.fillStyle = isLocal ? "rgba(245,230,200,0.14)" : "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.roundRect(x - tw2 / 2, ty, tw2, th, 3 * scale);
  ctx.fill();

  // Text
  ctx.fillStyle = isLocal ? "#F5E6C8" : "rgba(255,255,255,0.88)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, ty + th / 2);
}

// ─── Convenience: compute facing from velocity ──────────────────────────────

export function computeFacing(player: WorldPlayer): number {
  if (player.dx > 0) return 1;
  if (player.dx < 0) return -1;
  // Fall back to dy when dx is zero
  if (player.dy > 0) return 1;
  if (player.dy < 0) return -1;
  return 1; // default right
}
