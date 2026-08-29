/**
 * Profile page at /profile
 * User can view/edit their profile, subscription, and badges.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [dailyGoal, setDailyGoal] = useState(120);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }
    if (user) {
      setUsername(user.username || "");
      setDailyGoal(user.daily_goal_minutes || 120);
    }
  }, [loading, user, router]);

  const handleSaveGoal = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/study/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyGoalMinutes: dailyGoal }),
      });

      if (res.ok) {
        setSaved(true);
        refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold">Profile</h1>

      {/* Profile info */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-2xl font-bold">
            {(user.display_name || user.username || "?")[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-lg">{user.display_name || user.username || "User"}</div>
            <div className="text-sm text-muted">@{user.username || "no-username"}</div>
            <div className="text-sm text-muted">{user.email}</div>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Subscription</h2>
        {user.isPremium ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600 dark:text-green-400 font-semibold">Premium Active</span>
            </div>
            {user.subscription && (
              <p className="text-sm text-muted">
                Plan: {user.subscription.plan} • Expires: {new Date(user.subscription.expires_at).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-muted mb-3">You&apos;re on the Free plan.</p>
            <a
              href="/pricing"
              className="inline-flex px-6 py-2.5 bg-foreground text-background rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Upgrade to Premium
            </a>
          </div>
        )}
      </div>

      {/* Daily goal */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Daily Study Goal</h2>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={dailyGoal}
            onChange={(e) => setDailyGoal(parseInt(e.target.value) || 60)}
            min={15}
            max={720}
            step={15}
            className="w-24 px-3 py-2 bg-accent border border-border rounded-lg text-sm"
          />
          <span className="text-sm text-muted">minutes</span>
        </div>
        <button
          onClick={handleSaveGoal}
          disabled={saving}
          className="px-6 py-2.5 bg-foreground text-background rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Goal"}
        </button>
        {saved && <p className="text-sm text-green-600 dark:text-green-400">Saved!</p>}
      </div>

      {/* Badges */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Badges</h2>
        <div className="flex items-center gap-3">
          <div className="text-4xl font-mono font-bold">{user.badge_count}</div>
          <div className="text-sm text-muted">badges earned</div>
        </div>
        <p className="text-xs text-muted mt-2">
          Badges are earned automatically based on your study activity.
        </p>
      </div>

      {/* Account info */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Member since</span>
            <span>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
