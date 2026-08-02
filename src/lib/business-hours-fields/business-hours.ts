export type Weekday = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface BusinessHourDraft {
  readonly weekday: Weekday;
  readonly label: string;
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
}

export interface HolidayHoursDraft {
  readonly isOpen: boolean;
  readonly opensAt: string;
  readonly closesAt: string;
}

export const weekdayLabels: Record<Weekday, string> = {
  monday: "月曜日",
  tuesday: "火曜日",
  wednesday: "水曜日",
  thursday: "木曜日",
  friday: "金曜日",
  saturday: "土曜日",
  sunday: "日曜日",
};

export const weekdays: readonly Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
