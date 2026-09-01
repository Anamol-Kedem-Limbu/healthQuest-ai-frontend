"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      // Placeholder action: at present, there is no backend reset endpoint.
      await new Promise((resolve) => setTimeout(resolve, 500));
      setMessage("If this email is registered, you will receive instructions to reset your password.");
    } catch (caughtError) {
      setError("Unable to send reset instructions right now. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.15),_transparent_23%),linear-gradient(180deg,_#fdfdfd_0%,_#f7f9fb_100%)] py-12">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-[var(--panel-border)] bg-white/95 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-10">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:text-[var(--text)]"
          >
            <ArrowLeft size={18} />
            Back to login
          </button>

          <div className="mt-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <Mail size={22} />
            </div>
            <h1 className="mt-6 text-4xl font-semibold text-[var(--text)]">Forgot password</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Enter your email and we’ll send reset instructions if your account exists.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--muted)]">Email</span>
              <input
                className="w-full rounded-[1.75rem] border border-[var(--panel-border)] bg-white/95 px-5 py-3 text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            {error ? <p className="rounded-[1.75rem] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            {message ? <p className="rounded-[1.75rem] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

            <button
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[var(--text)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner size={16} className="text-white" />
                  <span>Sending...</span>
                </>
              ) : (
                "Send reset instructions"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
