"use client";

import { useEffect, useState, useCallback } from "react";

interface Admin {
  user: { email: string; role: string };
}

interface UserRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  plan: "free" | "monthly_premium" | "weekly_premium";
  created_at: string;
  subscription: {
    plan: string;
    status: string;
    expires_at: string;
  } | null;
  hasActiveSubscription: boolean;
}

const PLANS = [
  { value: "free", label: "Free" },
  { value: "monthly_premium", label: "Monthly Premium" },
  { value: "weekly_premium", label: "Weekly Premium" },
];

export default function AdminUsersClient({
  admin,
  search,
  plan,
}: {
  admin: Admin;
  search: string;
  plan: string;
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);
  const [planFilter, setPlanFilter] = useState(plan);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (q: string, p: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (p) params.set("plan", p);
      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e: any) {
      setError(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(searchInput, planFilter);
  }, [fetchUsers, searchInput, planFilter]);

  async function updatePlan(userId: string, newPlan: string) {
    if (!confirm(`Change plan to ${newPlan}?`)) return;
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, plan: newPlan as any } : u))
      );
    } catch (e: any) {
      alert(`Failed to update plan: ${e.message}`);
    } finally {
      setUpdatingId(null);
    }
  }

  function planBadge(p: string) {
    if (p === "monthly_premium")
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">Monthly Premium</span>;
    if (p === "weekly_premium")
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">Weekly Premium</span>;
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">Free</span>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-foreground">Users</h1>
        <p className="text-sm text-muted mt-1">
          Manage user subscriptions and plan levels. Only admins can change plans.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by username or display name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
        />
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
        >
          <option value="">All plans</option>
          {PLANS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => fetchUsers(searchInput, planFilter)}
          className="px-4 py-2 bg-accent text-background rounded-lg text-sm hover:bg-accent/90"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background-alt text-muted text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Current Plan</th>
              <th className="text-left px-4 py-3 font-medium">Subscription</th>
              <th className="text-left px-4 py-3 font-medium">Change Plan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-background-alt/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-accent-subtle flex items-center justify-center text-xs">
                          {(u.username || u.display_name || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-foreground">
                          {u.display_name || u.username || "(unnamed)"}
                        </div>
                        <div className="text-xs text-muted">
                          @{u.username || "no-username"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted capitalize">{u.role}</td>
                  <td className="px-4 py-3">{planBadge(u.plan)}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {u.subscription ? (
                      <>
                        <div className="capitalize">{u.subscription.plan}</div>
                        <div>expires {new Date(u.subscription.expires_at).toLocaleDateString()}</div>
                      </>
                    ) : (
                      <span className="text-muted">No active sub</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.plan}
                      disabled={updatingId === u.id}
                      onChange={(e) => updatePlan(u.id, e.target.value)}
                      className="px-2 py-1 border border-border rounded bg-background text-foreground text-xs"
                    >
                      {PLANS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    {updatingId === u.id && (
                      <span className="ml-2 text-xs text-muted">saving...</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        Showing {users.length} user{users.length === 1 ? "" : "s"}.
      </p>
    </div>
  );
}
