import { toast, type ExternalToast } from "svelte-sonner";
import { formatToastCopyText } from "./toast-copy.js";

export { formatToastCopyText } from "./toast-copy.js";

export type ToastCopyOptions = Readonly<{
  /** コピー内容だけに含め、トースト画面には表示しない詳細情報。 */
  detail?: unknown;
  /** アイコンのみで表示するコピーボタンの、スクリーンリーダー向けラベル。 */
  label?: string;
}>;

type ToastPublisher = (title: string, options: ExternalToast) => string | number;

const COPY_FEEDBACK_DURATION = 2000;
const copyFeedbackTimers = new WeakMap<
  HTMLButtonElement,
  ReturnType<typeof setTimeout>
>();

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
  const copyLabel = copy?.label ?? "コピー";
  return {
    description: normalizeDescription(message),
    action: {
      label: copyLabel,
      onClick: (event) => {
        const actionButton = event.currentTarget;
        event.preventDefault();
        void copyText(copyTextValue)
          .then(() => {
            if (!actionButton.isConnected) return;
            actionButton.dataset.copied = "true";
            actionButton.setAttribute("aria-label", "コピーしました");
            actionButton.textContent = "コピーしました";

            const previousTimer = copyFeedbackTimers.get(actionButton);
            if (previousTimer !== undefined) clearTimeout(previousTimer);

            const feedbackTimer = setTimeout(() => {
              copyFeedbackTimers.delete(actionButton);
              if (!actionButton.isConnected) return;
              delete actionButton.dataset.copied;
              actionButton.removeAttribute("aria-label");
              actionButton.textContent = copyLabel;
            }, COPY_FEEDBACK_DURATION);
            copyFeedbackTimers.set(actionButton, feedbackTimer);
          })
          .catch(() => {
            toast.error("コピーできませんでした", {
              description: "ブラウザのクリップボード権限を確認してください。",
            });
          });
      },
    },
  };
}

function showCopyableToast(
  publish: ToastPublisher,
  title: string,
  message?: unknown,
  copy?: ToastCopyOptions
): void {
  publish(title, createToastOptions(title, message, copy));
}

export function showToast(
  title: string,
  message?: unknown,
  copy?: ToastCopyOptions
): void {
  showCopyableToast(toast, title, message, copy);
}

export function showInfoToast(
  title: string,
  message?: unknown,
  copy?: ToastCopyOptions
): void {
  showCopyableToast(toast.info, title, message, copy);
}

export function showSuccessToast(
  title: string,
  message?: unknown,
  copy?: ToastCopyOptions
): void {
  showCopyableToast(toast.success, title, message, copy);
}

export function showWarningToast(
  title: string,
  message?: unknown,
  copy?: ToastCopyOptions
): void {
  showCopyableToast(toast.warning, title, message, copy);
}

export function showErrorToast(
  title: string,
  message?: unknown,
  copy?: ToastCopyOptions
): void {
  showCopyableToast(toast.error, title, message, copy);
}
