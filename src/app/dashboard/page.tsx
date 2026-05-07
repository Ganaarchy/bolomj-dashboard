"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CircleDollarSign, FileText, Plane } from "lucide-react";
import { api } from "@/lib/api";
import type { DashboardSummary } from "@/lib/types";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { SecureLayout } from "@/components/layout/secure-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/page-state";

const cards = [
  { key: "total_tours", label: "Нийт аялал", icon: Plane },
  { key: "published_tours", label: "Нийтэлсэн аялал", icon: FileText },
  { key: "draft_tours", label: "Ноорог аялал", icon: FileText },
  { key: "total_bookings", label: "Нийт захиалга", icon: CalendarClock },
  { key: "pending_bookings", label: "Хүлээгдэж буй", icon: CalendarClock },
] as const;

function DashboardContent() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await api.dashboardSummary());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <>
      <PageHeader
        title="Хянах самбар"
        description="Танай байгууллагын аялал, захиалга, борлуулалтын товч үзүүлэлт."
      />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={loadSummary} /> : null}
      {summary && !loading && !error ? (
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
                  <p className="text-3xl font-semibold">{summary[item.key]}</p>
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
                {formatCurrency(summary.total_sales)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}

export default function DashboardPage() {
  return (
    <SecureLayout roles={["tenant_admin"]}>
      <DashboardContent />
    </SecureLayout>
  );
}
