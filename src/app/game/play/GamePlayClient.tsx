"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type {
  GameQuestion,
  FallingTarget,
  Projectile,
  Bomb,
  Player,
  FeedbackState,
} from "@/modules/game/types";
import { getQuestionsForBranch, toAnswerMapping } from "@/modules/game/services/questions";

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGET_RADIUS = 18;
const BOMB_RADIUS = 20;
const PROJECTILE_RADIUS = 4;
const PROJECTILE_SPEED = 8;
const BASE_TARGET_SPEED = 1.2;
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
  feedbackText: "#ffffff",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function checkCollision(
  a: { x: number; y: number; r?: number; radius?: number },
  b: { x: number; y: number; r?: number; radius?: number }
) {
  const ar = a.r ?? a.radius ?? 0;
  const br = b.r ?? b.radius ?? 0;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy) < ar + br;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function GamePlayClient() {
  const searchParams = useSearchParams();
  const branch = searchParams.get("branch") || "cse";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

  const [phase, setPhase] = useState<"idle" | "loading" | "playing" | "paused" | "game_over">("idle");
  const [question, setQuestion] = useState<GameQuestion | null>(null);
  const [answerMap, setAnswerMap] = useState<{ A: string; B: string; C: string; D: string }>({ A: "", B: "", C: "", D: "" });
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

  const S = useRef({
    phase: "idle" as "idle" | "loading" | "playing" | "paused" | "game_over",
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
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[],
    player: { x: 0, y: 0, width: PLAYER_WIDTH, height: PLAYER_HEIGHT } as Player,
    spawnTimer: 0,
    targetSpawnInterval: 1800,
    questions: [] as GameQuestion[],
    usedIds: new Set<string>(),
    sessionStart: 0,
    arenaWidth: 0,
    arenaHeight: 0,
  });

  // ─── Load questions ─────────────────────────────────────────────────────────

  const loadQuestions = useCallback(async () => {
    try {
      const questions = await getQuestionsForBranch(branch as any, 30);
      S.current.questions = questions;
    } catch {
      console.error("Failed to load questions");
    }
  }, [branch]);

  // ─── Spawn helpers ──────────────────────────────────────────────────────────

  let idCounter = 0;
  const uid = () => `${Date.now()}-${++idCounter}`;

  const spawnTarget = (arenaW: number, arenaH: number, speedMul: number): FallingTarget => {
    const letters: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];
    const letter = letters[Math.floor(Math.random() * 4)];
    return {
      id: uid(),
      letter,
      x: rand(ARENA_PADDING + TARGET_RADIUS, arenaW - ARENA_PADDING - TARGET_RADIUS),
      y: -TARGET_RADIUS * 2,
      speed: BASE_TARGET_SPEED * speedMul * rand(0.85, 1.15),
      drift: rand(-0.3, 0.3),
      radius: TARGET_RADIUS,
      opacity: 1,
    };
  };

  const spawnBomb = (arenaW: number, arenaH: number, speedMul: number): Bomb => {
    const x = rand(ARENA_PADDING + BOMB_RADIUS, arenaW - ARENA_PADDING - BOMB_RADIUS);
    return {
      id: uid(),
      x,
      y: -BOMB_RADIUS * 2,
      speed: BASE_TARGET_SPEED * speedMul * rand(0.8, 1.0),
      drift: rand(-0.2, 0.2),
      radius: BOMB_RADIUS,
      opacity: 1,
    };
  };

  // ─── Next question ──────────────────────────────────────────────────────────

  const nextQuestion = useCallback(() => {
    const s = S.current;
    const available = s.questions.filter((q) => !s.usedIds.has(q.id));
    if (available.length === 0) {
      s.questions = [];
      s.usedIds = new Set();
      loadQuestions().then(() => {
        const available2 = s.questions.filter((q) => !s.usedIds.has(q.id));
        if (available2.length > 0) {
          const q = available2[Math.floor(Math.random() * available2.length)];
          s.usedIds.add(q.id);
          s.currentQuestion = q;
          setQuestion(q);
          setAnswerMap(toAnswerMapping(q));
          setQuestionNum((n) => n + 1);
        }
      });
      return;
    }
    const q = available[Math.floor(Math.random() * available.length)];
    s.usedIds.add(q.id);
    s.currentQuestion = q;
    setQuestion(q);
    setAnswerMap(toAnswerMapping(q));
    setQuestionNum((n) => n + 1);
  }, [loadQuestions]);

  // ─── Start game ─────────────────────────────────────────────────────────────

  const startGame = useCallback(async () => {
    await loadQuestions();
    const s = S.current;
    s.score = 0;
    s.combo = 0;
    s.bestCombo = 0;
    s.lives = BASE_LIVES;
    s.speedMultiplier = 1;
    s.questionsAnswered = 0;
    s.correctAnswers = 0;
    s.targets = [];
    s.projectiles = [];
    s.bombs = [];
    s.particles = [];
    s.spawnTimer = 0;
    s.targetSpawnInterval = 1800;
    s.usedIds = new Set();
    s.sessionStart = Date.now();
    s.phase = "playing";
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setLives(BASE_LIVES);
    setTotalAnswered(0);
    setTotalCorrect(0);
    setQuestionNum(1);
    setPhase("playing");
    setGameResult(null);
    nextQuestion();
  }, [loadQuestions, nextQuestion]);

  // ─── Handle hit ─────────────────────────────────────────────────────────────

  const handleHit = useCallback((target: FallingTarget) => {
    const s = S.current;
    if (!s.currentQuestion) return;
    const correct = s.currentQuestion.correct_option;
    s.questionsAnswered += 1;
    setTotalAnswered((n) => n + 1);
    if (target.letter === correct) {
      target.opacity = 0;
      s.combo += 1;
      s.correctAnswers += 1;
      s.score += 100 * s.combo;
      s.speedMultiplier = Math.min(MAX_SPEED, s.speedMultiplier + SPEED_INCREMENT);
      setCombo(s.combo);
      setBestCombo((prev) => Math.max(prev, s.combo));
      setScore(s.score);
      setTotalCorrect((n) => n + 1);
      setFeedback({ text: `CORRECT +${100 * s.combo}`, color: COLORS.correct, start: Date.now() });
      setTimeout(() => setFeedback(null), FEEDBACK_DURATION);
      nextQuestion();
    } else {
      s.combo = 0;
      s.score = Math.max(0, s.score - 50);
      setCombo(0);
      setScore(s.score);
      setFeedback({ text: `WRONG — Answer: ${correct}`, color: COLORS.wrong, start: Date.now() });
      setTimeout(() => setFeedback(null), FEEDBACK_DURATION);
      nextQuestion();
    }
  }, [nextQuestion]);

  // ─── Game loop ──────────────────────────────────────────────────────────────

  const tick = useCallback((now: number) => {
    const s = S.current;
    const canvas = canvasRef.current;
    if (!canvas || s.phase !== "playing") return;

    if (!lastTimeRef.current) lastTimeRef.current = now;
    const dt = Math.min(50, now - lastTimeRef.current);
    lastTimeRef.current = now;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const groundY = H - 40;

    // Update targets
    for (const t of s.targets) {
      t.y += t.speed * dt * 0.06;
      t.x += t.drift;
      t.x = clamp(t.x, ARENA_PADDING + t.radius, W - ARENA_PADDING - t.radius);
      if (t.y > groundY && t.opacity > 0) {
        t.opacity = 0;
        s.lives -= 1;
        s.combo = 0;
        setLives(s.lives);
        setCombo(0);
        setFeedback({ text: "MISSED!", color: COLORS.wrong, start: Date.now() });
        setTimeout(() => setFeedback(null), FEEDBACK_DURATION);
        if (s.lives <= 0) {
          endGame(s);
        }
      }
    }
    s.targets = s.targets.filter((t) => t.opacity > 0 && t.y < H + 50);

    // Update bombs
    for (const b of s.bombs) {
      b.y += b.speed * dt * 0.06;
      b.x += b.drift;
      b.x = clamp(b.x, ARENA_PADDING + b.radius, W - ARENA_PADDING - b.radius);
      if (b.y > groundY && b.y < H && b.opacity > 0) {
        if (checkCollision(b, s.player)) {
          b.opacity = 0;
          s.lives -= 1;
          s.combo = 0;
          setLives(s.lives);
          setCombo(0);
          setFeedback({ text: "BOMB IMPACT!", color: COLORS.wrong, start: Date.now() });
          setTimeout(() => setFeedback(null), FEEDBACK_DURATION);
          if (s.lives <= 0) endGame(s);
        }
      }
    }
    s.bombs = s.bombs.filter((b) => b.opacity > 0 && b.y < H + 100);

    // Update projectiles
    for (const p of s.projectiles) {
      p.y -= p.speed * dt * 0.06;
    }
    s.projectiles = s.projectiles.filter((p) => p.y > -20);

    // Collision: projectile → target
    for (const p of s.projectiles) {
      for (const t of s.targets) {
        if (t.opacity <= 0) continue;
        if (checkCollision(p, t)) {
          t.opacity = 0;
          p.y = -100;
          handleHit(t);
          break;
        }
      }
    }
    s.projectiles = s.projectiles.filter((p) => p.y > -20);

    // Collision: projectile → bomb
    for (const p of s.projectiles) {
      for (const b of s.bombs) {
        if (b.opacity <= 0 || b.y > H) continue;
        if (checkCollision(p, b)) {
          p.y = -100;
          b.opacity = 0;
          s.lives -= 1;
          s.combo = 0;
          setLives(s.lives);
          setCombo(0);
          setFeedback({ text: "BOMB! −1 LIFE", color: COLORS.wrong, start: Date.now() });
          setTimeout(() => setFeedback(null), FEEDBACK_DURATION);
          if (s.lives <= 0) endGame(s);
        }
      }
    }

    // Player movement
    if (keysRef.current.has("ArrowLeft") || keysRef.current.has("a") || keysRef.current.has("A")) {
      s.player.x -= 8;
    }
    if (keysRef.current.has("ArrowRight") || keysRef.current.has("d") || keysRef.current.has("D")) {
      s.player.x += 8;
    }
    s.player.x = clamp(s.player.x, ARENA_PADDING, W - ARENA_PADDING - s.player.width);

    // Spawn
    s.spawnTimer += dt;
    if (s.spawnTimer > s.targetSpawnInterval) {
      s.spawnTimer = 0;
      const bombChance = Math.min(BOMB_CHANCE_BASE + (s.speedMultiplier - 1) * 0.008, BOMB_CHANCE_MAX);
      if (Math.random() < bombChance) {
        s.bombs.push(spawnBomb(W, H, s.speedMultiplier));
      } else {
        s.targets.push(spawnTarget(W, H, s.speedMultiplier));
      }
    }

    // Particles
    for (const p of s.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
    }
    s.particles = s.particles.filter((p) => p.life > 0);

    // ─── Draw ─────────────────────────────────────────────────────────────────

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Targets
    for (const t of s.targets) {
      if (t.opacity <= 0) continue;
      ctx.globalAlpha = t.opacity;
      ctx.beginPath();
      ctx.arc(t.x, t.y, TARGET_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.targetFill;
      ctx.fill();
      ctx.strokeStyle = COLORS.targetStroke;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = COLORS.targetText;
      ctx.font = `bold ${TARGET_RADIUS}px 'Inter', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t.letter, t.x, t.y);
    }
    ctx.globalAlpha = 1;

    // Bombs
    for (const b of s.bombs) {
      if (b.opacity <= 0 || b.y > H) continue;
      ctx.beginPath();
      ctx.arc(b.x, b.y, BOMB_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.bombFill;
      ctx.fill();
      ctx.strokeStyle = COLORS.bombStroke;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = COLORS.bombText;
      ctx.font = `bold 16px 'Inter', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✕", b.x, b.y);
    }

    // Projectiles
    for (const p of s.projectiles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, PROJECTILE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.projectile;
      ctx.fill();
    }

    // Particles
    for (const p of s.particles) {
      ctx.globalAlpha = Math.max(0, p.life / 500);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Player
    ctx.fillStyle = COLORS.playerFill;
    ctx.beginPath();
    ctx.moveTo(s.player.x + s.player.width / 2, s.player.y);
    ctx.lineTo(s.player.x + s.player.width, s.player.y + s.player.height);
    ctx.lineTo(s.player.x, s.player.y + s.player.height);
    ctx.closePath();
    ctx.fill();

    // Ground line
    ctx.strokeStyle = "rgba(34,211,238,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    animRef.current = requestAnimationFrame(tick);
  }, [handleHit]);

  function endGame(s: typeof S.current) {
    s.phase = "game_over";
    const elapsed = Math.floor((Date.now() - s.sessionStart) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(elapsed % 60).padStart(2, "0");
    setGameResult({
      score: s.score,
      questions: s.questionsAnswered,
      correct: s.correctAnswers,
      accuracy: s.questionsAnswered > 0 ? Math.round((s.correctAnswers / s.questionsAnswered) * 100) + "%" : "0%",
      bestCombo: s.bestCombo,
      time: `${mm}:${ss}`,
    });
    setPhase("game_over");
  }

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width;
      canvas.height = rect.height;
      S.current.arenaWidth = rect.width;
      S.current.arenaHeight = rect.height;
      S.current.player.x = clamp(S.current.player.x, ARENA_PADDING, rect.width - ARENA_PADDING - PLAYER_WIDTH);
      S.current.player.y = rect.height - PLAYER_HEIGHT - 10;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === " " || e.key === "Space") {
        e.preventDefault();
        const s = S.current;
        if (s.phase === "playing") {
          const p: Projectile = {
            id: uid(),
            x: s.player.x + s.player.width / 2,
            y: s.player.y,
            speed: PROJECTILE_SPEED,
            radius: PROJECTILE_RADIUS,
          };
          s.projectiles.push(p);
        }
      }
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        const s = S.current;
        if (s.phase === "playing") {
          s.phase = "paused";
          setPhase("paused");
          cancelAnimationFrame(animRef.current);
        } else if (s.phase === "paused") {
          s.phase = "playing";
          setPhase("playing");
          lastTimeRef.current = 0;
          animRef.current = requestAnimationFrame(tick);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animRef.current);
    };
  }, [tick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    S.current.player.y = canvas.height - PLAYER_HEIGHT - 10;
  }, []);

  // Mouse / touch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - PLAYER_WIDTH / 2;
      S.current.player.x = clamp(x, ARENA_PADDING, rect.width - ARENA_PADDING - PLAYER_WIDTH);
    };
    const handlePointerDown = (e: PointerEvent) => {
      const s = S.current;
      if (s.phase === "playing") {
        const p: Projectile = {
          id: uid(),
          x: s.player.x + s.player.width / 2,
          y: s.player.y,
          speed: PROJECTILE_SPEED,
          radius: PROJECTILE_RADIUS,
        };
        s.projectiles.push(p);
      }
    };

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerdown", handlePointerDown);

    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  // ─── Auto-start ─────────────────────────────────────────────────────────────

  useEffect(() => {
    startGame();
  }, []);

  // ─── Mute state ─────────────────────────────────────────────────────────────

  const [muted, setMuted] = useState(true);

  // ─── Render ─────────────────────────────────────────────────────────────────

  const isIdle = phase === "idle" || phase === "loading";

  return (
    <div className="flex flex-col h-screen bg-[#0a0e17]">
      {/* ── Header / Question Area ── */}
      <div className="flex-none bg-[#0d1321] border-b border-cyan-900/30 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-500 tracking-widest">QUESTION</span>
            <span className="text-xs text-cyan-400 font-mono">{questionNum} / {QUESTIONS_PER_SESSION}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-gray-500">SCORE </span>
              <span className="text-cyan-400 font-mono font-bold">{String(score).padStart(6, "0")}</span>
            </div>
            {combo > 1 && (
              <div className="text-amber-400 font-mono font-bold animate-pulse">
                COMBO ×{combo}
              </div>
            )}
          </div>
        </div>

        {/* Question text */}
        {question && (
          <div className="max-w-5xl mx-auto mb-2">
            <p className="text-sm text-gray-300 leading-relaxed">{question.question_text}</p>
          </div>
        )}

        {/* Answer map */}
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

      {/* ── Lives + controls bar ── */}
      <div className="flex-none flex items-center justify-between px-4 py-1.5 bg-[#0a0e17]">
        <div className="flex items-center gap-1">
          {Array.from({ length: BASE_LIVES }).map((_, i) => (
            <span key={i} className={i < lives ? "text-red-500 text-sm" : "text-gray-700 text-sm"}>♥</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted((m) => !m)}
            className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1"
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <button
            onClick={() => {
              const s = S.current;
              if (s.phase === "playing") {
                s.phase = "paused";
                setPhase("paused");
                cancelAnimationFrame(animRef.current);
              } else if (s.phase === "paused") {
                s.phase = "playing";
                setPhase("playing");
                lastTimeRef.current = 0;
                animRef.current = requestAnimationFrame(tick);
              }
            }}
            className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1 border border-gray-800 rounded"
          >
            {phase === "paused" ? "▶ RESUME" : "⏸ PAUSE"}
          </button>
        </div>
      </div>

      {/* ── Game Arena ── */}
      <div className="flex-1 min-h-0 relative">
        <canvas
          ref={canvasRef}
          className={`w-full h-full block touch-none ${isIdle ? "hidden" : ""}`}
        />

        {/* Loading overlay */}
        {isIdle && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-cyan-400 text-sm animate-pulse">Loading questions...</div>
          </div>
        )}

        {/* Feedback */}
        {feedback && Date.now() - feedback.start < FEEDBACK_DURATION && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-lg font-bold text-sm tracking-wider"
            style={{ color: feedback.color, backgroundColor: "rgba(0,0,0,0.7)" }}
          >
            {feedback.text}
          </div>
        )}

        {/* Pause overlay */}
        {phase === "paused" && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
            <p className="text-cyan-400 text-lg font-bold tracking-widest">PAUSED</p>
            <button
              onClick={() => {
                const s = S.current;
                s.phase = "playing";
                setPhase("playing");
                lastTimeRef.current = 0;
                animRef.current = requestAnimationFrame(tick);
              }}
              className="px-6 py-2 bg-cyan-500 text-gray-900 rounded font-bold text-sm"
            >
              RESUME
            </button>
            <button
              onClick={startGame}
              className="px-4 py-2 border border-gray-700 text-gray-400 rounded text-sm"
            >
              RESTART
            </button>
            <a
              href="/game"
              className="px-4 py-2 text-gray-500 text-sm hover:text-gray-300"
            >
              EXIT
            </a>
          </div>
        )}

        {/* Game over */}
        {phase === "game_over" && gameResult && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
            <p className="text-red-500 text-2xl font-bold tracking-widest">GAME OVER</p>
            <div className="text-center space-y-1">
              <p className="text-gray-400 text-xs">SCORE</p>
              <p className="text-white text-3xl font-bold font-mono">{gameResult.score.toLocaleString()}</p>
              <div className="grid grid-cols-3 gap-4 mt-3 text-center">
                <div>
                  <p className="text-gray-500 text-[10px]">QUESTIONS</p>
                  <p className="text-cyan-400 font-mono text-sm">{gameResult.questions}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px]">CORRECT</p>
                  <p className="text-green-400 font-mono text-sm">{gameResult.correct}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px]">ACCURACY</p>
                  <p className="text-white font-mono text-sm">{gameResult.accuracy}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px]">BEST COMBO</p>
                  <p className="text-amber-400 font-mono text-sm">×{gameResult.bestCombo}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-[10px]">SURVIVED</p>
                  <p className="text-white font-mono text-sm">{gameResult.time}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={startGame}
                className="px-6 py-2 bg-cyan-500 text-gray-900 rounded font-bold text-sm"
              >
                PLAY AGAIN
              </button>
              <a
                href="/game"
                className="px-4 py-2 border border-gray-700 text-gray-400 rounded text-sm"
              >
                CHANGE BRANCH
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
