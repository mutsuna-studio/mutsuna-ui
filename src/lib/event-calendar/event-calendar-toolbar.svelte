<script lang="ts">
  import { parseDate, type DateValue } from "@internationalized/date";
  import { Calendar } from "../calendar/index.js";
  import { Button } from "../button/index.js";
  import { ButtonGroup } from "../button-group/index.js";
  import { Popover, PopoverTrigger, PopoverContent } from "../popover/index.js";
  import { Select, SelectTrigger, SelectContent, SelectItem } from "../select/index.js";
  import type { EventCalendarProps, EventCalendarView } from "./types.js";

  let { date, view, label, navigationUnit, dayCount, displayDayCount, locale, weekStartsOn,
    disabled, loading, readonly, toolbarFilters, toolbarActions, viewSwitcher, onNavigate, onToday, onDateChange, onViewChange
  }: Pick<EventCalendarProps, "date" | "dayCount" | "locale" | "weekStartsOn" | "disabled" | "loading" | "readonly" | "toolbarFilters" | "toolbarActions" | "viewSwitcher"> & {
    view: EventCalendarView;
    label: string;
    navigationUnit: string;
    displayDayCount: number;
    onNavigate: (direction: -1 | 1) => void;
    onToday: () => void;
    onDateChange: (date: string) => void;
    onViewChange: (value: string) => void;
  } = $props();
  let datePickerOpen = $state(false);
  let datePickerPlaceholder = $state<DateValue>(parseDate("2000-01-01"));
  function changeDatePickerOpen(open: boolean) {
    datePickerOpen = open && !disabled && !loading;
    if (datePickerOpen) datePickerPlaceholder = parseDate(date);
  }
  function selectDate(value: DateValue | undefined) {
    if (!value || disabled || loading) return;
    onDateChange(value.toString());
    datePickerOpen = false;
  }
</script>

  <header class="flex flex-wrap items-center justify-between gap-3 border-b p-3">
    <div class="flex flex-wrap items-center gap-2">
      <ButtonGroup aria-label="表示範囲の切り替え">
        <Button variant="outline" size="sm" disabled={disabled || loading} onclick={onToday}>今日</Button>
        <Button variant="outline" size="sm" aria-label={`前の${navigationUnit}`} disabled={disabled || loading} onclick={() => onNavigate(-1)}>‹</Button>
        <Button variant="outline" size="sm" aria-label={`次の${navigationUnit}`} disabled={disabled || loading} onclick={() => onNavigate(1)}>›</Button>
      </ButtonGroup>
      <h2>
        <Popover bind:open={() => datePickerOpen, changeDatePickerOpen}>
          <PopoverTrigger>
            {#snippet child({ props })}
              <Button {...props} variant="ghost" size="sm" class="text-base font-semibold tabular-nums" aria-label={`日付を選択: ${label}`} disabled={disabled || loading}>{label}</Button>
            {/snippet}
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start">
            <Calendar type="single" value={parseDate(date)} bind:placeholder={datePickerPlaceholder} {locale} {weekStartsOn} captionLayout="dropdown" fixedWeeks={false} onValueChange={selectDate} />
          </PopoverContent>
        </Popover>
      </h2>
      {@render toolbarFilters?.()}
    </div>
    <div class="flex flex-wrap items-center gap-2">
      {#if loading || readonly}<span class="text-sm text-muted-foreground">{loading ? "読み込み中…" : "閲覧のみ"}</span>{/if}
      {@render toolbarActions?.()}
      {#if viewSwitcher}
        {@render viewSwitcher()}
      {:else}
      <Select type="single" value={view} onValueChange={onViewChange} disabled={disabled || loading}>
        <SelectTrigger aria-label="カレンダーの表示" class={view === "date-timeline" ? "w-44" : "w-36"}>{view === "date-timeline" ? "日付タイムライン" : view === "timeline" ? "タイムライン" : view === "month" ? "月表示" : dayCount !== undefined ? `${displayDayCount}日表示` : view === "day" ? "日表示" : "週表示"}</SelectTrigger>
        <SelectContent><SelectItem value="day">日表示</SelectItem><SelectItem value="week">週表示</SelectItem><SelectItem value="month">月表示</SelectItem><SelectItem value="timeline">タイムライン</SelectItem><SelectItem value="date-timeline">日付タイムライン</SelectItem></SelectContent>
      </Select>
      {/if}
    </div>
  </header>
