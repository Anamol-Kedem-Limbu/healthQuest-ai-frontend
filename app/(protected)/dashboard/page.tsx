"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, getDashboard, getHealthTrends } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AnalyticsTrendPayload, Badge, Dashboard } from "@/lib/types";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bot,
  Flame,
  HeartPulse,
  RefreshCw,
  Target,
  Trophy,
  Waves,
} from "lucide-react";
import { GoalProgressRing, LoadingSection, Panel } from "@/components/ui";
import { useToasts, ToastContainer } from "@/components/Toast";

export default function DashboardPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const { toasts, removeToast } = useToasts();
  const [data, setData] = useState<Dashboard | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrendPayload | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setData(await getDashboard(token));
      } catch (caughtError) {
        if (caughtError instanceof ApiError && caughtError.status === 401) {
          logout();
          router.replace("/login");
          return;
        }
        setDashboardError("Unable to load dashboard.");
      }
    })();
  }, [token, logout, router]);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    (async () => {
      setTrendsLoading(true);
      try {
        const trendData = await getHealthTrends(token);
        if (mounted) setTrends(trendData);
      } catch {
        // ignore
      } finally {
        if (mounted) setTrendsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  const goalsSummary = useMemo(() => {
    if (!data) return null;
    return {
      total: data.goals.length,
      completed: data.goals.filter((g) => g.is_completed).length,
      active: data.goals.filter((g) => !g.is_completed).length,
    };
  }, [data]);

  const goalsCompletionPercent =
    goalsSummary && goalsSummary.total > 0
      ? Math.round((goalsSummary.completed / goalsSummary.total) * 100)
      : 0;

  const refreshDashboard = async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      setData(await getDashboard(token));
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  const getBadgeAchievementTip = (badge: Badge) => {
    const name = badge.name.toLowerCase();
    if (name.includes("hydration")) {
      return "Keep the hydration streak alive by sipping a glass of water before each meal and logging it every day.";
    }
    if (name.includes("streak") || name.includes("consistency")) {
      return "Consistency is your superpower. Try to lock in one small healthy habit today to extend your streak.";
    }
    if (name.includes("sleep")) {
      return "A steady bedtime routine helps cement this progress. Wind down with a short screen-free ritual tonight.";
    }
    if (name.includes("steps") || name.includes("movement") || name.includes("activity")) {
      return "Aim for a quick walk after lunch or a short standing break every hour to keep your activity momentum.";
    }
    if (name.includes("mindful") || name.includes("wellness") || name.includes("focus")) {
      return "Take a moment to reflect on what helped you earn this badge, then set a small follow-up goal to keep the rhythm going.";
    }
    return "Keep doing what earned this badge, and use it as motivation to add one more healthy habit today.";
  };

  const selectedBadgeTip = selectedBadge ? getBadgeAchievementTip(selectedBadge) : null;

  const trendSummary = useMemo(() => {
    if (!trends) return null;

    const hydrationValues = trends.hydration.map((point) => point.value);
    const exerciseValues = trends.exercise.map((point) => point.duration_minutes);
    const heartRateValues = trends.vitals.heart_rate.map((point) => point.value);

    const getTrendDelta = (values: Array<number | undefined>) => {
      if (values.length < 2) return 0;
      const first = values[0];
      const last = values[values.length - 1];
      if (first == null || last == null || first === 0) return 0;
      return ((last - first) / first) * 100;
    };

    return {
      hydrationDelta: getTrendDelta(hydrationValues),
      exerciseDelta: getTrendDelta(exerciseValues),
      heartRateDelta: getTrendDelta(heartRateValues),
    };
  }, [trends]);

  const formatDelta = (delta: number | undefined, fallback: string) =>
    delta ? `${delta > 0 ? "+" : ""}${delta.toFixed(0)}% vs. start` : fallback;

  if (!token) return null;
  if (dashboardError)
    return (
      <div className="mx-auto max-w-6xl py-2">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          {dashboardError}
        </div>
      </div>
    );
  if (!data)
    return (
      <div className="mx-auto max-w-6xl py-2">
        <Panel>
          <LoadingSection lines={6} />
        </Panel>
      </div>
    );

  const stats = [
    { icon: Flame, label: "Current streak", value: data.streak?.current_streak_days ?? 0, unit: "days" },
    { icon: Target, label: "Longest streak", value: data.streak?.longest_streak_days ?? 0, unit: "days" },
    { icon: BadgeCheck, label: "Badges", value: data.badges.length, unit: "earned" },
    { icon: Trophy, label: "Total points", value: data.total_points, unit: "pts" },
  ];

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]">Welcome back</p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--text)]">Your progress</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Track your health goals and achievements</p>
        </div>
        <button
          onClick={refreshDashboard}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--panel-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--bg-soft)] disabled:opacity-60"
          aria-label="Refresh dashboard"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {dashboardError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {dashboardError}
        </div>
      )}

      {/* Loading state */}
      {!data && !dashboardError && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-[var(--panel-border)] bg-white animate-pulse" />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-lg border border-[var(--panel-border)] bg-white p-4 shadow-xs"
                >
                  <div className="flex items-center gap-2 text-[var(--muted)]">
                    <Icon size={16} />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      {item.label}
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-[var(--text)]">
                    {item.value}
                    <span className="ml-1 text-xs font-normal text-[var(--muted)]">
                      {item.unit}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>

          {/* Goal momentum */}
          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]">Goal momentum</p>
                <h2 className="mt-2 text-lg font-bold text-[var(--text)]">
                  {goalsSummary && goalsSummary.total > 0
                    ? `${goalsSummary.completed} of ${goalsSummary.total} goals done`
                    : "No goals yet"}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {goalsSummary && goalsSummary.total > 0
                    ? `${goalsSummary.active} active — keep the momentum going.`
                    : "Add one to start building your health journey."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <GoalProgressRing
                value={goalsCompletionPercent}
                target={100}
                size={96}
                strokeWidth={8}
                color="blue"
              />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                  Completion rate
                </p>
                <p className="mt-2 text-3xl font-bold text-[var(--text)]">{goalsCompletionPercent}%</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {goalsSummary && goalsSummary.total > 0
                    ? `${goalsCompletionPercent === 100 ? "All done! Excellent work." : "Keep making progress."}`
                    : "Start with your first goal."}
                </p>
              </div>
            </div>
          </Panel>

          {/* Weekly trends */}
          <Panel>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]">Weekly trends</p>
                <h2 className="mt-2 text-lg font-bold text-[var(--text)]">How your habits are moving</h2>
              </div>
              <span className="rounded-lg bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--accent)]">
                {trendsLoading ? "Loading…" : "Last 7 days"}
              </span>
            </div>

            {!trends ? (
              <p className="text-sm text-[var(--muted)]">
                {trendsLoading ? "Preparing your trend snapshot…" : "Trend data not available yet. Log some activities to see trends."}
              </p>
            ) : (
              <div className="space-y-6">
                {/* Hydration */}
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[var(--text)]">Hydration</p>
                    <p className="text-xs text-[var(--muted)]">
                      {trends.hydration.at(-1)?.value ?? 0} ml ·{" "}
                      {formatDelta(trendSummary?.hydrationDelta, "—")}
                    </p>
                  </div>
                  <div className="mt-3 grid h-20 grid-cols-7 gap-2">
                    {trends.hydration.slice(-7).map((point, idx) => {
                      const height = Math.max(8, Math.min(100, ((point.value ?? 0) / 2500) * 100));
                      return (
                        <div key={`${point.timestamp}-${idx}`} className="flex flex-col items-center justify-end gap-1">
                          <div
                            className="w-full rounded-sm bg-blue-500 transition-all"
                            style={{ height: `${height}%`, minHeight: "4px" }}
                            title={`${point.value} ml`}
                          />
                          <span className="text-[10px] font-medium text-[var(--muted)]">
                            {new Date(point.timestamp).toLocaleDateString("en", { weekday: "short" })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recovery & Movement */}
                <div className="grid gap-6 border-t border-[var(--panel-border)] pt-6 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <HeartPulse size={16} className="text-red-500" />
                      <span className="text-sm font-bold text-[var(--text)]">Recovery</span>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[var(--text)]">
                      {trends.vitals.heart_rate.at(-1)?.value ?? "—"}
                      <span className="ml-1 text-xs font-normal text-[var(--muted)]">bpm</span>
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatDelta(trendSummary?.heartRateDelta, "stable")}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Waves size={16} className="text-blue-500" />
                      <span className="text-sm font-bold text-[var(--text)]">Movement</span>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[var(--text)]">
                      {trends.exercise.at(-1)?.duration_minutes ?? 0}
                      <span className="ml-1 text-xs font-normal text-[var(--muted)]">min</span>
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatDelta(trendSummary?.exerciseDelta, "no recent logs")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Panel>

          {/* Badges */}
          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]">Achievements</p>
                <h2 className="mt-2 text-lg font-bold text-[var(--text)]">Your badges</h2>
              </div>
              {data.badges.length > 0 && (
                <span className="text-xs font-medium text-[var(--muted)]">
                  {data.badges.length} earned
                </span>
              )}
            </div>
            {data.badges.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Earn badges by staying consistent with your health habits. They'll appear here as you make progress.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.badges.map((badge) => (
                  <button
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--panel-border)] bg-[var(--accent)]/5 px-3 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/10"
                  >
                    <BadgeCheck size={14} className="text-[var(--accent)]" />
                    {badge.name}
                  </button>
                ))}
              </div>
            )}
          </Panel>

          {/* Recent guidance */}
          <Panel>
            <div className="mb-4 flex items-center gap-2">
              <Bot size={16} className="text-[var(--accent)]" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]">AI Coach</p>
                <h2 className="text-lg font-bold text-[var(--text)]">Recent guidance</h2>
              </div>
            </div>
            {data.recent_chat_logs.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Start a conversation with your AI coach to get personalized health recommendations and support.
              </p>
            ) : (
              <div className="space-y-4">
                {data.recent_chat_logs.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="border-l-2 border-[var(--accent)] pl-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">You asked</p>
                    <p className="mt-1 text-sm text-[var(--text)]">{entry.user_message}</p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--accent)]">Coach said</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-[var(--muted)] line-clamp-3">
                      {entry.assistant_response}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Badge modal */}
          {selectedBadge && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-[var(--panel-border)] bg-white p-6 shadow-lg">
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]">Achievement</p>
                  <h3 className="mt-2 text-2xl font-bold text-[var(--text)]">{selectedBadge.name}</h3>
                </div>

                <p className="text-sm text-[var(--muted)]">
                  {selectedBadge.description ??
                    "Awarded for your consistent progress and healthy habit achievements."}
                </p>

                {selectedBadgeTip && (
                  <p className="mt-4 border-l-2 border-[var(--accent)] pl-3 text-sm font-medium text-[var(--text)]">
                    💡 {selectedBadgeTip}
                  </p>
                )}

                <p className="mt-4 text-xs text-[var(--muted)]">
                  Earned on{" "}
                  {new Date(selectedBadge.awarded_at ?? Date.now()).toLocaleDateString(
                    "en",
                    { year: "numeric", month: "short", day: "numeric" }
                  )}
                </p>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setSelectedBadge(null)}
                    className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent)]/90"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBadge(null);
                      router.push("/dashboard/goals");
                    }}
                    className="flex-1 rounded-lg border border-[var(--panel-border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--bg-soft)]"
                  >
                    View goals
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
