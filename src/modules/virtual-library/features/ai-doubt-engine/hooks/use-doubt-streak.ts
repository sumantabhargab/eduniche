/**
 * Doubt Streak & Daily Goal Tracker
 *
 * Tracks consecutive days of doubt-engine activity using localStorage.
 * Calculates current streak, longest streak, and daily goal progress.
 */

const STREAK_KEY = "padhaishuru_doubt_streak";
const GOAL_KEY = "padhaishuru_doubt_goal";
const HISTORY_KEY = "padhaishuru_doubt_history";
const DEFAULT_DAILY_GOAL = 5;

export interface DoubtStreak {
  current: number;
  longest: number;
  todayCount: number;
  dailyGoal: number;
  goalMet: boolean;
  lastActiveDate: string | null;
}

function todayStr(): string {
  return new Date().toLocaleDateString("en-CA");
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA");
}

export function getDoubtStreak(): DoubtStreak {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) {
      const today = todayStr();
      const initial = { current: 0, longest: 0, lastActiveDate: today };
      localStorage.setItem(STREAK_KEY, JSON.stringify(initial));
      return { ...initial, todayCount: 0, dailyGoal: DEFAULT_DAILY_GOAL, goalMet: false };
    }
    const streak = JSON.parse(raw) as { current: number; longest: number; lastActiveDate: string };
    const today = todayStr();
    const yesterday = yesterdayStr();
    const historyRaw = localStorage.getItem(HISTORY_KEY);
    const history: Record<string, number> = historyRaw ? JSON.parse(historyRaw) : {};
    const todayCount = history[today] || 0;
    const goalRaw = localStorage.getItem(GOAL_KEY);
    const dailyGoal = goalRaw ? parseInt(goalRaw, 10) : DEFAULT_DAILY_GOAL;
    const goalMet = todayCount >= dailyGoal;

    return {
      current: streak.current,
      longest: streak.longest,
      todayCount,
      dailyGoal,
      goalMet,
      lastActiveDate: streak.lastActiveDate,
    };
  } catch {
    return { current: 0, longest: 0, todayCount: 0, dailyGoal: DEFAULT_DAILY_GOAL, goalMet: false, lastActiveDate: null };
  }
}

export function recordDoubtActivity(count: number = 1): DoubtStreak {
  try {
    const today = todayStr();
    const yesterday = yesterdayStr();
    const raw = localStorage.getItem(STREAK_KEY);
    const streak = raw ? JSON.parse(raw) as { current: number; longest: number; lastActiveDate: string } : { current: 0, longest: 0, lastActiveDate: "" };

    // Update history
    const historyRaw = localStorage.getItem(HISTORY_KEY);
    const history: Record<string, number> = historyRaw ? JSON.parse(historyRaw) : {};
    history[today] = (history[today] || 0) + count;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    // Update streak
    if (streak.lastActiveDate === today) {
      // Already active today, streak unchanged
    } else if (streak.lastActiveDate === yesterday) {
      // Consecutive day
      streak.current += 1;
      streak.lastActiveDate = today;
    } else {
      // Streak broken or first time
      streak.current = 1;
      streak.lastActiveDate = today;
    }
    streak.longest = Math.max(streak.longest, streak.current);
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));

    const goalRaw = localStorage.getItem(GOAL_KEY);
    const dailyGoal = goalRaw ? parseInt(goalRaw, 10) : DEFAULT_DAILY_GOAL;

    return {
      current: streak.current,
      longest: streak.longest,
      todayCount: history[today] || 0,
      dailyGoal,
      goalMet: (history[today] || 0) >= dailyGoal,
      lastActiveDate: streak.lastActiveDate,
    };
  } catch {
    return getDoubtStreak();
  }
}

export function setDailyGoal(goal: number): void {
  try {
    localStorage.setItem(GOAL_KEY, String(goal));
  } catch {
    // ignore
  }
}

export function getTotalDoubtsAllTime(): number {
  try {
    const historyRaw = localStorage.getItem(HISTORY_KEY);
    if (!historyRaw) return 0;
    const history: Record<string, number> = JSON.parse(historyRaw);
    return Object.values(history).reduce((sum, count) => sum + count, 0);
  } catch {
    return 0;
  }
}

export function getDoubtStreakStatus(streak: DoubtStreak): "none" | "alive" | "broken" {
  if (streak.current === 0) return "none";
  const lastActive = streak.lastActiveDate;
  if (!lastActive) return "none";
  const today = todayStr();
  const yesterday = yesterdayStr();
  if (lastActive === today || lastActive === yesterday) return "alive";
  return "broken";
}
