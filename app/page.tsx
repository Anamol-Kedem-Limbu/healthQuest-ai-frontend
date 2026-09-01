import Link from "next/link";
import { BarChart3, HeartPulse, Sparkles, ShieldCheck, Trophy, Zap, Users } from "lucide-react";

const highlights = [
  {
    title: "Log vitals",
    description: "Track essential wellness data with a calm, simple daily routine.",
    icon: HeartPulse,
  },
  {
    title: "Chat with AI coach",
    description: "Get supportive guidance tailored to your routine, habits, and goals.",
    icon: Sparkles,
  },
  {
    title: "Earn points and badges",
    description: "Stay consistent and turn healthy habits into visible momentum.",
    icon: Trophy,
  },
  {
    title: "Track your progress",
    description: "Observe streaks, reminders, and milestones in one refined dashboard.",
    icon: BarChart3,
  },
];

const journeySteps = [
  "Create your health profile and choose your preferred reminders.",
  "Log hydration, exercise, symptoms, medications, and appointments effortlessly.",
  "Receive tailored coaching and celebrate streaks, points, and badges.",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_20%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.08),_transparent_18%),linear-gradient(180deg,_#f8fafc,_#f7f9fb)] py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-6">
        <section className="overflow-hidden rounded-[2.5rem] border border-[var(--panel-border)] bg-[rgba(255,255,255,0.92)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-8 lg:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
              Your health platform
            </div>
            <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight text-[var(--text)] sm:text-5xl lg:text-6xl">
              Small daily habits, tracked and rewarded.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">
              Log your vitals, chat with an AI health coach, and earn points for staying consistent.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="rounded-full bg-[var(--text)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                Get started
              </Link>
              <Link href="/login" className="rounded-full border border-[var(--panel-border)] bg-white/80 px-5 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-white">
                Log in
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-[var(--panel-border)] bg-white/80 p-5 shadow-sm">
                <p className="text-2xl font-semibold text-[var(--text)]">4.8/5</p>
                <p className="mt-2 text-sm text-[var(--muted)]">Loved by daily users</p>
              </div>
              <div className="rounded-3xl border border-[var(--panel-border)] bg-white/80 p-5 shadow-sm">
                <p className="text-2xl font-semibold text-[var(--text)]">24/7</p>
                <p className="mt-2 text-sm text-[var(--muted)]">AI support on demand</p>
              </div>
              <div className="rounded-3xl border border-[var(--panel-border)] bg-white/80 p-5 shadow-sm">
                <p className="text-2xl font-semibold text-[var(--text)]">100%</p>
                <p className="mt-2 text-sm text-[var(--muted)]">Focused on consistency</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--panel-border)] bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Today&apos;s focus</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">Stay steady and build momentum</p>
              </div>
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 shadow-sm">
                On track
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-3xl border border-[var(--panel-border)] bg-slate-50 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700">
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">Vitals logged</p>
                    <p className="text-sm text-slate-500">Blood pressure and hydration updated</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-[var(--panel-border)] bg-slate-50 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">AI coach ready</p>
                    <p className="text-sm text-slate-500">Helpful suggestions for today&apos;s routine</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-[var(--panel-border)] bg-slate-50 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-violet-100 p-2 text-violet-700">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">3 day streak</p>
                    <p className="text-sm text-slate-500">Keep going to unlock your next badge</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-[var(--panel-border)] pt-5 text-sm text-[var(--muted)]">
              <div className="flex items-center gap-3 py-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                  <ShieldCheck size={18} />
                </span>
                <span>Private health data with secure tracking.</span>
              </div>
              <div className="flex items-center gap-3 py-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Zap size={18} />
                </span>
                <span>Fast AI coaching delivered in seconds.</span>
              </div>
              <div className="flex items-center gap-3 py-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Users size={18} />
                </span>
                <span>Designed for long-term healthy habit building.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-[1.75rem] border border-[var(--panel-border)] bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-[var(--text)]">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.description}</p>
            </article>
          );
        })}
      </section>

      <section className="mt-8 rounded-[2rem] border border-[var(--panel-border)] bg-white/90 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--accent)]">Designed for daily rhythm</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--text)] sm:text-4xl">
              Everything you need to build a healthy routine without the friction.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              From hydration and exercise to medication reminders and appointments, your progress stays visible and motivating.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-[var(--panel-border)] bg-white/80 p-5">
            <div className="space-y-4">
              {journeySteps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--bg-soft)] p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-[var(--muted)]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
  );
}
