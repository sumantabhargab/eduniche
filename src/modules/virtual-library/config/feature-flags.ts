/**
 * Feature flags for the Virtual Library module.
 *
 * NEXT_PUBLIC_ variables are inlined by Next.js at build time,
 * so this file works in both server and client contexts.
 */

const asBoolean = (val: string | undefined, fallback: boolean): boolean => {
  if (val === undefined || val === null || val === "") return fallback;
  return val.toLowerCase() === "true" || val === "1";
};

/**
 * Virtual Library configuration. Read once at module load.
 */
export const virtualLibraryConfig = {
  /** Master switch — the library is the content browser. Keep enabled. */
  enabled: true,

  /** Enable video presence in rooms (requires real WebRTC provider) */
  videoEnabled: false,

  /** Enable live chat in rooms
   *  NOTE: The old chat system (conversations/messages tables) is NOT part of MVP.
   *        The actual global chat is at /chat using chat_messages table. */
  chatEnabled: false,

  /** Enable the AI doubt engine
   *  NOTE: AI Doubt Engine is at /doubts using ai_conversations/ai_messages tables.
   *        This flag controls the in-library AI panel, not the standalone /doubts page. */
  aiEnabled: false,
} as const;

export type VirtualLibraryConfig = typeof virtualLibraryConfig;
