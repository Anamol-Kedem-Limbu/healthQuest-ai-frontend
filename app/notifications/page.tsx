"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";
import type { NotificationItem } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { Bell, CalendarDays, Flame, HeartPulse, Sparkles, Zap } from "lucide-react";

function getNotificationIcon(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes("reward") || normalized.includes("badge")) return Sparkles;
  if (normalized.includes("hydration") || normalized.includes("water")) return Zap;
  if (normalized.includes("exercise") || normalized.includes("workout")) return Flame;
  if (normalized.includes("appointment") || normalized.includes("attended") || normalized.includes("reminder")) return CalendarDays;
  if (normalized.includes("alert") || normalized.includes("health") || normalized.includes("vitals")) return HeartPulse;
  return Bell;
}

export default function NotificationsPage() {
  const { token, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let mounted = true;

    getNotifications(token)
      .then((items) => {
        if (!mounted) return;
        setNotifications(items);
      })
      .catch((caughtError) => {
        if (!mounted) return;
        if (caughtError instanceof ApiError && caughtError.status === 401) {
          logout();
          return;
        }
        setError("Unable to load notifications.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token, logout]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await markAllNotificationsRead(token);
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch {
      // ignore
    }
  };

  const handleToggleRead = async (notificationId: string) => {
    if (!token) return;
    try {
      await markNotificationRead(token, notificationId);
      setNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item)));
    } catch {
      // ignore
    }
  };

  const router = useRouter();

  const handleActOnNotification = async (item: NotificationItem) => {
    if (!token) return;
    // Mark read first
    try {
      await markNotificationRead(token, item.id);
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    } catch {
      // ignore
    }

    const normalized = `${item.title} ${item.message}`.toLowerCase();
    // If notification mentions a report, try to extract a UUID and go to the report viewer
    const uuidMatch = (/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i).exec(item.message || "" ) || (/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i).exec(item.title || "");
    if (normalized.includes("report") || uuidMatch) {
      if (uuidMatch) {
        router.push(`/dashboard/health/report?reportId=${uuidMatch[1]}`);
      } else {
        router.push("/dashboard/health/report");
      }
      return;
    }
    if (normalized.includes("vitals") || normalized.includes("no vitals") || normalized.includes("log your vitals")) {
      router.push("/dashboard/health");
      return;
    }
    if (normalized.includes("appointment") || normalized.includes("attend") || normalized.includes("reminder")) {
      router.push("/dashboard/health");
      return;
    }
    // Default: open notifications list / stay
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-[var(--panel-border)] bg-white/90 p-6 shadow-sm backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">Notifications</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--text)]">All alerts & activity</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
              Keep track of your latest rewards, reminders, health alerts, and activity updates in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleMarkAllRead}
              className="rounded-full border border-[var(--panel-border)] bg-[var(--bg)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--bg-soft)]"
            >
              Mark all as read
            </button>
            <Link href="/dashboard" className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent)]/90">
              Back to dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-4 rounded-[2rem] border border-[var(--panel-border)] bg-white/90 p-6 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">Activity feed</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{unreadCount} unread notification{unreadCount === 1 ? "" : "s"}</p>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-soft)] px-3 py-2 text-sm text-[var(--muted)]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Bell size={16} />
                </span>
                Latest first
              </div>
            </div>

            {loading ? (
              <div className="rounded-[2rem] bg-[var(--bg-soft)] p-6 text-sm text-[var(--muted)]">Loading notifications...</div>
            ) : error ? (
              <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="rounded-[2rem] bg-[var(--bg-soft)] p-6 text-sm text-[var(--muted)]">
                No notifications yet. Your progress, reminders, and health alerts will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((item) => {
                  const Icon = getNotificationIcon(item.title);
                  return (
                    <button key={item.id} onClick={() => handleActOnNotification(item)} className={`w-full text-left rounded-[1.8rem] border p-5 transition ${item.read ? "border-[var(--panel-border)] bg-[var(--bg)]" : "border-[var(--accent)]/20 bg-[var(--accent)]/10"}`}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="mt-1 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-[var(--bg-soft)] text-[var(--accent)]">
                            <Icon size={20} />
                          </div>
                          <div className="min-w-0">
                            <h2 className="truncate text-lg font-semibold text-[var(--text)]">{item.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.message ?? "No additional details."}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-start gap-2 text-right text-sm text-[var(--muted)] lg:items-end">
                          <span>{item.created_at ? new Date(item.created_at).toLocaleString() : "Unknown date"}</span>
                          {!item.read ? (
                            <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">New</span>
                          ) : (
                            <span className="rounded-full bg-[var(--bg-soft)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">Read</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-4 rounded-[2rem] border border-[var(--panel-border)] bg-white/90 p-6 shadow-sm backdrop-blur-xl">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">Tips</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Keep your notification feed useful and actionable.</p>
            </div>
            <div className="space-y-4">
              <div className="rounded-[1.8rem] bg-[var(--bg-soft)] p-4">
                <p className="text-sm font-semibold text-[var(--text)]">Use notifications as reminders</p>
                <p className="mt-2 text-sm text-[var(--muted)]">Tap any new notification to mark it as read and keep your inbox focused on what matters most.</p>
              </div>
              <div className="rounded-[1.8rem] bg-[var(--bg-soft)] p-4">
                <p className="text-sm font-semibold text-[var(--text)]">Prefer short summaries</p>
                <p className="mt-2 text-sm text-[var(--muted)]">Titles should explain the action, and details should spell out the benefit or next step.</p>
              </div>
              <div className="rounded-[1.8rem] bg-[var(--bg-soft)] p-4">
                <p className="text-sm font-semibold text-[var(--text)]">Review daily</p>
                <p className="mt-2 text-sm text-[var(--muted)]">Clear or act on notifications every day so you stay on top of health reminders and progress updates.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
