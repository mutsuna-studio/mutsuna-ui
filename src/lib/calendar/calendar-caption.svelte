<script lang="ts">
import { DateFormatter, getLocalTimeZone, type DateValue } from "@internationalized/date";
import { tick, type ComponentProps } from "svelte";
import Button from "@mutsuna/ui/button/button.svelte";
import * as Popover from "@mutsuna/ui/popover";
import type Calendar from "./calendar.svelte";
import { Select as SelectRoot, SelectContent, SelectItem, SelectTrigger } from "@mutsuna/ui/select";
import { cn } from "../utils.js";

const calendarYearFloor = 2020;

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
} = $props();

let monthYearOpen = $state(false);
let draftYear = $state(calendarYearFloor);
let draftMonth = $state(1);
let yearListElement = $state<HTMLDivElement | undefined>();
let monthListElement = $state<HTMLDivElement | undefined>();

const monthOptions = $derived(
  (months ?? Array.from({ length: 12 }, (_, index) => index + 1)).map((value) => ({
    value: String(value),
    label: formatMonthOption(value),
  })),
);

const yearOptions = $derived(
  (years ?? [])
    .filter((value) => value >= calendarYearFloor)
    .map((value) => ({
      value: String(value),
      label: formatYearOption(value),
    })),
);
const dropdownTriggerClass = "z-10 justify-center bg-background [&>svg]:hidden";
const selectedMonthLabel = $derived(monthOptions.find((option) => option.value === String(month.month))?.label ?? formatMonth(month));
const selectedYearLabel = $derived(yearOptions.find((option) => option.value === String(month.year))?.label ?? formatYear(month));
const selectedMonthYearLabel = $derived(`${selectedYearLabel} ${selectedMonthLabel}`);
const draftMonthLabel = $derived(monthOptions.find((option) => option.value === String(draftMonth))?.label ?? selectedMonthLabel);
const draftYearLabel = $derived(yearOptions.find((option) => option.value === String(draftYear))?.label ?? selectedYearLabel);
const draftMonthYearLabel = $derived(`${draftYearLabel} ${draftMonthLabel}`);

$effect(() => {
  if (!monthYearOpen) {
    return;
  }

  month.year;
  month.month;
  draftYear;
  draftMonth;
  void tick().then(scrollSelectedOptionsIntoView);
});

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

function updatePlaceholderMonth(value: string): void {
  if (!placeholder) return;
  const parsedMonth = Number.parseInt(value, 10);
  if (Number.isNaN(parsedMonth)) return;
  const nextPlaceholder = placeholder.set({ month: parsedMonth });
  placeholder = nextPlaceholder.subtract({ months: monthIndex });
}

function updatePlaceholderYear(value: string): void {
  if (!placeholder) return;
  const parsedYear = Number.parseInt(value, 10);
  if (Number.isNaN(parsedYear) || parsedYear < calendarYearFloor) return;
  const nextPlaceholder = placeholder.set({ year: parsedYear });
  placeholder = nextPlaceholder.subtract({ months: monthIndex });
}

function setMonthYearOpen(open: boolean): void {
  monthYearOpen = open;
  if (!open) return;
  draftYear = month.year;
  draftMonth = month.month;
}

function selectDraftYear(value: string): void {
  const parsedValue = Number.parseInt(value, 10);
  if (Number.isNaN(parsedValue)) return;
  if (parsedValue < calendarYearFloor) return;
  draftYear = parsedValue;
}

function selectDraftMonth(value: string): void {
  if (!placeholder) return;
  const parsedValue = Number.parseInt(value, 10);
  if (Number.isNaN(parsedValue) || parsedValue < 1 || parsedValue > 12) return;
  draftMonth = parsedValue;
  const nextPlaceholder = placeholder.set({ year: draftYear, month: draftMonth });
  placeholder = nextPlaceholder.subtract({ months: monthIndex });
  monthYearOpen = false;
}

function scrollSelectedOptionsIntoView(): void {
  scrollElementIntoView(yearListElement?.querySelector(`[data-calendar-year-option="${draftYear}"]`));
  scrollElementIntoView(monthListElement?.querySelector(`[data-calendar-month-option="${draftMonth}"]`));
}

function scrollElementIntoView(element: Element | null | undefined): void {
  if (element === undefined || element === null || typeof element.scrollIntoView !== "function") {
    return;
  }

  element.scrollIntoView({ block: "center", inline: "nearest" });
}
</script>

{#if captionLayout === "dropdown"}
  <div class="flex items-center justify-center gap-2">
    <Popover.Root bind:open={() => monthYearOpen, setMonthYearOpen}>
      <Popover.Trigger>
        {#snippet child({ props })}
          <Button {...props} aria-label="年月" variant="outline" size="sm" class="z-10 h-7 w-32 justify-center bg-background px-2 text-sm font-medium">
            {selectedMonthYearLabel}
          </Button>
        {/snippet}
      </Popover.Trigger>
      <Popover.Content class="w-56 gap-2 p-2" align="center" sideOffset={6}>
        <div class="grid gap-2">
          <div
            class="border-input h-12 w-full rounded-md border bg-background px-2 text-center text-xl font-semibold leading-[3rem] tabular-nums"
            data-calendar-month-year-selected-value
          >
            {draftMonthYearLabel}
          </div>

          <div class="grid grid-cols-2 gap-1.5">
            <div
              bind:this={yearListElement}
              class="h-36 overflow-y-auto rounded-md border bg-background p-1"
              role="group"
              aria-label="年候補"
              data-calendar-year-list
            >
              {#each yearOptions as option (option.value)}
                <button
                  type="button"
                  data-calendar-year-option={option.value}
                  class={cn(
                    "h-8 w-full rounded-md text-sm font-medium tabular-nums hover:bg-accent hover:text-accent-foreground",
                    option.value === String(draftYear) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                  aria-pressed={option.value === String(draftYear)}
                  aria-label={`${option.label}を選択`}
                  onpointerdown={(event) => event.preventDefault()}
                  onclick={() => selectDraftYear(option.value)}
                >
                  {option.label}
                </button>
              {/each}
            </div>

            <div
              bind:this={monthListElement}
              class="h-36 overflow-y-auto rounded-md border bg-background p-1"
              role="group"
              aria-label="月候補"
              data-calendar-month-list
            >
              {#each monthOptions as option (option.value)}
                <button
                  type="button"
                  data-calendar-month-option={option.value}
                  class={cn(
                    "h-8 w-full rounded-md text-sm font-medium tabular-nums hover:bg-accent hover:text-accent-foreground",
                    option.value === String(draftMonth) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                  aria-pressed={option.value === String(draftMonth)}
                  aria-label={`${option.label}を選択`}
                  onpointerdown={(event) => event.preventDefault()}
                  onclick={() => selectDraftMonth(option.value)}
                >
                  {option.label}
                </button>
              {/each}
            </div>
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  </div>
{:else if captionLayout === "dropdown-months"}
  <div class="flex items-center justify-center gap-2">
    <SelectRoot type="single" value={String(month.month)} onValueChange={updatePlaceholderMonth}>
      <SelectTrigger size="sm" class={`${dropdownTriggerClass} w-20`}>
        <span>{monthOptions.find((option) => option.value === String(month.month))?.label ?? formatMonth(month)}</span>
      </SelectTrigger>
      <SelectContent>
        {#each monthOptions as option (option.value)}
          <SelectItem value={option.value}>{option.label}</SelectItem>
        {/each}
      </SelectContent>
    </SelectRoot>
    {#if placeholder}
      <span>{formatYear(placeholder)}</span>
    {/if}
  </div>
{:else if captionLayout === "dropdown-years"}
  <div class="flex items-center justify-center gap-2">
    {#if placeholder}
      <span>{formatMonth(placeholder)}</span>
    {/if}
    <SelectRoot type="single" value={String(month.year)} onValueChange={updatePlaceholderYear}>
      <SelectTrigger size="sm" class={`${dropdownTriggerClass} w-24`}>
        <span>{yearOptions.find((option) => option.value === String(month.year))?.label ?? formatYear(month)}</span>
      </SelectTrigger>
      <SelectContent class="max-h-64">
        {#each yearOptions as option (option.value)}
          <SelectItem value={option.value}>{option.label}</SelectItem>
        {/each}
      </SelectContent>
    </SelectRoot>
  </div>
{:else}
  {formatMonth(month)} {formatYear(month)}
{/if}
