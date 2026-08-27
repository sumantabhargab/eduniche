/**
 * ChatService — abstraction layer over the ChatProvider.
 *
 * Manages message subscription, sending, and history retrieval
 * within a room context.
 */

import type { ChatMessage } from "../types/index";
import type { ChatProvider } from "../types/adapters";

export class ChatService {
  constructor(private provider: ChatProvider) {}

  subscribe(roomId: string, onMessage: (message: ChatMessage) => void): () => void {
    return this.provider.subscribe(roomId, (message) => {
      onMessage(message);
    });
  }

  async sendMessage(roomId: string, content: string): Promise<ChatMessage> {
    return this.provider.sendMessage(roomId, content);
  }

  async getHistory(roomId: string, limit = 50): Promise<ChatMessage[]> {
    return this.provider.getHistory(roomId, limit);
  }
}
