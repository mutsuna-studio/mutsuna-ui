import { toast } from "svelte-sonner";

function normalizeDescription(description?: unknown): string | undefined {
  if (description == null) return undefined;
  if (typeof description === "string") return description;
  if (description instanceof Error) return description.message;

  try {
    return JSON.stringify(description);
  } catch {
    return String(description);
  }
}

export function showToast(message: string, description?: unknown) {
  toast(message, { description: normalizeDescription(description) });
}

export function showInfoToast(message: string, description?: unknown) {
  toast.info(message, { description: normalizeDescription(description) });
}

export function showSuccessToast(message: string, description?: unknown) {
  toast.success(message, { description: normalizeDescription(description) });
}

export function showWarningToast(message: string, description?: unknown) {
  toast.warning(message, { description: normalizeDescription(description) });
}

export function showErrorToast(message: string, description?: unknown) {
  toast.error(message, { description: normalizeDescription(description) });
}
