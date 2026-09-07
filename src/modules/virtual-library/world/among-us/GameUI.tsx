/**
 * GameUI.tsx — In-game overlay (task progress, action buttons, chat, voting).
 *
 * Rendered on top of the dimmed library world during the PLAYING / VOTING / ENDED phases.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface GameUIProps {
  lobby: {
    id: string;
    players: Array<{
      id: string;
      name: string;
      color: string;
      isDead?: boolean;
      role?: "crewmate" | "impostor";
      tasks?: Array<{ name: string; completed: boolean; progress: number }>;
    }>;
    maxPlayers: number;
  };
  gamePhase: "lobby" | "playing" | "discussion" | "voting" | "ended";
  currentUserId: string;
  currentRole: "crewmate" | "impostor";
  isGhost: boolean;
  aliveCount: number;
  totalCount: number;
  myTasks: Array<{ id: string; name: string; completed: boolean; progress: number }>;
  activeTask: { name: string; description: string; icon: string; progress: number } | null;
  onStartTask: () => void;
  canKill: boolean;
  killCooldown: number;
  onKill: () => void;
  canUseEmergency: boolean;
  onEmergency: () => void;
  canReport: boolean;
  onReport: () => void;
  messages: Array<{ id: string; playerId: string; text: string; timestamp: number }>;
  onSendMessage: (text: string) => void;
  voteState: { votes: Map<string, string | null>; endsAt: number } | null;
  onVote: (targetId: string | null) => void;
  onSkipVote: () => void;
}

const AVATARS = [
  "👩‍🔬", "👨‍💻", "👩‍🎨", "👨‍🏫", "👩‍⚕️", "👨‍🍳",
  "👩‍🚀", "🧑‍🔬",
];

export function GameUI({
  lobby,
  gamePhase,
  currentUserId,
  currentRole,
  isGhost,
  aliveCount,
  totalCount,
  myTasks,
  activeTask,
  onStartTask,
  canKill,
  killCooldown,
  onKill,
  canUseEmergency,
  onEmergency,
  canReport,
  onReport,
  messages,
  onSendMessage,
  voteState,
  onVote,
  onSkipVote,
}: GameUIProps) {
  const [showChat, setShowChat] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Ghosts see everything
  const canSeeRole = currentRole === "impostor" || isGhost;
  const isPlaying = gamePhase === "playing";
  const isVoting = gamePhase === "voting";

  // Task completion
  const completedTasks = myTasks.filter((t) => t.completed).length;
  const taskProgress = myTasks.length > 0 ? completedTasks / myTasks.length : 0;

  // Ghost hint
  useEffect(() => {
    if (isGhost && gamePhase === "playing") {
      const t = setTimeout(() => {}, 4000);
      return () => clearTimeout(t);
    }
  }, [isGhost, gamePhase]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput("");
  };

  const me = lobby.players.find((p) => p.id === currentUserId);

  // ─── ENDED overlay ────────────────────────────────────────────────────────────

  if (gamePhase === "ended") {
    return (
      <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
          <div className="text-5xl mb-4">
            {currentRole === "impostor" && aliveCount > totalCount - aliveCount
              ? "💀"
              : "✅"}
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">
            {aliveCount > totalCount - aliveCount ? "Impostor Wins!" : "Crewmates Win!"}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            The game has ended. Return to the library.
          </p>
        </div>
      </div>
    );
  }

  // ─── VOTING overlay ──────────────────────────────────────────────────────────

  if (isVoting && voteState) {
    const alivePlayers = lobby.players.filter((p) => !p.isDead);
    return (
      <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-100 text-center mb-1">
            Who is the Impostor?
          </h2>
          <p className="text-slate-400 text-sm text-center mb-5">
            Vote to eject someone
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-5">
            {alivePlayers.map((player) => {
              const avatarIdx = lobby.players.indexOf(player);
              const voteCount = Array.from(voteState.votes.values()).filter(
                (v) => v === player.id,
              ).length;
              return (
                <button
                  key={player.id}
                  onClick={() => onVote(player.id)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-slate-700 bg-slate-800 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all min-w-[80px]"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
                    style={{ backgroundColor: player.color }}
                  >
                    {AVATARS[avatarIdx % AVATARS.length]}
                  </div>
                  <span className="text-xs text-slate-300 font-medium">
                    {player.name}
                  </span>
                  {voteCount > 0 && (
                    <span className="text-[10px] text-indigo-400 font-bold">
                      {voteCount} vote{voteCount > 1 ? "s" : ""}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              onClick={onSkipVote}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-slate-700 bg-slate-800 hover:border-slate-500 hover:bg-slate-700 transition-all min-w-[80px]"
            >
              <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-lg font-bold text-slate-300">
                ⏭
              </div>
              <span className="text-xs text-slate-400">Skip</span>
            </button>
          </div>
          {isGhost && (
            <p className="text-purple-400 text-xs text-center">
              👻 You&apos;re a ghost — you can watch but not vote.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── PLAYING overlay ──────────────────────────────────────────────────────────

  return (
    <div className={`game-ui ${isGhost ? "ghost-mode" : ""}`}>
      {/* Top bar */}
      <div className="game-ui-top">
        {currentRole === "crewmate" && !isGhost && (
          <div className="task-progress-container">
            <div className="task-progress-label">
              <span className="task-icon">📋</span>
              <span>Tasks: {completedTasks}/{myTasks.length}</span>
            </div>
            <div className="task-progress-bar">
              <div
                className="task-progress-fill"
                style={{ width: `${taskProgress * 100}%` }}
              />
            </div>
          </div>
        )}
        {currentRole === "impostor" && !isGhost && (
          <div className="task-progress-container">
            <div className="task-progress-label">
              <span className="task-icon">🎭</span>
              <span>Sabotage in progress...</span>
            </div>
            <div className="task-progress-bar">
              <div
                className="task-progress-fill"
                style={{
                  width: `${taskProgress * 100}%`,
                  background: "linear-gradient(90deg, #DC2626, #EF4444)",
                }}
              />
            </div>
          </div>
        )}
        <div className="alive-counter">
          <span className={`alive-dot ${aliveCount <= 2 ? "critical" : ""}`} />
          <span>👥 {aliveCount}/{totalCount} alive</span>
        </div>
        <div className={`role-indicator ${currentRole}`}>
          {isGhost ? "👻 Ghost" : currentRole === "impostor" ? "🎭 Impostor" : "🛡️ Crewmate"}
        </div>
      </div>

      {/* Active task panel */}
      {activeTask && isPlaying && !isGhost && currentRole === "crewmate" && (
        <div className="active-task-panel">
          <div className="active-task-header">
            <span className="active-task-icon">{activeTask.icon}</span>
            <div>
              <div className="active-task-name">{activeTask.name}</div>
              <div className="active-task-desc">{activeTask.description}</div>
            </div>
          </div>
          <div className="active-task-bar">
            <div
              className="active-task-fill"
              style={{ width: `${activeTask.progress * 100}%` }}
            />
          </div>
          <div className="active-task-tip">
            {activeTask.progress >= 1 ? "Complete!" : `${Math.round(activeTask.progress * 100)}%`}
          </div>
        </div>
      )}

      {/* Action buttons (left side) */}
      {isPlaying && !isGhost && (
        <div className="game-ui-actions">
          {currentRole === "impostor" && (
            <button
              className={`action-btn kill-btn ${!canKill ? "on-cooldown" : ""}`}
              disabled={!canKill}
              onClick={onKill}
            >
              {canKill ? "🔪 Kill" : `⏳ ${Math.ceil(killCooldown / 1000)}s`}
            </button>
          )}
          {canReport && (
            <button className="action-btn report-btn" onClick={onReport}>
              📢 Report Body
            </button>
          )}
          <button className="action-btn emergency-btn" onClick={onEmergency}>
            🚨 Emergency
          </button>
        </div>
      )}

      {/* Impostor panel */}
      {canSeeRole && currentRole === "impostor" && !isGhost && (
        <div className="task-list-panel impostor-panel">
          <div className="panel-header">
            <span>🎭 Impostor</span>
            <button className="panel-close" onClick={() => setShowTasks(false)}>
              ✕
            </button>
          </div>
          <div className="impostor-tips">
            <p>Pretend to do tasks. Sabotage when crewmates are apart.</p>
            <p>Kill cooldown: {Math.ceil(killCooldown / 1000)}s</p>
          </div>
        </div>
      )}

      {/* Task list panel */}
      {currentRole === "crewmate" && !isGhost && myTasks.length > 0 && (
        <div className="task-list-panel">
          <div className="panel-header">
            <span>📋 Tasks</span>
            <button className="panel-close" onClick={() => setShowTasks(false)}>
              ✕
            </button>
          </div>
          {myTasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${task.completed ? "completed" : ""}`}
            >
              <span className="task-check">{task.completed ? "✅" : "⬜"}</span>
              <span className="task-name">{task.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Show buttons */}
      {!showTasks && currentRole === "crewmate" && !isGhost && myTasks.length > 0 && (
        <button className="show-tasks-btn" onClick={() => setShowTasks(true)}>
          📋 Tasks ({completedTasks}/{myTasks.length})
        </button>
      )}
      {!showChat && (
        <button className="show-chat-btn" onClick={() => setShowChat(true)}>
          💬 Chat ({messages.length})
        </button>
      )}

      {/* Chat panel */}
      {showChat && (
        <div className="chat-panel">
          <div className="panel-header">
            <span>💬 Chat</span>
            <button className="panel-close" onClick={() => setShowChat(false)}>
              ✕
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((msg) => {
              const sender = lobby.players.find((p) => p.id === msg.playerId);
              const isOwn = msg.playerId === currentUserId;
              return (
                <div key={msg.id} className={`chat-msg ${isOwn ? "own" : ""}`}>
                  <span className="chat-sender" style={{ color: sender?.color ?? "#94A3B8" }}>
                    {sender?.name ?? "Unknown"}
                  </span>
                  <span className="chat-text">{msg.text}</span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder={isGhost ? "👻 Dead players can't chat" : "Say something..."}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              disabled={isGhost}
            />
            <button className="chat-send-btn" onClick={handleSendChat} disabled={isGhost}>
              Send
            </button>
          </div>
        </div>
      )}

      {/* Ghost hint */}
      {isGhost && gamePhase === "playing" && (
        <div className="ghost-hint">
          👻 You are a ghost! Watch the game continue.
        </div>
      )}
    </div>
  );
}
