"use client";

import { SecureLayout } from "@/components/layout/secure-layout";
import { PageHeader } from "@/components/layout/page-header";
import { TourForm } from "@/components/tours/tour-form";

export default function NewTourPage() {
  return (
    <SecureLayout roles={["tenant_admin", "system_admin"]}>
      <PageHeader
        title="Шинэ аялал"
        description="Аяллын үндсэн мэдээлэл, үнэ, нийтлэлийн төлөвийг оруулна."
      />
      <TourForm />
    </SecureLayout>
  );
}
