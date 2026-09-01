import Link from "next/link";
import { BarChart3, HeartPulse, Sparkles, Trophy } from "lucide-react";

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

const stats = [
  { value: "4.8/5", label: "Loved by daily users" },
  { value: "24/7", label: "AI support on demand" },
  { value: "100%", label: "Focused on consistency" },
];

const card = "rounded-xl border border-[var(--panel-border)] bg-white shadow-xs";
const kicker = "text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Hero */}
        <section className="rounded-2xl border border-[var(--panel-border)] bg-white p-8 shadow-sm sm:p-10">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                Your health platform
              </span>
              <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[var(--text)] sm:text-4xl lg:text-5xl">
                Small daily habits, tracked and rewarded.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
                Log your vitals, chat with an AI health coach, and earn points for staying
                consistent.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                >
                  Get started
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg border border-[var(--panel-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--bg-soft)]"
                >
                  Log in
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {stats.map((s) => (
                  <div key={s.label} className={`${card} p-4`}>
                    <p className="text-xl font-bold text-[var(--text)]">{s.value}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] p-5">
              <div className="flex items-center justify-between">
                <p className={kicker}>Today&apos;s focus</p>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  On track
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  {
                    icon: HeartPulse,
                    title: "Vitals logged",
                    sub: "Blood pressure and hydration updated",
                  },
                  {
                    icon: Sparkles,
                    title: "AI coach ready",
                    sub: "Suggestions for today's routine",
                  },
                  {
                    icon: Trophy,
                    title: "3 day streak",
                    sub: "Keep going to unlock your next badge",
                  },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.title} className={`flex items-center gap-3 ${card} p-3`}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                        <Icon size={16} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text)]">{row.title}</p>
                        <p className="text-xs text-[var(--muted)]">{row.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className={`${card} p-5`}>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Icon size={16} />
                </span>
                <h2 className="mt-3 text-sm font-semibold text-[var(--text)]">{item.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
              </article>
            );
          })}
        </section>

        {/* Journey */}
        <section className="rounded-2xl border border-[var(--panel-border)] bg-white p-8 shadow-sm sm:p-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className={kicker}>Designed for daily rhythm</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
                Everything you need to build a healthy routine without the friction.
              </h2>
              <p className="mt-3 max-w-xl text-base leading-7 text-[var(--muted)]">
                From hydration and exercise to medication reminders and appointments, your progress
                stays visible and motivating.
              </p>
            </div>
            <div className="space-y-3">
              {journeySteps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-3 rounded-xl border border-[var(--panel-border)] bg-[var(--bg-soft)] p-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-[var(--muted)]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
