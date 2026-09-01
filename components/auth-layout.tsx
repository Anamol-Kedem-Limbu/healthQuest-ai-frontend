"use client";

import Link from "next/link";
import { HeartPulse, MessageCircle, ShieldCheck, Trophy } from "lucide-react";
import { ui } from "@/components/ui";

const features = [
  {
    icon: HeartPulse,
    title: "Smart wellness tracking",
    description: "Log vitals, hydration, exercise, and reminders in one place.",
  },
  {
    icon: MessageCircle,
    title: "AI health coaching",
    description: "Get personalized guidance based on your routine.",
  },
  {
    icon: Trophy,
    title: "Progress rewards",
    description: "Build streaks, earn badges, and stay motivated.",
  },
];

export function AuthLayout({
  kicker,
  title,
  subtitle,
  active,
  children,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  active: "login" | "register";
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2 lg:items-center">
        {/* Brand panel */}
        <section className={`${ui.panel} p-8 lg:p-10`}>
          <span className={ui.chip}>HealthQuest AI</span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{subtitle}</p>

          <div className="mt-8 space-y-3">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={`flex items-start gap-3 ${ui.subtle} p-4`}>
                  <span className={ui.iconBadge}>
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-2 border-t border-[var(--panel-border)] pt-5 text-xs text-[var(--muted)]">
            <ShieldCheck size={14} className="text-[var(--accent)]" />
            Privacy-first health tracking. Your data stays yours.
          </div>
        </section>

        {/* Form panel */}
        <section className={`${ui.panel} p-8`}>
          <p className={ui.kicker}>{kicker}</p>
          <h2 className="mt-2 text-xl font-bold text-[var(--text)]">
            {active === "login" ? "Sign in to your dashboard" : "Create your account"}
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg border border-[var(--panel-border)] bg-[var(--bg-soft)] p-1 text-sm font-medium">
            <Link
              href="/login"
              className={`rounded-md px-4 py-2 text-center transition ${
                active === "login"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Login
            </Link>
            <Link
              href="/register"
              className={`rounded-md px-4 py-2 text-center transition ${
                active === "register"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Register
            </Link>
          </div>

          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
