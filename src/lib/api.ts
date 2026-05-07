import { clearToken, getToken } from "@/lib/auth";
import type {
  AdminTenant,
  AuthUser,
  Booking,
  BookingStatus,
  CreateTenantPayload,
  DashboardSummary,
  LoginBody,
  LoginResponse,
  TenantStatus,
  Tour,
  TourPayload,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");
  if (options.body !== undefined)
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("Нэвтрэх эрх дууссан байна.", 401);
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : "Сервертэй холбогдоход алдаа гарлаа.";
    throw new ApiError(message, response.status);
  }

  return data as T;
}

function unwrapList<T>(data: T[] | { data: T[] }) {
  return Array.isArray(data) ? data : data.data;
}

export const api = {
  login(body: LoginBody) {
    return apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body,
    });
  },
  me() {
    return apiFetch<AuthUser>("/auth/me");
  },
  async dashboardSummary() {
    return apiFetch<DashboardSummary>("/tenant/dashboard/summary");
  },
  async tours() {
    const data = await apiFetch<Tour[] | { data: Tour[] }>("/tenant/tours");
    return unwrapList(data);
  },
  tour(id: string) {
    return apiFetch<Tour>(`/tenant/tours/${id}`);
  },
  createTour(body: TourPayload) {
    return apiFetch<Tour>("/tenant/tours", {
      method: "POST",
      body,
    });
  },
  updateTour(id: string, body: TourPayload) {
    return apiFetch<Tour>(`/tenant/tours/${id}`, {
      method: "PATCH",
      body,
    });
  },
  async bookings() {
    const data = await apiFetch<Booking[] | { data: Booking[] }>(
      "/tenant/bookings",
    );
    return unwrapList(data);
  },
  updateBookingStatus(id: string, status: BookingStatus) {
    return apiFetch<Booking>(`/tenant/bookings/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },
  async tenants() {
    const data = await apiFetch<AdminTenant[] | { data: AdminTenant[] }>(
      "/admin/tenants",
    );
    return unwrapList(data);
  },
  createTenant(body: CreateTenantPayload) {
    return apiFetch<AdminTenant>("/admin/tenants", {
      method: "POST",
      body,
    });
  },
  updateTenantStatus(id: string, status: TenantStatus) {
    return apiFetch<AdminTenant>(`/admin/tenants/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },
};
