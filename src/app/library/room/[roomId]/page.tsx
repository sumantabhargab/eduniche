/**
 * Study room page — /library/room/[roomId].
 */

"use client";

import { StudyRoom } from "@/modules/virtual-library/features/rooms/components/StudyRoom";

interface RoomPageProps {
  params: { roomId: string };
}

export default function RoomPage({ params }: RoomPageProps) {
  return <StudyRoom roomId={params.roomId} />;
}
