export type DateTimeInputPrecision = "year" | "month" | "day" | "time";
export type ExcelDateSystem = "1900" | "1904";
export interface DateTimeInputOptions { excelDateSystem?: ExcelDateSystem; }

export function normalizeDateTimeInputText(input: string): string {
  return input.normalize("NFKC").trim().replace(/[−–—]/g, "-");
}

/** Returns a timezone-free canonical value, or null for invalid/ambiguous input. Numbers are Excel serials. */
export function parseDateTimeInput(input: string | number, precision: DateTimeInputPrecision, options: DateTimeInputOptions = {}): string | null {
  if (typeof input === "number") return serial(input, precision, options.excelDateSystem ?? "1900");
  const text = normalizeDateTimeInputText(input);
  if (!text) return null;
  const explicitSerial = /^excel:\s*(\d+(?:\.\d+)?)$/i.exec(text);
  if (explicitSerial) return serial(Number(explicitSerial[1]), precision, options.excelDateSystem ?? "1900");
  if (precision === "time") {
    const clockText = text.replace(/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}[ T]+/, "");
    const clock = /^(?:(AM|PM|午前|午後)\s*)?(\d{1,2})(?::|時)(\d{1,2})(?:(?::|分)(\d{1,2})秒?)?分?\s*(AM|PM)?$/i.exec(clockText);
    if (clock) {
      let hour = Number(clock[2]); const minute = Number(clock[3]); const second = Number(clock[4] ?? 0);
      const meridiem = (clock[1] ?? clock[5])?.toUpperCase();
      if (meridiem) { if (hour < 1 || hour > 12) return null; hour = hour % 12 + (["PM", "午後"].includes(meridiem) ? 12 : 0); }
      return hour < 24 && minute < 60 && second < 60 ? `${pad(hour)}:${pad(minute)}` : null;
    }
    if (/^\d{3,4}$/.test(text)) { const hour = Number(text.slice(0, -2)), minute = Number(text.slice(-2)); return hour < 24 && minute < 60 ? `${pad(hour)}:${pad(minute)}` : null; }
    if (/^\d{1,2}$/.test(text) && Number(text) < 24) return `${pad(Number(text))}:00`;
    return /^\d+(?:\.\d+)?$/.test(text) ? serial(Number(text), precision, options.excelDateSystem ?? "1900") : null;
  }
  if (/^\d{4}$/.test(text)) return precision === "year" && Number(text) > 0 ? text : null;
  let parts: number[] | undefined;
  if (/^\d{6}$/.test(text)) parts = [Number(text.slice(0, 4)), Number(text.slice(4)), 1];
  else if (/^\d{8}$/.test(text)) parts = [Number(text.slice(0, 4)), Number(text.slice(4, 6)), Number(text.slice(6))];
  else {
    const dateText = text.replace(/年/g, "-").replace(/月/g, "-").replace(/日/g, "").replace(/-$/, "");
    const match = /^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?(?:[ T]+(.+))?$/.exec(dateText);
    if (match) {
      if (match[4] && (!match[3] || parseDateTimeInput(match[4], "time") === null)) return null;
      if (precision === "day" && !match[3]) return null;
      parts = [Number(match[1]), Number(match[2]), Number(match[3] ?? 1)];
    }
  }
  if (parts) {
    if (precision === "day" && /^\d{6}$/.test(text)) return null;
    const [year, month, day] = parts;
    const date = new Date(0); date.setUTCFullYear(year, month - 1, day); date.setUTCHours(0, 0, 0, 0);
    if (year < 1 || year > 9999 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return format(date, precision);
  }
  return /^\d+(?:\.\d+)?$/.test(text) ? serial(Number(text), precision, options.excelDateSystem ?? "1900") : null;
}
function pad(value: number) { return String(value).padStart(2, "0"); }
function format(date: Date, precision: DateTimeInputPrecision) {
  return [String(date.getUTCFullYear()).padStart(4, "0"), pad(date.getUTCMonth() + 1), pad(date.getUTCDate())].slice(0, precision === "year" ? 1 : precision === "month" ? 2 : 3).join("-");
}
function serial(value: number, precision: DateTimeInputPrecision, system: ExcelDateSystem): string | null {
  if (!Number.isFinite(value) || value < 0 || value > 2958465.999999) return null;
  const days = Math.floor(value);
  if (precision === "time") { const minutes = Math.floor((value - days) * 1440 + 1e-7); return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`; }
  // Excel's fictitious 1900-02-29 cannot be represented as a Gregorian date.
  if (system === "1900" && (days === 0 || days === 60)) return null;
  const epoch = system === "1904" ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 31);
  const date = new Date(epoch + (days - (system === "1900" && days > 60 ? 1 : 0)) * 86400000);
  return date.getUTCFullYear() > 9999 ? null : format(date, precision);
}
