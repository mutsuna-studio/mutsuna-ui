<script lang="ts">
import { DateFormatter, getLocalTimeZone, type DateValue } from "@internationalized/date";
import { type ComponentProps } from "svelte";
import { parseDateTimeInput, type ExcelDateSystem } from "../date-time-input/index.js";
import Button from "@mutsuna/ui/button/button.svelte";
import { stepCalendarMonth } from "./calendar-month-step.js";
import CalendarRoller from "./calendar-roller.svelte";
import type Calendar from "./calendar.svelte";

const calendarYearFloor = 1;

let {
  captionLayout,
  months,
  monthFormat,
  years,
  yearFormat,
  month,
  locale,
  placeholder = $bindable(),
  monthIndex = 0,
  disabled = false,
  excelDateSystem = "1900",
}: {
  captionLayout: ComponentProps<typeof Calendar>["captionLayout"];
  months: ComponentProps<typeof Calendar>["months"];
  monthFormat: ComponentProps<typeof Calendar>["monthFormat"];
  years: ComponentProps<typeof Calendar>["years"];
  yearFormat: ComponentProps<typeof Calendar>["yearFormat"];
  month: DateValue;
  placeholder: DateValue | undefined;
  locale: string;
  monthIndex: number;
  disabled?: boolean;
  excelDateSystem?: ExcelDateSystem;
} = $props();

let monthYearOpen = $state(false);
let yearInput = $state<HTMLInputElement | null>(null);
let monthInput = $state<HTMLInputElement | null>(null);
const monthOptions = $derived((months ?? Array.from({ length: 12 }, (_, i) => i + 1))
  .filter((value) => value >= 1 && value <= 12).map((value) => ({ value, label: formatMonthOption(value) })));
const yearOptions = $derived((years ?? []).filter((value) => value >= calendarYearFloor)
  .map((value) => ({ value, label: formatYearOption(value) })));
const selectedMonthYearLabel = $derived(`${formatYear(month)} ${formatMonth(month)}`);
function formatYear(date: DateValue) {
  const dateObj = date.toDate(getLocalTimeZone());
  if (typeof yearFormat === "function") return yearFormat(dateObj.getFullYear());
  return new DateFormatter(locale, { year: yearFormat }).format(dateObj);
}

function formatMonth(date: DateValue) {
  const dateObj = date.toDate(getLocalTimeZone());
  if (typeof monthFormat === "function") return monthFormat(dateObj.getMonth() + 1);
  return new DateFormatter(locale, { month: monthFormat }).format(dateObj);
}

function formatMonthOption(value: number) {
  if (typeof monthFormat === "function") return monthFormat(value);
  return new DateFormatter(locale, { month: monthFormat }).format(new Date(2026, value - 1, 1));
}

function formatYearOption(value: number) {
  if (typeof yearFormat === "function") return yearFormat(value);
  return new DateFormatter(locale, { year: yearFormat }).format(new Date(value, 0, 1));
}

function steppedMonth(offset: number) {
  return stepCalendarMonth(month.year, month.month, offset, yearOptions.map((option) => option.value), monthOptions.map((option) => option.value));
}
function stepMonth(offset: number) {
  if (!placeholder || disabled) return;
  const next = steppedMonth(offset);
  placeholder = month.set(next).subtract({ months: monthIndex });
}
const canPreviousMonth = $derived.by(() => { const next = steppedMonth(-1); return next.year !== month.year || next.month !== month.month; });
const canNextMonth = $derived.by(() => { const next = steppedMonth(1); return next.year !== month.year || next.month !== month.month; });

function inputYearMonth(text: string) {
  const parsed = parseDateTimeInput(text, "month", { excelDateSystem });
  if (!parsed || !placeholder || disabled) return;
  const year = Number(parsed.slice(0, 4)), nextMonth = Number(parsed.slice(5));
  if (!yearOptions.some((option) => option.value === year) || !monthOptions.some((option) => option.value === nextMonth)) return;
  placeholder = month.set({ year, month: nextMonth }).subtract({ months: monthIndex });
}
function update(unit: "year" | "month", value: number): void {
  if (!placeholder || disabled) return;
  placeholder = month.set({ [unit]: value }).subtract({ months: monthIndex });
}
</script>

{#if captionLayout?.startsWith("dropdown")}
  <div class="grid w-full gap-2" data-calendar-caption-dropdown={monthYearOpen ? "open" : "closed"}>
    <div class="flex justify-center">
      <Button type="button" aria-label={monthYearOpen ? "日付選択へ戻る" : "年月"} aria-expanded={monthYearOpen} variant="outline" size="sm" class="z-10 h-7 w-32 justify-center bg-background px-2 text-sm font-medium" {disabled} onclick={() => monthYearOpen = !monthYearOpen}>
        {monthYearOpen ? "日付選択へ戻る" : selectedMonthYearLabel}
      </Button>
    </div>
    {#if monthYearOpen}
      <div class="flex items-center gap-2" data-calendar-month-year-picker>
        <div class="min-w-0 flex-1">
          {#if captionLayout !== "dropdown-months"}
            <CalendarRoller onYearMonthInput={inputYearMonth} bind:ref={yearInput} onTab={captionLayout === "dropdown" ? () => monthInput?.focus() : undefined} label="年" value={month.year} options={yearOptions} {disabled} onValueChange={(value) => update("year", value)} />
          {:else}<span>{formatYear(month)}</span>{/if}
        </div>
        <div class="min-w-0 flex-1">
          {#if captionLayout !== "dropdown-years"}
            <CalendarRoller bind:ref={monthInput} onTab={captionLayout === "dropdown" ? () => yearInput?.focus() : undefined} label="月" value={month.month} options={monthOptions} {disabled} onStep={stepMonth} canPrevious={canPreviousMonth} canNext={canNextMonth} onValueChange={(value) => update("month", value)} />
          {:else}<span>{formatMonth(month)}</span>{/if}
        </div>
      </div>
    {/if}
  </div>
{:else}
  {formatMonth(month)} {formatYear(month)}
{/if}
