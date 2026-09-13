<script module lang="ts">
import type { ExcelDateSystem } from "../date-time-input/index.js";
import type { DatePickerPrecision } from "./date-picker-utils.js";
export interface DatePickerProps {
  excelDateSystem?: ExcelDateSystem;
  precision?: DatePickerPrecision;
  showWeekday?: boolean;
  showIcon?: boolean;
  isDateUnavailable?: (value: string) => boolean;
  showCurrent?: boolean;
  currentLabel?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  ariaLabel: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  size?: "sm" | "default";
  class?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}
</script>

<script lang="ts">
import { parseDate, type DateValue } from "@internationalized/date";
import { Calendar } from "../calendar/index.js";
import { digitCount, isPickerValue, toCalendarDate, currentPickerValue } from "./date-picker-utils.js";
import { Input } from "../input/index.js";
import { tick } from "svelte";
import CalendarIcon from "@lucide/svelte/icons/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/index.js";
import { Button } from "../button/index.js";
import CalendarRoller from "../calendar/calendar-roller.svelte";
import { stepCalendarMonth } from "../calendar/calendar-month-step.js";
import { parseDateTimeInput, normalizeDateTimeInputText } from "../date-time-input/index.js";
import { cn } from "../utils.js";

let {
  excelDateSystem = "1900", precision = "day", showWeekday = false, showIcon = true, isDateUnavailable,
  showCurrent = true, currentLabel,
  value = $bindable(""), onValueChange, ariaLabel, id, name, disabled = false,
  min: minProp, max: maxProp, placeholder: placeholderProp, size = "default",
  class: className, "aria-invalid": invalid, "aria-describedby": describedBy,
}: DatePickerProps = $props();
const min = $derived(minProp ?? (precision === "year" ? "1900" : precision === "month" ? "1900-01" : "1900-01-01"));
const max = $derived(maxProp ?? (precision === "year" ? "2100" : precision === "month" ? "2100-12" : "2100-12-31"));
const unit = $derived(precision === "year" ? "年" : precision === "month" ? "年月" : "日付");
const placeholder = $derived(placeholderProp ?? `${unit}を選択`);
const shortcutLabel = $derived(currentLabel ?? (precision === "year" ? "今年" : precision === "month" ? "今月" : "今日"));
let calendarPlaceholder = $state<DateValue>(parseDate("2000-01-01"));
const calendarValue = $derived(precision === "day" && valid(value) ? parseDate(value) : undefined);
let open = $state(false);
let draftYear = $state(2000);
let draftMonth = $state(1);
let yearInput = $state<HTMLInputElement | null>(null);
let monthInput = $state<HTMLInputElement | null>(null);
let draftText = $state("");
let inputElement = $state<HTMLInputElement | null>(null);
let inputError = $state("");
const errorId = $props.id();
const parsedDraft = $derived(parseDateTimeInput(draftText, precision, { excelDateSystem }) ?? "");
function editText(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  draftText = normalizeDateTimeInputText(input.value);
  input.value = draftText;
  inputError = validationError();
  if (parsedDraft && rangeValid && parsedDraft >= min && parsedDraft <= max) {
    draftYear = Number(parsedDraft.slice(0, 4));
    draftMonth = Number(parsedDraft.slice(5, 7)) || 1;
    calendarPlaceholder = parseDate(toCalendarDate(parsedDraft, precision));
  }
}
function valid(v: string) { return isPickerValue(v, precision); }
const rangeValid = $derived(valid(min) && valid(max) && min <= max);
const years = $derived(rangeValid ? Array.from({ length: Number(max.slice(0, 4)) - Number(min.slice(0, 4)) + 1 }, (_, i) => Number(min.slice(0, 4)) + i) : []);
const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
const formatMonthValue = (year: number, month: number) => `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
function allowedMonths(year: number) { return allMonths.filter((month) => !blocked(formatMonthValue(year, month))); }
const yearOptions = $derived(years.filter((year) => precision === "year" ? !blocked(String(year).padStart(4, "0")) : allowedMonths(year).length > 0).map((value) => ({ value, label: `${value}年` })));
const monthOptions = $derived(allowedMonths(draftYear).map((value) => ({ value, label: `${value}月` })));
function syncRollerDraft() {
  draftText = precision === "year" ? String(draftYear).padStart(4, "0") : formatMonthValue(draftYear, draftMonth).replaceAll("-", "");
  inputError = "";
}
function selectYear(year: number) {
  draftYear = year;
  if (precision === "month") {
    const options = allowedMonths(year);
    if (options.length) draftMonth = options.reduce((nearest, month) => Math.abs(month - draftMonth) < Math.abs(nearest - draftMonth) ? month : nearest);
  }
  syncRollerDraft();
}
function inputYearMonth(digits: string) {
  draftText = digits;
  inputError = validationError();
  if (inputError) return;
  draftYear = Number(parsedDraft.slice(0, 4));
  draftMonth = Number(parsedDraft.slice(5, 7)) || 1;
}
function selectMonth(month: number) { draftMonth = month; syncRollerDraft(); }
function steppedMonth(offset: number) {
  return stepCalendarMonth(draftYear, draftMonth, offset, years, allMonths, (year, month) => !blocked(formatMonthValue(year, month)));
}
function stepMonth(offset: number) {
  const next = steppedMonth(offset);
  draftYear = next.year;
  draftMonth = next.month;
  syncRollerDraft();
}
const canPreviousMonth = $derived.by(() => { const next = steppedMonth(-1); return next.year !== draftYear || next.month !== draftMonth; });
const canNextMonth = $derived.by(() => { const next = steppedMonth(1); return next.year !== draftYear || next.month !== draftMonth; });
function validationError() {
  if (!parsedDraft) return `${unit}を半角数字${digitCount[precision]}桁の形式で入力してください。`;
  if (parsedDraft < min || parsedDraft > max) return `${min}〜${max}の範囲で入力してください。`;
  if (isDateUnavailable?.(parsedDraft)) return "この値は選択できません。";
  return "";
}
function commitText() {
  if (disabled || !rangeValid) return;
  inputError = validationError();
  if (inputError) return;
  if (value !== parsedDraft) { value = parsedDraft; onValueChange?.(value); }
  open = false;
}
const selectedLabel = $derived.by(() => {
  if (!valid(value)) return placeholder;
  const label = value.split("-").map((part, i) => `${Number(part)}${["年", "月", "日"][i]}`).join("");
  if (precision !== "day" || !showWeekday) return label;
  const weekday = new Intl.DateTimeFormat("ja-JP", { weekday: "short", timeZone: "UTC" }).format(parseDate(value).toDate("UTC"));
  return `${label}(${weekday})`;
});
function changeOpen(next: boolean) {
  open = next && !disabled && rangeValid;
  if (!open) return;
  const candidate = valid(value) ? value : currentPickerValue(precision);
  const initial = candidate < min ? min : candidate > max ? max : candidate;
  draftYear = Number(initial.slice(0, 4));
  draftMonth = Number(initial.slice(5, 7)) || 1;
  draftText = initial.replaceAll("-", "");
  calendarPlaceholder = parseDate(toCalendarDate(initial, precision));
  inputError = "";

}
function blocked(next: string) {
  return disabled || !rangeValid || !valid(next) || next < min || next > max || Boolean(isDateUnavailable?.(next));
}
function commit(next: string) {
  if (blocked(next)) return;
  if (value !== next) { value = next; onValueChange?.(next); }
  open = false;
}
</script>

{#if name}<input type="hidden" {name} {value} {disabled} />{/if}
<Popover bind:open={() => open, changeOpen}>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button {...props} {id} type="button" variant="outline" {size}
        disabled={disabled || !rangeValid} aria-label={`${ariaLabel}: ${selectedLabel}`}
        aria-invalid={invalid} aria-describedby={describedBy}
        class={cn("min-w-0", showIcon ? "justify-between" : "justify-center", !valid(value) && "text-muted-foreground", className)}>
        <span class="truncate tabular-nums">{selectedLabel}</span>
        {#if showIcon}<CalendarIcon aria-hidden="true" />{/if}
      </Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent onOpenAutoFocus={(event) => {
    event.preventDefault();
    void tick().then(() => { (precision === "day" ? inputElement : yearInput)?.focus({ preventScroll: true }); });
  }} align="start" class={cn("max-w-[calc(100vw-2rem)] gap-2 p-2", precision === "day" ? "w-[15rem]" : "w-56")} aria-label={ariaLabel}>
    {#if precision === "day"}
    <div class="flex items-center gap-1.5">
      <Input bind:ref={inputElement} bind:value={draftText} aria-label={`${unit}を直接入力`}
        placeholder="YYYYMMDD" inputmode="numeric" pattern={`[0-9]{${digitCount[precision]}}`} class="h-7 min-w-0 flex-1 text-sm font-normal tabular-nums md:text-sm"
        aria-invalid={Boolean(inputError)} aria-describedby={inputError ? errorId : undefined}
        oninput={editText} onkeydown={(event) => {
          if (event.key === "Enter" && !event.isComposing && event.keyCode !== 229) {
            event.preventDefault(); event.stopPropagation(); commitText();
          }
        }} />
      {#if showCurrent}
        <Button type="button" variant="ghost" size="sm" class="shrink-0 px-2 font-normal text-muted-foreground" disabled={blocked(currentPickerValue(precision))} onclick={() => commit(currentPickerValue(precision))}>{shortcutLabel}</Button>
      {/if}
    </div>
    {/if}
    {#if inputError}<p id={errorId} role="alert" class="text-sm text-destructive">{inputError}</p>{/if}
    {#if precision === "day"}
      <Calendar class="p-0" fixedWeeks={false} type="single" value={calendarValue} bind:placeholder={calendarPlaceholder}
        minValue={rangeValid ? parseDate(min) : undefined} maxValue={rangeValid ? parseDate(max) : undefined}
        years={years} {excelDateSystem} captionLayout="dropdown" showToday={false}
        isDateUnavailable={(date) => Boolean(isDateUnavailable?.(date.toString()))}
        onValueChange={(date) => { if (date) commit(date.toString()); }} />
    {:else}
    <div class={cn("grid gap-2", precision === "month" && "grid-cols-2")}>
      <CalendarRoller bind:ref={yearInput} label="年" value={draftYear} options={yearOptions} {disabled} onValueChange={selectYear}
        onYearMonthInput={inputYearMonth}
        onTab={precision === "month" ? () => monthInput?.focus() : undefined} onEnter={commitText} />
      {#if precision === "month"}
        <CalendarRoller bind:ref={monthInput} label="月" value={draftMonth} options={monthOptions} {disabled} onValueChange={selectMonth}
          onStep={stepMonth} canPrevious={canPreviousMonth} canNext={canNextMonth} onTab={() => yearInput?.focus()} onEnter={commitText} />
      {/if}
    </div>
    <div class="flex gap-2">
      {#if showCurrent}<Button type="button" variant="ghost" size="sm" disabled={blocked(currentPickerValue(precision))} onclick={() => commit(currentPickerValue(precision))}>{shortcutLabel}</Button>{/if}
      <Button type="button" size="sm" class="flex-1" disabled={blocked(parsedDraft)} onclick={commitText}>選択</Button>
    </div>
    {/if}

  </PopoverContent>
</Popover>
