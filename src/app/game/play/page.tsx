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
  projectile: "#22d3ee",
  playerFill: "#164e63",
  playerStroke: "#22d3ee",
  correct: "#22c55e",
  wrong: "#ef4444",
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function GamePlayPage() {
  const searchParams = useSearchParams();
  const branch = searchParams.get("branch") || "cse";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const mouseXRef = useRef<number>(0);
  const mountedRef = useRef(true);

  // React state for UI
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [lives, setLives] = useState(BASE_LIVES);
  const [phase, setPhase] = useState<"idle" | "playing" | "gameover">("idle");
  const [question, setQuestion] = useState<GameQuestion | null>(null);
  const [answerMap, setAnswerMap] = useState<Record<string, string>>({});
  const [questionNum, setQuestionNum] = useState(1);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [gameTime, setGameTime] = useState(0);

  // Game state ref
  const S = useRef({
    phase: "idle" as "idle" | "playing" | "gameover",
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

  // Load questions
  const loadQuestions = useCallback(async () => {
    try {
      const questions = await getQuestionsForBranch(branch as any, 30);
      S.current.questions = questions;
    } catch {
      console.error("Failed to load questions");
    }
  }, [branch]);

  // Next question
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

  // Start game
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
    nextQuestion();
  }, [loadQuestions, nextQuestion]);

  // Handle correct/wrong hit
  const handleHit = useCallback((target: FallingTarget) => {
    const s = S.current;
    s.questionsAnswered++;
    const correct = target.letter === s.currentQuestion?.correct_option;

    if (correct) {
      s.combo++;
      if (s.combo > s.bestCombo) s.bestCombo = s.combo;
      const points = 100 * Math.max(1, s.combo);
      s.score += points;
      s.correctAnswers++;
      s.speedMultiplier = Math.min(MAX_SPEED, s.speedMultiplier + SPEED_INCREMENT);
      s.targetSpawnInterval = Math.max(600, s.targetSpawnInterval - 30);

      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        s.particles.push({
          x: target.x, y: target.y,
          vx: Math.cos(angle) * rand(2, 5), vy: Math.sin(angle) * rand(2, 5),
          life: 1, color: COLORS.correct, size: rand(2, 4),
        });
      }

      s.targets = [];
      setTimeout(() => {
        if (s.questionsAnswered >= QUESTIONS_PER_SESSION) {
          s.phase = "gameover";
          setPhase("gameover");
          setGameTime(Math.round((Date.now() - s.sessionStart) / 1000));
        } else {
          nextQuestion();
        }
      }, 350);
    } else {
      s.combo = 0;
      s.score = Math.max(0, s.score - 50);
      s.lives--;

      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        s.particles.push({
          x: target.x, y: target.y,
          vx: Math.cos(angle) * rand(1, 3), vy: Math.sin(angle) * rand(1, 3),
          life: 1, color: COLORS.wrong, size: rand(2, 3),
        });
      }

      s.targets = s.targets.filter((t) => t.id !== target.id);
    }

    setScore(s.score);
    setCombo(s.combo);
    setBestCombo(s.bestCombo);
    setLives(s.lives);
    setTotalAnswered(s.questionsAnswered);
    setTotalCorrect(s.correctAnswers);
  }, [nextQuestion]);

  // Shoot
  const shoot = useCallback(() => {
    const s = S.current;
    if (s.phase !== "playing") return;
    s.projectiles.push({
      id: `p-${Date.now()}`,
      x: s.player.x + s.player.width / 2,
      y: s.player.y - PROJECTILE_RADIUS,
      speed: PROJECTILE_SPEED,
      radius: PROJECTILE_RADIUS,
    });
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      S.current.arenaWidth = rect.width;
      S.current.arenaHeight = rect.height;
      S.current.player.y = rect.height - 20;
      if (S.current.player.x === 0) {
        S.current.player.x = rect.width / 2 - PLAYER_WIDTH / 2;
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        shoot();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseXRef.current = e.clientX - rect.left;
    };
    const handleClick = () => shoot();
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      mouseXRef.current = e.touches[0].clientX - rect.left;
    };
    const handleTouchStart = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseXRef.current = e.touches[0].clientX - rect.left;
      shoot();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart);

    const loop = (timestamp: number) => {
      if (!mountedRef.current) return;
      const s = S.current;
      const dt = Math.min(32, timestamp - lastTimeRef.current);
      lastTimeRef.current = timestamp;

      if (s.phase === "playing") {
        const arenaW = s.arenaWidth;
        const arenaH = s.arenaHeight;

        // Player movement
        if (keysRef.current.has("arrowleft") || keysRef.current.has("a")) {
          s.player.x -= 6;
        }
        if (keysRef.current.has("arrowright") || keysRef.current.has("d")) {
          s.player.x += 6;
        }
        s.player.x += (mouseXRef.current - s.player.width / 2 - s.player.x) * 0.15;
        s.player.x = clamp(s.player.x, ARENA_PADDING, arenaW - ARENA_PADDING - s.player.width);

        // Spawn
        s.spawnTimer += dt;
        if (s.spawnTimer >= s.targetSpawnInterval) {
          s.spawnTimer = 0;
          const letters: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];
          const letter = letters[Math.floor(Math.random() * 4)];
          s.targets.push({
            id: `t-${Date.now()}-${Math.random()}`,
            letter,
            x: rand(ARENA_PADDING + TARGET_RADIUS, arenaW - ARENA_PADDING - TARGET_RADIUS),
            y: -TARGET_RADIUS * 2,
            speed: BASE_TARGET_SPEED * s.speedMultiplier * rand(0.85, 1.15),
            drift: rand(-0.3, 0.3),
            radius: TARGET_RADIUS,
            opacity: 1,
          });
          const bombChance = Math.min(BOMB_CHANCE_BASE + (s.speedMultiplier - 1) * 0.008, BOMB_CHANCE_MAX);
          if (Math.random() < bombChance) {
            s.bombs.push({
              id: `b-${Date.now()}-${Math.random()}`,
              x: rand(ARENA_PADDING + BOMB_RADIUS, arenaW - ARENA_PADDING - BOMB_RADIUS),
              y: -BOMB_RADIUS * 2,
              speed: BASE_TARGET_SPEED * s.speedMultiplier * rand(0.8, 1.0),
              drift: rand(-0.2, 0.2),
              radius: BOMB_RADIUS,
              opacity: 1,
            });
          }
        }

        // Update targets
        for (const t of s.targets) {
          t.y += t.speed;
          t.x += t.drift;
          t.x = clamp(t.x, ARENA_PADDING + t.radius, arenaW - ARENA_PADDING - t.radius);
        }
        for (const b of s.bombs) {
          b.y += b.speed;
          b.x += b.drift;
          b.x = clamp(b.x, ARENA_PADDING + b.radius, arenaW - ARENA_PADDING - b.radius);
        }
        for (const p of s.projectiles) {
          p.y -= p.speed;
        }
        for (const p of s.particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05;
          p.life -= dt / 600;
        }
        s.particles = s.particles.filter((p) => p.life > 0);

        // Collision: projectile → target
        for (const p of s.projectiles) {
          for (const t of [...s.targets]) {
            if (checkCollision(p, t)) {
              handleHit(t);
              s.projectiles = s.projectiles.filter((proj) => proj.id !== p.id);
              break;
            }
          }
        }

        // Collision: projectile → bomb
        for (const p of s.projectiles) {
          for (const b of s.bombs) {
            if (checkCollision(p, b)) {
              s.lives--;
              s.combo = 0;
              s.projectiles = s.projectiles.filter((proj) => proj.id !== p.id);
              s.bombs = s.bombs.filter((bomb) => bomb.id !== b.id);
              for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12;
                s.particles.push({
                  x: b.x, y: b.y,
                  vx: Math.cos(angle) * rand(3, 7), vy: Math.sin(angle) * rand(3, 7),
                  life: 1, color: COLORS.wrong, size: rand(3, 6),
                });
              }
              setLives(s.lives);
              setCombo(0);
              setScore(s.score);
              if (s.lives <= 0) {
                s.phase = "gameover";
                setPhase("gameover");
                setGameTime(Math.round((Date.now() - s.sessionStart) / 1000));
              }
              break;
            }
          }
        }

        // Bomb → player
        for (const b of s.bombs) {
          if (
            b.y + b.radius >= s.player.y &&
            Math.abs(b.x - (s.player.x + s.player.width / 2)) < s.player.width / 2 + b.radius
          ) {
            s.lives--;
            s.combo = 0;
            s.bombs = s.bombs.filter((bomb) => bomb.id !== b.id);
            for (let i = 0; i < 12; i++) {
              const angle = (Math.PI * 2 * i) / 12;
              s.particles.push({
                x: b.x, y: b.y,
                vx: Math.cos(angle) * rand(3, 7), vy: Math.sin(angle) * rand(3, 7),
                life: 1, color: COLORS.wrong, size: rand(3, 6),
              });
            }
            setLives(s.lives);
            setCombo(0);
            setScore(s.score);
            if (s.lives <= 0) {
              s.phase = "gameover";
              setPhase("gameover");
              setGameTime(Math.round((Date.now() - s.sessionStart) / 1000));
            }
            break;
          }
        }

        // Target reaches bottom
        for (const t of [...s.targets]) {
          if (t.y - t.radius >= arenaH - 5) {
            s.lives--;
            s.combo = 0;
            s.targets = s.targets.filter((target) => target.id !== t.id);
            setLives(s.lives);
            setCombo(0);
            if (s.lives <= 0) {
              s.phase = "gameover";
              setPhase("gameover");
              setGameTime(Math.round((Date.now() - s.sessionStart) / 1000));
            }
          }
        }
        for (const b of [...s.bombs]) {
          if (b.y - b.radius >= arenaH - 5) {
            s.bombs = s.bombs.filter((bomb) => bomb.id !== b.id);
          }
        }

        s.projectiles = s.projectiles.filter((p) => p.y > -10);
      }

      // ─── Render ─────────────────────────────────────────────────────────────
      const w = s.arenaWidth;
      const h = s.arenaHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 0.5;
      for (let x = 40; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 40; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (s.phase === "playing") {
        // Targets
        for (const t of s.targets) {
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.radius + 4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(34, 211, 238, 0.08)";
          ctx.fill();

          ctx.beginPath();
          ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.targetFill;
          ctx.fill();
          ctx.strokeStyle = COLORS.targetStroke;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = COLORS.targetText;
          ctx.font = `bold ${t.radius * 0.9}px "Inter", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(t.letter, t.x, t.y);
        }

        // Bombs
        for (const b of s.bombs) {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(239, 68, 68, 0.06)";
          ctx.fill();

          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.bombFill;
          ctx.fill();
          ctx.strokeStyle = COLORS.bombStroke;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.strokeStyle = COLORS.bombStroke;
          ctx.lineWidth = 2.5;
          const s2 = b.radius * 0.4;
          ctx.beginPath();
          ctx.moveTo(b.x - s2, b.y - s2);
          ctx.lineTo(b.x + s2, b.y + s2);
          ctx.moveTo(b.x + s2, b.y - s2);
          ctx.lineTo(b.x - s2, b.y + s2);
          ctx.stroke();
        }

        // Projectiles
        for (const p of s.projectiles) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.projectile;
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + 12);
          ctx.strokeStyle = "rgba(34, 211, 238, 0.25)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Particles
        for (const p of s.particles) {
          ctx.globalAlpha = clamp(p.life, 0, 1);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Player
        const px = s.player.x;
        const py = s.player.y;
        ctx.fillStyle = COLORS.playerFill;
        ctx.fillRect(px, py, PLAYER_WIDTH, PLAYER_HEIGHT);
        ctx.strokeStyle = COLORS.playerStroke;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px, py, PLAYER_WIDTH, PLAYER_HEIGHT);
        ctx.fillStyle = "#0e7490";
        ctx.fillRect(px + PLAYER_WIDTH / 2 - 3, py - 8, 6, 8);
        ctx.strokeStyle = COLORS.playerStroke;
        ctx.strokeRect(px + PLAYER_WIDTH / 2 - 3, py - 8, 6, 8);

        // Base line
        ctx.fillStyle = "rgba(34, 211, 238, 0.08)";
        ctx.fillRect(ARENA_PADDING, h - 4, w - ARENA_PADDING * 2, 4);
      }

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(gameLoopRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", resize);
    };
  }, [shoot, handleHit]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col">
      {/* Question Header */}
      <div className="shrink-0 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Question
              </span>
              <span className="text-xs text-gray-600">
                {questionNum} / {QUESTIONS_PER_SESSION}
              </span>
            </div>
            <span className="text-sm text-cyan-400 font-mono font-bold">
              {score.toLocaleString()}
            </span>
          </div>

          {phase === "playing" && question && (
            <>
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line mb-3">
                {question.question_text}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["A", "B", "C", "D"] as const).map((letter) => (
                  <div
                    key={letter}
                    className="flex items-center gap-3 px-3 py-2 bg-gray-900/50 rounded border border-gray-800"
                  >
                    <span className="w-5 h-5 rounded bg-cyan-400/10 text-cyan-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {letter}
                    </span>
                    <span className="text-sm text-gray-300 truncate">{answerMap[letter]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Arena */}
      <div ref={containerRef} className="flex-1 relative" style={{ minHeight: 400 }}>
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold text-white mb-1">GATE ARCADE</p>
            <p className="text-sm text-gray-500 mb-6">
              Shoot the correct answer. Avoid the bombs.
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-cyan-500 text-gray-900 font-bold rounded-lg hover:bg-cyan-400 transition-colors"
            >
              START
            </button>
          </div>
        )}

        {phase === "playing" && (
          <>
            <div className="absolute top-3 left-3 flex gap-1 z-10">
              {Array.from({ length: BASE_LIVES }).map((_, i) => (
                <span
                  key={i}
                  className={i < lives ? "text-rose-400" : "text-gray-700"}
                >
                  ♥
                </span>
              ))}
            </div>
            {combo > 1 && (
              <div className="absolute top-3 right-3 z-10">
                <span className="text-sm text-amber-400 font-mono font-bold">
                  ×{combo}
                </span>
              </div>
            )}
            <canvas ref={canvasRef} className="w-full h-full block" />
          </>
        )}

        {phase === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <p className="text-3xl font-bold text-white mb-6">GAME OVER</p>
            <div className="space-y-2 text-center mb-8">
              <p className="text-lg text-cyan-400 font-mono">
                Score: {score.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">
                Correct: {totalCorrect} / {totalAnswered}
              </p>
              <p className="text-sm text-gray-400">Accuracy: {accuracy}%</p>
              <p className="text-sm text-gray-400">
                Best Combo: ×{bestCombo}
              </p>
              <p className="text-sm text-gray-400">Time: {formatTime(gameTime)}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-cyan-500 text-gray-900 font-bold rounded-lg hover:bg-cyan-400 transition-colors"
              >
                PLAY AGAIN
              </button>
              <a
                href="/game"
                className="px-6 py-2.5 border border-gray-700 text-gray-400 rounded-lg hover:text-gray-200 transition-colors"
              >
                CHANGE BRANCH
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Controls hint */}
      {phase === "playing" && (
        <div className="shrink-0 border-t border-gray-800 py-2 px-4">
          <p className="text-xs text-gray-600 text-center">
            Mouse: move &amp; click &nbsp;|&nbsp; A/D or Arrows: move &nbsp;|&nbsp; Space: shoot &nbsp;|&nbsp; Mobile: tap to shoot
          </p>
        </div>
      )}
    </div>
  );
}
