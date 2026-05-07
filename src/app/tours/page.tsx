"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Edit, Plus } from "lucide-react";
import { api } from "@/lib/api";
import type { Tour } from "@/lib/types";
import { formatCurrency, formatDate, getErrorMessage } from "@/lib/utils";
import { SecureLayout } from "@/components/layout/secure-layout";
import { PageHeader } from "@/components/layout/page-header";
import { MarketplaceBadge, TourStatusBadge } from "@/components/tours/tour-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function ToursContent() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTours = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTours(await api.tours());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  return (
    <>
      <PageHeader
        title="Аяллууд"
        description="Tenant-ийн аяллын жагсаалт, төлөв болон marketplace нийтлэлийг удирдана."
        action={
          <Button asChild>
            <Link href="/tours/new">
              <Plus className="h-4 w-4" />
              Шинэ аялал
            </Link>
          </Button>
        }
      />
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={loadTours} /> : null}
      {!loading && !error && tours.length === 0 ? (
        <EmptyState
          title="Аялал бүртгэгдээгүй байна"
          description="Эхний аяллаа үүсгээд dashboard дээрээс удирдаж эхэлнэ."
          action={
            <Button asChild>
              <Link href="/tours/new">Аялал үүсгэх</Link>
            </Button>
          }
        />
      ) : null}
      {!loading && !error && tours.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Нэр</TableHead>
                  <TableHead>Чиглэл</TableHead>
                  <TableHead>Үнэ</TableHead>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Төлөв</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead className="text-right">Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tours.map((tour) => (
                  <TableRow key={tour.id}>
                    <TableCell>
                      <div className="font-medium">{tour.title}</div>
                      <div className="text-xs text-muted-foreground">{tour.slug}</div>
                    </TableCell>
                    <TableCell>
                      {[tour.destination_city, tour.destination_country]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </TableCell>
                    <TableCell>{formatCurrency(tour.price, tour.currency ?? "MNT")}</TableCell>
                    <TableCell>{formatDate(tour.start_date)}</TableCell>
                    <TableCell>
                      <TourStatusBadge status={tour.status} />
                    </TableCell>
                    <TableCell>
                      <MarketplaceBadge published={tour.published_to_marketplace} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/tours/${tour.id}/edit`}>
                          <Edit className="h-4 w-4" />
                          Засах
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

export default function ToursPage() {
  return (
    <SecureLayout roles={["tenant_admin"]}>
      <ToursContent />
    </SecureLayout>
  );
}
