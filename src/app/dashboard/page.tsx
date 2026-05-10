"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CircleDollarSign, FileText, Plane } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import type { DashboardSummary } from "@/lib/types";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { SecureLayout } from "@/components/layout/secure-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/ui/page-state";

const cards = [
  { key: "total_tours", label: "Нийт аялал", icon: Plane },
  { key: "published_tours", label: "Нийтэлсэн аялал", icon: FileText },
  { key: "draft_tours", label: "Ноорог аялал", icon: FileText },
  { key: "total_bookings", label: "Нийт захиалга", icon: CalendarClock },
  { key: "pending_bookings", label: "Хүлээгдэж буй", icon: CalendarClock },
] as const;

const emptySummary: DashboardSummary = {
  total_tours: 0,
  published_tours: 0,
  draft_tours: 0,
  total_bookings: 0,
  pending_bookings: 0,
  total_sales: 0,
};

function DashboardContent() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      setSummary(await api.dashboardSummary());
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
    loadSummary();
  }, [loadSummary]);

  const currentSummary = summary ?? emptySummary;

  return (
    <>
      <PageHeader
        title="Хянах самбар"
        description="Аялал, захиалга, борлуулалтын товч үзүүлэлт."
      />
      {loading ? <LoadingState /> : null}
      {forbidden ? <ForbiddenState /> : null}
      {error ? <ErrorState message={error} onRetry={loadSummary} /> : null}
      {summary && !loading && !error && !forbidden ? (
        <div className="space-y-4">
          {Object.values(currentSummary).every((value) => Number(value) === 0) ? (
            <div className="rounded-md border bg-white p-4 text-sm text-muted-foreground">
              Tenant-тай холбоотой өгөгдөл одоогоор хоосон байна. System admin
              хэрэглэгч tenant_id-гүй бол tenant-scoped үзүүлэлт хоосон ирж болно.
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.key}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {item.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold">
                      {currentSummary[item.key]}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Нийт борлуулалт
                </CardTitle>
                <CircleDollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">
                  {formatCurrency(currentSummary.total_sales)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function DashboardPage() {
  return (
    <SecureLayout roles={["tenant_admin", "system_admin"]}>
      <DashboardContent />
    </SecureLayout>
  );
}
