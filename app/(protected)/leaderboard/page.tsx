"use client";

import { useEffect, useState } from "react";
import { ApiError, getLeaderboard } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import type { LeaderboardEntry } from "@/lib/types";
import { Award, Crown, Medal, UserRound } from "lucide-react";

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

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
          Leaderboard
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Top contributors
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          See who’s leading the way in health points and habits.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      )}

      {/* Podium – top 3 highlighted */}
      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {entries.slice(0, 3).map((entry, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            const podiumStyles = isFirst
              ? "bg-gradient-to-b from-amber-100 to-amber-50 border-amber-200"
              : isSecond
              ? "bg-gradient-to-b from-slate-100 to-slate-50 border-slate-200"
              : "bg-gradient-to-b from-orange-100 to-orange-50 border-orange-200";

            const icon = isFirst ? (
              <Crown size={24} className="text-amber-500" />
            ) : isSecond ? (
              <Medal size={24} className="text-slate-500" />
            ) : (
              <Award size={24} className="text-orange-500" />
            );

            return (
              <div
                key={entry.user_id}
                className={`relative flex flex-col items-center rounded-[2rem] border p-5 backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-lg ${podiumStyles}`}
              >
                <div className="mb-2 text-3xl">{icon}</div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl font-bold text-slate-700 shadow-sm">
                  <UserRound size={28} />
                </div>
                <p className="mt-3 text-center font-semibold text-slate-900">
                  {entry.display_name ?? "User"}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-600">
                  {entry.total_points} pts
                </p>
                <div className="mt-3 w-full rounded-full bg-white/60 p-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Rank #{index + 1}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Remaining entries – clean list */}
      {!loading && entries.length > 3 && (
        <div className="overflow-hidden rounded-[2rem] border border-white/50 bg-white/70 backdrop-blur-sm">
          <div className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Others
            </h2>
            <div className="space-y-2">
              {entries.slice(3).map((entry, index) => {
                const rank = index + 4;
                const progressPercent = Math.round(
                  (entry.total_points / maxPoints) * 100
                );
                return (
                  <div
                    key={entry.user_id}
                    className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-3 transition hover:bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        #{rank}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {entry.display_name ?? "User"}
                        </p>
                        <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-[var(--accent)]"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                      {entry.total_points} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/40 p-10 text-center backdrop-blur-sm">
          <p className="text-sm text-slate-500">
            Leaderboard is empty. Start earning points by completing goals and
            logging health activities!
          </p>
        </div>
      )}
    </div>
  );
}