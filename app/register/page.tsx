//app/register/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Spinner from "@/components/spinner";
import { ArrowLeft, Eye, EyeOff, HeartPulse, MessageCircle, Trophy, ShieldCheck, Zap, Users } from "lucide-react";

const advantages = [
  {
    title: "Smart wellness tracking",
    description: "Log vitals, hydration, exercise, and reminders in one place.",
    icon: HeartPulse,
  },
  {
    title: "AI health coaching",
    description: "Receive personalized recommendations based on your routine.",
    icon: MessageCircle,
  },
  {
    title: "Progress rewards",
    description: "Build streaks, earn badges, and stay motivated daily.",
    icon: Trophy,
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { token, register, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [consentDataStorage, setConsentDataStorage] = useState(false);
  const [consentModelTraining, setConsentModelTraining] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      router.replace("/dashboard");
    }
  }, [token, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    setEmailError(null);
    setPasswordError(null);
    setDisplayNameError(null);

    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();
    let hasError = false;

    if (!normalizedEmail) {
      setEmailError("Email is required.");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError("Enter a valid email address.");
      hasError = true;
    }

    if (!normalizedPassword) {
      setPasswordError("Password is required.");
      hasError = true;
    } else if (normalizedPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      hasError = true;
    }

    if (!displayName.trim()) {
      setDisplayNameError("Display name is required for registration.");
      hasError = true;
    }

    if (hasError) {
      setSubmitting(false);
      return;
    }

    try {
      await register({
        email: normalizedEmail,
        password: normalizedPassword,
        display_name: displayName.trim(),
        consent_data_storage: consentDataStorage,
        consent_model_training: consentModelTraining,
      });
      setMessage("Account created. Signing you in...");
      await login(normalizedEmail, normalizedPassword);
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message || "Unable to create an account. Check your input and try again.");
      } else {
        setError("Unable to create an account. Check your input and try again.");
      }
      setMessage(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.18),_transparent_20%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_25%),linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_100%)] py-14">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 sm:px-6 lg:px-8 lg:flex-row lg:items-center">
        <section className="relative flex-1 overflow-hidden rounded-[2.5rem] border border-[var(--panel-border)] bg-white/95 p-10 shadow-[0_40px_120px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="absolute inset-y-0 left-0 w-2 bg-[radial-gradient(circle,_rgba(20,184,166,0.45),transparent_70%)]" />
          <div className="relative">
            <span className="inline-flex items-center rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-3 py-1 text-sm font-semibold text-[var(--accent)]">
              HealthQuest AI
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-[var(--text)] sm:text-5xl">
              Start your healthiest streak yet.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Register today and take control of your wellness with goals, AI coaching, and achievement badges.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {advantages.slice(0, 2).map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-[1.75rem] border border-[var(--panel-border)] bg-slate-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
                      <Icon size={20} />
                    </div>
                    <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] bg-gradient-to-br from-teal-600 to-cyan-600 p-6 text-white shadow-[0_20px_80px_rgba(15,23,42,0.12)]">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-100">Goal power</p>
                <p className="mt-3 text-lg font-semibold">Create goals that actually stick.</p>
              </div>
              <div className="rounded-[1.75rem] border border-[var(--panel-border)] bg-white p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.35em] text-[var(--accent)]">Reward momentum</p>
                <p className="mt-3 text-lg font-semibold text-[var(--text)]">Earn badges for every healthy habit you keep.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex-1 rounded-[2rem] border border-[var(--panel-border)] bg-[var(--panel)] p-4 shadow-glow backdrop-blur-xl sm:p-6">
          <div className="rounded-[2rem] bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--accent)]">Register</p>
                <h2 className="mt-3 text-3xl font-semibold text-[var(--text)]">Create your account</h2>
              </div>
              <p className="text-sm text-[var(--muted)]">Set up your profile and get a personalized wellness plan from day one.</p>
            </div>

            <div className="mt-8 rounded-[2rem] bg-slate-50 p-3 shadow-sm">
              <div className="grid grid-cols-2 gap-2 rounded-full bg-white/80 p-1 text-sm font-semibold text-[var(--muted)]">
                <button className="rounded-full bg-transparent px-4 py-3 transition hover:bg-slate-100" type="button" onClick={() => router.push("/login")}>Login</button>
                <button className="rounded-full bg-[var(--text)] px-4 py-3 text-white">Register</button>
              </div>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--muted)]">Display name</span>
                <input
                  autoComplete="name"
                  className="w-full rounded-[1.75rem] border border-[var(--panel-border)] bg-white/95 px-5 py-3 text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
                {displayNameError ? <p className="mt-2 text-sm text-red-600">{displayNameError}</p> : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--muted)]">Email</span>
                <input
                  autoComplete="email"
                  className="w-full rounded-[1.75rem] border border-[var(--panel-border)] bg-white/95 px-5 py-3 text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                {emailError ? <p className="mt-2 text-sm text-red-600">{emailError}</p> : null}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--muted)]">Password</span>
                <div className="relative">
                  <input
                    autoComplete="new-password"
                    className="w-full rounded-[1.75rem] border border-[var(--panel-border)] bg-white/95 px-5 py-3 pr-12 text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-[var(--accent)] transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordError ? <p className="mt-2 text-sm text-red-600">{passwordError}</p> : null}
              </label>

              <div className="rounded-[1.75rem] border border-[var(--panel-border)] bg-slate-50 p-5 text-sm text-[var(--muted)]">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={consentDataStorage}
                    onChange={(event) => setConsentDataStorage(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  <span>Store my health data for the app experience.</span>
                </label>
                <label className="mt-4 flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={consentModelTraining}
                    onChange={(event) => setConsentModelTraining(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  <span>I consent to using my data for model improvement and training.</span>
                </label>
              </div>

              {error ? <p className="rounded-[1.75rem] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
              {message ? <p className="rounded-[1.75rem] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

              <button
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[var(--text)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? (
                  <div className="inline-flex items-center justify-center gap-2">
                    <Spinner size={16} className="text-white" />
                    Creating account...
                  </div>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <div className="mt-6 rounded-[1.75rem] bg-slate-50 p-5 text-center text-sm text-[var(--muted)] shadow-sm">
              Already have an account? <button type="button" className="font-semibold text-[var(--accent)]" onClick={() => router.push("/login")}>Sign in</button>
            </div>

            <div className="mt-6 border-t border-[var(--panel-border)] pt-6 text-sm text-[var(--muted)]">
              <div className="flex items-center gap-3 py-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                  <ShieldCheck size={18} />
                </span>
                <span>Your health data stays private and encrypted</span>
              </div>
              <div className="flex items-center gap-3 py-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Zap size={18} />
                </span>
                <span>Get personalized coaching in seconds</span>
              </div>
              <div className="flex items-center gap-3 py-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Users size={18} />
                </span>
                <span>Trusted by people building better daily habits</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
