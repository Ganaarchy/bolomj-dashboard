import { AlertCircle, Loader2, Lock, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Ачааллаж байна..." }: { label?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed bg-white">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-white p-6 text-center">
      <AlertCircle className="mb-3 h-8 w-8 text-destructive" />
      <p className="text-sm font-medium">Алдаа гарлаа</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          Дахин оролдох
        </Button>
      ) : null}
    </div>
  );
}

export function ForbiddenState({
  message = "Энэ хэсэгт хандах эрх хүрэлцэхгүй байна.",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-white p-6 text-center">
      <Lock className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">Хандах эрхгүй</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-white p-6 text-center">
      <SearchX className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
