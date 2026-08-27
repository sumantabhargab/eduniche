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
  /** Master switch — disable to hide the entire library */
  enabled: asBoolean(process.env.NEXT_PUBLIC_VIRTUAL_LIBRARY_ENABLED, true),

  /** Enable video presence in rooms (requires real WebRTC provider) */
  videoEnabled: asBoolean(process.env.NEXT_PUBLIC_VIRTUAL_LIBRARY_VIDEO, false),

  /** Enable live chat in rooms */
  chatEnabled: asBoolean(process.env.NEXT_PUBLIC_VIRTUAL_LIBRARY_CHAT, true),

  /** Enable the AI doubt engine */
  aiEnabled: asBoolean(process.env.NEXT_PUBLIC_VIRTUAL_LIBRARY_AI, false),
} as const;

export type VirtualLibraryConfig = typeof virtualLibraryConfig;
