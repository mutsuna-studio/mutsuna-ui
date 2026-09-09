import { parseDate } from "@internationalized/date";

export type DatePickerPrecision = "year" | "month" | "day";
export const digitCount = { year: 4, month: 6, day: 8 } as const;
export function isPickerValue(value: string, precision: DatePickerPrecision): boolean {
  const pattern = precision === "year" ? /^(?!0000)[0-9]{4}$/ : precision === "month" ? /^(?!0000)[0-9]{4}-(0[1-9]|1[0-2])$/ : /^(?!0000)[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
  if (!pattern.test(value)) return false;
  try { parseDate(toCalendarDate(value, precision)); return true; } catch { return false; }
}
export function toCalendarDate(value: string, precision: DatePickerPrecision): string {
  return value + (precision === "year" ? "-01-01" : precision === "month" ? "-01" : "");
}
export function fromDigits(value: string, precision: DatePickerPrecision): string {
  if (!new RegExp(`^[0-9]{${digitCount[precision]}}$`).test(value)) return "";
  const result = [value.slice(0, 4), value.slice(4, 6), value.slice(6, 8)].filter(Boolean).join("-");
  return isPickerValue(result, precision) ? result : "";
}
export function currentPickerValue(precision: DatePickerPrecision): string {
  const now = new Date();
  return [String(now.getFullYear()).padStart(4, "0"), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].slice(0, precision === "year" ? 1 : precision === "month" ? 2 : 3).join("-");
}
