/**
 * RoomCard — individual room card in the grid.
 *
 * Minimal, tappable, shows essential info at a glance.
 */

import Link from "next/link";
import type { StudyRoom } from "../../../types/index";
import { getBranchById } from "../../../config/syllabus";

interface RoomCardProps {
  room: StudyRoom;
  isActive?: boolean;
  onClick?: () => void;
}

export function RoomCard({ room, isActive, onClick }: RoomCardProps) {
  const branch = room.branchId !== "all"
    ? getBranchById(room.branchId)
    : null;

  const occupancyPercent = (room.activeCount / room.maxParticipants) * 100;
  const isNearlyFull = occupancyPercent > 80;

  return (
    <Link
      href={`/library/room/${room.id}`}
      onClick={onClick}
      className={`group block bg-card border rounded-2xl p-5 transition-all duration-200
        ${isActive
          ? "border-foreground shadow-lg"
          : "border-border hover:border-foreground/30 hover:shadow-md"
        }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-base leading-tight group-hover:text-foreground/80 transition-colors">
          {room.name}
        </h3>
        {branch && (
          <span
            className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: `${branch.color}15`,
              color: branch.color,
            }}
          >
            {branch.shortName}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-muted line-clamp-2 mb-4">
        {room.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isNearlyFull ? "bg-amber-500" : "bg-green-500"
            }`}
          />
          <span className={isNearlyFull ? "text-amber-600 dark:text-amber-400" : "text-muted"}>
            {room.activeCount} / {room.maxParticipants}
          </span>
        </div>

        <span className="text-xs text-muted uppercase tracking-wide">
          {room.mode}
        </span>
      </div>

      {/* Occupancy bar */}
      <div className="mt-3 h-1 bg-accent rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isNearlyFull ? "bg-amber-500" : "bg-foreground/40"
          }`}
          style={{ width: `${occupancyPercent}%` }}
        />
      </div>
    </Link>
  );
}
