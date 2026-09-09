<script module lang="ts">
export interface MonthPickerProps {
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
import { Input } from "../input/index.js";
import { tick } from "svelte";
import CalendarIcon from "@lucide/svelte/icons/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/index.js";
import { Button } from "../button/index.js";
import { ScrollbarArea } from "../scrollbar/index.js";
import { cn } from "../utils.js";

let {
  value = $bindable(""), onValueChange, ariaLabel, id, name, disabled = false,
  min = "1900-01", max = "2100-12", placeholder = "年月を選択", size = "default",
  class: className, "aria-invalid": invalid, "aria-describedby": describedBy,
}: MonthPickerProps = $props();
let open = $state(false);
let draftYear = $state(2000);
let draftText = $state("");
let inputElement = $state<HTMLInputElement | null>(null);
let inputError = $state("");
const errorId = $props.id();
const parsedDraft = $derived.by(() => {
  const match = draftText.match(/^([0-9]{4})([0-9]{2})$/);
  if (!match) return "";
  const result = `${match[1]}-${match[2].padStart(2, "0")}`;
  return valid(result) ? result : "";
});
function editText(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  draftText = input.value.replace(/[^0-9]/g, "").slice(0, 6);
  input.value = draftText;
  inputError = validationError();
  if (parsedDraft && rangeValid && parsedDraft >= min && parsedDraft <= max) {
    draftYear = Number(parsedDraft.slice(0, 4));
  }
}
function selectYear(year: number) {
  draftYear = year;
  const month = parsedDraft ? parsedDraft.slice(5) : "01";
  draftText = `${String(year).padStart(4, "0")}${month}`;
  inputError = "";
}
function validationError() {
  if (!parsedDraft) return "年月を半角数字6桁（例：202609）の形式で入力してください。";
  if (parsedDraft < min || parsedDraft > max) return `${min}〜${max}の範囲で入力してください。`;
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
const valid = (v: string) => /^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(v);
const rangeValid = $derived(valid(min) && valid(max) && min <= max);
const years = $derived(rangeValid ? Array.from({ length: Number(max.slice(0, 4)) - Number(min.slice(0, 4)) + 1 }, (_, i) => Number(min.slice(0, 4)) + i) : []);
const selectedLabel = $derived(valid(value) ? `${Number(value.slice(0, 4))}年${Number(value.slice(5))}月` : placeholder);
const monthValue = (month: number) => `${String(draftYear).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
const unavailable = (month: number) => !rangeValid || monthValue(month) < min || monthValue(month) > max;

function changeOpen(next: boolean) {
  open = next && !disabled && rangeValid;
  if (!open) return;
  const candidate = valid(value) ? value : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const initial = candidate < min ? min : candidate > max ? max : candidate;
  draftYear = Number(initial.slice(0, 4));
  draftText = initial.replace("-", "");
  inputError = "";
  void tick().then(() => {
    yearList?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: "center" });
    monthList?.querySelector(`[data-month="${Number(initial.slice(5))}"]`)?.scrollIntoView({ block: "center" });
  });
}
function choose(month: number) {
  if (disabled || unavailable(month)) return;
  const next = monthValue(month);
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
        class={cn("min-w-0 justify-between", !valid(value) && "text-muted-foreground", className)}>
        <span class="truncate">{selectedLabel}</span><CalendarIcon aria-hidden="true" />
      </Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent onOpenAutoFocus={(event) => {
    event.preventDefault();
    void tick().then(() => { inputElement?.focus({ preventScroll: true }); inputElement?.select(); });
  }} align="start" class="w-56 max-w-[calc(100vw-2rem)] gap-2 p-2" aria-label={ariaLabel}>
    <div class="flex items-center gap-1.5">
      <Input bind:ref={inputElement} bind:value={draftText} aria-label="年月を直接入力"
        placeholder="YYYYMM" inputmode="numeric" pattern="[0-9]{6}" class="h-10 text-center text-lg font-semibold tabular-nums md:text-lg"
        aria-invalid={Boolean(inputError)} aria-describedby={inputError ? errorId : undefined}
        oninput={editText} onkeydown={(event) => {
          if (event.key === "Enter" && !event.isComposing && event.keyCode !== 229) {
            event.preventDefault(); event.stopPropagation(); commitText();
          }
        }} />
    </div>
    {#if inputError}<p id={errorId} role="alert" class="text-sm text-destructive">{inputError}</p>{/if}
    <div class="grid grid-cols-2 gap-1.5">
      <ScrollbarArea bind:ref={yearList} class="h-40 overflow-y-auto rounded-md border bg-background p-1" role="group" aria-label="年候補">
        {#each years as year}
          <Button type="button" variant={year === draftYear ? "default" : "ghost"} size="sm" class="w-full" aria-pressed={year === draftYear} onclick={() => selectYear(year)}>{year}年</Button>
        {/each}
      </ScrollbarArea>
      <ScrollbarArea bind:ref={monthList} class="h-40 overflow-y-auto rounded-md border bg-background p-1" role="group" aria-label="月候補">
        {#each Array.from({ length: 12 }, (_, i) => i + 1) as month}
          <Button type="button" data-month={month} variant={monthValue(month) === value ? "default" : "ghost"} size="sm" class="w-full" aria-pressed={monthValue(month) === value} disabled={unavailable(month)} onclick={() => choose(month)}>{month}月</Button>
        {/each}
      </ScrollbarArea>
    </div>
  </PopoverContent>
</Popover>
