"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Plus, X } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import type { AdminTenant, AuthUser, CreateTenantPayload, TenantStatus } from "@/lib/types";
import { formatDate, getErrorMessage } from "@/lib/utils";
import { SecureLayout } from "@/components/layout/secure-layout";
import { PageHeader } from "@/components/layout/page-header";
import { TenantStatusBadge } from "@/components/admin/tenant-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/ui/page-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const tenantStatusOptions: Array<{ label: string; value: TenantStatus }> = [
  { label: "Хүлээгдэж буй", value: "pending" },
  { label: "Идэвхтэй", value: "active" },
  { label: "Түдгэлзсэн", value: "suspended" },
];

const emptyTenantForm: CreateTenantPayload = {
  name: "",
  slug: "",
  registration_number: "",
  email: "",
  phone: "",
  description: "",
  website_subdomain: "",
  admin_email: "",
  admin_password: "",
  admin_first_name: "",
  admin_last_name: "",
};

function compactPayload(form: CreateTenantPayload): CreateTenantPayload {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    registration_number: form.registration_number?.trim() || null,
    email: form.email?.trim() || null,
    phone: form.phone?.trim() || null,
    description: form.description?.trim() || null,
    website_subdomain: form.website_subdomain.trim(),
    admin_email: form.admin_email.trim(),
    admin_password: form.admin_password,
    admin_first_name: form.admin_first_name.trim(),
    admin_last_name: form.admin_last_name?.trim() || null,
  };
}

function adminName(user: AuthUser) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;
}

function TenantsContent() {
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [form, setForm] = useState<CreateTenantPayload>(emptyTenantForm);
  const [createdAdmin, setCreatedAdmin] = useState<AuthUser | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      setTenants(await api.tenants());
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function updateForm<K extends keyof CreateTenantPayload>(
    key: K,
    value: CreateTenantPayload[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function createTenant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setCreatedAdmin(null);
    try {
      const created = await api.createTenant(compactPayload(form));
      setTenants((current) => [created.tenant, ...current]);
      setCreatedAdmin(created.adminUser);
      setForm(emptyTenantForm);
      setShowCreate(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: TenantStatus) {
    setUpdatingId(id);
    setError(null);
    try {
      const updated = await api.updateTenantStatus(id, status);
      setTenants((current) =>
        current.map((tenant) => (tenant.id === id ? updated : tenant)),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  return (
    <>
      <PageHeader
        title="Тенантууд"
        description="Системийн tenant байгууллагуудыг бүртгэж, төлөвийг удирдана."
        action={
          <Button onClick={() => setShowCreate((value) => !value)}>
            {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreate ? "Хаах" : "Tenant үүсгэх"}
          </Button>
        }
      />

      {error ? <ErrorState message={error} onRetry={loadTenants} /> : null}
      {forbidden ? <ForbiddenState /> : null}

      {createdAdmin ? (
        <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Tenant үүссэн. Анхны tenant admin: {adminName(createdAdmin)} (
          {createdAdmin.email})
        </div>
      ) : null}

      {showCreate ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Шинэ tenant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={createTenant}>
              <div className="space-y-2">
                <Label htmlFor="name">Байгууллагын нэр</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(event) => updateForm("slug", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website_subdomain">Website subdomain</Label>
                <Input
                  id="website_subdomain"
                  value={form.website_subdomain}
                  onChange={(event) =>
                    updateForm("website_subdomain", event.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_number">Регистр</Label>
                <Input
                  id="registration_number"
                  value={form.registration_number ?? ""}
                  onChange={(event) =>
                    updateForm("registration_number", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Имэйл</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email ?? ""}
                  onChange={(event) => updateForm("email", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Утас</Label>
                <Input
                  id="phone"
                  value={form.phone ?? ""}
                  onChange={(event) => updateForm("phone", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin_email">Admin имэйл</Label>
                <Input
                  id="admin_email"
                  type="email"
                  value={form.admin_email}
                  onChange={(event) =>
                    updateForm("admin_email", event.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin_password">Admin нууц үг</Label>
                <Input
                  id="admin_password"
                  type="password"
                  value={form.admin_password}
                  onChange={(event) =>
                    updateForm("admin_password", event.target.value)
                  }
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin_first_name">Admin нэр</Label>
                <Input
                  id="admin_first_name"
                  value={form.admin_first_name}
                  onChange={(event) =>
                    updateForm("admin_first_name", event.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin_last_name">Admin овог</Label>
                <Input
                  id="admin_last_name"
                  value={form.admin_last_name ?? ""}
                  onChange={(event) =>
                    updateForm("admin_last_name", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Тайлбар</Label>
                <Textarea
                  id="description"
                  value={form.description ?? ""}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                />
              </div>
              <div className="flex justify-end gap-3 md:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                >
                  Болих
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Үүсгэж байна..." : "Үүсгэх"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {loading ? <LoadingState /> : null}
      {!loading && !forbidden && !error && tenants.length === 0 ? (
        <EmptyState
          title="Tenant бүртгэгдээгүй байна"
          description="Шинэ tenant үүсгээд platform-д байгууллага нэмнэ."
        />
      ) : null}
      {!loading && !forbidden && tenants.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Байгууллага</TableHead>
                  <TableHead>Холбоо барих</TableHead>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Төлөв</TableHead>
                  <TableHead>Шинэчлэх</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-xs text-muted-foreground">{tenant.slug}</div>
                    </TableCell>
                    <TableCell>
                      <div>{tenant.email || "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        {tenant.phone || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{tenant.website_subdomain || "-"}</TableCell>
                    <TableCell>
                      {tenant.marketplace_enabled ? "Идэвхтэй" : "Идэвхгүй"}
                    </TableCell>
                    <TableCell>{formatDate(tenant.created_at)}</TableCell>
                    <TableCell>
                      <TenantStatusBadge status={tenant.status} />
                    </TableCell>
                    <TableCell className="min-w-44">
                      <Select<TenantStatus>
                        value={tenant.status}
                        disabled={updatingId === tenant.id}
                        onValueChange={(value) => updateStatus(tenant.id, value)}
                        options={tenantStatusOptions}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

export default function AdminTenantsPage() {
  return (
    <SecureLayout roles={["system_admin"]}>
      <TenantsContent />
    </SecureLayout>
  );
}
