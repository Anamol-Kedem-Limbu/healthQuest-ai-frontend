"use client";

import { useEffect, useState } from "react";
import { ApiError, getLeaderboard } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import type { LeaderboardEntry } from "@/lib/types";
import { Award, Crown, Medal, UserRound } from "lucide-react";
import { EmptyState, PageHeader, Panel, ui } from "@/components/ui";

export default function LeaderboardPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        setEntries(await getLeaderboard(token));
      } catch (caughtError) {
        if (caughtError instanceof ApiError && caughtError.status === 401) {
          logout();
          router.replace("/login");
          return;
        }
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load the leaderboard right now.";
        setError(message || "Unable to load the leaderboard right now.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, logout, router]);

  if (!token) return null;

  const maxPoints = entries.length > 0 ? entries[0].total_points : 1;

  const podium = [
    { icon: Crown, tint: "text-amber-500", ring: "ring-amber-200" },
    { icon: Medal, tint: "text-[var(--muted)]", ring: "ring-[var(--panel-border)]" },
    { icon: Award, tint: "text-orange-500", ring: "ring-orange-200" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Community"
        title="Leaderboard"
        description="See who is leading in health points and habits."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-[var(--panel-border)] bg-white"
            />
          ))}
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {entries.slice(0, 3).map((entry, index) => {
            const { icon: Icon, tint, ring } = podium[index];
            return (
              <div
                key={entry.user_id}
                className={`flex flex-col items-center ${ui.card} p-5 text-center`}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Rank #{index + 1}
                </span>
                <span
                  className={`mt-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-soft)] ring-1 ${ring}`}
                >
                  <UserRound size={24} className="text-[var(--muted)]" />
                </span>
                <div className="mt-3 flex items-center gap-1.5">
                  <Icon size={16} className={tint} />
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {entry.display_name ?? "User"}
                  </p>
                </div>
                <p className="mt-1 text-lg font-bold text-[var(--text)]">
                  {entry.total_points}
                  <span className="ml-1 text-xs font-normal text-[var(--muted)]">pts</span>
                </p>
              </div>
            );
          })}
        </div>
      )}

      {!loading && entries.length > 3 && (
        <Panel>
          <p className={ui.kicker}>Standings</p>
          <h2 className={`mt-2 ${ui.sectionTitle}`}>Everyone else</h2>
          <div className="mt-4 divide-y divide-[var(--panel-border)]">
            {entries.slice(3).map((entry, index) => {
              const rank = index + 4;
              const progressPercent = Math.max(
                2,
                Math.round((entry.total_points / maxPoints) * 100),
              );
              return (
                <div
                  key={entry.user_id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-soft)] text-xs font-semibold text-[var(--muted)]">
                      {rank}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text)]">
                        {entry.display_name ?? "User"}
                      </p>
                      <div className="mt-1.5 h-1 w-32 overflow-hidden rounded-full bg-[var(--panel-border)]">
                        <div
                          className="h-full rounded-full bg-[var(--accent)]"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className={ui.chip}>{entry.total_points} pts</span>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {!loading && entries.length === 0 && !error && (
        <EmptyState
          title="Leaderboard is empty"
          description="Start earning points by completing goals and logging health activities."
        />
      )}
    </div>
  );
}
