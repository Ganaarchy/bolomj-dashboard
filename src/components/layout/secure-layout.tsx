"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getStoredUser, getToken, redirectByRole, setStoredUser } from "@/lib/auth";
import type { AuthUser, UserRole } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";
import { AppShell } from "@/components/layout/app-shell";
import { ErrorState, LoadingState } from "@/components/ui/page-state";

export function SecureLayout({
  roles,
  children,
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      if (!getToken()) {
        window.location.href = "/login";
        return;
      }

      const cached = getStoredUser();
      if (cached && !roles.includes(cached.role)) {
        redirectByRole(cached.role);
        return;
      }

      if (cached && !cancelled) {
        setUser(cached);
        setLoading(false);
      }

      try {
        const me = await api.me();
        if (cancelled) return;
        setStoredUser(me);
        if (!roles.includes(me.role)) {
          redirectByRole(me.role);
          return;
        }
        setUser(me);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [roles]);

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <LoadingState label="Эрх шалгаж байна..." />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen p-6">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!user) return null;

  return <AppShell user={user}>{children}</AppShell>;
}
