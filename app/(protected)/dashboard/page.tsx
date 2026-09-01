"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, getDashboard, getHealthTrends } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AnalyticsTrendPayload, Badge, Dashboard } from "@/lib/types";
import { useRouter } from "next/navigation";
import {
  Activity,
  BadgeCheck,
  Bot,
  CalendarDays,
  Compass,
  Flame,
  HeartPulse,
  Sparkles,
  Target,
  Trophy,
  Waves,
} from "lucide-react";
import {
  Card,
  EmptyState,
  GoalProgressRing,
  LoadingSection,
  Panel,
  SectionHeader,
} from "@/components/ui";
import { useToasts, ToastContainer } from "@/components/Toast";

export default function DashboardPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const { toasts, removeToast, success, error } = useToasts();
  const [data, setData] = useState<Dashboard | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrendPayload | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
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
      } catch (e) {
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
    try {
      setData(await getDashboard(token));
    } catch {
      // ignore
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
      return "A steady bedtime routine helps cement this progress. Wind down with a short screen‑free ritual tonight.";
    }
    if (name.includes("steps") || name.includes("movement") || name.includes("activity")) {
      return "Aim for a quick walk after lunch or a short standing break every hour to keep your activity momentum.";
    }
    if (name.includes("mindful") || name.includes("wellness") || name.includes("focus")) {
      return "Take a moment to reflect on what helped you earn this badge, then set a small follow‑up goal to keep the rhythm going.";
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

  if (!token) return null;
  if (dashboardError)
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
        {dashboardError}
      </div>
    );
  if (!data)
    return (
      <div className="mx-auto max-w-4xl">
        <Panel>
          <LoadingSection lines={6} />
        </Panel>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Stats strip – fewer cards, one fluid row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: Flame,
            label: "Current streak",
            value: data.streak?.current_streak_days ?? 0,
            unit: "days",
            accent: "from-amber-400 to-orange-500",
            bg: "bg-gradient-to-br from-amber-50 to-orange-50",
          },
          {
            icon: Target,
            label: "Longest streak",
            value: data.streak?.longest_streak_days ?? 0,
            unit: "days",
            accent: "from-emerald-400 to-green-500",
            bg: "bg-gradient-to-br from-emerald-50 to-green-50",
          },
          {
            icon: BadgeCheck,
            label: "Badges",
            value: data.badges.length,
            unit: "earned",
            accent: "from-violet-400 to-fuchsia-500",
            bg: "bg-gradient-to-br from-violet-50 to-fuchsia-50",
          },
          {
            icon: Trophy,
            label: "Total points",
            value: data.total_points,
            unit: "pts",
            accent: "from-sky-400 to-cyan-500",
            bg: "bg-gradient-to-br from-sky-50 to-cyan-50",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="group relative overflow-hidden rounded-3xl border border-white/50 bg-white/70 p-4 backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${item.accent} opacity-10 blur-2xl`} />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{item.unit}</p>
                </div>
                <div className={`rounded-xl bg-gradient-to-br ${item.accent} p-2 text-white shadow-sm`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goals & momentum – merged into one clean surface */}
      <div className="rounded-[2.5rem] border border-white/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
              Goal momentum
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {goalsSummary && goalsSummary.total > 0
                ? `${goalsSummary.completed} of ${goalsSummary.total} goals done`
                : "No goals yet"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {goalsSummary && goalsSummary.total > 0
                ? `${goalsSummary.active} active, keep going!`
                : "Add one to start building momentum."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-2xl bg-blue-50/80 px-4 py-3">
              <GoalProgressRing
                value={goalsCompletionPercent}
                target={100}
                size={68}
                strokeWidth={8}
                color="blue"
              />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                  Progress
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {goalsCompletionPercent}%
                </p>
              </div>
            </div>
            <button
              onClick={refreshDashboard}
              className="rounded-full bg-[var(--bg-soft)] p-3 text-[var(--accent)] transition hover:bg-[var(--accent)]/10"
              aria-label="Refresh dashboard"
            >
              <Sparkles size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Weekly trends – unified panel */}
      <div className="overflow-hidden rounded-[2.5rem] border border-white/50 bg-white/80 shadow-sm backdrop-blur-sm">
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
                Weekly trend
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                How your habits are moving
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                A quick look at hydration, movement, and recovery over the last seven days.
              </p>
            </div>
            <div className="rounded-full bg-[var(--accent)]/10 px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {trendsLoading ? "Loading…" : "Last 7 days"}
            </div>
          </div>

          {!trends ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-sm text-slate-500">
              {trendsLoading ? "Preparing your trend snapshot…" : "Trend data is not available yet."}
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Hydration bars */}
              <div className="rounded-3xl bg-gradient-to-br from-cyan-50/60 to-sky-50/60 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Hydration</p>
                    <p className="text-xs text-slate-500">
                      {trendSummary?.hydrationDelta
                        ? `${trendSummary.hydrationDelta > 0 ? "+" : ""}${trendSummary.hydrationDelta.toFixed(0)}% vs. start`
                        : "No recent data"}
                    </p>
                  </div>
                  <div className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-700">
                    {trends.hydration.at(-1)?.value ?? 0} ml
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 h-28">
                  {trends.hydration.slice(-7).map((point, idx) => {
                    const height = Math.max(15, Math.min(100, ((point.value ?? 0) / 2500) * 100));
                    return (
                      <div key={`${point.timestamp}-${idx}`} className="flex flex-col items-center justify-end">
                        <div
                          className="w-full max-w-[2rem] rounded-t-xl bg-gradient-to-t from-cyan-500 to-sky-400 transition-all duration-300"
                          style={{ height: `${height}%` }}
                        />
                        <span className="mt-1 text-[10px] font-medium text-slate-400">
                          {new Date(point.timestamp).toLocaleDateString("en", { weekday: "short" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recovery & movement side by side */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-gradient-to-br from-rose-50/60 to-pink-50/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-rose-600">
                    <HeartPulse size={16} /> Recovery
                  </div>
                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {trends.vitals.heart_rate.at(-1)?.value ?? "—"} bpm
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {trendSummary?.heartRateDelta
                      ? `${trendSummary.heartRateDelta > 0 ? "+" : ""}${trendSummary.heartRateDelta.toFixed(0)}% vs. start`
                      : "Stable"}
                  </p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50/60 to-teal-50/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                    <Waves size={16} /> Movement
                  </div>
                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {trends.exercise.at(-1)?.duration_minutes ?? 0} min
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {trendSummary?.exerciseDelta
                      ? `${trendSummary.exerciseDelta > 0 ? "+" : ""}${trendSummary.exerciseDelta.toFixed(0)}% vs. start`
                      : "No recent logs"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Badges – horizontal scroll, minimal */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-slate-900">Badges</h2>
          {data.badges.length > 0 && (
            <span className="text-sm font-medium text-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1 rounded-full">
              {data.badges.length} earned
            </span>
          )}
        </div>
        {data.badges.length === 0 ? (
          <EmptyState title="No badges yet" description="Keep showing up for your habits and this space will fill up with wins." />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {data.badges.map((badge) => (
              <button
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className="flex-shrink-0 w-48 rounded-3xl border border-white/60 bg-white/80 p-4 text-left shadow-sm backdrop-blur-sm transition hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                    Earned
                  </span>
                  <BadgeCheck size={16} className="text-[var(--accent)]" />
                </div>
                <p className="font-semibold text-slate-900">{badge.name}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{badge.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI guidance – airy list */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Bot size={20} className="text-[var(--accent)]" />
          <h2 className="text-2xl font-semibold text-slate-900">Recent AI guidance</h2>
        </div>
        {data.recent_chat_logs.length === 0 ? (
          <EmptyState title="No guidance yet" description="Start a conversation with your coach to collect a history of suggestions here." />
        ) : (
          <div className="space-y-3">
            {data.recent_chat_logs.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl bg-white/70 border border-white/50 p-4 backdrop-blur-sm"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {entry.user_message}
                </p>
                <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
                  {entry.assistant_response}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badge detail modal – glassy overlay */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[2.5rem] border border-white/50 bg-white/90 p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
                  Badge details
                </p>
                <h3 className="mt-2 text-3xl font-bold text-slate-900">
                  {selectedBadge.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBadge(null)}
                className="rounded-full bg-[var(--bg-soft)] p-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <p className="mt-4 text-slate-600">
              {selectedBadge.description ??
                "This badge was awarded for your consistent progress and healthy habit achievements."}
            </p>

            {selectedBadgeTip && (
              <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Achievement tip
                </p>
                <p className="mt-2 text-sm text-slate-800">{selectedBadgeTip}</p>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Awarded on
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {new Date(selectedBadge.awarded_at ?? Date.now()).toLocaleDateString()}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Next step
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Keep building momentum by adding a goal or tracking one more healthy habit today.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedBadge(null)}
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedBadge(null);
                  router.push("/goals");
                }}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                View goals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}