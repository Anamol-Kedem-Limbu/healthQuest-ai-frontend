"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, Trophy, HeartPulse, Settings, MessageSquare, Crown, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/goals", label: "Goals", icon: Trophy },
  { href: "/dashboard/health", label: "Health", icon: HeartPulse },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Crown },
  { href: "/dashboard/health/report", label: "Reports", icon: FileText },
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function NavEntry({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent)]/5 text-[var(--text)] shadow-sm ring-1 ring-[var(--accent)]/20"
          : "text-[var(--muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
      } ${collapsed ? "justify-center px-2" : ""}`}
    >
      {/* Active pill indicator (only expanded) */}
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[var(--accent)]" />
      )}
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
          active
            ? "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/30"
            : "bg-[var(--bg-soft)] text-[var(--accent)] group-hover:bg-[var(--accent)]/10"
        }`}
      >
        <Icon size={18} />
      </span>
      <span className={`${collapsed ? "hidden" : "block"} whitespace-nowrap`}>{label}</span>
    </Link>
  );
}

function DesktopSidebar({
  pathname,
  open,
  onToggle,
}: {
  pathname: string | null;
  open: boolean;
  onToggle: () => void;
}) {
  const { user } = useAuth();
  const displayName = user?.display_name?.trim() || user?.email || "Guest";
  const accountSubtext = user?.email ?? "Signed in";

  return (
    <aside
      className={`hidden lg:flex lg:flex-col ${
        open ? "w-64" : "w-20"
      } fixed top-16 left-0 bottom-0 z-40 border-r border-[var(--panel-border)] bg-white/85 backdrop-blur-lg px-3 py-5 shadow-xl shadow-black/5 transition-all duration-300`}
    >
      {/* Brand (only expanded) */}
      <div className={`mb-6 flex items-center ${open ? "justify-start" : "justify-center"}`}>
        <div
          className={`text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent)] ${
            open ? "block" : "sr-only"
          }`}
        >
          HealthQuest
        </div>
      </div>

      {/* Scrollable navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--accent)]/20 scrollbar-track-transparent pb-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <NavEntry
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={active}
              collapsed={!open}
            />
          );
        })}
      </nav>

      {/* User profile – always at bottom */}
      <div
        className={`mt-4 border-t border-[var(--panel-border)] pt-4 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <Link
          href="/dashboard/settings"
          className="group flex items-center gap-3 rounded-xl p-2 text-sm text-[var(--muted)] transition hover:bg-[var(--bg-soft)]"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-500 text-white shadow-md">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <div className="overflow-hidden">
            <div className="truncate font-semibold text-[var(--text)]">{displayName}</div>
            <div className="truncate text-[11px] text-[var(--muted)]">{accountSubtext}</div>
          </div>
        </Link>
      </div>
    </aside>
  );
}

function MobileSidebar({
  pathname,
  isOpen,
  onClose,
}: {
  pathname: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const { user } = useAuth();
  const displayName = user?.display_name?.trim() || user?.email || "Guest";
  const accountSubtext = user?.email ?? "Signed in";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col rounded-r-2xl border-r border-[var(--panel-border)] bg-white/90 backdrop-blur-lg px-4 py-5 shadow-2xl transition-transform lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            HealthQuest
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text)] transition hover:bg-[var(--bg-soft)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--accent)]/20 scrollbar-track-transparent pb-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <NavEntry
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={active}
                collapsed={false}
              />
            );
          })}
        </nav>

        {/* User profile – fixed at bottom */}
        <div className="mt-4 border-t border-[var(--panel-border)] pt-4">
          <Link
            href="/dashboard/settings"
            className="group flex items-center gap-3 rounded-xl p-2 text-sm text-[var(--muted)] transition hover:bg-[var(--bg-soft)]"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-500 text-white shadow-md">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <div className="overflow-hidden">
              <div className="truncate font-semibold text-[var(--text)]">{displayName}</div>
              <div className="truncate text-[11px] text-[var(--muted)]">{accountSubtext}</div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}

export function Sidebar({
  isOpen,
  onClose,
  onToggleSidebar,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  onToggleSidebar?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <DesktopSidebar
        pathname={pathname}
        open={isOpen ?? false}
        onToggle={onToggleSidebar ?? (() => {})}
      />
      <MobileSidebar pathname={pathname} isOpen={isOpen} onClose={onClose} />
    </>
  );
}

export default Sidebar;