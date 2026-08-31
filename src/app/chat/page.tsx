/**
 * Global Chat page at /chat
 * Real-time multiplayer global chat (premium feature).
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { createBrowserClient } from "@/lib/supabase/client";
import { EduNeuroLoader } from "@/components/loading";

// Icon components replacing emojis
function IconBan({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

function IconLock({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
  avatar_url: string | null;
}

export default function ChatPage() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [checkingPremium, setCheckingPremium] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createBrowserClient();

  // Check premium status
  useEffect(() => {
    if (!user) {
      setCheckingPremium(false);
      return;
    }

    const checkPremium = async () => {
      try {
        const res = await fetch("/api/auth/profile");
        if (res.ok) {
          const data = await res.json();
          setIsPremium(data.isPremium || false);
        }
      } catch (e) {
        // ignore
      } finally {
        setCheckingPremium(false);
      }
    };

    checkPremium();
  }, [user]);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetch("/api/chat/messages");
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          setIsMuted(data.isMuted || false);
          setIsBanned(data.isBanned || false);
        }
      } catch (e) {
        // ignore
      }
    };

    loadMessages();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("global-chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        async (payload) => {
          const newMsg = payload.new as any;

          // Fetch user info
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url")
            .eq("id", newMsg.user_id)
            .maybeSingle();

          const msg: ChatMessage = {
            id: newMsg.id,
            user_id: newMsg.user_id,
            content: newMsg.content,
            created_at: newMsg.created_at,
            username: (profile as any)?.username || (profile as any)?.display_name || "Anonymous",
            avatar_url: (profile as any)?.avatar_url || null,
          };

          setMessages(prev => [...prev, msg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending || isMuted || isBanned) return;

    const text = input.trim();
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to send message.");
      }
    } catch (e) {
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }, [input, sending, isMuted, isBanned]);

  // Loading state
  if (loading || checkingPremium) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <EduNeuroLoader size="md" variant="page" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Global Chat</h1>
        <p className="text-muted mb-8">Sign in to join the conversation.</p>
        <a href="/login" className="px-6 py-3 bg-foreground text-background rounded-xl font-semibold">
          Sign In
        </a>
      </div>
    );
  }

  if (isBanned) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="bg-card border border-red-200 dark:border-red-800 rounded-2xl p-8">
          <div className="text-red-500 mb-4 inline-block">
            <IconBan />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-red-600">Banned from Chat</h2>
          <p className="text-muted">You have been banned from the global chat.</p>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12">
          <div className="text-muted mb-4 inline-block">
            <IconLock />
          </div>
          <h2 className="text-2xl font-bold mb-3">Premium Required</h2>
          <p className="text-muted mb-6">
            Global chat is available for Premium subscribers.
          </p>
          <div className="bg-accent/30 rounded-xl p-6 mb-6">
            <div className="text-lg font-bold mb-1">₹49 <span className="text-sm font-normal text-muted">/ month</span></div>
            <p className="text-sm text-muted">Get access to live chat, AI Doubt Engine, and more.</p>
          </div>
          <a
            href="/pricing"
            className="inline-flex px-8 py-3 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Upgrade to Premium
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Global Chat</h1>
        <p className="text-sm text-muted">Connect with fellow students in real time.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Messages */}
        <div className="h-[500px] overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted text-sm">
              No messages yet. Start the conversation!
            </div>
          )}

          {messages.map((msg) => {
            const isOwn = user && msg.user_id === user.id;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {msg.username[0].toUpperCase()}
                </div>
                <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                  <div className={`text-xs text-muted mb-0.5 ${isOwn ? "text-right" : ""}`}>
                    {msg.username}
                  </div>
                  <div
                    className={`inline-block px-3 py-2 rounded-xl text-sm ${
                      isOwn
                        ? "bg-foreground text-background"
                        : "bg-accent"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border">
          {isMuted && (
            <div className="text-sm text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
              <IconBan className="w-4 h-4" />
              You are muted and cannot send messages.
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isMuted ? "You are muted..." : "Type a message..."}
              disabled={isMuted || isBanned || sending}
              className="flex-1 px-4 py-2.5 bg-accent border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || isMuted || isBanned}
              className="px-5 py-2.5 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {sending ? (
                <>
                  <EduNeuroLoader size="xs" variant="thinking" />
                  <span>Sending</span>
                </>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}