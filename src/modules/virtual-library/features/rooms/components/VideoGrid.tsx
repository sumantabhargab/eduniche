/**
 * VideoGrid — conditional video grid in a room.
 *
 * Renders only when videoEnabled is true. Shows participant tiles.
 */

import type { Participant } from "../../../types/index";

interface VideoGridProps {
  participants: Participant[];
}

export function VideoGrid({ participants }: VideoGridProps) {
  if (participants.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-card border border-border border-dashed rounded-2xl">
        <p className="text-muted text-sm">No one is sharing their camera yet.</p>
      </div>
    );
  }

  const cols = participants.length <= 2 ? 2 : participants.length <= 4 ? 2 : 3;

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {participants.map((p) => (
        <VideoTile key={p.id} participant={p} />
      ))}
    </div>
  );
}

interface VideoTileProps {
  participant: Participant;
}

export function VideoTile({ participant }: VideoTileProps) {
  return (
    <div className="relative aspect-video bg-card border border-border rounded-xl overflow-hidden group">
      {/* Placeholder avatar */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-2xl font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          {participant.label.charAt(0)}
        </div>
      </div>

      {/* Status indicators */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="text-xs bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-md">
          {participant.label}
        </span>
        <div className="flex gap-1">
          {participant.isMuted && (
            <span className="text-xs bg-red-500/80 text-white px-1.5 py-0.5 rounded-md">
              🔇
            </span>
          )}
          {!participant.isVideoOn && (
            <span className="text-xs bg-red-500/80 text-white px-1.5 py-0.5 rounded-md">
              📷
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
