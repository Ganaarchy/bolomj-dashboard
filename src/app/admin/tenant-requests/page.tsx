"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Eye, X } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import type { AdminTenantRequest } from "@/lib/types";
import { formatDate, getErrorMessage } from "@/lib/utils";
import { TenantRequestStatusBadge } from "@/components/admin/tenant-request-status-badge";
import { SecureLayout } from "@/components/layout/secure-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/ui/page-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function organizationName(request: AdminTenantRequest) {
  return (
    request.organization?.name ||
    request.organization_name ||
    request.tenant_name ||
    request.company_name ||
    request.name ||
    "-"
  );
}

function requestedSubdomain(request: AdminTenantRequest) {
  return (
    request.website_subdomain ||
    request.requested_website_subdomain ||
    request.requested_subdomain ||
    "-"
  );
}

function adminName(request: AdminTenantRequest) {
  return [request.admin_first_name, request.admin_last_name]
    .filter(Boolean)
    .join(" ");
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 border-b py-3 last:border-0">
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || "-"}</dd>
    </div>
  );
}

function TenantRequestsContent() {
  const [requests, setRequests] = useState<AdminTenantRequest[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<AdminTenantRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminTenantRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "pending"),
    [requests],
  );

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      setRequests(await api.tenantRequests());
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

  async function openDetails(request: AdminTenantRequest) {
    setSelectedRequest(request);
    setDetailLoading(true);
    setError(null);
    try {
      setSelectedRequest(await api.tenantRequest(request.id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  }

  function mergeRequest(updated: AdminTenantRequest) {
    setRequests((current) =>
      current.map((item) =>
        item.id === updated.id ? { ...item, ...updated } : item,
      ),
    );
    setSelectedRequest((current) =>
      current?.id === updated.id ? { ...current, ...updated } : current,
    );
  }

  async function approveRequest(request: AdminTenantRequest) {
    const confirmed = window.confirm(
      "Энэ байгууллагын хүсэлтийг баталгаажуулах уу?",
    );
    if (!confirmed) return;

    setMutatingId(request.id);
    setError(null);
    setSuccess(null);
    try {
      const approval = await api.approveTenantRequest(request.id);
      mergeRequest(approval.request);
      setSuccess("Байгууллага баталгаажиж tenant_admin эрх үүслээ.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setMutatingId(null);
    }
  }

  async function rejectRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rejectTarget) return;

    const reason = rejectReason.trim();
    setMutatingId(rejectTarget.id);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.rejectTenantRequest(
        rejectTarget.id,
        reason ? { rejection_reason: reason } : undefined,
      );
      mergeRequest(updated);
      setRejectTarget(null);
      setRejectReason("");
      setSuccess("Хүсэлт татгалзлаа.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setMutatingId(null);
    }
  }

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return (
    <>
      <PageHeader
        title="Бүртгэлийн хүсэлтүүд"
        description="Шинэ байгууллагын tenant бүртгэлийн хүсэлтүүдийг шалгаж баталгаажуулна."
      />

      {success ? (
        <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}
      {error ? <ErrorState message={error} onRetry={loadRequests} /> : null}
      {forbidden ? <ForbiddenState /> : null}
      {loading ? <LoadingState /> : null}

      {!loading && !forbidden && !error && pendingRequests.length === 0 ? (
        <EmptyState
          title="Хүлээгдэж буй хүсэлт алга"
          description="Шинэ tenant бүртгэлийн хүсэлт ирэхэд энд харагдана."
        />
      ) : null}

      {!loading && !forbidden && pendingRequests.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Байгууллага</TableHead>
                  <TableHead>Website subdomain</TableHead>
                  <TableHead>Admin имэйл</TableHead>
                  <TableHead>Төлөв</TableHead>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium">{organizationName(request)}</div>
                      <div className="text-xs text-muted-foreground">
                        {request.organization?.registration_number ||
                          request.registration_number ||
                          request.slug ||
                          "-"}
                      </div>
                    </TableCell>
                    <TableCell>{requestedSubdomain(request)}</TableCell>
                    <TableCell>{request.admin_email || "-"}</TableCell>
                    <TableCell>
                      <TenantRequestStatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>{formatDate(request.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openDetails(request)}
                        >
                          <Eye className="h-4 w-4" />
                          Дэлгэрэнгүй
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={mutatingId === request.id}
                          onClick={() => approveRequest(request)}
                        >
                          <Check className="h-4 w-4" />
                          Батлах
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={mutatingId === request.id}
                          onClick={() => {
                            setRejectTarget(request);
                            setRejectReason(request.rejection_reason || "");
                          }}
                        >
                          <X className="h-4 w-4" />
                          Татгалзах
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {selectedRequest ? (
        <div className="fixed inset-0 z-40 bg-black/30">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
            <div className="flex items-start justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-semibold">Хүсэлтийн дэлгэрэнгүй</h2>
                <p className="text-sm text-muted-foreground">
                  {organizationName(selectedRequest)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSelectedRequest(null)}
                aria-label="Close details"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {detailLoading ? (
                <LoadingState label="Дэлгэрэнгүй ачааллаж байна..." />
              ) : (
                <dl>
                  <DetailRow
                    label="Төлөв"
                    value={
                      <TenantRequestStatusBadge status={selectedRequest.status} />
                    }
                  />
                  <DetailRow
                    label="Байгууллагын нэр"
                    value={organizationName(selectedRequest)}
                  />
                  <DetailRow label="Slug" value={selectedRequest.slug} />
                  <DetailRow
                    label="Регистр"
                    value={
                      selectedRequest.organization?.registration_number ||
                      selectedRequest.registration_number
                    }
                  />
                  <DetailRow
                    label="Имэйл"
                    value={selectedRequest.organization?.email || selectedRequest.email}
                  />
                  <DetailRow
                    label="Утас"
                    value={selectedRequest.organization?.phone || selectedRequest.phone}
                  />
                  <DetailRow
                    label="Website subdomain"
                    value={requestedSubdomain(selectedRequest)}
                  />
                  <DetailRow
                    label="Admin имэйл"
                    value={selectedRequest.admin_email}
                  />
                  <DetailRow
                    label="Admin нэр"
                    value={adminName(selectedRequest)}
                  />
                  <DetailRow
                    label="Тайлбар"
                    value={
                      selectedRequest.organization?.description ||
                      selectedRequest.description
                    }
                  />
                  <DetailRow
                    label="Татгалзсан шалтгаан"
                    value={selectedRequest.rejection_reason}
                  />
                  <DetailRow
                    label="Үүссэн огноо"
                    value={formatDate(selectedRequest.created_at)}
                  />
                </dl>
              )}
            </div>
            {selectedRequest.status === "pending" ? (
              <div className="flex justify-end gap-2 border-t p-5">
                <Button
                  type="button"
                  variant="outline"
                  disabled={mutatingId === selectedRequest.id}
                  onClick={() => {
                    setRejectTarget(selectedRequest);
                    setRejectReason(selectedRequest.rejection_reason || "");
                  }}
                >
                  <X className="h-4 w-4" />
                  Татгалзах
                </Button>
                <Button
                  type="button"
                  disabled={mutatingId === selectedRequest.id}
                  onClick={() => approveRequest(selectedRequest)}
                >
                  <Check className="h-4 w-4" />
                  Батлах
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {rejectTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
            onSubmit={rejectRequest}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Хүсэлт татгалзах</h2>
                <p className="text-sm text-muted-foreground">
                  {organizationName(rejectTarget)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setRejectTarget(null)}
                aria-label="Close reject dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">Татгалзсан шалтгаан</Label>
              <Textarea
                id="rejection_reason"
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Backend дэмждэг бол шалтгаан хадгалагдана."
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectTarget(null)}
              >
                Болих
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={mutatingId === rejectTarget.id}
              >
                Татгалзах
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

export default function AdminTenantRequestsPage() {
  return (
    <SecureLayout roles={["system_admin"]}>
      <TenantRequestsContent />
    </SecureLayout>
  );
}
