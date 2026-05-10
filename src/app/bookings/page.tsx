"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { BookingStatus, TenantBooking } from "@/lib/types";
import { formatCurrency, formatDate, getErrorMessage } from "@/lib/utils";
import { SecureLayout } from "@/components/layout/secure-layout";
import { PageHeader } from "@/components/layout/page-header";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/ui/page-state";
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

function BookingsContent() {
  const [bookings, setBookings] = useState<TenantBooking[]>([]);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, BookingStatus>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
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
      setNoteDrafts(Object.fromEntries(data.map((booking) => [booking.id, ""])));
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
      setNoteDrafts((current) => ({ ...current, [id]: "" }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium">
                        {[booking.customer_first_name, booking.customer_last_name]
                          .filter(Boolean)
                          .join(" ")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {booking.customer_phone || "-"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {booking.customer_email}
                      </div>
                    </TableCell>
                    <TableCell>{booking.tour_title}</TableCell>
                    <TableCell>{booking.traveler_count}</TableCell>
                    <TableCell>{formatCurrency(booking.total_amount)}</TableCell>
                    <TableCell>{formatDate(booking.created_at)}</TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="min-w-56">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {booking.note || "Тэмдэглэлгүй"}
                        </p>
                        <Label htmlFor={`booking-note-${booking.id}`} className="sr-only">
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

export default function BookingsPage() {
  return (
    <SecureLayout roles={["tenant_admin", "system_admin"]}>
      <BookingsContent />
    </SecureLayout>
  );
}
