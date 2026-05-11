"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import {
  clearAuth,
  dashboardHomeForRole,
  getStoredUser,
  getToken,
  isDashboardRole,
  setStoredUser,
} from "@/lib/auth";
import type { AuthUser, DashboardRole } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";
import { AppShell } from "@/components/layout/app-shell";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/ui/page-state";

export function SecureLayout({
  roles,
  children,
}: {
  roles: DashboardRole[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const dashboardRole = user && isDashboardRole(user.role) ? user.role : null;
  const isAllowed = dashboardRole ? roles.includes(dashboardRole) : false;
  const shouldRedirectSystemAdmin =
    dashboardRole === "system_admin" &&
    !isAllowed &&
    roles.includes("tenant_admin") &&
    !roles.includes("system_admin");

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      if (!getToken()) {
        window.location.href = "/login";
        return;
      }

      const cached = getStoredUser();
      if (cached && !isDashboardRole(cached.role)) {
        clearAuth();
        window.location.href = "/login";
        return;
      }

      if (cached && !cancelled) {
        setUser(cached);
        setLoading(false);
      }

      try {
        const me = await api.me();
        if (cancelled) return;
        if (!isDashboardRole(me.role)) {
          clearAuth();
          window.location.href = "/login";
          return;
        }
        setStoredUser(me);
        setUser(me);
        setError(null);
        setForbidden(false);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          setForbidden(true);
        } else {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (shouldRedirectSystemAdmin) {
      router.replace(dashboardHomeForRole("system_admin"));
    }
  }, [router, shouldRedirectSystemAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <LoadingState label="Эрх шалгаж байна..." />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen p-6">
        <ForbiddenState />
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

  if (shouldRedirectSystemAdmin) {
    return (
      <AppShell user={user}>
        <LoadingState label="Redirecting to platform admin..." />
      </AppShell>
    );
  }

  if (!isAllowed) {
    return (
      <AppShell user={user}>
        <ForbiddenState />
      </AppShell>
    );
  }

  return <AppShell user={user}>{children}</AppShell>;
}
