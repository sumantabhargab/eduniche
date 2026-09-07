/**
 * Game constants for the Among Us-style library game.
 */

export const GAME_CONFIG = {
  /** Total players per lobby */
  PLAYERS_PER_GAME: 8,

  /** Number of impostors (proportional to players) */
  IMPOSTOR_RATIO: 1 / 4,
  MIN_IMPOSTORS: 1,
  MAX_IMPOSTORS: 2,

  /** Task configuration */
  TOTAL_TASKS_PER_PLAYER: 5,
  MAX_CONCURRENT_TASKS: 1,
  TASK_COMPLETION_BONUS: 0.15,

  /** Kill settings */
  KILL_COOLDOWN_MS: 20_000,
  KILL_RANGE_PX: 50,
  SABOTAGE_COOLDOWN_MS: 30_000,

  /** Meeting settings */
  EMERGENCY_BUTTON_COOLDOWN_MS: 15_000,
  VOTING_DURATION_MS: 45_000,
  DISCUSSION_DURATION_MS: 30_000,

  /** Win conditions */
  CREW_TASK_THRESHOLD: 0.8,
  IMPOSTOR_KILL_THRESHOLD: 1 / 2,

  /** Player movement while doing tasks */
  TASK_SPEED_MULTIPLIER: 0,

  /** Map interactions */
  TASK_TRIGGER_RANGE_PX: 40,
  BODY_REPORT_RANGE_PX: 55,

  /** Visual */
  GHOST_OPACITY: 0.35,
};

export const PLAYER_STATES = {
  ALIVE: "alive",
  DEAD: "dead",
  GHOST: "ghost",
} as const;

export type PlayerGameState = typeof PLAYER_STATES[keyof typeof PLAYER_STATES];

export const GAME_PHASES = {
  LOBBY: "lobby",
  PLAYING: "playing",
  DISCUSSION: "discussion",
  VOTING: "voting",
  ENDED: "ended",
} as const;

export type GamePhase = typeof GAME_PHASES[keyof typeof GAME_PHASES];

export const GAME_RESULTS = {
  NONE: "none",
  CREW_WIN: "crew_win",
  IMPOSTOR_WIN: "impostor_win",
  DRAW: "draw",
} as const;

export type GameResult = typeof GAME_RESULTS[keyof typeof GAME_RESULTS];
