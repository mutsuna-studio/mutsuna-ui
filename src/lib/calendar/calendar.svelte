<script lang="ts">
import { Calendar as CalendarPrimitive } from "bits-ui";
import * as Calendar from "./index.js";
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
		<Calendar.Months>
			<Calendar.Nav>
				<Calendar.PrevButton variant={buttonVariant} />
				<Calendar.NextButton variant={buttonVariant} />
			</Calendar.Nav>
			{#each months as month, monthIndex (month)}
				<Calendar.Month>
					<Calendar.Header>
						{#snippet child({ props })}
							<div {...props}>
								<Calendar.Caption
									{captionLayout}
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
					</Calendar.Header>
					<Calendar.Grid>
						<Calendar.GridHead>
							<Calendar.GridRow class="select-none">
								{#each weekdays as weekday, i (i)}
									<Calendar.HeadCell>
										{weekday.slice(0, 2)}
									</Calendar.HeadCell>
								{/each}
							</Calendar.GridRow>
						</Calendar.GridHead>
						<Calendar.GridBody>
							{#each month.weeks as weekDates (weekDates)}
								<Calendar.GridRow class="mt-2 w-full">
									{#each weekDates as date (date)}
										<Calendar.Cell {date} month={month.value}>
											{#if day}
												{@render day({
													day: date,
													outsideMonth: !isEqualMonth(date, month.value),
												})}
										{:else}
											<Calendar.Day class={getCalendarDayColorClass(date)} />
										{/if}
										</Calendar.Cell>
									{/each}
								</Calendar.GridRow>
							{/each}
						</Calendar.GridBody>
					</Calendar.Grid>
				</Calendar.Month>
			{/each}
		</Calendar.Months>
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
