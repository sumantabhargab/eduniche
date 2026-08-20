"use client";

import { useEffect, useState } from "react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  count: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setVisible(true);
        });
      },
      { threshold: 0.1 }
    );

    const el = document.getElementById("leaderboard-trigger");
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    fetch("/api/leaderboard")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.leaderboard && data.leaderboard.length > 0) {
          setEntries(data.leaderboard);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, [visible]);

  if (error) {
    return (
      <div id="leaderboard-trigger" className="w-full max-w-md mx-auto">
        <div className="text-center py-8">
          <div className="text-muted text-sm">
            Be the first to reach the leaderboard.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="leaderboard-trigger" className="w-full max-w-md mx-auto">
      <div
        className={`transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {entries.length > 0 ? (
          <div className="space-y-0">
            {entries.map((entry, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 py-3 ${
                  i < entries.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="w-8 text-right">
                  <span
                    className={`font-mono text-sm ${
                      i < 3 ? "text-accent font-medium" : "text-muted"
                    }`}
                  >
                    {String(entry.rank).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex-1 text-sm text-foreground truncate">
                  {entry.name}
                </div>
                <div className="font-mono text-sm text-muted">
                  {entry.count}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="font-mono text-xs text-muted-light tracking-widest uppercase mb-2">
              Leaderboard loading…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
