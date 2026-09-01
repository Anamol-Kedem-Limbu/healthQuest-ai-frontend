//app/register/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Spinner from "@/components/spinner";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { ui } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const { token, register, login, hasProfile } = useAuth();
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
    <AuthLayout
      kicker="Register"
      title="Start your healthiest streak yet."
      subtitle="Create an account and take control of your wellness with goals, AI coaching, and badges."
      active="register"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--text)]">Display name</span>
          <input
            autoComplete="name"
            className={ui.input}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
          {displayNameError ? (
            <p className="mt-1.5 text-sm text-red-600">{displayNameError}</p>
          ) : null}
        </label>

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
              autoComplete="new-password"
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

        <div className={`${ui.subtle} p-4 text-sm text-[var(--muted)]`}>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={consentDataStorage}
              onChange={(event) => setConsentDataStorage(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[var(--panel-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            <span>Store my health data for the app experience.</span>
          </label>
          <label className="mt-3 flex items-start gap-3">
            <input
              type="checkbox"
              checked={consentModelTraining}
              onChange={(event) => setConsentModelTraining(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[var(--panel-border)] text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            <span>I consent to using my data for model improvement and training.</span>
          </label>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}

        <button className={`w-full ${ui.btnPrimary}`} disabled={submitting} type="submit">
          {submitting ? (
            <>
              <Spinner size={16} className="text-white" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <button
          type="button"
          className="font-semibold text-[var(--accent)]"
          onClick={() => router.push("/login")}
        >
          Sign in
        </button>
      </p>
    </AuthLayout>
  );
}
