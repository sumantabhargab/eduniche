/**
 * GameWorld.tsx — bridges the library renderer with the Among Us game UI.
 *
 * Displays the dimmed library world in the background and overlays the
 * game UI on top. During the lobby phase, shows the LobbyScreen instead.
 */

"use client";

import { useGame } from "./useGame";
import { LobbyScreen } from "./LobbyScreen";
import { GameUI } from "./GameUI";
import { WorldRenderer } from "../WorldRenderer";

export interface GameWorldProps {
  onLeave: () => void;
  initialLobbyCode?: string;
}

export function GameWorld({ onLeave, initialLobbyCode }: GameWorldProps) {
  const {
    lobby,
    currentUserId,
    isHost,
    isReady,
    myRole,
    isGhost,
    gamePhase,
    gameResult,
    aliveCount,
    totalCount,
    myTasks,
    activeTask,
    canKill,
    killCooldown,
    kill,
    canEmergency,
    callEmergencyMeeting,
    canReport,
    reportBody,
    messages,
    sendChat,
    voteState,
    vote,
    skipVote,
    createLobby,
    setReady,
    startGame,
    cleanup,
  } = useGame({ joinCode: initialLobbyCode });

  // Cleanup on leave
  const handleLeave = () => {
    cleanup();
    onLeave();
  };

  // ─── LOBBY phase (no lobby yet) ─────────────────────────────────────────────

  if (gamePhase === "lobby" && !lobby) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <LobbyScreen
          lobby={{
            id: "",
            name: "Library Mystery",
            hostId: currentUserId,
            players: [],
            maxPlayers: 8,
          }}
          currentUserId={currentUserId}
          isHost={true}
          isReady={false}
          onReady={setReady}
          onStart={() => {
            createLobby();
            setTimeout(startGame, 100);
          }}
          onLeave={handleLeave}
          onKick={() => {}}
        />
      </div>
    );
  }

  // ─── LOBBY phase with lobby data ─────────────────────────────────────────────

  if (gamePhase === "lobby" && lobby) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <LobbyScreen
          lobby={lobby}
          currentUserId={currentUserId}
          isHost={isHost}
          isReady={isReady}
          onReady={setReady}
          onStart={startGame}
          onLeave={handleLeave}
          onKick={() => {}}
        />
      </div>
    );
  }

  // ─── PLAYING / VOTING / ENDED ────────────────────────────────────────────────

  const me = lobby?.players.find((p) => p.id === currentUserId);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Library world in background */}
      <div className="absolute inset-0">
        <WorldRenderer
          localPlayer={{
            id: currentUserId,
            label: me?.name ?? "Player",
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            displayX: 0,
            displayY: 0,
            dx: 0,
            dy: 0,
            isLocal: true,
            colorIndex: 0,
            roomId: "entrance",
            lastUpdate: Date.now(),
            isMuted: true,
            isVideoOn: false,
            isMoving: false,
          }}
          remotePlayers={[]}
          messages={[]}
          connectionState={"connected"}
          className="opacity-30"
        />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-background-dark/70 backdrop-blur-sm" />

      {/* Game UI */}
      <GameUI
        lobby={lobby ?? { id: "", players: [], maxPlayers: 8 }}
        gamePhase={gamePhase}
        currentUserId={currentUserId}
        currentRole={myRole ?? "crewmate"}
        isGhost={isGhost}
        aliveCount={aliveCount}
        totalCount={totalCount}
        myTasks={myTasks}
        activeTask={activeTask}
        onStartTask={() => {}}
        canKill={canKill}
        killCooldown={killCooldown}
        onKill={kill}
        canUseEmergency={canEmergency}
        onEmergency={callEmergencyMeeting}
        canReport={canReport}
        onReport={reportBody}
        messages={messages}
        onSendMessage={sendChat}
        voteState={voteState ?? null}
        onVote={vote}
        onSkipVote={skipVote}
      />

      {/* Leave button */}
      <button
        onClick={handleLeave}
        className="absolute top-4 right-4 z-[600] px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-colors"
      >
        Leave Game
      </button>

      {/* End-of-game overlay */}
      {gamePhase === "ended" && gameResult && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="text-5xl mb-4">
              {gameResult === "crew_win" && "✅"}
              {gameResult === "impostor_win" && "💀"}
              {gameResult === "draw" && "🤝"}
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">
              {gameResult === "crew_win" && "Crewmates Win!"}
              {gameResult === "impostor_win" && "Impostor Wins!"}
              {gameResult === "draw" && "It's a Draw!"}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {gameResult === "crew_win" && "The impostor was ejected. Well done, crew!"}
              {gameResult === "impostor_win" && "The impostor outsmarted everyone."}
              {gameResult === "draw" && "Neither side could claim victory."}
            </p>
            <button
              onClick={handleLeave}
              className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-colors"
            >
              Return to Library
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
