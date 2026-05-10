import { Badge } from "@/components/ui/badge";
import type { TenantRequestStatus } from "@/lib/types";

const statusConfig: Record<
  TenantRequestStatus,
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  pending: { label: "Хүлээгдэж буй", variant: "warning" },
  approved: { label: "Баталгаажсан", variant: "success" },
  rejected: { label: "Татгалзсан", variant: "danger" },
};

export function TenantRequestStatusBadge({
  status,
}: {
  status: TenantRequestStatus;
}) {
  const config = statusConfig[status] ?? statusConfig.pending;

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
