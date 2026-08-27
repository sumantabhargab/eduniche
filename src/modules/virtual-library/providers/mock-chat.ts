/**
 * Mock ChatProvider — in-memory message store for development.
 */

import type { ChatMessage } from "../types/index";
import type { ChatProvider } from "../types/adapters";

/** Internal message with mock metadata stripped before returning to consumers. */
type StoredMessage = ChatMessage & { readonly _mockKey: string };

const STORE: Map<string, StoredMessage[]> = new Map();

export class MockChatProvider implements ChatProvider {
  readonly enabled = true;

  subscribe(
    roomId: string,
    onMessage: (message: ChatMessage) => void,
  ): () => void {
    if (!STORE.has(roomId)) STORE.set(roomId, []);

    const messages = STORE.get(roomId)!;

    // Send mock history
    const mockSystemMessages: StoredMessage[] = [
      {
        id: `mock-sys-${roomId}-1`,
        _mockKey: "sys-1",
        roomId,
        authorId: "system",
        authorLabel: "System",
        content: "Welcome to the study room! Be respectful and focused.",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: "system",
      },
    ];

    const mockHistory: StoredMessage[] = [
      {
        id: `mock-msg-${roomId}-1`,
        _mockKey: "hist-1",
        roomId,
        authorId: "mock-user-1",
        authorLabel: "Student 1",
        content: "Hey everyone, let's crush TOC today!",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: "text",
      },
      {
        id: `mock-msg-${roomId}-2`,
        _mockKey: "hist-2",
        roomId,
        authorId: "mock-user-3",
        authorLabel: "Student 3",
        content: "Working on DP problems, any tips for Matrix Chain Multiplication?",
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        type: "text",
      },
    ];

    // Store history
    STORE.set(roomId, [...mockSystemMessages, ...mockHistory]);

    // Deliver history to the subscriber
    STORE.get(roomId)!.forEach((msg) => onMessage(msg));

    // Deliver new messages (simulated)
    const mockSender = () => {
      const replies = [
        "That's a great point!",
        "Can someone explain Turing Machine construction?",
        "Just finished a practice test — 62/100",
        "Don't forget to take breaks! 🧠",
        "Has anyone seen recent PYQ analysis for CN?",
        "Focus mode activated 🔥",
      ];
      const mockMsg: StoredMessage = {
        id: `mock-msg-${roomId}-${Date.now()}`,
        _mockKey: `live-${Date.now()}`,
        roomId,
        authorId: `mock-user-${Math.floor(Math.random() * 10) + 1}`,
        authorLabel: `Student ${Math.floor(Math.random() * 10) + 1}`,
        content: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toISOString(),
        type: "text",
      };
      STORE.get(roomId)!.push(mockMsg);
      onMessage(mockMsg);
    };

    const interval = setInterval(
      () => Math.random() > 0.6 && mockSender(),
      20000 + Math.random() * 30000,
    );

    return () => clearInterval(interval);
  }

  async sendMessage(
    roomId: string,
    content: string,
    type: ChatMessage["type"] = "text",
  ): Promise<ChatMessage> {
    if (!STORE.has(roomId)) STORE.set(roomId, []);

    const message: StoredMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      _mockKey: `sent-${Date.now()}`,
      roomId,
      authorId: "current-user",
      authorLabel: "You",
      content,
      timestamp: new Date().toISOString(),
      type,
    };

    STORE.get(roomId)!.push(message);
    // Return without mock metadata
    const { _mockKey, ...rest } = message;
    void _mockKey;
    return rest;
  }

  async getHistory(_roomId: string, limit = 50): Promise<ChatMessage[]> {
    // In mock, we return stored messages across all rooms
    const all: StoredMessage[] = [];
    for (const msgs of STORE.values()) {
      all.push(...msgs);
    }
    return all.slice(-limit).map(({ _mockKey, ...rest }) => rest);
  }

  /** Clean up (for testing). */
  destroy(): void {
    STORE.clear();
  }
}

/** Singleton mock instance. */
export const mockChatProvider = new MockChatProvider();
