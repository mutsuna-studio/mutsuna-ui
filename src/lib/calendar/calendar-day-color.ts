import type { DateValue } from "@internationalized/date";
import pkg from "japanese-holidays";

const { isHoliday } = pkg;

export function getCalendarDayColorClass(value: DateValue): string {
  const date = new Date(value.year, value.month - 1, value.day);

  if (isHoliday(date) !== undefined || date.getDay() === 0) return getCalendarDayAccentClass("red");
  if (date.getDay() === 6) return getCalendarDayAccentClass("blue");
  return "";
}

function getCalendarDayAccentClass(color: "red" | "blue"): string {
  if (color === "red") {
    return "text-red-600 not-data-[disabled]:not-data-[outside-month]:not-data-[selected]:hover:!text-red-600 [&[data-today]:not([data-selected]):not([data-disabled]):not([data-outside-month])]:!text-red-600";
  }

  return "text-blue-600 not-data-[disabled]:not-data-[outside-month]:not-data-[selected]:hover:!text-blue-600 [&[data-today]:not([data-selected]):not([data-disabled]):not([data-outside-month])]:!text-blue-600";
}
