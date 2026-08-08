function normalizeValue(
  value?: unknown,
  includeErrorStack = false
): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  if (value instanceof Error) {
    return includeErrorStack
      ? value.stack ?? `${value.name}: ${value.message}`
      : value.message;
  }

  try {
    return JSON.stringify(value, null, includeErrorStack ? 2 : undefined);
  } catch {
    return String(value);
  }
}

export function formatToastCopyText(
  title: string,
  message?: unknown,
  detail?: unknown
): string {
  const normalizedMessage = normalizeValue(message);
  const normalizedDetail = normalizeValue(detail, true);

  return [
    `タイトル: ${title}`,
    normalizedMessage === undefined
      ? undefined
      : `メッセージ: ${normalizedMessage}`,
    normalizedDetail === undefined
      ? undefined
      : `エラー詳細: ${normalizedDetail}`,
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
}
