"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Save, Trash2, Upload, Video } from "lucide-react";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import type {
  CreateTourPayload,
  Tour,
  TourMedia,
  TourStatus,
  UpdateTourPayload,
} from "@/lib/types";
import { uploadFileToSpaces } from "@/lib/uploads";
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
  cover_image_url: string;
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
    cover_image_url: tour?.cover_image_url ?? "",
  };
}

function optionalString(value: string) {
  return value.trim() || undefined;
}

const IMAGE_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_UPLOAD_TYPES = ["video/mp4", "video/webm"];
const MAX_DETAIL_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DETAIL_VIDEO_SIZE = 50 * 1024 * 1024;

function bySortOrder(a: TourMedia, b: TourMedia) {
  return a.sortOrder - b.sortOrder;
}

export function TourForm({ tour }: { tour?: Tour }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialState(tour));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [tourMedia, setTourMedia] = useState<TourMedia[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [photosUploading, setPhotosUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [deletingMediaIds, setDeletingMediaIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mode = tour ? "edit" : "create";
  const isInvalidMarketplace = useMemo(
    () => form.published_to_marketplace && form.status !== "published",
    [form.published_to_marketplace, form.status],
  );
  const coverPreviewUrl = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : form.cover_image_url),
    [coverFile, form.cover_image_url],
  );
  const detailPhotos = useMemo(
    () => tourMedia.filter((media) => media.mediaType === "image").sort(bySortOrder),
    [tourMedia],
  );
  const detailVideo = useMemo(
    () => tourMedia.find((media) => media.mediaType === "video") ?? null,
    [tourMedia],
  );

  useEffect(() => {
    return () => {
      if (coverPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  useEffect(() => {
    if (!tour) return;

    let active = true;
    setMediaLoading(true);
    setMediaError(null);

    api
      .getTourMedia(tour.id)
      .then((media) => {
        if (active) setTourMedia(media);
      })
      .catch((err) => {
        if (active) setMediaError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setMediaLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tour]);

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
      cover_image_url: optionalString(form.cover_image_url),
    };
  }

  async function uploadCoverImage(file: File) {
    if (!IMAGE_UPLOAD_TYPES.includes(file.type)) {
      throw new Error("Cover image must be JPG, PNG, or WebP.");
    }

    const uploaded = await uploadFileToSpaces(file, "tours");

    setForm((current) => ({
      ...current,
      cover_image_url: uploaded.fileUrl,
    }));
    setCoverFile(null);

    return uploaded.fileUrl;
  }

  async function handleCoverFileChange(file: File | null) {
    setError(null);
    setCoverFile(file);

    if (!file) return;

    setCoverUploading(true);
    try {
      await uploadCoverImage(file);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleDetailPhotoFiles(files: FileList | null) {
    if (!tour || !files?.length) return;

    const selectedFiles = Array.from(files);

    for (const file of selectedFiles) {
      if (!IMAGE_UPLOAD_TYPES.includes(file.type)) {
        setMediaError(`${file.name}: JPG, PNG, эсвэл WebP зураг сонгоно уу.`);
        return;
      }

      if (file.size > MAX_DETAIL_IMAGE_SIZE) {
        setMediaError(`${file.name}: зураг 5MB-аас бага байх ёстой.`);
        return;
      }
    }

    setMediaError(null);
    setPhotosUploading(true);
    try {
      let nextSortOrder = detailPhotos.length;

      for (const file of selectedFiles) {
        const uploaded = await uploadFileToSpaces(file, "tours");
        const created = await api.createTourMedia(tour.id, {
          mediaType: "image",
          url: uploaded.fileUrl,
          caption: null,
          sortOrder: nextSortOrder,
        });

        nextSortOrder += 1;
        setTourMedia((current) => [...current, created]);
      }
    } catch (err) {
      setMediaError(getErrorMessage(err));
    } finally {
      setPhotosUploading(false);
    }
  }

  async function handleDetailVideoFile(file: File | null) {
    if (!tour || !file) return;

    if (!VIDEO_UPLOAD_TYPES.includes(file.type)) {
      setMediaError("MP4 эсвэл WebM видео сонгоно уу.");
      return;
    }

    if (file.size > MAX_DETAIL_VIDEO_SIZE) {
      setMediaError("Видео 50MB-аас бага байх ёстой.");
      return;
    }

    setMediaError(null);
    setVideoUploading(true);
    try {
      const uploaded = await uploadFileToSpaces(file, "tours");
      const saved = detailVideo
        ? await api.updateTourMedia(tour.id, detailVideo.id, {
            mediaType: "video",
            url: uploaded.fileUrl,
            caption: detailVideo.caption,
            sortOrder: 0,
          })
        : await api.createTourMedia(tour.id, {
            mediaType: "video",
            url: uploaded.fileUrl,
            caption: null,
            sortOrder: 0,
          });

      setTourMedia((current) => [
        ...current.filter((media) => media.id !== saved.id && media.mediaType !== "video"),
        saved,
      ]);
    } catch (err) {
      setMediaError(getErrorMessage(err));
    } finally {
      setVideoUploading(false);
    }
  }

  async function handleDeleteMedia(mediaId: string) {
    if (!tour) return;

    setMediaError(null);
    setDeletingMediaIds((current) => [...current, mediaId]);
    try {
      await api.deleteTourMedia(tour.id, mediaId);
      setTourMedia((current) => current.filter((media) => media.id !== mediaId));
    } catch (err) {
      setMediaError(getErrorMessage(err));
    } finally {
      setDeletingMediaIds((current) => current.filter((id) => id !== mediaId));
    }
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

    const user = getStoredUser();
    if (!user?.tenant_id) {
      setError(
        "Аялал үүсгэхэд tenant_admin эрхтэй, tenant холбогдсон хэрэглэгч шаардлагатай.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = toPayload();

      if (mode === "edit" && tour) {
        await api.updateTour(tour.id, payload);
      } else {
        await api.createTour(payload as CreateTourPayload);
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
          <CardTitle>Cover image</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="flex min-h-44 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
            {coverPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreviewUrl}
                alt="Tour cover preview"
                className="h-full max-h-56 w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
                No image selected
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cover_file">Upload banner image</Label>
              <Input
                id="cover_file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={coverUploading}
                onChange={(event) => {
                  void handleCoverFileChange(event.target.files?.[0] ?? null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG, or WebP. The image uploads immediately after selection.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover_image_url">Uploaded image URL</Label>
              <Input
                id="cover_image_url"
                type="url"
                value={form.cover_image_url}
                readOnly
                placeholder="Uploads fill this automatically"
              />
            </div>
            {coverUploading ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                Uploading image...
              </div>
            ) : coverFile ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                Uploaded: {coverFile.name}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {mode === "edit" && tour ? (
        <Card>
          <CardHeader>
            <CardTitle>Нэмэлт зургууд</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mediaError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {mediaError}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="detail_photos">Зураг нэмэх</Label>
              <Input
                id="detail_photos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                disabled={mediaLoading || photosUploading}
                onChange={(event) => {
                  const input = event.currentTarget;
                  void handleDetailPhotoFiles(input.files).finally(() => {
                    input.value = "";
                  });
                }}
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG, эсвэл WebP. Нэг зураг хамгийн ихдээ 5MB.
              </p>
            </div>
            {mediaLoading ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                Loading photos...
              </div>
            ) : null}
            {photosUploading ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                Uploading photos...
              </div>
            ) : null}
            {detailPhotos.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {detailPhotos.map((photo) => {
                  const deleting = deletingMediaIds.includes(photo.id);

                  return (
                    <div
                      key={photo.id}
                      className="overflow-hidden rounded-md border bg-muted/20"
                    >
                      <div className="aspect-video bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={photo.caption ?? "Tour detail photo"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-end p-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={deleting}
                          onClick={() => void handleDeleteMedia(photo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deleting ? "Deleting" : "Delete"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !mediaLoading ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                No detail photos uploaded.
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {mode === "edit" && tour ? (
        <Card>
          <CardHeader>
            <CardTitle>Богино танилцуулга видео</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="detail_video">
                {detailVideo ? "Видео солих" : "Видео нэмэх"}
              </Label>
              <Input
                id="detail_video"
                type="file"
                accept="video/mp4,video/webm"
                disabled={mediaLoading || videoUploading}
                onChange={(event) => {
                  const input = event.currentTarget;
                  void handleDetailVideoFile(input.files?.[0] ?? null).finally(
                    () => {
                      input.value = "";
                    },
                  );
                }}
              />
              <p className="text-xs text-muted-foreground">
                MP4 эсвэл WebM. Зөвлөмж: 50MB-аас бага богино видео.
              </p>
            </div>
            {videoUploading ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                Uploading video...
              </div>
            ) : null}
            {detailVideo ? (
              <div className="space-y-3">
                <video
                  src={detailVideo.url}
                  controls
                  className="max-h-96 w-full rounded-md border bg-black"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deletingMediaIds.includes(detailVideo.id)}
                    onClick={() => void handleDeleteMedia(detailVideo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingMediaIds.includes(detailVideo.id)
                      ? "Deleting"
                      : "Remove video"}
                  </Button>
                </div>
              </div>
            ) : !mediaLoading ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <Video className="h-4 w-4" />
                No detail video uploaded.
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

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
        <Button
          type="submit"
          disabled={submitting || coverUploading || isInvalidMarketplace}
        >
          <Save className="h-4 w-4" />
          {submitting ? "Хадгалж байна..." : "Хадгалах"}
        </Button>
      </div>
    </form>
  );
}
