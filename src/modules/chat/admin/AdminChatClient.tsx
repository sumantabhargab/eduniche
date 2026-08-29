/**
 * AdminChatClient — admin moderation panel for the global chat.
 *
 * Shows recent chat messages. Admins can:
 * - Delete any message (soft delete via deleted_at)
 * - Mute a user
 * - Ban a user
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface AdminChatClientProps {
  admin: {
    user: {
      email: string;
      role: string;
    };
  };
}

export default function AdminChatClient({ admin }: AdminChatClientProps) {
  const supabase = createBrowserClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "deleted">("all");

  const loadMessages = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, user_id, content, created_at, deleted_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Failed to load messages:", error);
        return;
      }

      const userIds = [...new Set((data ?? []).map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p])
      );

      const enriched: ChatMessage[] = (data ?? []).map((m) => {
        const profile = profileMap.get(m.user_id);
        return {
          ...m,
          username: profile?.username ?? null,
          display_name: profile?.display_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
        };
      });

      setMessages(enriched);
    } catch (e) {
      console.error("Load messages error:", e);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const deleteMessage = async (id: string) => {
    if (!supabase) return;
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase
      .from("chat_messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      alert("Failed to delete: " + error.message);
      return;
    }
    await loadMessages();
  };

  const muteUser = async (userId: string) => {
    if (!supabase) return;
    const reason = prompt("Reason for muting?");
    if (reason === null) return;
    const { error } = await supabase.from("muted_users").insert({
      user_id: userId,
      muted_by: (await supabase.auth.getUser()).data.user?.id,
      reason,
      expires_at: null,
    });
    if (error) {
      alert("Failed to mute: " + error.message);
      return;
    }
    alert("User muted.");
  };

  const banUser = async (userId: string) => {
    if (!supabase) return;
    if (!confirm("Ban this user from chat? This is reversible by removing from banned_users.")) return;
    const reason = prompt("Reason for ban?");
    if (reason === null) return;
    const { error } = await supabase.from("banned_users").insert({
      user_id: userId,
      banned_by: (await supabase.auth.getUser()).data.user?.id,
      reason,
    });
    if (error) {
      alert("Failed to ban: " + error.message);
      return;
    }
    alert("User banned.");
  };

  const visible = filter === "all"
    ? messages
    : messages.filter((m) => m.deleted_at !== null);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Admin Chat Moderation</h1>
          <p className="text-sm text-muted">
            Signed in as {admin.user.email}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filter === "all"
                ? "bg-foreground text-background"
                : "bg-card border border-border"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("deleted")}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filter === "deleted"
                ? "bg-foreground text-background"
                : "bg-card border border-border"
            }`}
          >
            Deleted
          </button>
          <button
            onClick={loadMessages}
            className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="text-center text-muted py-12">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="text-center text-muted py-12">No messages found.</div>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto">
            {visible.map((m) => (
              <div
                key={m.id}
                className={`bg-card border rounded-xl p-4 ${
                  m.deleted_at ? "border-red-200 opacity-60" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {m.username || m.display_name || "Anonymous"}
                      </span>
                      <span className="text-xs text-muted">
                        {new Date(m.created_at).toLocaleString()}
                      </span>
                      {m.deleted_at && (
                        <span className="text-xs text-red-600">deleted</span>
                      )}
                    </div>
                    <div className="text-sm text-foreground break-words">
                      {m.deleted_at ? "[message deleted]" : m.content}
                    </div>
                  </div>
                  {!m.deleted_at && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => deleteMessage(m.id)}
                        className="px-2 py-1 text-xs border border-border rounded hover:bg-red-50 hover:text-red-600"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => muteUser(m.user_id)}
                        className="px-2 py-1 text-xs border border-border rounded hover:bg-amber-50 hover:text-amber-700"
                      >
                        Mute
                      </button>
                      <button
                        onClick={() => banUser(m.user_id)}
                        className="px-2 py-1 text-xs border border-border rounded hover:bg-red-50 hover:text-red-600"
                      >
                        Ban
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}