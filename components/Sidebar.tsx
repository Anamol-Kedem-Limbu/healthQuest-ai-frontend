"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Home, Trophy, HeartPulse, Settings, MessageSquare, Crown, FileText, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/goals", label: "Goals", icon: Trophy },
  { href: "/dashboard/health", label: "Health", icon: HeartPulse },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Crown },
  { href: "/dashboard/health/report", label: "Reports", icon: FileText },
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
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
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
        active
          ? "bg-[var(--accent)] text-white shadow-md"
          : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/50"
      } ${collapsed ? "justify-center px-2.5" : ""}`}
    >
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
          active
            ? "bg-white/20"
            : "bg-transparent group-hover:bg-[var(--accent)]/10"
        }`}
      >
        <Icon size={18} strokeWidth={2} />
      </span>
      {!collapsed && <span className="truncate font-medium">{label}</span>}
    </Link>
  );
}

function DesktopSidebar({
  pathname,
  open,
}: {
  pathname: string | null;
  open: boolean;
}) {
  const { user } = useAuth();
  const displayName = user?.display_name?.trim() || user?.email || "Guest";
  const accountSubtext = user?.email ?? "Signed in";

  return (
    <aside
      className={`${
        open ? "w-64" : "w-20"
      } hidden lg:flex lg:flex-col fixed top-16 left-0 bottom-0 z-40 border-r border-[var(--panel-border)] bg-white backdrop-blur-sm transition-all duration-300`}
    >
      {/* Brand area */}
      {open && (
        <div className="px-4 py-4 border-b border-[var(--panel-border)]">
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
            HealthQuest
          </div>
          <div className="text-[10px] text-[var(--muted)] mt-1">Wellness Platform</div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
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

      {/* User profile section */}
      {open && (
        <div className="border-t border-[var(--panel-border)] px-2 py-4">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 rounded-lg p-2 text-sm text-[var(--muted)] transition hover:bg-[var(--accent)]/10 hover:text-[var(--text)]"
          >
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-teal-600 text-white text-xs font-bold shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="truncate font-medium text-[var(--text)] text-xs">{displayName}</div>
              <div className="truncate text-[10px] text-[var(--muted)]">{accountSubtext}</div>
            </div>
          </Link>
        </div>
      )}
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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--panel-border)] bg-white backdrop-blur-sm transition-transform lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--panel-border)]">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
              HealthQuest
            </div>
            <div className="text-[10px] text-[var(--muted)] mt-1">Wellness Platform</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text)] transition hover:bg-[var(--bg-soft)]"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
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

        {/* User profile section */}
        <div className="border-t border-[var(--panel-border)] px-2 py-4">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 rounded-lg p-2 text-sm text-[var(--muted)] transition hover:bg-[var(--accent)]/10 hover:text-[var(--text)]"
            onClick={onClose}
          >
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-teal-600 text-white text-xs font-bold shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="truncate font-medium text-[var(--text)] text-xs">{displayName}</div>
              <div className="truncate text-[10px] text-[var(--muted)]">{accountSubtext}</div>
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
      />
      <MobileSidebar pathname={pathname} isOpen={isOpen} onClose={onClose} />
    </>
  );
}

export default Sidebar;