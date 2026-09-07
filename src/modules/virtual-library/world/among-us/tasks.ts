/**
 * Task system — defines and tracks Among Us-style tasks on the map.
 *
 * Tasks are tied to interactable map elements (desks, computers, bookshelves, etc.)
 * and appear as clickable hotspots on the map.
 */

import type { RoomId } from "./types";

export interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  location: { x: number; y: number };
  roomId: RoomId;
  durationMs: number;
  /** Interaction range in pixels */
  range: number;
  icon: string;
  color: string;
}

export interface PlayerTask {
  taskId: string;
  completed: boolean;
  progress: number; // 0..1
}

export const MAP_TASKS: TaskDefinition[] = [
  {
    id: "task-desk-1",
    name: "Organize Books",
    description: "Sort the books on this desk by subject",
    location: { x: 180, y: 120 },
    roomId: "quiet-zone",
    durationMs: 3000,
    range: 35,
    icon: "📚",
    color: "#60A5FA",
  },
  {
    id: "task-desk-2",
    name: "Fill Water Bottle",
    description: "Refill the water bottle at the dispenser",
    location: { x: 280, y: 160 },
    roomId: "quiet-zone",
    durationMs: 2500,
    range: 30,
    icon: "💧",
    color: "#34D399",
  },
  {
    id: "task-computer-1",
    name: "Submit Assignment",
    description: "Log in and submit your assignment on the computer",
    location: { x: 140, y: 220 },
    roomId: "group-study",
    durationMs: 4000,
    range: 35,
    icon: "💻",
    color: "#A78BFA",
  },
  {
    id: "task-desk-3",
    name: "Solve Worksheet",
    description: "Complete the practice problems on the worksheet",
    location: { x: 380, y: 180 },
    roomId: "group-study",
    durationMs: 3500,
    range: 30,
    icon: "📝",
    color: "#FBBF24",
  },
  {
    id: "task-library-1",
    name: "Return Books",
    description: "Return these books to the correct shelves",
    location: { x: 160, y: 340 },
    roomId: "main-reading",
    durationMs: 3000,
    range: 35,
    icon: "📖",
    color: "#F87171",
  },
  {
    id: "task-library-2",
    name: "Check Out Books",
    description: "Scan and check out books for a patron",
    location: { x: 250, y: 380 },
    roomId: "main-reading",
    durationMs: 3500,
    range: 30,
    icon: "🔍",
    color: "#38BDF8",
  },
  {
    id: "task-discuss-1",
    name: "Present Topic",
    description: "Present your research topic at the discussion table",
    location: { x: 480, y: 300 },
    roomId: "discussion-room",
    durationMs: 4000,
    range: 40,
    icon: "🎤",
    color: "#C084FC",
  },
  {
    id: "task-entrance-1",
    name: "Check In",
    description: "Sign in at the front desk",
    location: { x: 380, y: 440 },
    roomId: "entrance",
    durationMs: 2000,
    range: 30,
    icon: "✍️",
    color: "#4ADE80",
  },
  {
    id: "task-study-1",
    name: "Review Notes",
    description: "Review and annotate your study notes",
    location: { x: 120, y: 300 },
    roomId: "quiet-zone",
    durationMs: 3000,
    range: 30,
    icon: "📓",
    color: "#FB923C",
  },
  {
    id: "task-group-1",
    name: "Group Project",
    description: "Collaborate on the group presentation",
    location: { x: 320, y: 220 },
    roomId: "group-study",
    durationMs: 4000,
    range: 35,
    icon: "👥",
    color: "#E879F9",
  },
];
