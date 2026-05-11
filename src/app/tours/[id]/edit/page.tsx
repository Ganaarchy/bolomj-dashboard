"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import type { Tour } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";
import { SecureLayout } from "@/components/layout/secure-layout";
import { PageHeader } from "@/components/layout/page-header";
import { TourForm } from "@/components/tours/tour-form";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/ui/page-state";

function EditTourContent() {
  const params = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const loadTour = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      setTour(await api.tour(params.id));
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadTour();
  }, [loadTour]);

  return (
    <>
      <PageHeader
        title="Аялал засах"
        description="Нийтлэл, marketplace болон аяллын дэлгэрэнгүй мэдээллийг шинэчилнэ."
      />
      {loading ? <LoadingState /> : null}
      {forbidden ? <ForbiddenState /> : null}
      {error ? <ErrorState message={error} onRetry={loadTour} /> : null}
      {tour && !loading && !error && !forbidden ? <TourForm tour={tour} /> : null}
    </>
  );
}

export default function EditTourPage() {
  return (
    <SecureLayout roles={["tenant_admin"]}>
      <EditTourContent />
    </SecureLayout>
  );
}
