"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  ImageIcon,
  Mail,
  Save,
  Shield,
  Upload,
  UserCircle,
} from "lucide-react";
import { ApiError, api } from "@/lib/api";
import type {
  AdminTenant,
  AuthUser,
  CreatePresignedUploadPayload,
  UpdateTenantAdminProfilePayload,
  UpdateTenantProfilePayload,
} from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";
import { SecureLayout } from "@/components/layout/secure-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/ui/page-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const emptyTenantForm: UpdateTenantProfilePayload = {
  name: "",
  slug: "",
  registration_number: "",
  email: "",
  phone: "",
  logo_url: "",
  banner_url: "",
  description: "",
  status: "pending",
};

function roleLabel(role: AuthUser["role"]) {
  if (role === "system_admin") return "System admin";
  if (role === "tenant_admin") return "Tenant admin";
  return role;
}

function displayName(user: AuthUser) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || "-";
}

function tenantToForm(tenant: AdminTenant): UpdateTenantProfilePayload {
  return {
    name: tenant.name,
    slug: tenant.slug,
    registration_number: tenant.registration_number ?? "",
    email: tenant.email ?? "",
    phone: tenant.phone ?? "",
    logo_url: tenant.logo_url ?? "",
    banner_url: tenant.banner_url ?? "",
    description: tenant.description ?? "",
    status: tenant.status,
  };
}

function compactTenantPayload(
  form: UpdateTenantProfilePayload,
): UpdateTenantProfilePayload {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    registration_number: form.registration_number?.trim() || null,
    email: form.email?.trim() || null,
    phone: form.phone?.trim() || null,
    logo_url: form.logo_url?.trim() || null,
    banner_url: form.banner_url?.trim() || null,
    description: form.description?.trim() || null,
    status: form.status,
  };
}

function compactTenantAdminProfilePayload(
  form: UpdateTenantProfilePayload,
): UpdateTenantAdminProfilePayload {
  return {
    phone: form.phone?.trim() || null,
    logo_url: form.logo_url?.trim() || null,
    banner_url: form.banner_url?.trim() || null,
    description: form.description?.trim() || null,
  };
}

function UserCard({ user }: { user: AuthUser }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-primary" />
          {displayName(user)}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border bg-muted/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-primary" />
            Имэйл
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="rounded-md border bg-muted/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4 text-primary" />
            Эрх
          </div>
          <p className="text-sm text-muted-foreground">{roleLabel(user.role)}</p>
        </div>
        {user.tenant_id ? (
          <div className="rounded-md border bg-muted/30 p-4 sm:col-span-2">
            <p className="mb-2 text-sm font-medium">Tenant ID</p>
            <p className="break-all text-sm text-muted-foreground">
              {user.tenant_id}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ProfileContent() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<AdminTenant | null>(null);
  const [form, setForm] =
    useState<UpdateTenantProfilePayload>(emptyTenantForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    setSuccess(null);
    try {
      const me = await api.me();
      setUser(me);

      if (me.role === "tenant_admin") {
        const tenantProfile = await api.tenantProfile();
        setTenant(tenantProfile);
        setForm(tenantToForm(tenantProfile));
      }
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

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function updateForm<K extends keyof UpdateTenantProfilePayload>(
    key: K,
    value: UpdateTenantProfilePayload[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadTenantImage(
    file: File,
    target: "logo_url" | "banner_url",
  ) {
    const allowedTypes: CreatePresignedUploadPayload["contentType"][] = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type as CreatePresignedUploadPayload["contentType"],
      )
    ) {
      throw new Error("Image must be JPG, PNG, or WebP.");
    }

    const presigned = await api.createPresignedUpload({
      folder: "tenants",
      fileName: file.name,
      contentType: file.type as CreatePresignedUploadPayload["contentType"],
    });

    const uploadRes = await fetch(presigned.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        "x-amz-acl": "public-read",
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error("Image upload failed.");
    }

    updateForm(target, presigned.fileUrl);
  }

  async function handleTenantImageChange(
    file: File | null,
    target: "logo_url" | "banner_url",
  ) {
    if (!file) return;

    setError(null);
    const setUploading =
      target === "logo_url" ? setUploadingLogo : setUploadingBanner;
    setUploading(true);
    try {
      await uploadTenantImage(file, target);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function saveTenant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // tenant_admin can only update editable profile fields; status is system_admin-only
      const payload =
        user?.role === "tenant_admin"
          ? compactTenantAdminProfilePayload(form)
          : compactTenantPayload(form);
      const updated = await api.updateTenantProfile(payload);
      setTenant(updated);
      setForm(tenantToForm(updated));
      setSuccess("Байгууллагын мэдээлэл шинэчлэгдлээ.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Профайл"
        description="Нэвтэрсэн хэрэглэгч болон байгууллагын мэдээлэл."
      />
      {loading ? <LoadingState /> : null}
      {forbidden ? <ForbiddenState /> : null}
      {error ? <ErrorState message={error} onRetry={loadProfile} /> : null}
      {success ? (
        <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}
      {user && !loading && !forbidden ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <UserCard user={user} />

          {user.role === "tenant_admin" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Байгууллагын мэдээлэл
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={saveTenant}>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-name">Name</Label>
                    <Input
                      id="tenant-name"
                      value={form.name}
                      readOnly
                      disabled
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-slug">Slug</Label>
                    <Input
                      id="tenant-slug"
                      value={form.slug}
                      readOnly
                      disabled
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-registration">Registration number</Label>
                    <Input
                      id="tenant-registration"
                      value={form.registration_number ?? ""}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-email">Email</Label>
                    <Input
                      id="tenant-email"
                      type="email"
                      value={form.email ?? ""}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-phone">Phone</Label>
                    <Input
                      id="tenant-phone"
                      value={form.phone ?? ""}
                      onChange={(event) => updateForm("phone", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-logo">Logo URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tenant-logo"
                        type="url"
                        value={form.logo_url ?? ""}
                        onChange={(event) =>
                          updateForm("logo_url", event.target.value)
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="relative shrink-0 overflow-hidden"
                        disabled={uploadingLogo}
                      >
                        <Upload className="h-4 w-4" />
                        {uploadingLogo ? "Uploading" : "Upload"}
                        <input
                          aria-label="Upload logo"
                          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploadingLogo}
                          onChange={(event) =>
                            handleTenantImageChange(
                              event.target.files?.[0] ?? null,
                              "logo_url",
                            )
                          }
                        />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant-banner">Banner URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tenant-banner"
                        type="url"
                        value={form.banner_url ?? ""}
                        onChange={(event) =>
                          updateForm("banner_url", event.target.value)
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="relative shrink-0 overflow-hidden"
                        disabled={uploadingBanner}
                      >
                        <ImageIcon className="h-4 w-4" />
                        {uploadingBanner ? "Uploading" : "Upload"}
                        <input
                          aria-label="Upload banner"
                          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploadingBanner}
                          onChange={(event) =>
                            handleTenantImageChange(
                              event.target.files?.[0] ?? null,
                              "banner_url",
                            )
                          }
                        />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="tenant-description">Description</Label>
                    <Textarea
                      id="tenant-description"
                      value={form.description ?? ""}
                      onChange={(event) =>
                        updateForm("description", event.target.value)
                      }
                    />
                  </div>
                  {tenant ? (
                    <p className="text-xs text-muted-foreground md:col-span-2">
                      Website subdomain: {tenant.website_subdomain || "-"}
                    </p>
                  ) : null}
                  <div className="flex justify-end md:col-span-2">
                    <Button
                      type="submit"
                      disabled={saving || uploadingLogo || uploadingBanner}
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Хадгалж байна..." : "Хадгалах"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export default function ProfilePage() {
  return (
    <SecureLayout roles={["tenant_admin", "system_admin"]}>
      <ProfileContent />
    </SecureLayout>
  );
}
