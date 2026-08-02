export function toIso(dateValue: string, timeValue: string): string {
  if (!dateValue || !timeValue) return "";
  const date = new Date(`${dateValue}T${timeValue}`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

export function toLocalDate(dateValue: string, timeValue: string): Date | null {
  if (!dateValue || !timeValue) return null;
  const date = new Date(`${dateValue}T${timeValue}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toTimeKey(value: Date): string {
  const hour = String(value.getHours()).padStart(2, "0");
  const minute = String(value.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

export function createDefaultFutureDateTimeRange(now = new Date(), minuteStep = 15): { readonly startsAt: Date; readonly endsAt: Date } {
  const stepMs = minuteStep * 60_000;
  const startsAt = new Date(Math.floor(now.getTime() / stepMs) * stepMs + stepMs);
  const endsAt = createDefaultEndDate(startsAt);
  return { startsAt, endsAt };
}

export function readMinimumFutureTime(dateValue: string, now = new Date(), minuteStep = 15): string | undefined {
  if (dateValue !== toDateKey(now)) return undefined;
  return toTimeKey(createDefaultFutureDateTimeRange(now, minuteStep).startsAt);
}

export function readMinimumFutureTimeInTimeZone(dateValue: string, timeZone: string, now = new Date(), minuteStep = 15): string | undefined {
  if (dateValue !== toDateKeyInTimeZone(now, timeZone)) return undefined;
  return toTimeKeyInTimeZone(createDefaultFutureDateTimeRange(now, minuteStep).startsAt, timeZone);
}

export function toDateKeyInTimeZone(value: Date, timeZone: string): string {
  const parts = formatDateTimeParts(value, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function toTimeKeyInTimeZone(value: Date, timeZone: string): string {
  const parts = formatDateTimeParts(value, timeZone);
  return `${parts.hour}:${parts.minute}`;
}

export function toIsoInTimeZone(dateValue: string, timeValue: string, timeZone: string): string {
  if (!dateValue || !timeValue) return "";
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isInteger)) return "";
  const requestedAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const requestedDate = new Date(requestedAsUtc);
  const offsetParts = formatDateTimeParts(requestedDate, timeZone);
  const offset =
    Date.UTC(Number(offsetParts.year), Number(offsetParts.month) - 1, Number(offsetParts.day), Number(offsetParts.hour), Number(offsetParts.minute)) -
    requestedAsUtc;
  return new Date(requestedAsUtc - offset).toISOString();
}

function formatDateTimeParts(value: Date, timeZone: string): Record<"year" | "month" | "day" | "hour" | "minute", string> {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: values.year ?? "",
    month: values.month ?? "",
    day: values.day ?? "",
    hour: values.hour ?? "",
    minute: values.minute ?? "",
  };
}

export function readInitialDate(value: string | null): Date | null {
  if (value === null) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function createDefaultEndDate(start: Date): Date {
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return end;
}

export function readInitialDateTimeRange(
  initialStartsAt: string | null,
  initialEndsAt: string | null,
): {
  readonly startsAtDate: string;
  readonly startsAtTime: string;
  readonly endsAtDate: string;
  readonly endsAtTime: string;
} | null {
  const start = readInitialDate(initialStartsAt);
  if (start === null) return null;
  const end = readInitialDate(initialEndsAt);
  const normalizedEnd = end !== null && end > start ? end : createDefaultEndDate(start);
  return {
    startsAtDate: toDateKey(start),
    startsAtTime: toTimeKey(start),
    endsAtDate: toDateKey(normalizedEnd),
    endsAtTime: toTimeKey(normalizedEnd),
  };
}
