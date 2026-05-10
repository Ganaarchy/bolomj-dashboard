export type ApiDataResponse<T> = {
  data: T;
};

export type ApiErrorResponse = {
  message?: string;
  error?: string;
  errors?: unknown;
};

export type ApiResponse<T> = T | ApiDataResponse<T>;

export type UserRole = "guest" | "system_admin" | "tenant_admin" | "user";

export type DashboardRole = "system_admin" | "tenant_admin";

export type TourStatus = "draft" | "published" | "archived";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "paid"
  | "cancelled"
  | "completed";

export type TenantStatus = "pending" | "active" | "suspended";

export type AuthUser = {
  id: string;
  email: string;
  role: Exclude<UserRole, "guest">;
  tenant_id: string | null;
  first_name: string;
  last_name: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type DashboardSummary = {
  total_tours: number;
  published_tours: number;
  draft_tours: number;
  total_bookings: number;
  pending_bookings: number;
  total_sales: string | number;
};

export type Tour = {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  description: string | null;
  destination_country: string | null;
  destination_city: string | null;
  duration_days: number;
  capacity: number | null;
  price: string | number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  meeting_point: string | null;
  includes_text: string | null;
  excludes_text: string | null;
  status: TourStatus;
  is_featured: boolean;
  published_to_marketplace: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateTourPayload = {
  title: string;
  slug: string;
  description?: string;
  destination_country?: string;
  destination_city?: string;
  duration_days: number;
  capacity?: number;
  price: number;
  currency?: string;
  start_date?: string;
  end_date?: string;
  meeting_point?: string;
  includes_text?: string;
  excludes_text?: string;
  status?: TourStatus;
  is_featured?: boolean;
  published_to_marketplace?: boolean;
};

export type UpdateTourPayload = Partial<CreateTourPayload>;

export type Booking = {
  id: string;
  tenant_id: string;
  tour_id: string;
  user_id: string | null;
  customer_first_name: string;
  customer_last_name: string | null;
  customer_email: string;
  customer_phone: string | null;
  traveler_count: number;
  total_amount: string | number;
  status: BookingStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type TenantBooking = Booking & {
  tour_title: string;
};

export type UpdateBookingStatusPayload = {
  status: BookingStatus;
  note?: string | null;
};

export type BookingStatusUpdateResponse = {
  message: string;
  booking: TenantBooking;
};

export type AdminTenant = {
  id: string;
  name: string;
  slug: string;
  registration_number: string | null;
  email: string | null;
  phone: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  description: string | null;
  website_subdomain: string | null;
  marketplace_enabled: boolean;
  status: TenantStatus;
  created_at: string;
  updated_at: string;
};

export type CreateTenantPayload = {
  name: string;
  slug: string;
  registration_number?: string | null;
  email?: string | null;
  phone?: string | null;
  description?: string | null;
  website_subdomain: string;
  admin_email: string;
  admin_password: string;
  admin_first_name: string;
  admin_last_name?: string | null;
};

export type TenantStatusUpdatePayload = {
  status: TenantStatus;
};

export type CreateTenantResponse = {
  message: string;
  data: {
    tenant: AdminTenant;
    adminUser: AuthUser;
  };
};

export type TenantStatusUpdateResponse = {
  message: string;
  data: AdminTenant;
};

export const STORAGE_KEYS = {
  accessToken: "bolomj_access_token",
  user: "bolomj_user",
} as const;
