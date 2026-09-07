/**
 * Lobby screen — pre-game room where players join and ready up.
 */

"use client";

import { useState } from "react";

interface LobbyScreenProps {
  lobby: {
    id: string;
    name: string;
    hostId: string;
    players: Array<{
      id: string;
      name: string;
      color: string;
      isReady: boolean;
      isHost: boolean;
    }>;
    maxPlayers: number;
  };
  currentUserId: string;
  isHost: boolean;
  isReady: boolean;
  onReady: (ready: boolean) => void;
  onStart: () => void;
  onLeave: () => void;
  onKick: (playerId: string) => void;
}

const AVATARS = [
  "👩‍🔬", "👨‍💻", "👩‍🎨", "👨‍🏫", "👩‍⚕️", "👨‍🍳",
  "👩‍🚀", "🧑‍🔬", "👩‍🏫", "👨‍🎤", "👩‍💻", "🧑‍🎨",
];

export function LobbyScreen({
  lobby,
  currentUserId,
  isHost,
  isReady,
  onReady,
  onStart,
  onLeave,
  onKick,
}: LobbyScreenProps) {
  const [copied, setCopied] = useState(false);

  const copyLobbyCode = () => {
    navigator.clipboard.writeText(lobby.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="lobby-screen">
      <div className="lobby-backdrop">
        {/* Floating library elements */}
        <div className="floating-books">
          {["📕", "📗", "📘", "📙", "📔", "📖", "📚", "📓"].map((book, i) => (
            <span
              key={i}
              className="floating-book"
              style={{
                left: `${5 + i * 12}%`,
                top: `${10 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${6 + (i % 4)}s`,
                fontSize: `${1.5 + (i % 3) * 0.5}rem`,
                opacity: 0.3,
              }}
            >
              {book}
            </span>
          ))}
        </div>
      </div>

      <div className="lobby-container">
        {/* Header */}
        <div className="lobby-header">
          <h1 className="lobby-title">
            <span className="lobby-icon">🏛️</span>
            Library Mystery
          </h1>
          <p className="lobby-subtitle">
            Who will unmask the impostor?
          </p>
        </div>

        {/* Lobby Code */}
        <div className="lobby-code-card">
          <div className="lobby-code-label">Lobby Code</div>
          <div className="lobby-code-row">
            <code className="lobby-code">{lobby.id.toUpperCase()}</code>
            <button className="lobby-copy-btn" onClick={copyLobbyCode}>
              {copied ? "✓ Copied!" : "Copy"}
            </button>
          </div>
          <p className="lobby-code-hint">Share this code with friends to join</p>
        </div>

        {/* Players */}
        <div className="lobby-players-section">
          <h2 className="lobby-section-title">
            Players ({lobby.players.length}/{lobby.maxPlayers})
          </h2>
          <div className="lobby-players-grid">
            {Array.from({ length: lobby.maxPlayers }).map((_, index) => {
              const player = lobby.players[index];
              const isYou = player?.id === currentUserId;

              if (!player) {
                return (
                  <div key={index} className="lobby-player-slot empty">
                    <div className="slot-avatar">+</div>
                    <div className="slot-name">Waiting...</div>
                  </div>
                );
              }

              return (
                <div
                  key={player.id}
                  className="lobby-player-slot"
                  style={{ "--player-color": player.color } as React.CSSProperties}
                >
                  <div className="slot-avatar">
                    {AVATARS[index % AVATARS.length]}
                  </div>
                  <div className="slot-info">
                    <div className="slot-name">
                      {player.name}
                      {isYou && <span className="you-badge">(You)</span>}
                      {player.isHost && <span className="host-badge">👑 Host</span>}
                    </div>
                    {player.isReady && (
                      <span className="slot-ready-badge">✓ Ready</span>
                    )}
                  </div>
                  {isHost && !player.isHost && (
                    <button
                      className="lobby-kick-btn"
                      onClick={() => onKick(player.id)}
                      title="Kick player"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rules Summary */}
        <div className="lobby-rules">
          <h3>How to Play</h3>
          <div className="rules-grid">
            <div className="rule-item">
              <span className="rule-icon">🔍</span>
              <div>
                <strong>Complete Tasks</strong>
                <p>Walk near task icons and interact to complete</p>
              </div>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🗣️</span>
              <div>
                <strong>Find the Impostor</strong>
                <p>Discuss in meetings and vote to eject</p>
              </div>
            </div>
            <div className="rule-item">
              <span className="rule-icon">⚠️</span>
              <div>
                <strong>Report Bodies</strong>
                <p>Find dead bodies and call emergency meetings</p>
              </div>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🎭</span>
              <div>
                <strong>Stay Hidden</strong>
                <p>Impostors: sabotage and eliminate without getting caught</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="lobby-actions">
          <button className="lobby-leave-btn" onClick={onLeave}>
            Leave Lobby
          </button>
          <button
            className={`lobby-ready-btn ${isReady ? "ready" : ""}`}
            onClick={() => onReady(!isReady)}
          >
            {isReady ? "✓ Ready!" : "Ready Up"}
          </button>
          {isHost && (
            <button
              className="lobby-start-btn"
              disabled={lobby.players.length < 3 || !lobby.players.every((p) => p.isReady)}
              onClick={onStart}
            >
              Start Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
