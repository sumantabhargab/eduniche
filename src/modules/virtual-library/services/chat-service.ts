/**
 * ChatService — wrapper around the Chat module's Supabase-backed services.
 *
 * Provides the Virtual Library module with a clean interface for:
 * - Getting/sending messages in a room
 * - Listening for realtime updates
 */

import type { ChatProvider } from "../types/adapters";
import type { ChatMessage } from "../types/index";
import { RealChatProvider } from "../providers/real-chat";

export interface ChatServiceOptions {
  realtimeProvider?: any;
  chatProvider?: ChatProvider;
}

export class ChatService {
  private provider: ChatProvider;

  constructor(opts?: ChatServiceOptions) {
    this.provider = opts?.chatProvider ?? new RealChatProvider();
  }

  get enabled(): boolean {
    return this.provider.enabled;
  }

  async isAuthenticated(): Promise<boolean> {
    return this.provider.isAuthenticated();
  }

  subscribe(roomId: string, onMessage: (message: ChatMessage) => void): () => void {
    return this.provider.subscribe(roomId, onMessage);
  }

  async sendMessage(roomId: string, content: string): Promise<ChatMessage> {
    return this.provider.sendMessage(roomId, content);
  }

  async getHistory(roomId: string, limit = 50): Promise<ChatMessage[]> {
    return this.provider.getHistory(roomId, limit);
  }

  async markRead(roomId: string): Promise<void> {
    // Optional: mark conversation as read
    return;
  }
}
