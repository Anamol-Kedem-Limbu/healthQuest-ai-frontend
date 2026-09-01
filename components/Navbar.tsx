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
    <header className="sticky top-0 z-50 w-full border-b border-[var(--panel-border)] bg-white/80 backdrop-blur-lg shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 lg:px-10">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="rounded-xl p-2 text-[var(--text)] transition hover:bg-[var(--bg-soft)] lg:hidden"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--accent)]">
              HealthQuest AI
            </span>
            <span className="hidden text-sm font-medium text-[var(--muted)] md:block">
              Personal health, guided
            </span>
          </Link>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Desktop navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {desktopLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-[var(--accent)]/10 text-[var(--accent)] shadow-sm"
                      : "text-[var(--text)] hover:bg-[var(--bg-soft)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(false);
                setNotificationsOpen((v) => !v);
              }}
              className="relative rounded-xl p-2 text-[var(--text)] transition hover:bg-[var(--bg-soft)]"
              aria-label="Show notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 z-50 mt-3 w-[22rem] rounded-[2rem] border border-[var(--panel-border)] bg-white/95 p-5 shadow-2xl backdrop-blur-md">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-[var(--text)]">
                      Notifications
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Showing latest {displayedNotifications.length} of {notifications.length}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMarkAllRead}
                      className="rounded-full border border-[var(--panel-border)] px-3 py-1 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--bg-soft)]"
                    >
                      Mark all read
                    </button>
                    <Link
                      href="/notifications"
                      className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--accent)]/90"
                    >
                      See all
                    </Link>
                  </div>
                </div>

                <div className="max-h-80 space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[var(--accent)]/20 scrollbar-track-transparent">
                  {displayedNotifications.length === 0 ? (
                    <div className="rounded-2xl bg-[var(--bg-soft)] p-4 text-sm text-[var(--muted)]">
                      No notifications yet. Keep using the app to earn updates and reminders.
                    </div>
                  ) : (
                    displayedNotifications.map((item) => {
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
                          className={`w-full rounded-2xl border p-3 text-left transition ${
                            item.read
                              ? "border-[var(--panel-border)] bg-[var(--bg)] hover:bg-[var(--bg-soft)]"
                              : "border-[var(--accent)]/20 bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-[var(--accent)]">
                              <Icon size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold text-[var(--text)]">
                                  {item.title}
                                </p>
                                {!item.read && (
                                  <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">
                                {item.message ?? "No details available."}
                              </p>
                              <p className="mt-2 text-[10px] text-[var(--muted)]">
                                {item.created_at
                                  ? new Date(item.created_at).toLocaleString()
                                  : "Unknown date"}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile avatar (desktop) */}
          <div className="relative hidden lg:block" ref={profileMenuRef}>
            <button
              onClick={() => {
                setNotificationsOpen(false);
                setProfileOpen((v) => !v);
              }}
              className="flex items-center gap-3 rounded-full p-1 pr-3 text-left transition hover:bg-[var(--bg-soft)]"
              aria-label="Open profile menu"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-500 text-sm font-bold text-white shadow-md">
                {avatarInitial}
              </span>
              <div className="hidden text-sm leading-tight xl:block">
                <div className="font-semibold text-[var(--text)]">
                  {displayName}
                </div>
                <div className="text-[11px] text-[var(--muted)]">
                  {profileSubtitle}
                </div>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-[2rem] border border-[var(--panel-border)] bg-white/95 p-3 shadow-2xl backdrop-blur-md">
                <div className="rounded-2xl bg-[var(--bg-soft)] p-4">
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {displayName}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {profileSubtitle}
                  </p>
                </div>
                <div className="mt-2 space-y-1">
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
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-[var(--text)] transition hover:bg-[var(--bg-soft)] disabled:opacity-60"
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
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
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