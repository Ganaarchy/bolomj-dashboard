import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/lib/types";

const statusMap: Record<
  BookingStatus,
  { label: string; variant: "secondary" | "success" | "warning" | "danger" | "default" }
> = {
  pending: { label: "Хүлээгдэж буй", variant: "warning" },
  confirmed: { label: "Баталгаажсан", variant: "default" },
  paid: { label: "Төлсөн", variant: "success" },
  cancelled: { label: "Цуцалсан", variant: "danger" },
  completed: { label: "Дууссан", variant: "secondary" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config = statusMap[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
