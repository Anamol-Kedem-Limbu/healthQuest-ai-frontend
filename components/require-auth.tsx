"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, initializing } = useAuth();

  useEffect(() => {
    if (!initializing && !token) {
      router.replace("/login");
    }
  }, [initializing, token, router]);

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

  return <>{children}</>;
}
