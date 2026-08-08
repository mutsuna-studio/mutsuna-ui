import { toast, type ExternalToast } from "svelte-sonner";
import { formatToastCopyText } from "./toast-copy.js";

export { formatToastCopyText } from "./toast-copy.js";

export type ToastCopyOptions = Readonly<{
  /** コピー内容だけに含め、トースト画面には表示しない詳細情報。 */
  detail?: unknown;
  /** コピーボタンのラベル。 */
  label?: string;
}>;

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

async function copyText(text: string): Promise<void> {
  if (
    typeof navigator === "undefined" ||
    navigator.clipboard?.writeText === undefined
  ) {
    throw new Error("Clipboard API is unavailable");
  }
  await navigator.clipboard.writeText(text);
}

function createToastOptions(
  title: string,
  message?: unknown,
  copy?: ToastCopyOptions
): ExternalToast {
  const copyTextValue = formatToastCopyText(title, message, copy?.detail);
  return {
    description: normalizeDescription(message),
    action: {
      label: copy?.label ?? "コピー",
      onClick: () => {
        void copyText(copyTextValue).catch(() => {
          toast.error("コピーできませんでした", {
            description: "ブラウザのクリップボード権限を確認してください。",
          });
        });
      },
    },
  };
}

export function showToast(
  title: string,
  message?: unknown,
  copy?: ToastCopyOptions
): void {
  toast(title, createToastOptions(title, message, copy));
}

export function showInfoToast(
  title: string,
  message?: unknown,
  copy?: ToastCopyOptions
): void {
  toast.info(title, createToastOptions(title, message, copy));
}

export function showSuccessToast(
  title: string,
  message?: unknown,
  copy?: ToastCopyOptions
): void {
  toast.success(title, createToastOptions(title, message, copy));
}

export function showWarningToast(
  title: string,
  message?: unknown,
  copy?: ToastCopyOptions
): void {
  toast.warning(title, createToastOptions(title, message, copy));
}

export function showErrorToast(
  title: string,
  message?: unknown,
  copy?: ToastCopyOptions
): void {
  toast.error(title, createToastOptions(title, message, copy));
}
