import type { ActionResult, SubmitFunction } from "@sveltejs/kit";
import { applyAction } from "$app/forms";
import { showErrorToast, showSuccessToast } from "../sonner/toast.js";
import { type FormActionToastStatus, readFormActionToast } from "./form-action-toast-state.js";

type FormActionData = Record<string, unknown> | undefined;

export interface FormActionToastResultContext<Success extends FormActionData, Failure extends FormActionData> {
  readonly formElement: HTMLFormElement;
  readonly result: ActionResult<Success, Failure>;
  readonly toastStatus: FormActionToastStatus | undefined;
}

export interface FormActionToastEnhancerOptions<Success extends FormActionData, Failure extends FormActionData> {
  readonly applyRedirect?: boolean;
  readonly invalidateAll?: boolean;
  readonly onPendingChange?: (pending: boolean, formElement: HTMLFormElement) => void;
  readonly onResult?: (context: FormActionToastResultContext<Success, Failure>) => void | Promise<void>;
  readonly reset?: boolean;
}

export function showFormActionToast(data: unknown): FormActionToastStatus | undefined {
  const notification = readFormActionToast(data);
  if (notification === undefined) {
    return undefined;
  }

  if (notification.status === "success") {
    showSuccessToast(notification.message);
  } else {
    showErrorToast(notification.message);
  }

  return notification.status;
}

export function createFormActionToastEnhancer<
  Success extends FormActionData = Record<string, unknown>,
  Failure extends FormActionData = Record<string, unknown>,
>(options: FormActionToastEnhancerOptions<Success, Failure> = {}): SubmitFunction<Success, Failure> {
  return ({ formElement }) => {
    options.onPendingChange?.(true, formElement);

    return async ({ result, update }) => {
      try {
        if (result.type === "redirect" && options.applyRedirect !== false) {
          await applyAction(result);
          return;
        }

        await update({ reset: options.reset ?? false, invalidateAll: options.invalidateAll });
        const toastStatus = result.type === "success" || result.type === "failure" ? showFormActionToast(result.data) : undefined;
        await options.onResult?.({ formElement, result, toastStatus });
      } finally {
        options.onPendingChange?.(false, formElement);
      }
    };
  };
}
