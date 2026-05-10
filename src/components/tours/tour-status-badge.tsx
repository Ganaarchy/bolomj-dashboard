import { Badge } from "@/components/ui/badge";
import type { TourStatus } from "@/lib/types";

const statusMap: Record<
  TourStatus,
  { label: string; variant: "secondary" | "success" | "warning" }
> = {
  draft: { label: "Ноорог", variant: "warning" },
  published: { label: "Нийтэлсэн", variant: "success" },
  archived: { label: "Архивласан", variant: "secondary" },
};

export function TourStatusBadge({ status }: { status: TourStatus }) {
  const config = statusMap[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function MarketplaceBadge({ published }: { published: boolean }) {
  return published ? (
    <Badge variant="success">Marketplace</Badge>
  ) : (
    <Badge variant="secondary">Дотоод</Badge>
  );
}
