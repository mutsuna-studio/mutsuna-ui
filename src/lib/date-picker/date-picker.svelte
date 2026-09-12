<script module lang="ts">
import type { DatePickerPrecision } from "./date-picker-utils.js";
export interface DatePickerProps {
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
import { digitCount, fromDigits, isPickerValue, toCalendarDate, currentPickerValue } from "./date-picker-utils.js";
import { Input } from "../input/index.js";
import { tick } from "svelte";
import CalendarIcon from "@lucide/svelte/icons/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/index.js";
import { Button } from "../button/index.js";
import { ScrollbarArea } from "../scrollbar/index.js";
import { cn } from "../utils.js";

let {
  precision = "day", showWeekday = false, showIcon = true, isDateUnavailable,
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
let draftText = $state("");
let inputElement = $state<HTMLInputElement | null>(null);
let inputError = $state("");
const errorId = $props.id();
const parsedDraft = $derived(fromDigits(draftText, precision));
function editText(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  draftText = input.value.replace(/[^0-9]/g, "").slice(0, digitCount[precision]);
  input.value = draftText;
  inputError = validationError();
  if (parsedDraft && rangeValid && parsedDraft >= min && parsedDraft <= max) {
    draftYear = Number(parsedDraft.slice(0, 4));
    calendarPlaceholder = parseDate(toCalendarDate(parsedDraft, precision));
  }
}
function selectYear(year: number) {
  if (precision === "year") { commit(String(year).padStart(4, "0")); return; }
  draftYear = year;
  const month = parsedDraft ? parsedDraft.slice(5) : "01";
  draftText = `${String(year).padStart(4, "0")}${month}`;
  inputError = "";
}
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
let yearList = $state<HTMLDivElement | null>(null);
let monthList = $state<HTMLDivElement | null>(null);
function valid(v: string) { return isPickerValue(v, precision); }
const rangeValid = $derived(valid(min) && valid(max) && min <= max);
const years = $derived(rangeValid ? Array.from({ length: Number(max.slice(0, 4)) - Number(min.slice(0, 4)) + 1 }, (_, i) => Number(min.slice(0, 4)) + i) : []);
const selectedLabel = $derived.by(() => {
  if (!valid(value)) return placeholder;
  const label = value.split("-").map((part, i) => `${Number(part)}${["年", "月", "日"][i]}`).join("");
  if (precision !== "day" || !showWeekday) return label;
  const weekday = new Intl.DateTimeFormat("ja-JP", { weekday: "short", timeZone: "UTC" }).format(parseDate(value).toDate("UTC"));
  return `${label}(${weekday})`;
});
const monthValue = (month: number) => `${String(draftYear).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
const unavailable = (month: number) => !rangeValid || monthValue(month) < min || monthValue(month) > max || Boolean(isDateUnavailable?.(monthValue(month)));

function changeOpen(next: boolean) {
  open = next && !disabled && rangeValid;
  if (!open) return;
  const candidate = valid(value) ? value : currentPickerValue(precision);
  const initial = candidate < min ? min : candidate > max ? max : candidate;
  draftYear = Number(initial.slice(0, 4));
  draftText = initial.replaceAll("-", "");
  calendarPlaceholder = parseDate(toCalendarDate(initial, precision));
  inputError = "";
  void tick().then(() => {
    yearList?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: "center" });
    monthList?.querySelector(`[data-month="${Number(initial.slice(5))}"]`)?.scrollIntoView({ block: "center" });
  });
}
function blocked(next: string) {
  return disabled || !rangeValid || !valid(next) || next < min || next > max || Boolean(isDateUnavailable?.(next));
}
function commit(next: string) {
  if (blocked(next)) return;
  if (value !== next) { value = next; onValueChange?.(next); }
  open = false;
}
function choose(month: number) { commit(monthValue(month)); }
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
    void tick().then(() => { inputElement?.focus({ preventScroll: true }); });
  }} align="start" class={cn("max-w-[calc(100vw-2rem)] gap-2 p-2", precision === "day" ? "w-[15rem]" : "w-56")} aria-label={ariaLabel}>
    <div class="flex items-center gap-1.5">
      <Input bind:ref={inputElement} bind:value={draftText} aria-label={`${unit}を直接入力`}
        placeholder={precision === "year" ? "YYYY" : precision === "month" ? "YYYYMM" : "YYYYMMDD"} inputmode="numeric" pattern={`[0-9]{${digitCount[precision]}}`} class="h-7 min-w-0 flex-1 text-sm font-normal tabular-nums focus-visible:ring-1 md:text-sm"
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
    {#if inputError}<p id={errorId} role="alert" class="text-sm text-destructive">{inputError}</p>{/if}
    {#if precision === "day"}
      <Calendar class="p-0" fixedWeeks={false} type="single" value={calendarValue} bind:placeholder={calendarPlaceholder}
        minValue={rangeValid ? parseDate(min) : undefined} maxValue={rangeValid ? parseDate(max) : undefined}
        years={years} captionLayout="dropdown" showToday={false}
        isDateUnavailable={(date) => Boolean(isDateUnavailable?.(date.toString()))}
        onValueChange={(date) => { if (date) commit(date.toString()); }} />
    {:else}
    <div class={cn("grid gap-1.5", precision === "month" && "grid-cols-2")}>
      <ScrollbarArea bind:ref={yearList} class="h-40 overflow-y-auto rounded-md border bg-background p-1" role="group" aria-label="年候補">
        {#each years as year}
          <Button type="button" variant={year === draftYear ? "default" : "ghost"} size="sm" class="w-full" aria-pressed={year === draftYear} disabled={precision === "year" && blocked(String(year).padStart(4, "0"))} onclick={() => selectYear(year)}>{year}年</Button>
        {/each}
      </ScrollbarArea>
      {#if precision === "month"}
      <ScrollbarArea bind:ref={monthList} class="h-40 overflow-y-auto rounded-md border bg-background p-1" role="group" aria-label="月候補">
        {#each Array.from({ length: 12 }, (_, i) => i + 1) as month}
          <Button type="button" data-month={month} variant={monthValue(month) === value ? "default" : "ghost"} size="sm" class="w-full" aria-pressed={monthValue(month) === value} disabled={unavailable(month)} onclick={() => choose(month)}>{month}月</Button>
        {/each}
      </ScrollbarArea>
      {/if}
    </div>
    {/if}

  </PopoverContent>
</Popover>
