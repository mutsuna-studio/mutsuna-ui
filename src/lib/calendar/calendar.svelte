<script lang="ts">
import { Calendar as CalendarPrimitive } from "bits-ui";
import CalendarCaption from "./calendar-caption.svelte";
import CalendarCell from "./calendar-cell.svelte";
import CalendarDay from "./calendar-day.svelte";
import CalendarGrid from "./calendar-grid.svelte";
import CalendarGridBody from "./calendar-grid-body.svelte";
import CalendarGridHead from "./calendar-grid-head.svelte";
import CalendarGridRow from "./calendar-grid-row.svelte";
import CalendarHeadCell from "./calendar-head-cell.svelte";
import CalendarHeader from "./calendar-header.svelte";
import CalendarMonth from "./calendar-month.svelte";
import CalendarMonths from "./calendar-months.svelte";
import CalendarNav from "./calendar-nav.svelte";
import CalendarNextButton from "./calendar-next-button.svelte";
import CalendarPrevButton from "./calendar-prev-button.svelte";
import type { ExcelDateSystem } from "../date-time-input/index.js";
import { cn, type WithoutChildrenOrChild } from "../utils.js";
import type { ButtonVariant } from "@mutsuna/ui/button";
import { Button } from "../button/index.js";
import { today, getLocalTimeZone, isSameDay, isEqualMonth, type DateValue } from "@internationalized/date";
import type { Snippet } from "svelte";
import { getCalendarDayColorClass } from "./calendar-day-color.js";

const calendarYearFloor = 2020;
const calendarYearCeiling = new Date().getFullYear() + 10;

let {
  ref = $bindable(null),
  value = $bindable(),
  placeholder = $bindable(),
  class: className,
  weekdayFormat = "short",
  weekStartsOn = 1,
  fixedWeeks = true,
  buttonVariant = "ghost",
  excelDateSystem = "1900",
  captionLayout = "label",
  locale = "ja-JP",
  months: monthsProp,
  years = Array.from({ length: calendarYearCeiling - calendarYearFloor + 1 }, (_, index) => calendarYearFloor + index),
  monthFormat: monthFormatProp,
  yearFormat = "numeric",
  day,
  showToday = true,
  todayLabel = "今日",
  disableDaysOutsideMonth = false,
  ...restProps
}: WithoutChildrenOrChild<CalendarPrimitive.RootProps> & {
  excelDateSystem?: ExcelDateSystem;
  showToday?: boolean;
  todayLabel?: string;
  buttonVariant?: ButtonVariant;
  captionLayout?: "dropdown" | "dropdown-months" | "dropdown-years" | "label";
  months?: CalendarPrimitive.MonthSelectProps["months"];
  years?: CalendarPrimitive.YearSelectProps["years"];
  monthFormat?: CalendarPrimitive.MonthSelectProps["monthFormat"];
  yearFormat?: CalendarPrimitive.YearSelectProps["yearFormat"];
  day?: Snippet<[{ day: DateValue; outsideMonth: boolean }]>;
} = $props();

function todayDisabled(date: DateValue) {
  return Boolean(restProps.disabled || restProps.readonly ||
    (restProps.minValue && date.compare(restProps.minValue) < 0) ||
    (restProps.maxValue && date.compare(restProps.maxValue) > 0) ||
    restProps.isDateDisabled?.(date) || restProps.isDateUnavailable?.(date));
}
function selectToday() {
  const date = today(getLocalTimeZone());
  if (todayDisabled(date)) return;
  placeholder = date;
  restProps.onPlaceholderChange?.(date);
  if (restProps.type === "multiple") {
    const selected = Array.isArray(value) ? value : [];
    if (selected.some((item) => isSameDay(item, date))) return;
    value = [...selected, date];
    restProps.onValueChange?.(value);
  } else {
    value = date;
    restProps.onValueChange?.(date);
  }
}

const monthFormat = $derived.by(() => {
  if (monthFormatProp) return monthFormatProp;
  if (captionLayout.startsWith("dropdown")) return "short";
  return "long";
});
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<CalendarPrimitive.Root
	bind:value={value as never}
	bind:ref
	bind:placeholder
	{weekdayFormat}
	{weekStartsOn}
	{fixedWeeks}
	{disableDaysOutsideMonth}
	class={cn(
		"bg-background p-3 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(8)] group/calendar in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
		className
	)}
	{locale}
	{monthFormat}
	{yearFormat}
	{...restProps}
>
	{#snippet children({ months, weekdays })}
		<CalendarMonths>
			<CalendarNav>
				<CalendarPrevButton variant={buttonVariant} />
				<CalendarNextButton variant={buttonVariant} />
			</CalendarNav>
			{#each months as month, monthIndex (monthIndex)}
				<CalendarMonth>
					<CalendarHeader>
						{#snippet child({ props })}
							<div {...props}>
								<CalendarCaption
									{captionLayout}
									{excelDateSystem}
									disabled={Boolean(restProps.disabled || restProps.readonly)}
									months={monthsProp}
									{monthFormat}
									{years}
									{yearFormat}
									month={month.value}
									bind:placeholder
									{locale}
									{monthIndex}
								/>
							</div>
						{/snippet}
					</CalendarHeader>
					<CalendarGrid>
						<CalendarGridHead>
							<CalendarGridRow class="select-none">
								{#each weekdays as weekday, i (i)}
									<CalendarHeadCell>
										{weekday.slice(0, 2)}
									</CalendarHeadCell>
								{/each}
							</CalendarGridRow>
						</CalendarGridHead>
						<CalendarGridBody>
							{#each month.weeks as weekDates (weekDates)}
								<CalendarGridRow class="mt-2 w-full">
									{#each weekDates as date (date)}
										<CalendarCell {date} month={month.value}>
											{#if day}
												{@render day({
													day: date,
													outsideMonth: !isEqualMonth(date, month.value),
												})}
										{:else}
											<CalendarDay class={getCalendarDayColorClass(date)} />
										{/if}
										</CalendarCell>
									{/each}
								</CalendarGridRow>
							{/each}
						</CalendarGridBody>
					</CalendarGrid>
				</CalendarMonth>
			{/each}
		</CalendarMonths>
    {#if showToday}
      <div class="mt-3 border-t pt-2">
        <Button type="button" variant="ghost" size="sm" class="w-full" disabled={todayDisabled(today(getLocalTimeZone()))} onclick={selectToday}>{todayLabel}</Button>
      </div>
    {/if}
	{/snippet}
</CalendarPrimitive.Root>

<style>
:global([data-calendar-month]:has([data-calendar-month-year-picker]) [data-calendar-grid]),
:global([data-calendar-months]:has([data-calendar-month-year-picker]) > [data-calendar-nav]) {
  display: none;
}
</style>
