export function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export const normalizeNullableString = normalizeOptionalString;

export function normalizeSearchText(value: string | null | undefined) {
  return (normalizeOptionalString(value) ?? "").toLowerCase().replace(/\s+/g, " ");
}

export function normalizeInteger(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  }

  return fallback;
}

export function normalizeOptionalInteger(value: unknown) {
  const parsed = normalizeInteger(value, NaN);
  return Number.isInteger(parsed) ? parsed : null;
}

export function normalizePositiveInteger(value: unknown, fallback: number) {
  const parsed = normalizeInteger(value, NaN);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function normalizeNumericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function normalizeNonnegativeNumber(value: unknown) {
  const parsed = normalizeNumericValue(value);
  return parsed !== null && parsed >= 0 ? parsed : 0;
}

export function normalizeOptionalNonnegativeNumber(value: unknown) {
  const parsed = normalizeNumericValue(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
}

export function sanitizeStorageFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-");
}

export function getFileExtension(fileName: string) {
  const normalizedName = fileName.trim().toLowerCase();
  const extensionIndex = normalizedName.lastIndexOf(".");

  if (extensionIndex < 0 || extensionIndex === normalizedName.length - 1) {
    return null;
  }

  return normalizedName.slice(extensionIndex + 1);
}
