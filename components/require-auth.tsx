"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, initializing, hasProfile } = useAuth();

  useEffect(() => {
    if (initializing) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    // Signed in but no health details yet — force the setup flow.
    if (hasProfile === false) {
      router.replace("/setup");
    }
  }, [initializing, token, hasProfile, router]);

  if (initializing) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6 text-sm text-[var(--muted)]">
        Loading your account...
      </div>
    );
  }

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6 text-sm text-[var(--muted)]">
        Redirecting to login...
      </div>
    );
  }

  if (hasProfile === false) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6 text-sm text-[var(--muted)]">
        Let&rsquo;s set up your health profile first...
      </div>
    );
  }

  return <>{children}</>;
}
