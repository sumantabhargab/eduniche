/**
 * AI Doubt Engine page at /doubts
 * Premium feature - Groq-powered academic assistant.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { createBrowserClient } from "@/lib/supabase/client";
import { EduNeuroLoader, ChatSkeleton } from "@/components/loading";

// Icon components replacing emojis
function IconSparkles({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function IconUserSmall({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconBot({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  conversationId?: string;
}

export default function DoubtsPage() {
  const { user, loading } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [checkingPremium, setCheckingPremium] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createBrowserClient();

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const question = input.trim();
    setInput("");
    setSending(true);

    // Add user message to UI
    const userMsg: Message = { role: "user", content: question, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const apiUrl = isPremium ? "/api/ai/doubt" : "/api/ai/doubt/free";
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          conversationId: conversationId,
          branchId: null,
          subjectId: null,
          topic: null,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.status === 403 && data?.upgradeUrl) {
        // Free tier daily limit hit
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.error || "Daily limit reached. Upgrade to Premium for unlimited access!",
          timestamp: new Date(),
        }]);
        return;
      }

      if (res.ok) {
        // Update conversation ID if new
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }

        const assistantMsg: Message = {
          role: "assistant",
          content: data.answer || "I couldn't generate a response. Please try again.",
          timestamp: new Date(),
          conversationId: data.conversationId || conversationId || undefined,
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.error || "Something went wrong. Please try again.",
          timestamp: new Date(),
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Connection error. Please check your network and try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setSending(false);
    }
  };

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
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">AI Doubt Engine</h1>
        <p className="text-muted mb-8">Sign in to ask academic questions.</p>
        <a href="/login" className="px-6 py-3 bg-foreground text-background rounded-xl font-semibold">
          Sign In
        </a>
      </div>
    );
  }

  if (!isPremium && user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="text-muted mb-4 inline-block">
            <IconSparkles />
          </div>
          <h2 className="text-2xl font-bold mb-3">Premium Required</h2>
          <p className="text-muted mb-6">
            The AI Doubt Engine is available for Premium subscribers.
          </p>
          <div className="bg-accent/30 rounded-xl p-6 mb-6">
            <div className="text-lg font-bold mb-1">₹49 <span className="text-sm font-normal text-muted">/ month</span></div>
            <p className="text-sm text-muted">Get access to the AI Doubt Engine, live chat, and more.</p>
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
        <h1 className="text-2xl font-bold">AI Doubt Engine</h1>
        <p className="text-sm text-muted">
          Ask any GATE-related question. Powered by EduNeuro&apos;s library.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Messages */}
        <div className="h-[60vh] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-muted">
              <div className="text-muted mb-3 inline-block">
                <IconSparkles className="w-10 h-10" />
              </div>
              <p className="text-sm">Ask a question about any GATE subject!</p>
              <p className="text-xs mt-2">Example: &ldquo;Explain the concept of normal forms in DBMS&rdquo;</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                msg.role === "user" ? "bg-accent" : "bg-foreground text-background"
              }`}>
                {msg.role === "user" ? <IconUserSmall /> : <IconBot />}
              </div>
              <div className={`max-w-[80%] ${msg.role === "user" ? "text-right" : ""}`}>
                <div className={`inline-block px-4 py-3 rounded-xl text-sm text-left ${
                  msg.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-accent"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <div className="text-xs text-muted mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center">
                <IconBot className="w-4 h-4" />
              </div>
              <div className="inline-block px-4 py-3 rounded-xl text-sm bg-accent text-muted">
                <EduNeuroLoader size="xs" variant="thinking" label="EduNeuro is thinking" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border">
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
              placeholder="Ask a GATE question..."
              disabled={sending}
              className="flex-1 px-4 py-3 bg-accent border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {sending ? (
                <>
                  <EduNeuroLoader size="xs" variant="thinking" />
                  <span>Sending</span>
                </>
              ) : (
                "Ask"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}