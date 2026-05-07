import { Badge } from "@/components/ui/badge";
import type { TenantStatus } from "@/lib/types";

const statusMap: Record<
  TenantStatus,
  { label: string; variant: "secondary" | "success" | "warning" | "danger" }
> = {
  pending: { label: "Хүлээгдэж буй", variant: "warning" },
  active: { label: "Идэвхтэй", variant: "success" },
  suspended: { label: "Түдгэлзсэн", variant: "danger" },
};

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const config = statusMap[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
