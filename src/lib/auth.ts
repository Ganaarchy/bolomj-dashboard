import { STORAGE_KEYS, type AuthUser } from "@/lib/types";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEYS.accessToken);
}

export function setToken(token: string) {
  window.localStorage.setItem(STORAGE_KEYS.accessToken, token);
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEYS.accessToken);
  window.localStorage.removeItem(STORAGE_KEYS.user);
}

export function setStoredUser(user: AuthUser) {
  window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEYS.user);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    clearAuth();
    return null;
  }
}

export function logout() {
  clearAuth();
  window.location.href = "/login";
}

export function dashboardHomeForRole(role: AuthUser["role"]) {
  if (role === "system_admin") return "/admin/tenants";
  if (role === "tenant_admin") return "/dashboard";
  return "/login";
}

export function redirectByRole(role: AuthUser["role"]) {
  window.location.href = dashboardHomeForRole(role);
}
