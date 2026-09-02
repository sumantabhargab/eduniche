"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type { GameQuestion, FallingTarget, Projectile, Bomb } from "@/modules/game/types";
import { getQuestionsForBranch, toAnswerMapping } from "@/modules/game/services/questions";

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGET_RADIUS = 18;
const BOMB_RADIUS = 20;
const PROJECTILE_RADIUS = 4;
const PROJECTILE_SPEED = 7;
const BASE_TARGET_SPEED = 1.0;
const MAX_SPEED = 5;
const SPEED_INCREMENT = 0.04;
const BOMB_CHANCE_BASE = 0.012;
const BOMB_CHANCE_MAX = 0.04;
const BASE_LIVES = 3;
const FEEDBACK_DURATION = 700;
const QUESTIONS_PER_SESSION = 15;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 12;
const ARENA_PADDING = 20;
const SPAWN_INTERVAL_BASE = 1400;

const COLORS = {
  bg: "#0a0e17",
  grid: "rgba(34, 211, 238, 0.03)",
  targetFill: "#0f1729",
  targetStroke: "#22d3ee",
  targetText: "#22d3ee",
  bombFill: "#1a0a0a",
  bombStroke: "#ef4444",
  bombText: "#ef4444",
  playerFill: "#22d3ee",
  playerStroke: "#67e8f9",
  projectile: "#22d3ee",
  correct: "#22c55e",
  wrong: "#ef4444",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
let _uid = 0;
const uid = () => `${Date.now()}-${++_uid}`;

function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  fill: string, stroke: string, text: string, textColor: string
) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.font = `bold ${r * 0.9}px "Courier New", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function drawBombIcon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.bombFill;
  ctx.fill();
  ctx.strokeStyle = COLORS.bombStroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.bombText;
  ctx.font = `bold ${r}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⚡", x, y);
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: { x: number; y: number; width: number; height: number }) {
  const cx = p.x + p.width / 2;
  const by = p.y + p.height;
  // Body
  ctx.fillStyle = COLORS.playerFill;
  ctx.fillRect(p.x + 2, p.y + 4, p.width - 4, p.height - 4);
  ctx.strokeStyle = COLORS.playerStroke;
  ctx.lineWidth = 1;
  ctx.strokeRect(p.x + 2, p.y + 4, p.width - 4, p.height - 4);
  // Barrel
  ctx.fillStyle = COLORS.playerStroke;
  ctx.fillRect(cx - 1.5, p.y - 8, 3, 12);
  // Base circle
  ctx.beginPath();
  ctx.arc(cx, by, p.width * 0.4, Math.PI, 0);
  ctx.fillStyle = COLORS.playerFill;
  ctx.fill();
  ctx.strokeStyle = COLORS.playerStroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GamePlayClient() {
  const searchParams = useSearchParams();
  const branch = searchParams.get("branch") || "cse";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const lastTimeRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const hitSetRef = useRef<Set<string>>(new Set());
  const gRef = useRef<any>(null);

  const [phase, setPhase] = useState<"idle" | "loading" | "playing" | "paused" | "game_over">("idle");
  const [question, setQuestion] = useState<GameQuestion | null>(null);
  const [answerMap, setAnswerMap] = useState<{ A: string; B: string; C: string; D: string }>({
    A: "", B: "", C: "", D: "",
  });
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [lives, setLives] = useState(BASE_LIVES);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [questionNum, setQuestionNum] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string; start: number } | null>(null);
  const [gameResult, setGameResult] = useState<{
    score: number;
    questions: number;
    correct: number;
    accuracy: string;
    bestCombo: number;
    time: string;
  } | null>(null);

  // ─── Init game ref (once) ────────────────────────────────────────────────────

  useEffect(() => {
    gRef.current = {
      phase: "idle",
      score: 0,
      combo: 0,
      bestCombo: 0,
      lives: BASE_LIVES,
      speedMultiplier: 1,
      questionsAnswered: 0,
      correctAnswers: 0,
      currentQuestion: null as GameQuestion | null,
      targets: [] as FallingTarget[],
      projectiles: [] as Projectile[],
      bombs: [] as Bomb[],
      particles: [] as any[],
      player: { x: 200, y: 100, width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
      spawnTimer: 0,
      targetSpawnInterval: SPAWN_INTERVAL_BASE,
      questions: [] as GameQuestion[],
      usedIds: new Set<string>(),
      sessionStart: 0,
    };
  }, []);

  // ─── Load questions ─────────────────────────────────────────────────────────

  const loadQuestions = useCallback(async () => {
    try {
      const questions = await getQuestionsForBranch(branch as any, 30);
      gRef.current.questions = questions;
    } catch {
      console.error("Failed to load questions");
    }
  }, [branch]);

  // ─── Next question ──────────────────────────────────────────────────────────

  const nextQuestion = useCallback(() => {
    const g = gRef.current;
    if (g.phase !== "playing") return;

    const available = g.questions.filter((q: GameQuestion) => !g.usedIds.has(q.id));
    if (available.length === 0) {
      g.usedIds = new Set();
      loadQuestions().then(() => {
        const avail2 = g.questions.filter((q: GameQuestion) => !g.usedIds.has(q.id));
        if (avail2.length > 0) {
          const q = avail2[Math.floor(Math.random() * avail2.length)];
          g.usedIds.add(q.id);
          g.currentQuestion = q;
          setQuestion(q);
          setAnswerMap(toAnswerMapping(q));
          setQuestionNum((n) => n + 1);
        }
      });
      return;
    }
    const q = available[Math.floor(Math.random() * available.length)];
    g.usedIds.add(q.id);
    g.currentQuestion = q;
    setQuestion(q);
    setAnswerMap(toAnswerMapping(q));
    setQuestionNum((n) => n + 1);
  }, [loadQuestions]);

  // ─── Handle hit ─────────────────────────────────────────────────────────────

  const handleHit = useCallback((target: FallingTarget) => {
    const g = gRef.current;
    if (!g.currentQuestion) return;
    const correct = g.currentQuestion.correct_option;
    g.questionsAnswered += 1;
    setTotalAnswered((n) => n + 1);

    if (target.letter === correct) {
      target.opacity = 0;
      g.combo += 1;
      g.correctAnswers += 1;
      g.score += 100 * g.combo;
      g.speedMultiplier = Math.min(MAX_SPEED, g.speedMultiplier + SPEED_INCREMENT);
      setCombo(g.combo);
      setBestCombo((prev) => Math.max(prev, g.combo));
      setScore(g.score);
      setTotalCorrect((n) => n + 1);
      setFeedback({ text: `CORRECT +${100 * g.combo}`, color: COLORS.correct, start: Date.now() });
      setTimeout(() => setFeedback(null), FEEDBACK_DURATION);
      nextQuestion();
    } else {
      g.combo = 0;
      g.score = Math.max(0, g.score - 50);
      setCombo(0);
      setScore(g.score);
      setFeedback({ text: `WRONG — Answer: ${correct}`, color: COLORS.wrong, start: Date.now() });
      setTimeout(() => setFeedback(null), FEEDBACK_DURATION);
      nextQuestion();
    }
  }, [nextQuestion]);

  // ─── Start game ─────────────────────────────────────────────────────────────

  const startGame = useCallback(async () => {
    const g = gRef.current;
    g.phase = "playing";
    g.score = 0; g.combo = 0; g.bestCombo = 0;
    g.lives = BASE_LIVES; g.speedMultiplier = 1;
    g.questionsAnswered = 0; g.correctAnswers = 0;
    g.targets = []; g.projectiles = []; g.bombs = []; g.particles = [];
    g.spawnTimer = 0; g.targetSpawnInterval = SPAWN_INTERVAL_BASE;
    g.usedIds = new Set(); g.sessionStart = Date.now();

    setScore(0); setCombo(0); setBestCombo(0);
    setLives(BASE_LIVES); setTotalAnswered(0); setTotalCorrect(0);
    setQuestionNum(1); setPhase("playing"); setGameResult(null);
    hitSetRef.current = new Set();
    lastTimeRef.current = 0;

    await loadQuestions();
    nextQuestion();
  }, [branch, loadQuestions, nextQuestion]);

  // ─── End game ───────────────────────────────────────────────────────────────

  const endGame = useCallback((g: any) => {
    g.phase = "game_over";
    const elapsed = Math.floor((Date.now() - g.sessionStart) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(elapsed % 60).padStart(2, "0");
    const accuracy = g.questionsAnswered > 0
      ? Math.round((g.correctAnswers / g.questionsAnswered) * 100) + "%"
      : "0%";
    setGameResult({
      score: g.score, questions: g.questionsAnswered,
      correct: g.correctAnswers, accuracy, bestCombo: g.bestCombo,
      time: `${mm}:${ss}`,
    });
    setPhase("game_over");
  }, []);

  // ─── Game loop (self-running RAF, no external deps) ──────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width;
      canvas.height = rect.height;
      const g = gRef.current;
      if (g.player) {
        g.player.y = rect.height - PLAYER_HEIGHT - 10;
        g.player.x = clamp(g.player.x, ARENA_PADDING, rect.width - ARENA_PADDING - PLAYER_WIDTH);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const checkAABB = (ax: number, ay: number, ar: number, bx: number, by: number, br: number) => {
      const dx = ax - bx, dy = ay - by;
      return Math.sqrt(dx * dx + dy * dy) < ar + br;
    };

    const tick = (now: number) => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) { animRef.current = requestAnimationFrame(tick); return; }

      // Always schedule next frame
      animRef.current = requestAnimationFrame(tick);

      const g = gRef.current;
      if (g.phase !== "playing") return;

      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min(50, now - lastTimeRef.current);
      lastTimeRef.current = now;

      const W = c.width, H = c.height;
      if (W === 0 || H === 0) return;

      const groundY = H - 40;

      // ─── Update targets ──────────────────────────────────────────────────────
      for (const t of g.targets) {
        if (t.opacity <= 0) continue;
        t.y += t.speed * dt * 0.06;
        t.x += t.drift;
        t.x = clamp(t.x, ARENA_PADDING + t.radius, W - ARENA_PADDING - t.radius);
        if (t.y > groundY) {
          t.opacity = 0;
          g.lives -= 1; g.combo = 0;
          setLives(g.lives); setCombo(0);
          setFeedback({ text: "MISSED!", color: COLORS.wrong, start: Date.now() });
          setTimeout(() => setFeedback(null), FEEDBACK_DURATION);
          if (g.lives <= 0) endGame(g);
        }
      }
      g.targets = g.targets.filter((t: any) => t.opacity > 0 && t.y < H + 50);

      // ─── Update projectiles ──────────────────────────────────────────────────
      for (const p of g.projectiles) {
        p.y -= PROJECTILE_SPEED;
      }
      g.projectiles = g.projectiles.filter((p: any) => p.y > -20);

      // ─── Collision: projectile → target ─────────────────────────────────────
      for (const p of g.projectiles) {
        const pid = p.id;
        if (hitSetRef.current.has(pid)) continue;
        for (const t of g.targets) {
          if (t.opacity <= 0) continue;
          if (checkAABB(p.x, p.y, p.radius, t.x, t.y, t.radius)) {
            hitSetRef.current.add(pid);
            handleHit(t);
            break;
          }
        }
      }

      // ─── Collision: projectile → bomb ───────────────────────────────────────
      for (const p of g.projectiles) {
        const pid = p.id;
        if (hitSetRef.current.has(pid)) continue;
        for (const b of g.bombs) {
          if (b.opacity <= 0) continue;
          if (checkAABB(p.x, p.y, p.radius, b.x, b.y, b.radius)) {
            hitSetRef.current.add(pid);
            b.opacity = 0;
            g.lives -= 1; g.combo = 0;
            setLives(g.lives); setCombo(0);
            setFeedback({ text: "BOMB! −1 LIFE", color: COLORS.wrong, start: Date.now() });
            setTimeout(() => setFeedback(null), FEEDBACK_DURATION);
            if (g.lives <= 0) endGame(g);
          }
        }
      }

      // ─── Update bombs ────────────────────────────────────────────────────────
      for (const b of g.bombs) {
        b.y += b.speed * dt * 0.06;
        b.x += b.drift;
        b.x = clamp(b.x, ARENA_PADDING + b.radius, W - ARENA_PADDING - b.radius);
        if (b.y > groundY && b.opacity > 0) {
          if (checkAABB(b.x, b.y, b.radius, g.player.x + g.player.width / 2, g.player.y + g.player.height / 2, g.player.width * 0.5)) {
            b.opacity = 0;
            g.lives -= 1; g.combo = 0;
            setLives(g.lives); setCombo(0);
            setFeedback({ text: "BOMB IMPACT!", color: COLORS.wrong, start: Date.now() });
            setTimeout(() => setFeedback(null), FEEDBACK_DURATION);
            if (g.lives <= 0) endGame(g);
          }
        }
      }
      g.bombs = g.bombs.filter((b: any) => b.opacity > 0 && b.y < H + 50);

      // ─── Player movement ────────────────────────────────────────────────────
      const moveSpeed = 6;
      if (keysRef.current.has("ArrowLeft") || keysRef.current.has("a")) {
        g.player.x -= moveSpeed;
      }
      if (keysRef.current.has("ArrowRight") || keysRef.current.has("d")) {
        g.player.x += moveSpeed;
      }
      g.player.x = clamp(g.player.x, ARENA_PADDING, W - ARENA_PADDING - PLAYER_WIDTH);

      // ─── Spawn ──────────────────────────────────────────────────────────────
      g.spawnTimer += dt;
      if (g.spawnTimer > g.targetSpawnInterval) {
        g.spawnTimer = 0;
        const bombChance = Math.min(BOMB_CHANCE_BASE + (g.speedMultiplier - 1) * 0.008, BOMB_CHANCE_MAX);
        if (Math.random() < bombChance) {
          const bx = clamp(rand(ARENA_PADDING + BOMB_RADIUS, W - ARENA_PADDING - BOMB_RADIUS), ARENA_PADDING + BOMB_RADIUS, W - ARENA_PADDING - BOMB_RADIUS);
          g.bombs.push({
            id: uid(), x: bx, y: -BOMB_RADIUS * 2,
            speed: BASE_TARGET_SPEED * g.speedMultiplier * rand(0.8, 1.0),
            drift: rand(-0.2, 0.2), radius: BOMB_RADIUS, opacity: 1,
          });
        }
        const tx = clamp(rand(ARENA_PADDING + TARGET_RADIUS, W - ARENA_PADDING - TARGET_RADIUS), ARENA_PADDING + TARGET_RADIUS, W - ARENA_PADDING - TARGET_RADIUS);
        const letters: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];
        g.targets.push({
          id: uid(),
          letter: letters[Math.floor(Math.random() * 4)],
          x: tx, y: -TARGET_RADIUS * 2,
          speed: BASE_TARGET_SPEED * g.speedMultiplier * rand(0.85, 1.15),
          drift: rand(-0.3, 0.3),
          radius: TARGET_RADIUS,
          opacity: 1,
        });
      }

      // ─── Draw ────────────────────────────────────────────────────────────────
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let gy = 0; gy < H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      // Danger line
      ctx.strokeStyle = "rgba(239, 68, 68, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
      ctx.setLineDash([]);

      // Targets
      for (const t of g.targets) {
        if (t.opacity <= 0) continue;
        ctx.globalAlpha = t.opacity;
        drawCircle(ctx, t.x, t.y, t.radius, COLORS.targetFill, COLORS.targetStroke, t.letter, COLORS.targetText);
        ctx.globalAlpha = 1;
      }

      // Bombs
      for (const b of g.bombs) {
        if (b.opacity <= 0) continue;
        ctx.globalAlpha = b.opacity;
        drawBombIcon(ctx, b.x, b.y, b.radius);
        ctx.globalAlpha = 1;
      }

      // Projectiles
      for (const p of g.projectiles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, PROJECTILE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.projectile;
        ctx.shadowBlur = 8;
        ctx.shadowColor = COLORS.projectile;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Player
      drawPlayer(ctx, g.player);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ─── Keyboard ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === " " || e.key === "Space") {
        e.preventDefault();
        const g = gRef.current;
        if (g.phase === "playing") {
          const p: Projectile = {
            id: uid(),
            x: g.player.x + g.player.width / 2,
            y: g.player.y,
            speed: PROJECTILE_SPEED,
            radius: PROJECTILE_RADIUS,
          };
          g.projectiles.push(p);
        }
      }
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        const g = gRef.current;
        if (g.phase === "playing") {
          g.phase = "paused"; setPhase("paused");
        } else if (g.phase === "paused") {
          g.phase = "playing"; setPhase("playing");
          lastTimeRef.current = 0;
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // ─── Pointer (mouse + touch) ────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const x = (e.clientX - rect.left) * scaleX - PLAYER_WIDTH / 2;
      gRef.current.player.x = clamp(x, ARENA_PADDING, canvas.width - ARENA_PADDING - PLAYER_WIDTH);
    };
    const handlePointerDown = () => {
      const g = gRef.current;
      if (g.phase !== "playing") return;
      const p: Projectile = {
        id: uid(),
        x: g.player.x + g.player.width / 2,
        y: g.player.y,
        speed: PROJECTILE_SPEED,
        radius: PROJECTILE_RADIUS,
      };
      g.projectiles.push(p);
    };

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerdown", handlePointerDown);
    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  // ─── UI render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-[#0a0e17] select-none">
      {/* Question header */}
      <div className="flex-none bg-[#0d1321] border-b border-cyan-900/30 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-500 tracking-widest">QUESTION</span>
            <span className="text-xs text-cyan-400 font-mono">
              {questionNum} / {QUESTIONS_PER_SESSION}
            </span>
          </div>
          <div>
            <span className="text-gray-500 text-xs">SCORE </span>
            <span className="text-cyan-400 font-mono font-bold text-xs">
              {String(score).padStart(6, "0")}
            </span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-2 gap-2">
          {(["A", "B", "C", "D"] as const).map((letter) => (
            <div
              key={letter}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/60 rounded border border-gray-800"
            >
              <span className="text-cyan-400 font-bold text-xs w-4">{letter}</span>
              <span className="text-gray-300 text-xs">{answerMap[letter] || "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lives + controls */}
      <div className="flex-none flex items-center justify-between px-4 py-1.5 bg-[#0a0e17]">
        <div className="flex items-center gap-1">
          {Array.from({ length: BASE_LIVES }).map((_, i) => (
            <span
              key={i}
              className={`text-sm transition-colors ${i < lives ? "text-red-500" : "text-gray-700"}`}
            >
              ♥
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {combo > 1 && (
            <span className="text-xs text-yellow-400 font-mono font-bold">×{combo}</span>
          )}
          <button
            onClick={() => {
              const g = gRef.current;
              if (g.phase === "playing") {
                g.phase = "paused"; setPhase("paused");
              } else if (g.phase === "paused") {
                g.phase = "playing"; setPhase("playing");
                lastTimeRef.current = 0;
              }
            }}
            className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1 border border-gray-800 rounded"
          >
            {phase === "paused" ? "RESUME" : "⏸ PAUSE"}
          </button>
        </div>
      </div>

      {/* Canvas + overlays */}
      <div className="flex-1 min-h-0 relative">
        <canvas ref={canvasRef} className="w-full h-full block touch-none" />

        {phase === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-1">GATE ARCADE</h2>
              <p className="text-xs text-gray-500 mb-5">
                Shoot the correct answer. Avoid the bombs.
              </p>
              <button
                onClick={startGame}
                className="px-8 py-3 bg-cyan-500 text-gray-900 font-bold text-sm rounded-lg hover:bg-cyan-400 transition-colors"
              >
                START GAME
              </button>
            </div>
          </div>
        )}

        {phase === "paused" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-4">PAUSED</h2>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { gRef.current.phase = "playing"; setPhase("playing"); lastTimeRef.current = 0; }}
                  className="px-6 py-2 bg-cyan-500 text-gray-900 font-bold text-sm rounded-lg"
                >
                  RESUME
                </button>
                <button
                  onClick={() => {
                    gRef.current.phase = "idle";
                    setPhase("idle");
                    cancelAnimationFrame(animRef.current);
                  }}
                  className="px-6 py-2 border border-gray-700 text-gray-300 text-sm rounded-lg"
                >
                  EXIT
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === "game_over" && gameResult && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center max-w-xs">
              <h2 className="text-2xl font-bold text-red-500 mb-1">GAME OVER</h2>
              <p className="text-xs text-gray-500 mb-5">Your run has ended</p>
              <div className="space-y-1.5 mb-6">
                <StatRow label="SCORE" value={String(gameResult.score).padStart(6, "0")} />
                <StatRow label="QUESTIONS" value={String(gameResult.questions)} />
                <StatRow label="CORRECT" value={`${gameResult.correct} (${gameResult.accuracy})`} />
                <StatRow label="BEST COMBO" value={`×${gameResult.bestCombo}`} />
                <StatRow label="SURVIVED" value={gameResult.time} />
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={startGame}
                  className="px-6 py-2.5 bg-cyan-500 text-gray-900 font-bold text-sm rounded-lg"
                >
                  PLAY AGAIN
                </button>
                <button
                  onClick={() => {
                    gRef.current.phase = "idle";
                    setPhase("idle"); setGameResult(null);
                    cancelAnimationFrame(animRef.current);
                  }}
                  className="px-6 py-2.5 border border-gray-700 text-gray-300 text-sm rounded-lg"
                >
                  CHANGE BRANCH
                </button>
              </div>
            </div>
          </div>
        )}

        {feedback && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg text-sm font-bold pointer-events-none transition-opacity"
            style={{
              color: feedback.color,
              background: `${feedback.color}20`,
              border: `1px solid ${feedback.color}40`,
            }}
          >
            {feedback.text}
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-4 py-1.5 bg-gray-900/40 rounded">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-white font-mono font-bold">{value}</span>
    </div>
  );
}
