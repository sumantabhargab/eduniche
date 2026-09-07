/**
 * useGame.ts — state machine for the Among Us Library game.
 *
 * Responsibilities:
 *  - Lobby lifecycle (create/join/ready/start)
 *  - Role assignment
 *  - Task assignment & completion
 *  - Kill / emergency / report actions
 *  - Discussion + voting phase
 *  - Win-condition evaluation
 *  - Cross-player state sync via Supabase Realtime broadcast
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GAME_CONFIG, PLAYER_STATES, GAME_PHASES, GAME_RESULTS } from "./config";
import { MAP_TASKS } from "./tasks";
import type {
  PlayerData,
  GameLobby,
  ChatMessage,
  VoteState,
  GamePhase,
  GameResult,
} from "./types";

const PLAYER_NAMES = [
  "Player", "Explorer", "Scholar", "Reader", "Librarian",
  "Bookworm", "Researcher", "Seeker",
];
const PLAYER_COLORS = [
  "#E53935", "#43A047", "#1E88E5", "#FB8C00",
  "#8E24AA", "#00ACC1", "#F4511E", "#5E35B1",
];

// Broadcast channel naming pattern — shared with useGame server/cron if needed
const BROADCAST = "eduneuro:game:lobby";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildLobby(
  hostId: string,
  maxPlayers: number = GAME_CONFIG.PLAYERS_PER_GAME,
): GameLobby {
  return {
    id: generateRoomCode(),
    name: "Library Mystery",
    hostId,
    players: [
      {
        id: hostId,
        name: getDisplayName(hostId),
        color: PLAYER_COLORS[0],
        isHost: true,
        isReady: false,
        joinedAt: Date.now(),
      },
    ],
    maxPlayers,
    phase: GAME_PHASES.LOBBY,
    createdAt: Date.now(),
  };
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

function getDisplayName(id: string): string {
  const suffix = id.slice(-4);
  const idx = parseInt(suffix, 36) % PLAYER_NAMES.length;
  return `${PLAYER_NAMES[idx]} ${suffix.slice(0, 2)}`;
}

function assignRoles(players: PlayerData[]): PlayerData[] {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const impostorCount = Math.min(
    Math.max(1, Math.floor(players.length * GAME_CONFIG.IMPOSTOR_RATIO)),
    GAME_CONFIG.MAX_IMPOSTORS,
  );
  return players.map((p) => ({
    ...p,
    role: shuffled.indexOf(p) < impostorCount ? "impostor" : "crewmate",
    isDead: false,
  }));
}

function assignTasks(players: PlayerData[]): PlayerData[] {
  const usedTasks = new Set<string>();
  return players.map((p) => {
    if (p.role === "impostor") return { ...p, tasks: [] };
    const tasks: Array<{ id: string; name: string; completed: boolean; progress: number }> = [];
    while (tasks.length < GAME_CONFIG.TOTAL_TASKS_PER_PLAYER) {
      const task = MAP_TASKS[Math.floor(Math.random() * MAP_TASKS.length)];
      if (usedTasks.has(task.id)) continue;
      usedTasks.add(task.id);
      tasks.push({ id: task.id, name: task.name, completed: false, progress: 0 });
    }
    return { ...p, tasks };
  });
}

function evaluateWinCondition(lobby: GameLobby): GameResult | null {
  const alive = lobby.players.filter((p) => !p.isDead);
  const impostors = alive.filter((p) => p.role === "impostor");
  const crewmates = alive.filter((p) => p.role === "crewmate");

  if (impostors.length === 0) return GAME_RESULTS.CREW_WIN;
  if (impostors.length >= crewmates.length) return GAME_RESULTS.IMPOSTOR_WIN;

  const totalTasks = lobby.players.reduce(
    (sum, p) => sum + (p.tasks?.length ?? 0),
    0,
  );
  const completedTasks = lobby.players.reduce(
    (sum, p) => sum + (p.tasks?.filter((t) => t.completed).length ?? 0),
    0,
  );
  if (totalTasks > 0 && completedTasks / totalTasks >= GAME_CONFIG.CREW_TASK_THRESHOLD) {
    return GAME_RESULTS.CREW_WIN;
  }
  return null;
}

// ─── Supabase Realtime Helpers ────────────────────────────────────────────────

function getSupabase() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createBrowserClient } = require("@/lib/supabase/client");
    return createBrowserClient();
  } catch {
    return null;
  }
}

function useGameChannel<T extends string>(
  channelName: string,
  eventName: T,
  onMessage: (payload: Record<string, unknown>) => void,
): ((message: Record<string, unknown>) => void) | null {
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabase>["channel"]> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return () => {};

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: true } },
    });

    channel
      .on("broadcast", { event: eventName }, ({ payload }: { payload: unknown }) => {
        onMessageRef.current(payload as Record<string, unknown>);
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          channelRef.current = channel as ReturnType<ReturnType<typeof getSupabase>["channel"]>;
        }
      });

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [channelName, eventName]);

  const broadcast = useCallback(
    (message: Record<string, unknown>) => {
      channelRef.current?.send({
        type: "broadcast",
        event: eventName,
        payload: message,
      });
    },
    [eventName],
  );

  return broadcast;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseAmongUsGameOptions {
  /** Optional: join an existing lobby by code */
  joinCode?: string;
  /** Player name override */
  playerName?: string;
}

export interface UseAmongUsGameReturn {
  // Lobby state
  lobby: GameLobby | null;
  currentUserId: string;
  isHost: boolean;
  isReady: boolean;
  myRole: "crewmate" | "impostor" | null;
  isGhost: boolean;

  // Actions
  createLobby: () => void;
  joinLobby: (code: string) => Promise<boolean>;
  leaveLobby: () => void;
  setReady: (ready: boolean) => void;
  startGame: () => void;

  // Gameplay
  myTasks: Array<{ id: string; name: string; completed: boolean; progress: number }>;
  activeTask: { name: string; description: string; icon: string; progress: number } | null;
  startTask: (taskId: string) => void;
  completeTask: (taskName: string) => void;

  // Actions
  canKill: boolean;
  killCooldown: number;
  kill: () => void;
  canReport: boolean;
  reportBody: () => void;
  canEmergency: boolean;
  callEmergencyMeeting: () => void;

  // Chat
  messages: ChatMessage[];
  sendChat: (text: string) => void;

  // Voting
  voteState: VoteState | null;
  vote: (targetId: string | null) => void;
  skipVote: () => void;

  // Observers
  gamePhase: GamePhase;
  gameResult: GameResult | null;
  aliveCount: number;
  totalCount: number;
  nearbyBody: string | null;
  onGameEnd: (cb: (result: GameResult) => void) => () => void;
  onPhaseChange: (cb: (phase: GamePhase) => void) => () => void;
  onRoleAssign: (cb: (role: "crewmate" | "impostor") => void) => () => void;
  onPlayerDeath: (cb: (playerId: string) => void) => () => void;
  onTaskUpdate: (cb: (tasks: Array<{ id: string; name: string; completed: boolean; progress: number }>) => void) => () => void;
  onKillCooldown: (cb: (cooldown: number) => void) => () => void;
  onVoteStart: (cb: (vs: VoteState) => void) => () => void;
  onVoteEnd: (cb: () => void) => () => void;
  onChatMessage: (cb: (msg: ChatMessage) => void) => () => void;

  // Lifecycle
  cleanup: () => void;
}

export function useGame({
  joinCode,
  playerName,
}: UseAmongUsGameOptions = {}): UseAmongUsGameReturn {
  // ─── State ───────────────────────────────────────────────────────────────────
  const [lobby, setLobby] = useState<GameLobby | null>(null);
  const [currentUserId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  const [isReady, setIsReady] = useState(false);
  const [myRole, setMyRole] = useState<"crewmate" | "impostor" | null>(null);
  const [isGhost, setIsGhost] = useState(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>(GAME_PHASES.LOBBY);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [aliveCount, setAliveCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [myTasks, setMyTasks] = useState<
    Array<{ id: string; name: string; completed: boolean; progress: number }>
  >([]);
  const [activeTask, setActiveTask] = useState<{
    name: string;
    description: string;
    icon: string;
    progress: number;
  } | null>(null);
  const [canKill, setCanKill] = useState(false);
  const [killCooldown, setKillCooldown] = useState(0);
  const [canReport, setCanReport] = useState(false);
  const [canEmergency, setCanEmergency] = useState(false);
  const [nearbyBody, setNearbyBody] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [voteState, setVoteState] = useState<VoteState | null>(null);

  const isHost = lobby?.hostId === currentUserId;
  const lobbyRef = useRef(lobby);
  const phaseRef = useRef(gamePhase);

  // Observer registries
  const endCallbacks = useRef<Set<(r: GameResult) => void>>(new Set());
  const phaseCallbacks = useRef<Set<(p: GamePhase) => void>>(new Set());
  const roleCallbacks = useRef<Set<(r: "crewmate" | "impostor") => void>>(new Set());
  const deathCallbacks = useRef<Set<(id: string) => void>>(new Set());
  const taskCallbacks = useRef<Set<(t: Array<{ id: string; name: string; completed: boolean; progress: number }>) => void>>(new Set());
  const cooldownCallbacks = useRef<Set<(c: number) => void>>(new Set());
  const voteStartCallbacks = useRef<Set<(vs: VoteState) => void>>(new Set());
  const voteEndCallbacks = useRef<Set<() => void>>(new Set());
  const chatCallbacks = useRef<Set<(m: ChatMessage) => void>>(new Set());

  const taskListType: Array<{ id: string; name: string; completed: boolean; progress: number }> = [];

  const sendGameEvent = useGameChannel(
    BROADCAST,
    "game-event",
    useCallback((event: Record<string, unknown>) => {
      const data = event as {
        type: string;
        lobbyId: string;
        payload?: Record<string, unknown>;
      };
      if (!event || typeof event !== "object" || !("type" in event)) return;

      // Ignore events from other lobbies
      if (lobbyRef.current && data.lobbyId !== lobbyRef.current.id) return;

      switch (data.type) {
        case "LOBBY_UPDATE":
          if (data.payload?.lobby) setLobby(data.payload.lobby as GameLobby);
          break;
        case "GAME_START":
          if (data.payload?.lobby) {
            setLobby(data.payload.lobby as GameLobby);
            setGamePhase(GAME_PHASES.PLAYING);
            phaseRef.current = GAME_PHASES.PLAYING;
            setTotalCount((data.payload.lobby as GameLobby).players.length);
            setAliveCount((data.payload.lobby as GameLobby).players.length);
            const me = (data.payload.lobby as GameLobby).players.find(
              (p) => p.id === currentUserId,
            );
            if (me) {
              setMyRole(me.role ?? "crewmate");
              setMyTasks(me.tasks ?? []);
              roleCallbacks.current.forEach((cb) => cb(me.role ?? "crewmate"));
            }
          }
          break;
        case "TASK_COMPLETE":
          if (data.payload?.playerId && data.payload?.taskId) {
            setLobby((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                players: prev.players.map((p) =>
                  p.id === (data.payload?.playerId as string)
                    ? {
                        ...p,
                        tasks: (p.tasks ?? []).map((t) =>
                          t.id === (data.payload?.taskId as string) ? { ...t, completed: true, progress: 1 } : t,
                        ),
                      }
                    : p,
                ),
              };
            });
          }
          break;
        case "PLAYER_DEATH":
          if (data.payload?.playerId) {
            setLobby((prev) => {
              if (!prev) return prev;
              const deadPlayer = prev.players.find((p) => p.id === data.payload?.playerId as string);
              if (deadPlayer?.isDead) return prev;
              return {
                ...prev,
                players: prev.players.map((p) =>
                  p.id === (data.payload?.playerId as string) ? { ...p, isDead: true } : p,
                ),
              };
            });
            setAliveCount((c) => Math.max(0, c - 1));
            if ((data.payload?.playerId as string) === currentUserId) {
              setIsGhost(true);
            }
            deathCallbacks.current.forEach((cb) => cb(data.payload?.playerId as string));
          }
          break;
        case "EMERGENCY_MEETING":
          startVotingPhase(data.payload?.initiatorId as string | undefined);
          break;
        case "BODY_REPORTED":
          startVotingPhase(data.payload?.reporterId as string | undefined);
          break;
        case "VOTE_CAST":
          if (data.payload?.votes && voteState) {
            const newVotes = new Map(voteState.votes);
            Object.entries(data.payload.votes as Record<string, string | null>).forEach(
              ([k, v]) => newVotes.set(k, v),
            );
            setVoteState((prev) => (prev ? { ...prev, votes: newVotes } : null));
          }
          break;
        case "VOTE_END":
          if (data.payload?.ejectedId !== undefined) {
            const ejectedId = data.payload.ejectedId as string | null;
            if (ejectedId) {
              setLobby((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  players: prev.players.map((p) =>
                    p.id === ejectedId ? { ...p, isDead: true } : p,
                  ),
                };
              });
              setAliveCount((c) => Math.max(0, c - 1));
              deathCallbacks.current.forEach((cb) => cb(ejectedId!));
            }
            voteEndCallbacks.current.forEach((cb) => cb());
            setVoteState(null);
            setGamePhase(GAME_PHASES.PLAYING);
            phaseRef.current = GAME_PHASES.PLAYING;
            phaseCallbacks.current.forEach((cb) => cb(GAME_PHASES.PLAYING));

            setTimeout(() => {
              setLobby((prev) => {
                if (!prev) return prev;
                const result = evaluateWinCondition(prev);
                if (result) {
                  setGamePhase(GAME_PHASES.ENDED);
                  phaseRef.current = GAME_PHASES.ENDED;
                  setGameResult(result);
                  endCallbacks.current.forEach((cb) => cb(result));
                }
                return prev;
              });
            }, 500);
          }
          break;
        case "GAME_END":
          if (data.payload && "result" in data.payload) {
            const resultValue = data.payload.result as GameResult;
            setGamePhase(GAME_PHASES.ENDED);
            phaseRef.current = GAME_PHASES.ENDED;
            setGameResult(resultValue);
            endCallbacks.current.forEach((cb) => cb(resultValue));
          }
          break;
        default:
          break;
      }
    }, [currentUserId, voteState]),
  );

  // Broadcast helper (stable)
  const broadcastRef = useRef<((msg: Record<string, unknown>) => void) | null>(null);
  const [, setBroadcastTick] = useState(0);
  useEffect(() => {
    const ch = getSupabase()?.channel(BROADCAST, {
      config: { broadcast: { self: true } },
    });
    if (!ch) return;
    ch.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        broadcastRef.current = (msg: Record<string, unknown>) => {
          ch.send({ type: "broadcast", event: "game-event", payload: msg });
        };
        setBroadcastTick((n) => n + 1);
      }
    });
    return () => {
      broadcastRef.current = null;
      void getSupabase()?.removeChannel(ch);
    };
  }, []);

  // ─── Lobby Actions ───────────────────────────────────────────────────────────

  const createLobby = useCallback(() => {
    const newLobby = buildLobby(currentUserId);
    setLobby(newLobby);
    setGamePhase(GAME_PHASES.LOBBY);
    phaseRef.current = GAME_PHASES.LOBBY;
    broadcastRef.current?.({
      type: "LOBBY_UPDATE",
      lobbyId: newLobby.id,
      payload: { lobby: newLobby },
    });
  }, [currentUserId]);

  const joinLobby = useCallback(
    async (code: string): Promise<boolean> => {
      const supabase = getSupabase();
      if (!supabase) return false;

      const { data } = await supabase
        .from("game_lobbies")
        .select("*")
        .eq("id", code.toUpperCase())
        .eq("phase", GAME_PHASES.LOBBY)
        .single();

      if (!data) return false;

      const lobbyData = data as unknown as GameLobby;
      if (lobbyData.players.length >= lobbyData.maxPlayers) return false;

      const newPlayer: PlayerData = {
        id: currentUserId,
        name: playerName ?? getDisplayName(currentUserId),
        color: PLAYER_COLORS[lobbyData.players.length % PLAYER_COLORS.length],
        isHost: false,
        isReady: false,
        joinedAt: Date.now(),
      };

      const updatedLobby = {
        ...lobbyData,
        players: [...lobbyData.players, newPlayer],
      };

      await supabase.from("game_lobbies").update({ players: updatedLobby.players }).eq("id", code.toUpperCase());

      setLobby(updatedLobby);
      lobbyRef.current = updatedLobby;
      setGamePhase(GAME_PHASES.LOBBY);
      phaseRef.current = GAME_PHASES.LOBBY;

      broadcastRef.current?.({
        type: "LOBBY_UPDATE",
        lobbyId: updatedLobby.id,
        payload: { lobby: updatedLobby },
      });

      return true;
    },
    [currentUserId, playerName],
  );

  const leaveLobby = useCallback(() => {
    if (lobby) {
      broadcastRef.current?.({
        type: "PLAYER_LEAVE",
        lobbyId: lobby.id,
        payload: { playerId: currentUserId },
      });
    }
    setLobby(null);
    setMyRole(null);
    setIsGhost(false);
    setGamePhase(GAME_PHASES.LOBBY);
    phaseRef.current = GAME_PHASES.LOBBY;
    setIsReady(false);
    setMyTasks([]);
    setActiveTask(null);
    setMessages([]);
    setVoteState(null);
    setGameResult(null);
    lobbyRef.current = null;
  }, [currentUserId, lobby]);

  const setReady = useCallback(
    (ready: boolean) => {
      setIsReady(ready);
      setLobby((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          players: prev.players.map((p) =>
            p.id === currentUserId ? { ...p, isReady: ready } : p,
          ),
        };
        lobbyRef.current = updated;
        broadcastRef.current?.({
          type: "LOBBY_UPDATE",
          lobbyId: updated.id,
          payload: { lobby: updated },
        });
        return updated;
      });
    },
    [currentUserId],
  );

  const startGame = useCallback(() => {
    if (!lobby || !isHost) return;
    const playersWithRoles = assignRoles(lobby.players);
    const playersWithTasks = assignTasks(playersWithRoles);
    const updatedLobby = { ...lobby, players: playersWithTasks, phase: GAME_PHASES.PLAYING };

    setLobby(updatedLobby);
    lobbyRef.current = updatedLobby;
    setGamePhase(GAME_PHASES.PLAYING);
    phaseRef.current = GAME_PHASES.PLAYING;
    setTotalCount(playersWithTasks.length);
    setAliveCount(playersWithTasks.length);

    const me = playersWithTasks.find((p) => p.id === currentUserId);
    if (me) {
      setMyRole(me.role ?? "crewmate");
      setMyTasks(me.tasks ?? []);
      roleCallbacks.current.forEach((cb) => cb(me.role ?? "crewmate"));
    }

    taskCallbacks.current.forEach((cb) => cb(me?.tasks ?? []));

    broadcastRef.current?.({
      type: "GAME_START",
      lobbyId: updatedLobby.id,
      payload: { lobby: updatedLobby },
    });
  }, [lobby, isHost, currentUserId]);

  // ─── Gameplay Actions ────────────────────────────────────────────────────────

  const startTask = useCallback(
    (taskId: string) => {
      const task = myTasks.find((t) => t.id === taskId && !t.completed);
      if (!task) return;
      const taskDef = MAP_TASKS.find((t) => t.id === taskId);
      setActiveTask({
        name: task.name,
        description: "Hold SPACE or stay near to complete",
        icon: taskDef?.icon ?? "📖",
        progress: task.progress,
      });
    },
    [myTasks],
  );

  const completeTask = useCallback(
    (taskName: string) => {
      setMyTasks((prev) => {
        const next = prev.map((t) =>
          t.name === taskName ? { ...t, completed: true, progress: 1 } : t,
        );
        taskCallbacks.current.forEach((cb) => cb(next));
        broadcastRef.current?.({
          type: "TASK_COMPLETE",
          lobbyId: lobbyRef.current?.id ?? "",
          payload: { playerId: currentUserId, taskName },
        });
        return next;
      });
      setActiveTask(null);

      // Check win condition
      setLobby((prev) => {
        if (!prev) return prev;
        const me = prev.players.find((p) => p.id === currentUserId);
        const myTaskList = me?.tasks ?? [];
        const completed = myTaskList.filter((t) => t.completed).length;
        if (completed / Math.max(myTaskList.length, 1) >= GAME_CONFIG.CREW_TASK_THRESHOLD) {
          const result = GAME_RESULTS.CREW_WIN;
          setGamePhase(GAME_PHASES.ENDED);
          phaseRef.current = GAME_PHASES.ENDED;
          setGameResult(result);
          endCallbacks.current.forEach((cb) => cb(result));
          broadcastRef.current?.({
            type: "GAME_END",
            lobbyId: prev.id,
            payload: { result },
          });
        }
        return prev;
      });
    },
    [currentUserId],
  );

  const kill = useCallback(() => {
    if (!canKill || !lobby || myRole !== "impostor") return;
    const aliveCrewmates = lobby.players.filter(
      (p) => p.id !== currentUserId && !p.isDead && p.role !== "impostor",
    );
    if (aliveCrewmates.length === 0) return;
    const victimId = aliveCrewmates[0].id;

    setLobby((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        players: prev.players.map((p) =>
          p.id === victimId ? { ...p, isDead: true } : p,
        ),
      };
      lobbyRef.current = updated;
      broadcastRef.current?.({
        type: "PLAYER_DEATH",
        lobbyId: updated.id,
        payload: { playerId: victimId, killerId: currentUserId },
      });
      return updated;
    });

    setAliveCount((c) => Math.max(0, c - 1));
    deathCallbacks.current.forEach((cb) => cb(victimId));
    if (victimId === currentUserId) setIsGhost(true);

    setCanKill(false);
    setKillCooldown(GAME_CONFIG.KILL_COOLDOWN_MS);
    cooldownCallbacks.current.forEach((cb) => cb(GAME_CONFIG.KILL_COOLDOWN_MS));

    setTimeout(() => {
      setLobby((prev) => {
        if (!prev) return prev;
        const result = evaluateWinCondition(prev);
        if (result) {
          setGamePhase(GAME_PHASES.ENDED);
          phaseRef.current = GAME_PHASES.ENDED;
          setGameResult(result);
          endCallbacks.current.forEach((cb) => cb(result));
          broadcastRef.current?.({
            type: "GAME_END",
            lobbyId: prev.id,
            payload: { result },
          });
        }
        return prev;
      });
    }, 100);
  }, [canKill, lobby, myRole, currentUserId]);

  const reportBody = useCallback(() => {
    const bodyId = nearbyBody;
    if (!lobby || !bodyId) return;
    broadcastRef.current?.({
      type: "BODY_REPORTED",
      lobbyId: lobby.id,
      payload: { bodyId, reporterId: currentUserId },
    });
    startVotingPhase(currentUserId);
  }, [lobby, nearbyBody, currentUserId]);

  const callEmergencyMeeting = useCallback(() => {
    if (!lobby) return;
    broadcastRef.current?.({
      type: "EMERGENCY_MEETING",
      lobbyId: lobby.id,
      payload: { initiatorId: currentUserId },
    });
    startVotingPhase(currentUserId);
  }, [lobby, currentUserId]);

  // ─── Voting ──────────────────────────────────────────────────────────────────

  const startVotingPhase = useCallback(
    (initiatorId: string | undefined) => {
      const votes = new Map<string, string | null>();
      lobby?.players.forEach((p) => {
        if (!p.isDead) votes.set(p.id, null);
      });

      const vs: VoteState = {
        votes,
        endsAt: Date.now() + GAME_CONFIG.VOTING_DURATION_MS,
      };

      setVoteState(vs);
      setGamePhase(GAME_PHASES.VOTING);
      phaseRef.current = GAME_PHASES.VOTING;
      phaseCallbacks.current.forEach((cb) => cb(GAME_PHASES.VOTING));
      voteStartCallbacks.current.forEach((cb) => cb(vs));

      broadcastRef.current?.({
        type: "VOTE_START",
        lobbyId: lobby?.id ?? "",
        payload: { voteState: vs, initiatorId },
      });

      setTimeout(() => {
        resolveVote(vs);
      }, GAME_CONFIG.VOTING_DURATION_MS);
    },
    [lobby],
  );

  const resolveVote = useCallback(
    (vs: VoteState) => {
      const tally = new Map<string, number>();
      vs.votes.forEach((target) => {
        if (target === null) return;
        tally.set(target, (tally.get(target) ?? 0) + 1);
      });

      let maxVotes = 0;
      let ejectedId: string | null = null;
      let tie = false;
      tally.forEach((count, playerId) => {
        if (count > maxVotes) {
          maxVotes = count;
          ejectedId = playerId;
          tie = false;
        } else if (count === maxVotes) {
          tie = true;
        }
      });

      if (tie || maxVotes === 0) ejectedId = null;

      if (ejectedId) {
        setLobby((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            players: prev.players.map((p) =>
              p.id === ejectedId! ? { ...p, isDead: true } : p,
            ),
          };
          lobbyRef.current = updated;
          broadcastRef.current?.({
            type: "VOTE_END",
            lobbyId: updated.id,
            payload: { ejectedId },
          });
          return updated;
        });
        setAliveCount((c) => Math.max(0, c - 1));
        deathCallbacks.current.forEach((cb) => cb(ejectedId!));
      } else {
        broadcastRef.current?.({
          type: "VOTE_END",
          lobbyId: lobby?.id ?? "",
          payload: { ejectedId: null },
        });
      }

      voteEndCallbacks.current.forEach((cb) => cb());
      setVoteState(null);
      setGamePhase(GAME_PHASES.PLAYING);
      phaseRef.current = GAME_PHASES.PLAYING;
      phaseCallbacks.current.forEach((cb) => cb(GAME_PHASES.PLAYING));

      setTimeout(() => {
        setLobby((prev) => {
          if (!prev) return prev;
          const result = evaluateWinCondition(prev);
          if (result) {
            setGamePhase(GAME_PHASES.ENDED);
            phaseRef.current = GAME_PHASES.ENDED;
            setGameResult(result);
            endCallbacks.current.forEach((cb) => cb(result));
            broadcastRef.current?.({
              type: "GAME_END",
              lobbyId: prev.id,
              payload: { result },
            });
          }
          return prev;
        });
      }, 500);
    },
    [lobby],
  );

  const vote = useCallback(
    (targetId: string | null) => {
      if (!voteState || !lobby) return;
      const newVotes = new Map(voteState.votes);
      newVotes.set(currentUserId, targetId);
      setVoteState((prev) => (prev ? { ...prev, votes: newVotes } : null));

      broadcastRef.current?.({
        type: "VOTE_CAST",
        lobbyId: lobby.id,
        payload: {
          playerId: currentUserId,
          votes: Object.fromEntries(newVotes.entries()),
        },
      });
    },
    [voteState, lobby, currentUserId],
  );

  const skipVote = useCallback(() => vote(null), [vote]);

  // ─── Chat ────────────────────────────────────────────────────────────────────

  const sendChat = useCallback(
    (text: string) => {
      if (!text.trim() || !lobby) return;
      const msg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        playerId: currentUserId,
        text: text.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);
      chatCallbacks.current.forEach((cb) => cb(msg));
      broadcastRef.current?.({
        type: "CHAT_MESSAGE",
        lobbyId: lobby.id,
        payload: msg,
      });
    },
    [lobby, currentUserId],
  );

  // ─── Kill Cooldown ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (killCooldown <= 0) return;
    const interval = setInterval(() => {
      setKillCooldown((c) => {
        const next = Math.max(0, c - 100);
        cooldownCallbacks.current.forEach((cb) => cb(next));
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [killCooldown]);

  // Sync canKill based on killCooldown
  useEffect(() => {
    setCanKill(killCooldown <= 0);
  }, [killCooldown]);

  // ─── Observe helpers ─────────────────────────────────────────────────────────

  const onGameEnd = useCallback((cb: (r: GameResult) => void) => {
    endCallbacks.current.add(cb);
    return () => endCallbacks.current.delete(cb);
  }, []);

  const onPhaseChange = useCallback((cb: (p: GamePhase) => void) => {
    phaseCallbacks.current.add(cb);
    return () => phaseCallbacks.current.delete(cb);
  }, []);

  const onRoleAssign = useCallback((cb: (r: "crewmate" | "impostor") => void) => {
    roleCallbacks.current.add(cb);
    return () => roleCallbacks.current.delete(cb);
  }, []);

  const onPlayerDeath = useCallback((cb: (id: string) => void) => {
    deathCallbacks.current.add(cb);
    return () => deathCallbacks.current.delete(cb);
  }, []);

  const onTaskUpdate = useCallback((cb: (t: Array<{ id: string; name: string; completed: boolean; progress: number }>) => void) => {
    taskCallbacks.current.add(cb);
    return () => taskCallbacks.current.delete(cb);
  }, []);

  const onKillCooldown = useCallback((cb: (c: number) => void) => {
    cooldownCallbacks.current.add(cb);
    return () => cooldownCallbacks.current.delete(cb);
  }, []);

  const onVoteStart = useCallback((cb: (vs: VoteState) => void) => {
    voteStartCallbacks.current.add(cb);
    return () => voteStartCallbacks.current.delete(cb);
  }, []);

  const onVoteEnd = useCallback((cb: () => void) => {
    voteEndCallbacks.current.add(cb);
    return () => voteEndCallbacks.current.delete(cb);
  }, []);

  const onChatMessage = useCallback((cb: (m: ChatMessage) => void) => {
    chatCallbacks.current.add(cb);
    return () => chatCallbacks.current.delete(cb);
  }, []);

  // ─── Cleanup ─────────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    if (lobby) {
      broadcastRef.current?.({
        type: "PLAYER_LEAVE",
        lobbyId: lobby.id,
        payload: { playerId: currentUserId },
      });
    }
    endCallbacks.current.clear();
    phaseCallbacks.current.clear();
    roleCallbacks.current.clear();
    deathCallbacks.current.clear();
    taskCallbacks.current.clear();
    cooldownCallbacks.current.clear();
    voteStartCallbacks.current.clear();
    voteEndCallbacks.current.clear();
    chatCallbacks.current.clear();
  }, [lobby, currentUserId]);

  // ─── Initial join (optional) ─────────────────────────────────────────────────
  useEffect(() => {
    if (joinCode && !lobby) {
      void joinLobby(joinCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinCode]);

  return {
    lobby,
    currentUserId,
    isHost,
    isReady,
    myRole,
    isGhost,
    createLobby,
    joinLobby,
    leaveLobby,
    setReady,
    startGame,
    myTasks,
    activeTask,
    startTask,
    completeTask,
    canKill,
    killCooldown,
    kill,
    canReport,
    reportBody,
    canEmergency,
    callEmergencyMeeting,
    messages,
    sendChat,
    voteState,
    vote,
    skipVote,
    gamePhase,
    gameResult,
    aliveCount,
    totalCount,
    nearbyBody,
    onGameEnd,
    onPhaseChange,
    onRoleAssign,
    onPlayerDeath,
    onTaskUpdate,
    onKillCooldown,
    onVoteStart,
    onVoteEnd,
    onChatMessage,
    cleanup,
  };
}
