"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { api } from "@/lib/api";
import type { CreateTourPayload, Tour, TourStatus, UpdateTourPayload } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  title: string;
  slug: string;
  description: string;
  destination_country: string;
  destination_city: string;
  duration_days: string;
  capacity: string;
  price: string;
  currency: string;
  start_date: string;
  end_date: string;
  meeting_point: string;
  includes_text: string;
  excludes_text: string;
  status: TourStatus;
  is_featured: boolean;
  published_to_marketplace: boolean;
};

function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function initialState(tour?: Tour): FormState {
  return {
    title: tour?.title ?? "",
    slug: tour?.slug ?? "",
    description: tour?.description ?? "",
    destination_country: tour?.destination_country ?? "",
    destination_city: tour?.destination_city ?? "",
    duration_days: String(tour?.duration_days ?? 1),
    capacity: tour?.capacity == null ? "" : String(tour.capacity),
    price: String(tour?.price ?? 0),
    currency: tour?.currency ?? "MNT",
    start_date: toDateInput(tour?.start_date),
    end_date: toDateInput(tour?.end_date),
    meeting_point: tour?.meeting_point ?? "",
    includes_text: tour?.includes_text ?? "",
    excludes_text: tour?.excludes_text ?? "",
    status: tour?.status ?? "draft",
    is_featured: tour?.is_featured ?? false,
    published_to_marketplace: tour?.published_to_marketplace ?? false,
  };
}

function optionalString(value: string) {
  return value.trim() || undefined;
}

export function TourForm({ tour }: { tour?: Tour }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialState(tour));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mode = tour ? "edit" : "create";
  const isInvalidMarketplace = useMemo(
    () => form.published_to_marketplace && form.status !== "published",
    [form.published_to_marketplace, form.status],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toPayload(): CreateTourPayload | UpdateTourPayload {
    return {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: optionalString(form.description),
      destination_country: optionalString(form.destination_country),
      destination_city: optionalString(form.destination_city),
      duration_days: Number(form.duration_days),
      capacity: form.capacity ? Number(form.capacity) : undefined,
      price: Number(form.price),
      currency: optionalString(form.currency) ?? "MNT",
      start_date: optionalString(form.start_date),
      end_date: optionalString(form.end_date),
      meeting_point: optionalString(form.meeting_point),
      includes_text: optionalString(form.includes_text),
      excludes_text: optionalString(form.excludes_text),
      status: form.status,
      is_featured: form.is_featured,
      published_to_marketplace: form.published_to_marketplace,
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isInvalidMarketplace) {
      setError("Marketplace дээр нийтлэх бол төлөв нь заавал нийтэлсэн байх ёстой.");
      return;
    }

    if (!form.title.trim() || !form.slug.trim()) {
      setError("Гарчиг болон slug заавал бөглөнө үү.");
      return;
    }

    if (Number(form.duration_days) < 1 || Number(form.price) < 0) {
      setError("Хугацаа болон үнэ зөв тоон утгатай байх ёстой.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "edit" && tour) {
        await api.updateTour(tour.id, toPayload());
      } else {
        await api.createTour(toPayload() as CreateTourPayload);
      }
      router.push("/tours");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Ерөнхий мэдээлэл</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Аяллын нэр</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(event) => update("slug", event.target.value)}
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Тайлбар</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination_country">Улс</Label>
            <Input
              id="destination_country"
              value={form.destination_country}
              onChange={(event) =>
                update("destination_country", event.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination_city">Хот</Label>
            <Input
              id="destination_city"
              value={form.destination_city}
              onChange={(event) => update("destination_city", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Хуваарь ба үнэ</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="duration_days">Өдөр</Label>
            <Input
              id="duration_days"
              type="number"
              min={1}
              value={form.duration_days}
              onChange={(event) => update("duration_days", event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Багтаамж</Label>
            <Input
              id="capacity"
              type="number"
              min={0}
              value={form.capacity}
              onChange={(event) => update("capacity", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Үнэ</Label>
            <Input
              id="price"
              type="number"
              min={0}
              value={form.price}
              onChange={(event) => update("price", event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Валют</Label>
            <Input
              id="currency"
              value={form.currency}
              onChange={(event) => update("currency", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_date">Эхлэх огноо</Label>
            <Input
              id="start_date"
              type="date"
              value={form.start_date}
              onChange={(event) => update("start_date", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">Дуусах огноо</Label>
            <Input
              id="end_date"
              type="date"
              value={form.end_date}
              onChange={(event) => update("end_date", event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="meeting_point">Уулзах цэг</Label>
            <Input
              id="meeting_point"
              value={form.meeting_point}
              onChange={(event) => update("meeting_point", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Нийтлэл ба нөхцөл</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="status">Төлөв</Label>
            <Select<TourStatus>
              id="status"
              value={form.status}
              onValueChange={(value) => update("status", value)}
              options={[
                { label: "Ноорог", value: "draft" },
                { label: "Нийтэлсэн", value: "published" },
                { label: "Архивласан", value: "archived" },
              ]}
            />
          </div>
          <div className="flex flex-col justify-end gap-3 rounded-md border bg-muted/30 p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={form.is_featured}
                onChange={(event) => update("is_featured", event.target.checked)}
              />
              Онцлох аялал
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={form.published_to_marketplace}
                onChange={(event) =>
                  update("published_to_marketplace", event.target.checked)
                }
              />
              Marketplace дээр нийтлэх
            </label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="includes_text">Багтсан зүйлс</Label>
            <Textarea
              id="includes_text"
              value={form.includes_text}
              onChange={(event) => update("includes_text", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excludes_text">Багтаагүй зүйлс</Label>
            <Textarea
              id="excludes_text"
              value={form.excludes_text}
              onChange={(event) => update("excludes_text", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/tours")}>
          Болих
        </Button>
        <Button type="submit" disabled={submitting || isInvalidMarketplace}>
          <Save className="h-4 w-4" />
          {submitting ? "Хадгалж байна..." : "Хадгалах"}
        </Button>
      </div>
    </form>
  );
}
