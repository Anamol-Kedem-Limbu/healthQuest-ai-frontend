"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";
import type { NotificationItem } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { Bell, CalendarDays, Flame, HeartPulse, Sparkles, Zap } from "lucide-react";
import { EmptyState, PageHeader, Panel, ui } from "@/components/ui";

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
    <div className="space-y-6">
      <PageHeader
        kicker="Activity"
        title="Notifications"
        description="Your latest rewards, reminders, health alerts, and activity updates in one place."
        actions={
          <>
            <button onClick={handleMarkAllRead} className={ui.btnSecondary}>
              Mark all as read
            </button>
            <Link href="/dashboard" className={ui.btnSecondary}>
              Back to dashboard
            </Link>
          </>
        }
      />

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={ui.kicker}>Activity feed</p>
            <h2 className={`mt-2 ${ui.sectionTitle}`}>Latest first</h2>
          </div>
          <span className={ui.chip}>
            {unreadCount} unread
          </span>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)]"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              title="No notifications yet"
              description="Your progress, reminders, and health alerts will appear here."
            />
          ) : (
            <div className="space-y-2">
              {notifications.map((item) => {
                const Icon = getNotificationIcon(item.title);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleActOnNotification(item)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      item.read
                        ? "border-[var(--panel-border)] bg-[var(--bg-soft)] hover:bg-white"
                        : "border-[var(--accent)]/30 bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`${ui.iconBadge} mt-0.5`}>
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-[var(--text)]">
                            {item.title}
                          </p>
                          {item.read ? (
                            <span className="shrink-0 text-xs font-medium text-[var(--muted)]">Read</span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                          {item.message ?? "No additional details."}
                        </p>
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString()
                            : "Unknown date"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
