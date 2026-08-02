export type FormActionToastStatus = "success" | "error";

export interface FormActionToast {
  readonly message: string;
  readonly status: FormActionToastStatus;
}

export function readFormActionToast(data: unknown): FormActionToast | undefined {
  if (data === null || typeof data !== "object" || !("status" in data) || !("message" in data)) {
    return undefined;
  }

  const { status, message } = data;
  if (typeof message !== "string") {
    return undefined;
  }

  return {
    message,
    status: status === "success" ? "success" : "error",
  };
}
