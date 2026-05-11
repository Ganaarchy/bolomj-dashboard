"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import type {
  BookingPassenger,
  BookingStatus,
  TenantBooking,
  TenantBookingDetail,
} from "@/lib/types";
import { cn, formatCurrency, formatDate, getErrorMessage } from "@/lib/utils";
import { SecureLayout } from "@/components/layout/secure-layout";
import { PageHeader } from "@/components/layout/page-header";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
} from "@/components/ui/page-state";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const bookingStatusOptions: Array<{ label: string; value: BookingStatus }> = [
  { label: "Хүлээгдэж буй", value: "pending" },
  { label: "Баталгаажсан", value: "confirmed" },
  { label: "Төлсөн", value: "paid" },
  { label: "Цуцалсан", value: "cancelled" },
  { label: "Дууссан", value: "completed" },
];

function bookingDisplayName(booking: TenantBooking) {
  const customerName = [
    booking.customer_first_name,
    booking.customer_last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    booking.primary_passenger_name ||
    customerName ||
    booking.customer_email ||
    "-"
  );
}

function getPassengerCount(booking: TenantBooking) {
  return Math.max(
    booking.passenger_count ?? 0,
    booking.traveler_count ?? 0,
    booking.passengers?.length ?? 0,
  );
}

function passengerCountLabel(count: number) {
  return `${count} хүн`;
}

function getPrimaryPassengerName(booking: TenantBooking) {
  const primaryName = booking.primary_passenger_name?.trim();
  if (primaryName) return primaryName;

  return (
    booking.passengers?.find((passenger) => passenger.is_primary)?.full_name ||
    null
  );
}

function hasCompletePassengerList(booking: TenantBooking) {
  if (!Array.isArray(booking.passengers)) return false;

  return booking.passengers.length >= getPassengerCount(booking);
}

function detailValue(value?: string | null) {
  return value?.trim() || "-";
}

function PassengerField({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm text-foreground">
        {detailValue(value)}
      </dd>
    </div>
  );
}

function PassengerDetailsPanel({
  passengers,
  loading,
  error,
}: {
  passengers: BookingPassenger[];
  loading: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-3 px-4 py-4">
      {loading ? (
        <div className="rounded-md border bg-background px-4 py-3 text-sm text-muted-foreground">
          Зорчигчдын мэдээлэл ачаалж байна...
        </div>
      ) : null}
      {!loading && error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {!loading && !error && passengers.length === 0 ? (
        <div className="rounded-md border bg-background px-4 py-3 text-sm text-muted-foreground">
          Зорчигчийн дэлгэрэнгүй мэдээлэл бүртгэгдээгүй байна.
        </div>
      ) : null}
      {!loading && !error && passengers.length > 0 ? (
        <div className="overflow-hidden rounded-md border bg-background">
          {passengers.map((passenger, index) => (
            <dl
              key={passenger.id}
              className={cn(
                "grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4",
                index > 0 && "border-t",
              )}
            >
              <div className="min-w-0 md:col-span-2 xl:col-span-1">
                <dt className="text-xs font-medium text-muted-foreground">
                  Овог нэр
                </dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2 break-words text-sm text-foreground">
                  <span>{detailValue(passenger.full_name)}</span>
                  {passenger.is_primary ? (
                    <Badge variant="success">Үндсэн зорчигч</Badge>
                  ) : null}
                </dd>
              </div>
              <PassengerField label="Утас" value={passenger.phone} />
              <PassengerField label="Email" value={passenger.email} />
              <PassengerField
                label="Пасспорт дугаар"
                value={passenger.passport_number}
              />
              <PassengerField
                label="Төрсөн огноо"
                value={formatDate(passenger.birth_date)}
              />
              <PassengerField label="Хүйс" value={passenger.gender} />
              <PassengerField
                label="Иргэншил"
                value={passenger.nationality}
              />
              <PassengerField
                label="Тэмдэглэл"
                value={passenger.notes}
                className="md:col-span-2"
              />
            </dl>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BookingsContent() {
  const [bookings, setBookings] = useState<TenantBooking[]>([]);
  const [statusDrafts, setStatusDrafts] = useState<
    Record<string, BookingStatus>
  >({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(
    null,
  );
  const [bookingDetails, setBookingDetails] = useState<
    Record<string, TenantBookingDetail>
  >({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const data = await api.bookings();
      setBookings(data);
      setStatusDrafts(
        Object.fromEntries(data.map((booking) => [booking.id, booking.status])),
      );
      setNoteDrafts(
        Object.fromEntries(data.map((booking) => [booking.id, ""])),
      );
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

  async function updateStatus(id: string) {
    const status = statusDrafts[id];
    if (!status) return;

    setUpdatingId(id);
    setError(null);
    try {
      const response = await api.updateBookingStatus(id, {
        status,
        note: noteDrafts[id]?.trim() || null,
      });
      setBookings((current) =>
        current.map((booking) =>
          booking.id === id ? { ...booking, ...response.booking } : booking,
        ),
      );
      setBookingDetails((current) => {
        const detail = current[id];
        if (!detail) return current;

        return {
          ...current,
          [id]: {
            ...detail,
            ...response.booking,
            passengers: detail.passengers,
          },
        };
      });
      setNoteDrafts((current) => ({ ...current, [id]: "" }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  async function toggleBookingDetail(booking: TenantBooking) {
    if (expandedBookingId === booking.id) {
      setExpandedBookingId(null);
      return;
    }

    setExpandedBookingId(booking.id);
    setDetailErrors((current) => {
      if (!current[booking.id]) return current;
      const next = { ...current };
      delete next[booking.id];
      return next;
    });

    if (hasCompletePassengerList(booking) || bookingDetails[booking.id]) {
      return;
    }

    setDetailLoadingId(booking.id);
    try {
      const detail = await api.booking(booking.id);
      setBookingDetails((current) => ({
        ...current,
        [booking.id]: detail,
      }));
      setBookings((current) =>
        current.map((item) =>
          item.id === booking.id
            ? { ...item, ...detail, passengers: detail.passengers }
            : item,
        ),
      );
    } catch (err) {
      setDetailErrors((current) => ({
        ...current,
        [booking.id]: getErrorMessage(err),
      }));
    } finally {
      setDetailLoadingId((current) =>
        current === booking.id ? null : current,
      );
    }
  }

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return (
    <>
      <PageHeader
        title="Захиалгууд"
        description="Хэрэглэгчийн захиалгын мэдээлэл болон төлөвийн шинэчлэлт."
      />
      {loading ? <LoadingState /> : null}
      {forbidden ? <ForbiddenState /> : null}
      {error ? <ErrorState message={error} onRetry={loadBookings} /> : null}
      {!loading && !forbidden && !error && bookings.length === 0 ? (
        <EmptyState
          title="Захиалга алга байна"
          description="Шинэ захиалга орж ирэхэд энд жагсаалтаар харагдана."
        />
      ) : null}
      {!loading && !forbidden && bookings.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Захиалагч</TableHead>
                  <TableHead>Аялал</TableHead>
                  <TableHead>Хүн</TableHead>
                  <TableHead>Дүн</TableHead>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Төлөв</TableHead>
                  <TableHead>Тэмдэглэл</TableHead>
                  <TableHead>Шинэчлэх</TableHead>
                  <TableHead>Дэлгэрэнгүй</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => {
                  const isExpanded = expandedBookingId === booking.id;
                  const passengerCount = getPassengerCount(booking);
                  const primaryPassengerName = getPrimaryPassengerName(booking);
                  const detail = bookingDetails[booking.id];
                  const passengers = detail?.passengers ?? booking.passengers ?? [];
                  const isDetailLoading = detailLoadingId === booking.id;

                  return (
                    <Fragment key={booking.id}>
                      <TableRow
                        className={cn(
                          isExpanded && "bg-muted/30 hover:bg-muted/30",
                        )}
                      >
                        <TableCell className="min-w-48 max-w-64">
                          <div className="break-words font-medium">
                            {bookingDisplayName(booking)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {booking.customer_phone || "-"}
                          </div>
                          <div className="break-all text-xs text-muted-foreground">
                            {booking.customer_email || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-48 max-w-64">
                          <div className="break-words">{booking.tour_title}</div>
                        </TableCell>
                        <TableCell className="min-w-40">
                          <div className="flex items-start gap-2">
                            <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <div className="font-medium leading-5">
                                {passengerCountLabel(passengerCount)}
                              </div>
                              {primaryPassengerName ? (
                                <div
                                  className="mt-0.5 max-w-40 truncate text-xs text-muted-foreground"
                                  title={primaryPassengerName}
                                >
                                  {primaryPassengerName}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-32">
                          {formatCurrency(booking.total_amount)}
                        </TableCell>
                        <TableCell className="min-w-32">
                          {formatDate(booking.created_at)}
                        </TableCell>
                        <TableCell className="min-w-32">
                          <BookingStatusBadge status={booking.status} />
                        </TableCell>
                        <TableCell className="min-w-56">
                          <div className="space-y-2">
                            <p className="max-w-56 break-words text-xs text-muted-foreground">
                              {booking.note || "Тэмдэглэлгүй"}
                            </p>
                            <Label
                              htmlFor={`booking-note-${booking.id}`}
                              className="sr-only"
                            >
                              Шинэ тэмдэглэл
                            </Label>
                            <Textarea
                              id={`booking-note-${booking.id}`}
                              value={noteDrafts[booking.id] ?? ""}
                              onChange={(event) =>
                                setNoteDrafts((current) => ({
                                  ...current,
                                  [booking.id]: event.target.value,
                                }))
                              }
                              placeholder="Шинэ тэмдэглэл"
                              className="min-h-20"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="min-w-48">
                          <div className="space-y-2">
                            <Select<BookingStatus>
                              value={statusDrafts[booking.id] ?? booking.status}
                              disabled={updatingId === booking.id}
                              onValueChange={(value) =>
                                setStatusDrafts((current) => ({
                                  ...current,
                                  [booking.id]: value,
                                }))
                              }
                              options={bookingStatusOptions}
                            />
                            <Button
                              size="sm"
                              className="w-full"
                              disabled={updatingId === booking.id}
                              onClick={() => updateStatus(booking.id)}
                            >
                              Хадгалах
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-40">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            disabled={isDetailLoading}
                            aria-expanded={isExpanded}
                            aria-controls={`booking-passengers-${booking.id}`}
                            onClick={() => toggleBookingDetail(booking)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            {isDetailLoading
                              ? "Ачаалж байна"
                              : isExpanded
                                ? "Хураах"
                                : "Дэлгэрэнгүй"}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            id={`booking-passengers-${booking.id}`}
                            colSpan={9}
                            className="bg-muted/20 p-0"
                          >
                            <PassengerDetailsPanel
                              passengers={passengers}
                              loading={isDetailLoading}
                              error={detailErrors[booking.id]}
                            />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

export default function BookingsPage() {
  return (
    <SecureLayout roles={["tenant_admin"]}>
      <BookingsContent />
    </SecureLayout>
  );
}
