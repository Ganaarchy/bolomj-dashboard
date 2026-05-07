export type UserRole = "tenant_admin" | "system_admin";

export type AuthUser = {
  id?: string;
  email: string;
  role: UserRole;
  tenant_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken?: string;
  token?: string;
  access_token?: string;
  jwt?: string;
  user?: AuthUser;
};

export type DashboardSummary = {
  total_tours: number;
  published_tours: number;
  draft_tours: number;
  total_bookings: number;
  pending_bookings: number;
  total_sales: number;
};

export type TourStatus = "draft" | "published" | "archived";

export type Tour = {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  description?: string | null;
  destination_country?: string | null;
  destination_city?: string | null;
  duration_days: number;
  capacity?: number | null;
  price: number;
  currency?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  meeting_point?: string | null;
  includes_text?: string | null;
  excludes_text?: string | null;
  status: TourStatus;
  is_featured: boolean;
  published_to_marketplace: boolean;
  created_at: string;
  updated_at: string;
};

export type TourPayload = {
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

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "paid"
  | "cancelled"
  | "completed";

export type Booking = {
  id: string;
  tenant_id: string;
  tour_id: string;
  user_id: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string;
  traveler_count: number;
  total_amount: number;
  status: BookingStatus;
  note?: string | null;
  created_at: string;
  updated_at: string;
  tour_title: string;
};

export type TenantStatus = "pending" | "active" | "suspended";

export type AdminTenant = {
  id: string;
  name: string;
  slug: string;
  registration_number?: string | null;
  email?: string | null;
  phone?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  description?: string | null;
  website_subdomain: string;
  marketplace_enabled: boolean;
  status: TenantStatus;
  created_at: string;
  updated_at: string;
};

export type CreateTenantPayload = {
  name: string;
  slug: string;
  registration_number?: string;
  email?: string;
  phone?: string;
  description?: string;
  website_subdomain: string;
  admin_email: string;
  admin_password: string;
  admin_first_name: string;
  admin_last_name?: string;
};
