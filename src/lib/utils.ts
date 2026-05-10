import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function toNumber(value?: string | number | null) {
  if (value == null || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

export function formatCurrency(
  amount?: string | number | null,
  currency = "MNT",
) {
  const value = toNumber(amount);
  if (value == null) return "-";

  return new Intl.NumberFormat("mn-MN", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "MNT" ? 0 : 2,
  }).format(value);
}

export function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Алдаа гарлаа. Дахин оролдоно уу.";
}
