export const IMAGE_UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const VIDEO_UPLOAD_MAX_SIZE_BYTES = 30 * 1024 * 1024;
export const OTHER_UPLOAD_MAX_SIZE_BYTES = 20 * 1024 * 1024;

export type UploadFileSizeKind = "image" | "video" | "other";

type UploadFileDescriptor = {
  name: string;
  size: number;
  type?: string | null;
};

const IMAGE_FILE_EXTENSIONS = new Set(["gif", "jpeg", "jpg", "png", "webp"]);
const VIDEO_FILE_EXTENSIONS = new Set(["avi", "mkv", "mov", "mp4", "webm"]);

export function getUploadFileSizeKind(
  file: Pick<UploadFileDescriptor, "name" | "type">,
): UploadFileSizeKind {
  const normalizedType = normalizeMimeType(file.type);

  if (normalizedType.startsWith("image/")) {
    return "image";
  }

  if (normalizedType.startsWith("video/")) {
    return "video";
  }

  const extension = getFileExtension(file.name);

  if (IMAGE_FILE_EXTENSIONS.has(extension)) {
    return "image";
  }

  if (VIDEO_FILE_EXTENSIONS.has(extension)) {
    return "video";
  }

  return "other";
}

export function getUploadFileSizeLimitBytes(
  file: Pick<UploadFileDescriptor, "name" | "type">,
) {
  const kind = getUploadFileSizeKind(file);

  if (kind === "image") {
    return IMAGE_UPLOAD_MAX_SIZE_BYTES;
  }

  if (kind === "video") {
    return VIDEO_UPLOAD_MAX_SIZE_BYTES;
  }

  return OTHER_UPLOAD_MAX_SIZE_BYTES;
}

export function exceedsUploadFileSizeLimit(file: UploadFileDescriptor) {
  const kind = getUploadFileSizeKind(file);
  const limitBytes = getUploadFileSizeLimitBytes(file);

  if (kind === "other") {
    return file.size > limitBytes;
  }

  return file.size >= limitBytes;
}

function normalizeMimeType(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex < 0 || lastDotIndex === fileName.length - 1) {
    return "";
  }

  return fileName.slice(lastDotIndex + 1).trim().toLowerCase();
}
