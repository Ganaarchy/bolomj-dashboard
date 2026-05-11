import { clearAuth, getToken } from "@/lib/auth";
import type {
  AdminTenant,
  AdminTenantRequest,
  ApiDataResponse,
  ApiErrorResponse,
  AuthUser,
  CreatePresignedUploadPayload,
  BookingStatusUpdateResponse,
  CreateTenantPayload,
  CreateTourPayload,
  DashboardSummary,
  LoginPayload,
  LoginResponse,
  PresignedUploadResponse,
  TenantBooking,
  TenantRequestApprovalResponse,
  TenantRequestRejectPayload,
  TenantStatus,
  Tour,
  UpdateBookingStatusPayload,
  UpdateTourPayload,
} from "@/lib/types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend"
)
  .replace(/\/+$/, "")
  .replace(/\/uploads$/, "");

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function joinUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function unwrapApiResponse<T>(payload: T | ApiDataResponse<T>): T {
  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "data" in payload
  ) {
    return (payload as ApiDataResponse<T>).data;
  }

  return payload as T;
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function errorMessage(payload: unknown) {
  if (payload && typeof payload === "object") {
    const error = payload as ApiErrorResponse;
    if (typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
    if (typeof error.error === "string" && error.error.trim()) {
      return error.error;
    }
  }

  return "Сервертэй холбогдоход алдаа гарлаа.";
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, auth = true, ...requestOptions } = options;
  const token = auth ? getToken() : null;
  const headers = new Headers(requestOptions.headers);

  headers.set("Accept", "application/json");
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(joinUrl(path), {
    ...requestOptions,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseResponse(response);

  if (response.status === 401) {
    clearAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("Нэвтрэх эрх дууссан байна.", 401, payload);
  }

  if (!response.ok) {
    throw new ApiError(errorMessage(payload), response.status, payload);
  }

  return unwrapApiResponse<T>(payload as T | ApiDataResponse<T>);
}

export const api = {
  login(body: LoginPayload) {
    return apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body,
      auth: false,
    });
  },
  me() {
    return apiFetch<AuthUser>("/auth/me");
  },
  dashboardSummary() {
    return apiFetch<DashboardSummary>("/tenant/dashboard/summary");
  },
  tours() {
    return apiFetch<Tour[]>("/tenant/tours");
  },
  tour(id: string) {
    return apiFetch<Tour>(`/tenant/tours/${id}`);
  },
  createTour(body: CreateTourPayload) {
    return apiFetch<Partial<Tour>>("/tenant/tours", {
      method: "POST",
      body,
    });
  },
  updateTour(id: string, body: UpdateTourPayload) {
    return apiFetch<Partial<Tour>>(`/tenant/tours/${id}`, {
      method: "PATCH",
      body,
    });
  },
  bookings() {
    return apiFetch<TenantBooking[]>("/tenant/bookings");
  },
  updateBookingStatus(id: string, body: UpdateBookingStatusPayload) {
    return apiFetch<BookingStatusUpdateResponse>(
      `/tenant/bookings/${id}/status`,
      {
        method: "PATCH",
        body,
      },
    );
  },
  tenants() {
    return apiFetch<AdminTenant[]>("/admin/tenants");
  },
  createTenant(body: CreateTenantPayload) {
    return apiFetch<{ tenant: AdminTenant; adminUser: AuthUser }>(
      "/admin/tenants",
      {
      method: "POST",
      body,
      },
    );
  },
  updateTenantStatus(id: string, status: TenantStatus) {
    return apiFetch<AdminTenant>(`/admin/tenants/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },
  tenantRequests() {
    return apiFetch<AdminTenantRequest[]>("/admin/tenant-requests");
  },
  tenantRequest(id: string) {
    return apiFetch<AdminTenantRequest>(`/admin/tenant-requests/${id}`);
  },
  approveTenantRequest(id: string) {
    return apiFetch<TenantRequestApprovalResponse>(
      `/admin/tenant-requests/${id}/approve`,
      {
        method: "PATCH",
      },
    );
  },
  rejectTenantRequest(id: string, body?: TenantRequestRejectPayload) {
    return apiFetch<AdminTenantRequest>(`/admin/tenant-requests/${id}/reject`, {
      method: "PATCH",
      body,
    });
  },
  createPresignedUpload(body: CreatePresignedUploadPayload) {
    return apiFetch<PresignedUploadResponse>("/uploads/presigned-url", {
      method: "POST",
      body,
    });
  },
};
