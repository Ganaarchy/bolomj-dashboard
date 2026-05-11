import { api } from "@/lib/api";
import type { CreatePresignedUploadPayload } from "@/lib/types";

const SUPPORTED_UPLOAD_TYPES: CreatePresignedUploadPayload["contentType"][] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
];

export async function uploadFileToSpaces(
  file: File,
  folder: CreatePresignedUploadPayload["folder"] = "tours",
): Promise<{
  key: string;
  fileUrl: string;
}> {
  if (
    !SUPPORTED_UPLOAD_TYPES.includes(
      file.type as CreatePresignedUploadPayload["contentType"],
    )
  ) {
    throw new Error("Unsupported file type.");
  }

  const presigned = await api.createPresignedUpload({
    folder,
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
    const text = await uploadRes.text();
    throw new Error(`Spaces upload failed: ${uploadRes.status} ${text}`);
  }

  return {
    key: presigned.key,
    fileUrl: presigned.fileUrl,
  };
}
