"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarCheck,
  ClipboardList,
  LogOut,
  Menu,
  Plane,
  UserCircle,
} from "lucide-react";
import { logout } from "@/lib/auth";
import type { AuthUser, DashboardRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation: Array<{
  href: string;
  label: string;
  icon: React.ElementType;
  roles: DashboardRole[];
}> = [
  {
    href: "/admin/tenants",
    label: "Тенантууд",
    icon: Building2,
    roles: ["system_admin"],
  },
  {
    href: "/admin/tenant-requests",
    label: "Бүртгэлийн хүсэлтүүд",
    icon: ClipboardList,
    roles: ["system_admin"],
  },
  {
    href: "/dashboard",
    label: "Хянах самбар",
    icon: BarChart3,
    roles: ["tenant_admin", "system_admin"],
  },
  {
    href: "/tours",
    label: "Аяллууд",
    icon: Plane,
    roles: ["tenant_admin", "system_admin"],
  },
  {
    href: "/bookings",
    label: "Захиалгууд",
    icon: CalendarCheck,
    roles: ["tenant_admin", "system_admin"],
  },
  {
    href: "/profile",
    label: "Профайл",
    icon: UserCircle,
    roles: ["tenant_admin", "system_admin"],
  },
];

function getDisplayName(user: AuthUser) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return fullName || user.email;
}

function getRoleLabel(role: AuthUser["role"]) {
  if (role === "system_admin") return "System admin";
  if (role === "tenant_admin") return "Tenant admin";
  return role;
}

export function AppShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const dashboardRole: DashboardRole | null =
    user.role === "system_admin" || user.role === "tenant_admin"
      ? user.role
      : null;
  const items = dashboardRole
    ? navigation.filter((item) => item.roles.includes(dashboardRole))
    : [];

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-white md:flex md:flex-col">
        <div className="flex h-16 items-center border-b px-5">
          <div>
            <p className="text-lg font-semibold tracking-normal">Bolomj</p>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-primary/10 text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 border-t p-4">
          <div>
            <p className="truncate text-sm font-medium">{getDisplayName(user)}</p>
            <p className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</p>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Гарах
          </Button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <Menu className="h-5 w-5 text-muted-foreground md:hidden" />
            <div>
              <p className="text-sm font-semibold md:hidden">Bolomj Dashboard</p>
              <p className="hidden text-sm text-muted-foreground md:block">
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{getDisplayName(user)}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Гарах
            </Button>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b bg-white px-4 py-2 md:hidden">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground",
                  active && "bg-primary/10 text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
