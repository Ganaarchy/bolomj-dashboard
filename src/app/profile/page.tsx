"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Shield, UserCircle } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import type { AuthUser } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";
import { SecureLayout } from "@/components/layout/secure-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/ui/page-state";

function roleLabel(role: AuthUser["role"]) {
  if (role === "system_admin") return "System admin";
  if (role === "tenant_admin") return "Tenant admin";
  return role;
}

function displayName(user: AuthUser) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || "-";
}

function ProfileContent() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      setUser(await api.me());
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <>
      <PageHeader
        title="Профайл"
        description="Нэвтэрсэн хэрэглэгчийн үндсэн мэдээлэл."
      />
      {loading ? <LoadingState /> : null}
      {forbidden ? <ForbiddenState /> : null}
      {error ? <ErrorState message={error} onRetry={loadProfile} /> : null}
      {user && !loading && !error && !forbidden ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              {displayName(user)}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-primary" />
                Имэйл
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="rounded-md border bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4 text-primary" />
                Эрх
              </div>
              <p className="text-sm text-muted-foreground">{roleLabel(user.role)}</p>
            </div>
            {user.tenant_id ? (
              <div className="rounded-md border bg-muted/30 p-4 sm:col-span-2">
                <p className="mb-2 text-sm font-medium">Tenant ID</p>
                <p className="break-all text-sm text-muted-foreground">
                  {user.tenant_id}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

export default function ProfilePage() {
  return (
    <SecureLayout roles={["tenant_admin", "system_admin"]}>
      <ProfileContent />
    </SecureLayout>
  );
}
