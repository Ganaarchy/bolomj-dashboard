"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Edit, ImageIcon, Plus, Rocket, Search } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import type { Tour, TourStatus } from "@/lib/types";
import { formatCurrency, formatDate, getErrorMessage } from "@/lib/utils";
import { SecureLayout } from "@/components/layout/secure-layout";
import { PageHeader } from "@/components/layout/page-header";
import { MarketplaceBadge, TourStatusBadge } from "@/components/tours/tour-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/ui/page-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type StatusFilter = "all" | TourStatus;
type MarketplaceFilter = "all" | "published" | "internal";

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: "Бүх төлөв", value: "all" },
  { label: "Ноорог", value: "draft" },
  { label: "Нийтэлсэн", value: "published" },
  { label: "Архивласан", value: "archived" },
];

const marketplaceOptions: Array<{ label: string; value: MarketplaceFilter }> = [
  { label: "Бүх нийтлэл", value: "all" },
  { label: "Marketplace", value: "published" },
  { label: "Дотоод", value: "internal" },
];

function ToursContent() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [marketplaceFilter, setMarketplaceFilter] =
    useState<MarketplaceFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadTours = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      setTours(await api.tours());
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

  async function updateTourStatus(tour: Tour, status: TourStatus) {
    setUpdatingId(tour.id);
    setError(null);
    try {
      const updated = await api.updateTour(tour.id, {
        status,
        published_to_marketplace:
          status === "published" ? tour.published_to_marketplace : false,
      });
      setTours((current) =>
        current.map((item) =>
          item.id === tour.id ? { ...item, ...updated } : item,
        ),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredTours = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tours.filter((tour) => {
      const matchesSearch = query
        ? tour.title.toLowerCase().includes(query)
        : true;
      const matchesStatus =
        statusFilter === "all" ? true : tour.status === statusFilter;
      const matchesMarketplace =
        marketplaceFilter === "all"
          ? true
          : marketplaceFilter === "published"
            ? tour.published_to_marketplace
            : !tour.published_to_marketplace;

      return matchesSearch && matchesStatus && matchesMarketplace;
    });
  }, [marketplaceFilter, search, statusFilter, tours]);

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
      {forbidden ? <ForbiddenState /> : null}
      {error ? <ErrorState message={error} onRetry={loadTours} /> : null}
      {!loading && !forbidden && !error ? (
        <div className="mb-4 grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-[1fr_180px_180px]">
          <div className="space-y-2">
            <Label htmlFor="tour-search">Хайх</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="tour-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Аяллын нэрээр хайх"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-filter">Төлөв</Label>
            <Select<StatusFilter>
              id="status-filter"
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={statusOptions}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="marketplace-filter">Marketplace</Label>
            <Select<MarketplaceFilter>
              id="marketplace-filter"
              value={marketplaceFilter}
              onValueChange={setMarketplaceFilter}
              options={marketplaceOptions}
            />
          </div>
        </div>
      ) : null}
      {!loading && !forbidden && !error && tours.length === 0 ? (
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
      {!loading && !forbidden && !error && tours.length > 0 && filteredTours.length === 0 ? (
        <EmptyState
          title="Шүүлтэд тохирох аялал олдсонгүй"
          description="Хайлтын үг эсвэл шүүлтүүрээ өөрчилнө үү."
        />
      ) : null}
      {!loading && !forbidden && !error && filteredTours.length > 0 ? (
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
                {filteredTours.map((tour) => (
                  <TableRow key={tour.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
                          {tour.cover_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={tour.cover_image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{tour.title}</div>
                          <div className="text-xs text-muted-foreground">{tour.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {[tour.destination_city, tour.destination_country]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </TableCell>
                    <TableCell>{formatCurrency(tour.price, tour.currency)}</TableCell>
                    <TableCell>{formatDate(tour.start_date)}</TableCell>
                    <TableCell>
                      <TourStatusBadge status={tour.status} />
                    </TableCell>
                    <TableCell>
                      <MarketplaceBadge published={tour.published_to_marketplace} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {tour.status !== "published" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingId === tour.id}
                            onClick={() => updateTourStatus(tour, "published")}
                          >
                            <Rocket className="h-4 w-4" />
                            Нийтлэх
                          </Button>
                        ) : null}
                        {tour.status !== "archived" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingId === tour.id}
                            onClick={() => updateTourStatus(tour, "archived")}
                          >
                            <Archive className="h-4 w-4" />
                            Архивлах
                          </Button>
                        ) : null}
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/tours/${tour.id}/edit`}>
                            <Edit className="h-4 w-4" />
                            Засах
                          </Link>
                        </Button>
                      </div>
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
    <SecureLayout roles={["tenant_admin", "system_admin"]}>
      <ToursContent />
    </SecureLayout>
  );
}
