//app/login/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Spinner from "@/components/spinner";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { ui } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { token, login, hasProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      router.replace(hasProfile === false ? "/setup" : "/dashboard");
    }
  }, [token, hasProfile, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    setEmailError(null);
    setPasswordError(null);

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
    }

    if (hasError) {
      setSubmitting(false);
      return;
    }

    try {
      await login(normalizedEmail, normalizedPassword);
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message || "Unable to authenticate. Check your input and try again.");
      } else {
        setError("Unable to authenticate. Check your input and try again.");
      }
      setMessage(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      kicker="Login"
      title="Welcome back to HealthQuest."
      subtitle="Sign in to keep tracking your habits, badges, and daily progress."
      active="login"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--text)]">Email</span>
          <input
            autoComplete="email"
            className={ui.input}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {emailError ? <p className="mt-1.5 text-sm text-red-600">{emailError}</p> : null}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--text)]">Password</span>
          <div className="relative">
            <input
              autoComplete="current-password"
              className={`${ui.input} pr-11`}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {passwordError ? <p className="mt-1.5 text-sm text-red-600">{passwordError}</p> : null}
        </label>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:brightness-95"
          >
            <ArrowLeft size={14} />
            Forgot password?
          </button>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button className={`w-full ${ui.btnPrimary}`} disabled={submitting} type="submit">
          {submitting ? (
            <>
              <Spinner size={16} className="text-white" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[var(--muted)]">
        New to HealthQuest?{" "}
        <button
          type="button"
          className="font-semibold text-[var(--accent)]"
          onClick={() => router.push("/register")}
        >
          Create an account
        </button>
      </p>
    </AuthLayout>
  );
}
