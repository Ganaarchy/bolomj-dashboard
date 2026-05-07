import type { AuthUser } from "@/lib/types";

const TOKEN_KEY = "bolomj_dashboard_token";
const USER_KEY = "bolomj_dashboard_user";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function setStoredUser(user: AuthUser) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    clearToken();
    return null;
  }
}

export function logout() {
  clearToken();
  window.location.href = "/login";
}

export function redirectByRole(role: AuthUser["role"]) {
  window.location.href = role === "system_admin" ? "/admin/tenants" : "/dashboard";
}
