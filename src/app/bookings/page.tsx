"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Booking, BookingStatus } from "@/lib/types";
import { formatCurrency, formatDate, getErrorMessage } from "@/lib/utils";
import { SecureLayout } from "@/components/layout/secure-layout";
import { PageHeader } from "@/components/layout/page-header";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import { Select } from "@/components/ui/select";
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBookings(await api.bookings());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  async function updateStatus(id: string, status: BookingStatus) {
    setUpdatingId(id);
    setError(null);
    try {
      const updated = await api.updateBookingStatus(id, status);
      setBookings((current) =>
        current.map((booking) => (booking.id === id ? updated : booking)),
      );
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
      {error ? <ErrorState message={error} onRetry={loadBookings} /> : null}
      {!loading && !error && bookings.length === 0 ? (
        <EmptyState
          title="Захиалга алга байна"
          description="Шинэ захиалга орж ирэхэд энд жагсаалтаар харагдана."
        />
      ) : null}
      {!loading && bookings.length > 0 ? (
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
                  <TableHead>Шинэчлэх</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium">
                        {booking.customer_first_name} {booking.customer_last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {booking.customer_phone}
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
                    <TableCell className="min-w-44">
                      <Select<BookingStatus>
                        value={booking.status}
                        disabled={updatingId === booking.id}
                        onValueChange={(value) => updateStatus(booking.id, value)}
                        options={bookingStatusOptions}
                      />
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
    <SecureLayout roles={["tenant_admin"]}>
      <BookingsContent />
    </SecureLayout>
  );
}
