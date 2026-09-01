"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Flame,
  HeartPulse,
  Menu,
  Sparkles,
  X,
  Zap,
  FileSearch,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  analyzeHealthReport,
} from "@/lib/api";
import { saveHealthReport } from "@/lib/report-storage";
import type { NotificationItem } from "@/lib/types";

function getNotificationIcon(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes("reward") || normalized.includes("badge")) return Sparkles;
  if (normalized.includes("hydration") || normalized.includes("water")) return Zap;
  if (normalized.includes("exercise") || normalized.includes("workout")) return Flame;
  if (
    normalized.includes("appointment") ||
    normalized.includes("attended") ||
    normalized.includes("reminder")
  )
    return CalendarDays;
  if (
    normalized.includes("alert") ||
    normalized.includes("health") ||
    normalized.includes("vitals")
  )
    return HeartPulse;
  return Bell;
}

export function Navbar({
  sidebarOpen,
  onToggleSidebar,
}: {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  // --- Fetch notifications ---
  useEffect(() => {
    if (!token) return;
    let mounted = true;

    const load = async () => {
      try {
        const items = await getNotifications(token);
        if (mounted) setNotifications(items);
      } catch {
        if (mounted) setNotifications([]);
      }
    };

    load();
    const interval = window.setInterval(load, 30000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [token]);

  // Close dropdowns on route change
  useEffect(() => {
    setNotificationsOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const handleMarkRead = async (notificationId: string) => {
    if (!token) return;
    try {
      await markNotificationRead(token, notificationId);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, read: true } : item
        )
      );
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await markAllNotificationsRead(token);
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch {
      // ignore
    }
  };

  const displayedNotifications = notifications.slice(0, 5);
  const displayName = user?.display_name?.trim() || user?.email || "Guest";
  const profileSubtitle = user?.email ?? "Signed in";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  // Desktop nav links – active state based on pathname
  const desktopLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/goals", label: "Goals" },
    { href: "/dashboard/health", label: "Health" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--panel-border)] bg-white backdrop-blur-sm shadow-xs">
      <div className="mx-auto flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="rounded-lg p-1.5 text-[var(--text)] transition hover:bg-[var(--bg-soft)] lg:hidden"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] hidden sm:block">
              HealthQuest
            </span>
          </Link>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1">
          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(false);
                setNotificationsOpen((v) => !v);
              }}
              className="relative rounded-lg p-1.5 text-[var(--text)] transition hover:bg-[var(--bg-soft)]"
              aria-label="Show notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-2xl border border-[var(--panel-border)] bg-white shadow-lg backdrop-blur-sm">
                <div className="border-b border-[var(--panel-border)] px-4 py-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-[var(--text)]">
                      Notifications
                    </p>
                    <span className="text-xs text-[var(--muted)]">
                      {unreadCount > 0 && `${unreadCount} new`}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleMarkAllRead}
                      className="flex-1 rounded-lg border border-[var(--panel-border)] px-2 py-1.5 text-xs font-medium text-[var(--text)] transition hover:bg-[var(--bg-soft)]"
                    >
                      Mark all read
                    </button>
                    <Link
                      href="/dashboard/notifications"
                      className="flex-1 rounded-lg bg-[var(--accent)] px-2 py-1.5 text-center text-xs font-medium text-white transition hover:bg-[var(--accent)]/90"
                    >
                      See all
                    </Link>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {displayedNotifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-[var(--muted)]">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--panel-border)]">
                      {displayedNotifications.map((item) => {
                        const Icon = getNotificationIcon(item.title);
                        const handleActOnNotification = async () => {
                          if (!token) return;
                          try {
                            await markNotificationRead(token, item.id);
                            setNotifications((prev) =>
                              prev.map((n) =>
                                n.id === item.id ? { ...n, read: true } : n
                              )
                            );
                          } catch {
                            // ignore
                          }
                          const normalized = `${item.title} ${item.message}`.toLowerCase();
                          if (
                            normalized.includes("vitals") ||
                            normalized.includes("no vitals") ||
                            normalized.includes("log your vitals")
                          ) {
                            router.push("/dashboard/health");
                            return;
                          }
                          if (
                            normalized.includes("appointment") ||
                            normalized.includes("attend") ||
                            normalized.includes("reminder")
                          ) {
                            router.push("/dashboard/health");
                            return;
                          }
                        };

                        return (
                          <button
                            key={item.id}
                            onClick={handleActOnNotification}
                            className={`w-full px-4 py-3 text-left transition ${
                              item.read
                                ? "bg-white hover:bg-[var(--bg-soft)]"
                                : "bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex-shrink-0">
                                <Icon size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium text-[var(--text)]">
                                    {item.title}
                                  </p>
                                  {!item.read && (
                                    <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-white flex-shrink-0">
                                      New
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">
                                  {item.message ?? "No details available."}
                                </p>
                                <p className="mt-1.5 text-[10px] text-[var(--muted)]">
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
              </div>
            )}
          </div>

          {/* Profile avatar */}
          <div className="relative hidden sm:block" ref={profileMenuRef}>
            <button
              onClick={() => {
                setNotificationsOpen(false);
                setProfileOpen((v) => !v);
              }}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-[var(--bg-soft)]"
              aria-label="Open profile menu"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-teal-600 text-xs font-bold text-white shadow-sm">
                {avatarInitial}
              </span>
              <div className="hidden text-xs leading-tight lg:block">
                <div className="font-medium text-[var(--text)] truncate max-w-[120px]">
                  {displayName}
                </div>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-white shadow-lg backdrop-blur-sm">
                <div className="border-b border-[var(--panel-border)] px-4 py-3.5">
                  <p className="text-sm font-bold text-[var(--text)]">
                    {displayName}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {profileSubtitle}
                  </p>
                </div>
                <div className="space-y-1 p-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setProfileOpen(false);
                      if (!token) return;
                      setAnalyzing(true);
                      try {
                        const result = await analyzeHealthReport(token);
                        saveHealthReport(result);
                        router.push("/dashboard/health/report");
                      } catch {
                        // ignore
                      } finally {
                        setAnalyzing(false);
                      }
                    }}
                    disabled={analyzing}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--text)] transition hover:bg-[var(--bg-soft)] disabled:opacity-60"
                  >
                    <FileSearch size={16} className="text-[var(--accent)]" />
                    {analyzing ? "Analyzing…" : "Analyze my report"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;