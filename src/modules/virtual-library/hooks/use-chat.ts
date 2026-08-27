/**
 * Hook for chat state and subscription management.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatMessage } from "../types/index";
import type { ChatProvider } from "../types/adapters";
import { ChatService } from "../services/chat-service";
import { mockChatProvider } from "../providers/mock-chat";

export interface UseChatOptions {
  roomId: string;
  provider?: ChatProvider;
}

export interface UseChatReturn {
  /** Current messages in the room */
  messages: ChatMessage[];
  /** Whether chat is currently loading */
  isLoading: boolean;
  /** Send a message (returns void for UI convenience) */
  sendMessage: (content: string) => Promise<void>;
  /** Clear messages */
  clear: () => void;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const { roomId, provider = mockChatProvider } = options;
  const service = useRef(new ChatService(provider)).current;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setMessages([]);

    const unsub = service.subscribe(roomId, (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Load history
    service.getHistory(roomId, 30).then((history) => {
      setMessages(history);
      setIsLoading(false);
    });

    return () => {
      unsub();
    };
  }, [roomId, service]);

  const sendMessage = useCallback(
    async (content: string) => {
      await service.sendMessage(roomId, content);
    },
    [roomId, service],
  );

  const clear = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clear };
}
