"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Tour } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";
import { SecureLayout } from "@/components/layout/secure-layout";
import { PageHeader } from "@/components/layout/page-header";
import { TourForm } from "@/components/tours/tour-form";
import { ErrorState, LoadingState } from "@/components/ui/page-state";

function EditTourContent() {
  const params = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTour = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTour(await api.tour(params.id));
    } catch (err) {
      setError(getErrorMessage(err));
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
      {error ? <ErrorState message={error} onRetry={loadTour} /> : null}
      {tour && !loading && !error ? <TourForm tour={tour} /> : null}
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
