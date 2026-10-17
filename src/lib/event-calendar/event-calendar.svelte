<script lang="ts">
  import { createCalendarInteraction } from "../internal/event-calendar/interaction.svelte.js";
  import { createCalendarViewport } from "../internal/event-calendar/viewport.svelte.js";
  import { onDestroy, flushSync, untrack } from "svelte";
  import { createAttachmentKey, fromAction } from "svelte/attachments";
  import { ScrollArea } from "bits-ui";
  import { parseDate } from "@internationalized/date";
  import { getCalendarDayColorClass } from "../internal/calendar/day-color.js";
  import { Button } from "../button/index.js";
  import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../dialog/index.js";
  import { cn } from "../utils.js";
  import { scrollbarVisibility } from "../scrollbar/scrollbar.js";
  import { backgroundSegments, addDays, addMonths, allDaySegments, calendarDates, civilString, civilTime, daySegments, monthWeeks, layoutTimelineEvents, visibleCalendarRange, eventsInCalendarRange, adjacentCalendarRanges } from "./layout.js";
  import EventCalendarToolbar from "./event-calendar-toolbar.svelte";
  import type { EventCalendarProps, EventCalendarEvent, EventCalendarRange } from "./types.js";

  let { date = $bindable(), view = $bindable("week"), onViewChange, dayCount, events = [], backgroundRanges = [], rows = [], timelineHourWidth = 64, weekStartsOn = 1, locale = "ja-JP", ariaLabel = "イベントカレンダー", startHour = 8, endHour = 20,
    step = 15, hourHeight = 48, eventMinHeight = 24, readonly = false, disabled = false, loading = false, error,
    currentTime, eventsLoading = false, eventsError, onEventsRetry, onVisibleRangeChange, onPrefetchRange, class: className, onDateChange, onCreate, onEventChange, onEventClick, eventContent, draft = null, layout = "content", toolbarFilters, toolbarActions, viewSwitcher
  }: EventCalendarProps = $props();
  const interaction = createCalendarInteraction({
    get grid() { return grid; },
    get viewport() { return viewport; },
    get isTimeline() { return isTimeline; },
    get effectiveTimelineHourWidth() { return effectiveTimelineHourWidth; },
    get effectiveHourHeight() { return effectiveHourHeight; },
    get step() { return step; },
    get config() { return config; },
    get date() { return date; },
    get days() { return days; },
    get canEdit() { return canEdit; },
    get events() { return events; },
    get onEventChange() { return onEventChange; },
    get onCreate() { return onCreate; },
    get onEventClick() { return onEventClick; },
    get view() { return view; },
    get preview() { return preview; },
    get eventMinHeight() { return eventMinHeight; },
    get disabled() { return disabled; },
    get loading() { return loading; },
    get timelineRows() { return timelineRows; },
    rangeLabel,
    allDayLabel,
  });
  const { touchSelection, begin, move, previewTimes, previewShape, cancel, finish, createAllDay, create, openDetails, eventKey } = interaction;

  const scroll = createCalendarViewport({
    get view() { return view; },
    get date() { return date; },
    get nowMinute() { return nowMinute; },
    get todayDate() { return todayDate; },
    get events() { return events; },
    get timelineRows() { return timelineRows; },
    get effectiveTimelineHourWidth() { return effectiveTimelineHourWidth; },
    get config() { return config; },
    get days() { return days; },
    get isTimeline() { return isTimeline; },
    get viewport() { return viewport; },
    get layout() { return layout; },
    get dayCount() { return dayCount; },
    get timelineBufferCount() { return timelineBufferCount; },
    get drag() { return interaction.drag; },
    changeDate,
  });
  const { stopNavigationAnimation, animateNavigation, measureTimeViewport, preserveTimePosition, fixedHeaderScroll, synchronizedDayScroll, measureMonthWeek, fitMonthViewport, observeTimelineScrollbar, horizontalScroll, continuousDateTimeline } = scroll;

  const horizontalViewportAttachments = { [createAttachmentKey()]: fromAction(horizontalScroll) };
  const dayViewportAttachments = {
    [createAttachmentKey()]: fromAction(fixedHeaderScroll),
    [createAttachmentKey()]: fromAction(preserveTimePosition, () => layout),
    [createAttachmentKey()]: fromAction(measureTimeViewport),
    [createAttachmentKey()]: fromAction(scrollbarVisibility, () => undefined),
  };
  const timelineViewportAttachments = {
    [createAttachmentKey()]: fromAction(continuousDateTimeline),
    [createAttachmentKey()]: fromAction(fixedHeaderScroll),
    [createAttachmentKey()]: fromAction(observeTimelineScrollbar),
    [createAttachmentKey()]: fromAction(scrollbarVisibility, () => undefined),
  };

  const effectiveHourHeight = $derived(layout === "fill" && (view === "day" || view === "week")
    ? Math.max(hourHeight, scroll.timeViewportHeight / (endHour - startHour)) : hourHeight);
  const config = $derived.by(() => {
    if (!Number.isInteger(startHour) || !Number.isInteger(endHour) || startHour < 0 || endHour > 24 || startHour >= endHour
      || !Number.isInteger(step) || step <= 0 || 60 % step !== 0 || !Number.isFinite(hourHeight) || hourHeight < 40 || !Number.isFinite(eventMinHeight) || eventMinHeight < 20)
      throw new RangeError("Invalid EventCalendar hours, step or hourHeight");
    if (new Set(backgroundRanges.map(range => range.id)).size !== backgroundRanges.length) throw new RangeError("Background range ids must be unique");
    if (new Set(events.map(event => event.id)).size !== events.length) throw new RangeError("Event ids must be unique");
    if (new Set(rows.map(row => row.id)).size !== rows.length || !Number.isFinite(timelineHourWidth) || timelineHourWidth < 48) throw new RangeError("Invalid timeline rows or hour width");
    return { from: startHour * 60, to: endHour * 60, height: (endHour - startHour) * effectiveHourHeight };
  });

  const timelineBufferCount = $derived(Math.max(35, (dayCount ?? 7) + 28, layout === "fill" ? Math.ceil(scroll.timelineViewportHeight / 48) + 28 : 0));

  const dateTimelineCount = $derived(scroll.dateTimelineRange ? Math.round((civilTime(scroll.dateTimelineRange.end + "T00:00") - civilTime(scroll.dateTimelineRange.start + "T00:00")) / 1440) : dayCount ?? 7);
  const isTimeline = $derived(view === "timeline" || view === "date-timeline");
  const displayDayCount = $derived(view === "date-timeline" ? dateTimelineCount : view === "day" || view === "week" ? dayCount ?? (view === "day" ? 1 : 7) : 1);
  const days = $derived(calendarDates(date, view === "date-timeline" ? dayCount ?? 7 : displayDayCount, view === "week" && dayCount === undefined ? weekStartsOn : undefined));
  const navigationUnit = $derived(view === "month" ? "月" : view === "week" && dayCount === undefined ? "週" : displayDayCount === 1 ? "日" : `${displayDayCount}日`);
  const timelineRows = $derived.by(() => {
    if (view === "date-timeline") return Array.from({ length: timelineBufferCount }, (_, i) => addDays(scroll.dateTimelineBufferStart || addDays(date, -14), i)).map(day => ({ id: undefined, label: dayLabel(day), date: day }));
    const result: { id: string | undefined; label: string; date: string }[] = rows.map(row => ({ ...row, date }));
    if (!rows.length || events.some(event => !rows.some(row => row.id === event.rowId))) result.push({ id: undefined, label: rows.length ? "未指定" : "予定", date });
    return result;
  });

  const minimumTimelineWidth = $derived((endHour - startHour) * timelineHourWidth);
  const timelineWidth = $derived(Math.max(minimumTimelineWidth, scroll.timelineAvailableWidth - 144));
  const effectiveTimelineHourWidth = $derived(timelineWidth / (endHour - startHour));
  const weeks = $derived(monthWeeks(date, weekStartsOn));
  const slots = $derived(Array.from({ length: (config.to - config.from) / step }, (_, i) => config.from + i * step));
  const canEdit = $derived(!readonly && !disabled && !loading && !eventsLoading && !eventsError && !draft);
  const visibleRange = $derived(visibleCalendarRange(date, view, view === "date-timeline" ? dateTimelineCount : dayCount, weekStartsOn));
  const visibleEvents = $derived(eventsInCalendarRange(events, visibleRange));
  let notifiedRange = "";
  let notifiedCallback: typeof onVisibleRangeChange;
  $effect(() => {
    const callback = onVisibleRangeChange;
    const range = visibleRange;
    const key = `${range.view}:${range.start}:${range.end}`;
    if (!callback || (key === notifiedRange && callback === notifiedCallback)) return;
    notifiedRange = key; notifiedCallback = callback;
    untrack(() => callback({ ...range }));
  });
  const adjacentRanges = $derived(adjacentCalendarRanges(date, view, view === "date-timeline" ? dateTimelineCount : dayCount, weekStartsOn));
  let notifiedPrefetch = "";
  let notifiedPrefetchCallback: typeof onPrefetchRange;
  $effect(() => {
    const callback = onPrefetchRange;
    const { previous, next } = adjacentRanges;
    const key = `${previous.view}:${previous.start}:${previous.end}:${next.start}:${next.end}`;
    if (!callback || (key === notifiedPrefetch && callback === notifiedPrefetchCallback)) return;
    notifiedPrefetch = key; notifiedPrefetchCallback = callback;
    untrack(() => callback({ previous: { ...previous }, next: { ...next } }));
  });
  let grid = $state<HTMLDivElement>(undefined!);
  let viewport = $state<HTMLDivElement | null>(null);
  function changeDate(value: string) {
    date = value;
    onDateChange?.(value);
  }
  function selectDate(value: string) {
    if (disabled || loading) return;
    resetNavigation();
    cancel();
    changeDate(value);
  }
  function goToToday() {
    const today = new Date();
    selectDate(todayDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
  }

  const monthRowHeight = $derived((scroll.monthHeight - 32 - (weeks.length - 1)) / weeks.length);

  let moreOpen = $state(false);
  let moreDay = $state("");
  let moreReturnFocus: HTMLElement | undefined;
  let pendingMoreEvent: EventCalendarEvent | undefined;
  const moreEvents = $derived(moreDay ? eventsOnDay(moreDay) : []);

  const touchSelectionAttachments = { [createAttachmentKey()]: fromAction(touchSelection) };

  const visibleTimedEvents = $derived(events.filter(event => !(interaction.drag?.moved && interaction.drag.event?.id === event.id)));
  const timedLayout = $derived(new Map(days.map(day => [day, daySegments(visibleTimedEvents, day, config.from, config.to, effectiveHourHeight, eventMinHeight)])));

  onDestroy(() => { stopNavigationAnimation(); cancel(); });

  function navigate(direction: -1 | 1) {
    if (disabled || loading) return;
    resetNavigation(); cancel();
    const next = view === "month" ? addMonths(date, direction) : addDays(date, direction * displayDayCount);
    flushSync(() => changeDate(next));
    animateNavigation(direction);
  }

  const preview: EventCalendarEvent | null = $derived(interaction.drag ? { id: "__draft", title: interaction.drag.event?.title ?? "新しい予定", color: interaction.drag.event?.color, start: civilString(interaction.drag.start), end: civilString(interaction.drag.end), rowId: interaction.drag.rowId }
    : draft);
  const allDayLayout = $derived(allDaySegments(preview?.allDay ? [...events, preview] : events, days));
  const formatter = $derived(new Intl.DateTimeFormat(locale, { day: "numeric", weekday: "short", timeZone: "UTC" }));
  function dayLabel(day: string) { return formatter.format(new Date(day + "T12:00:00Z")); }
  const monthFormatter = $derived(new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }));
  const weekLabel = $derived(monthFormatter.format(new Date((view === "month" ? date : days[0]) + "T12:00:00Z")));
  const weekdayShortFormatter = $derived(new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }));
  function timeLabel(value: number) { return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`; }
  const dateFormatter = $derived(new Intl.DateTimeFormat(locale, { month: "long", day: "numeric", timeZone: "UTC" }));
  const weekdayFormatter = $derived(new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }));
  function detailDateLabel(day: string) {
    const value = new Date(day + "T12:00:00Z");
    return `${dateFormatter.format(value)}(${weekdayFormatter.format(value)})`;
  }
  function detailTimeLabel(value: string) { return `${Number(value.slice(11, 13))}:${value.slice(14, 16)}`; }
  function rangeLabel(start: string, end: string) {
    const first = start.slice(0, 10), last = end.slice(0, 10);
    return `${detailDateLabel(first)}・${detailTimeLabel(start)}～${first === last ? "" : `${detailDateLabel(last)}・`}${detailTimeLabel(end)}`;
  }
  function allDayLabel(event: EventCalendarRange) {
    const lastDay = addDays(event.end, -1);
    return `${detailDateLabel(event.start)}${lastDay === event.start ? "" : `～${detailDateLabel(lastDay)}`}・終日`;
  }
  const todayDate = $derived(currentTime?.slice(0, 10) ?? "");
  const nowMarkerLeft = $derived(56 + days.indexOf(todayDate) * scroll.dayScrollWidth / days.length - scroll.dayScrollOffset);
  const nowMinute = $derived(currentTime ? civilTime(currentTime) % 1440 : -1);

  function changeView(value: string) {
    if (value !== "day" && value !== "week" && value !== "month" && value !== "timeline" && value !== "date-timeline") return;
    resetNavigation();
    cancel(); view = value; onViewChange?.(value);
  }
  function resetNavigation() {
    stopNavigationAnimation();
    scroll.resetDayScroll();
  }
  $effect(() => {
    void date; void view; void dayCount; void weekStartsOn;
    untrack(resetNavigation);
  });
  function monthEvents(day: string) {
    return daySegments(events, day, 0, 1440).map(segment => segment.event);
  }
  function eventsOnDay(day: string) {
    return [...events.filter(event => event.allDay && event.start <= day && event.end > day)
      .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title)), ...monthEvents(day)];
  }
  function monthDayLayout(day: string, segments: ReturnType<typeof allDaySegments>["segments"], index: number, fullLimit: number, overflowLimit: number) {
    const allDay = segments.filter(segment => segment.start <= index && segment.end > index);
    const timedEvents = monthEvents(day);
    const fitsAll = allDay.every(segment => segment.row < fullLimit) && allDay.length + timedEvents.length <= fullLimit;
    const limit = fitsAll ? fullLimit : overflowLimit;
    const visibleAllDay = allDay.filter(segment => segment.row < limit);
    const slots = Array.from({ length: limit }, (_, row) => row).filter(row => !visibleAllDay.some(segment => segment.row === row));
    const timed = timedEvents.slice(0, slots.length).map((event, i) => ({ event, row: slots[i] }));
    const hidden = allDay.filter(segment => segment.event !== preview && segment.row >= limit).length + timedEvents.length - timed.length;
    return { timed, hidden, limit };
  }
  function monthWeekLayout(week: string[]) {
    // 描画後は実際の日付セルを測る。均等割りの推定値はSSRの初期表示だけに使う。
    const height = scroll.monthWeekHeights[week[0]] ?? monthRowHeight;
    // 日付見出しの下に20pxの予定を24px間隔で配置し、下端に2pxを残す。
    // 全件が収まらない日だけ「他」の16pxと予定との2px間隔を確保する。
    const fullLimit = Math.max(0, Math.floor((height - 22) / 24));
    const overflowLimit = Math.max(0, Math.floor((height - 40) / 24));
    const allDay = allDaySegments(preview?.allDay ? [...events, preview] : events, week);
    const days = week.map((day, index) => monthDayLayout(day, allDay.segments, index, fullLimit, overflowLimit));
    const segments: typeof allDay.segments = [];
    for (const segment of allDay.segments) {
      if (segment.event === preview) { segments.push(segment); continue; }
      // 日ごとに表示行数が異なるため、終日予定は表示できる連続区間だけ描画する。
      let start: number | null = null;
      for (let index = segment.start; index <= segment.end; index++) {
        const visible = index < segment.end && segment.row < days[index].limit;
        if (visible && start === null) start = index;
        if (!visible && start !== null) {
          segments.push({ ...segment, start, end: index });
          start = null;
        }
      }
    }
    return { days, segments, overflowLimit };
  }

  function openMore(day: string, target: HTMLElement) {
    pendingMoreEvent = undefined;
    moreDay = day; moreReturnFocus = target; moreOpen = true;
  }
  function selectMoreEvent(event: EventCalendarEvent) {
    if (disabled || loading) return;
    pendingMoreEvent = event;
    moreOpen = false;
  }
  function closeMore(event: Event) {
    event.preventDefault();
    const target = moreReturnFocus?.isConnected ? moreReturnFocus : viewport;
    const selectedEvent = pendingMoreEvent;
    pendingMoreEvent = undefined;
    if (selectedEvent && target) {
      interaction.suppressClick = false;
      openDetails(selectedEvent, target);
    } else target?.focus();
  }

  function rowMatches(event: EventCalendarEvent, id: string | undefined) {
    return id === undefined ? !rows.some(row => row.id === event.rowId) : event.rowId === id;
  }
  function timelineLayout(row: { id: string | undefined; date: string }) {
    const rowEvents = view === "date-timeline" ? events : events.filter(event => rowMatches(event, row.id));
    const layout = layoutTimelineEvents(rowEvents, row.date, config.from, config.to, effectiveTimelineHourWidth);
    const previewTop = layout.segments.find(segment => segment.event.id === interaction.drag?.event?.id)?.top ?? 4;
    return { ...layout, previewTop, segments: layout.segments.filter(segment => !(interaction.drag?.moved && interaction.drag.event?.id === segment.event.id)) };
  }

</script>

<!-- Capture loss alone does not cancel: window listeners still receive the release. -->
<svelte:window onpointerdowncapture={(event) => { if (event.pointerType === "touch" && !event.isPrimary && interaction.drag?.pointerType === "touch") cancel(); }} onpointermove={move} onpointerupcapture={finish} onpointercancelcapture={cancel} onkeydown={(event) => { if (event.key === "Escape" && !(event.target as HTMLElement)?.closest?.('[role="dialog"], [role="listbox"]') && interaction.drag) { event.preventDefault(); resetNavigation(); cancel(); interaction.announcement = "操作をキャンセルしました"; } }} onblur={() => { resetNavigation(); cancel(); }} />

{#snippet rangeBackground(day: string, axis: "x" | "y" | "day", rowId: string | undefined = undefined)}
  {#each backgroundSegments(backgroundRanges, day, axis === "day" ? 0 : config.from, axis === "day" ? 1440 : config.to, rowId) as segment (segment.id)}
    <div class="range-background" data-slot="event-calendar-background-range" data-background-id={segment.id} aria-hidden="true"
      style:background-color={segment.color}
      style:top={axis === "y" ? `${(segment.start - config.from) / 60 * effectiveHourHeight}px` : "0"}
      style:height={axis === "y" ? `${(segment.end - segment.start) / 60 * effectiveHourHeight}px` : "100%"}
      style:left={axis === "x" ? `${(segment.start - config.from) / 60 * effectiveTimelineHourWidth}px` : "0"}
      style:width={axis === "x" ? `${(segment.end - segment.start) / 60 * effectiveTimelineHourWidth}px` : "100%"}></div>
  {/each}
{/snippet}

{#snippet timelinePage(pageRows: { id: string | undefined; label: string; date: string }[])}
          {#each pageRows as row, index (row.id === undefined ? `date:${row.date}` : `row:${row.id}`)}
            {@const layout = timelineLayout(row)}
            <div class="timeline-row" data-timeline-row={index} data-timeline-date={row.date} style:height={`${layout.height}px`}>
              <div class:today={view === "date-timeline" && row.date === todayDate} class="timeline-label timeline-row-label">
                <span class={view === "date-timeline" ? getCalendarDayColorClass(parseDate(row.date)) : undefined}>{row.label}</span>
                {#each layout.allDay as event (event.id)}
                  <button type="button" class="all-day-event timeline-all-day" data-all-day-event-id={event.id}
                    style:--event-color={event.color ?? "var(--primary)"} disabled={disabled || loading}
                    aria-label={`${event.title} ${allDayLabel(event)}`}
                    onclick={(click) => { if (click.detail === 0) interaction.suppressClick = false; openDetails(event, click.currentTarget); }}>
                    {#if eventContent}{@render eventContent(event)}{:else}<strong>{event.title}</strong>{/if}
                  </button>
                {/each}
              </div>
              <div class="timeline-track" style:width={`${timelineWidth}px`}>
                {@render rangeBackground(row.date, "x", row.id)}
                {#each slots as minutes}
                  <button type="button" class="timeline-slot" class:hour-line={minutes % 60 === 0}
                    style:left={`${(minutes - config.from) / 60 * effectiveTimelineHourWidth}px`} style:width={`${step / 60 * effectiveTimelineHourWidth}px`}
                    disabled={!canEdit || !onCreate} aria-label={`${row.date} ${timeLabel(minutes)} ${row.label}に予定を作成`}
                    onclick={(click) => { if (click.detail === 0) interaction.suppressClick = false; create(row.date, minutes, click.currentTarget, row.id); }}></button>
                {/each}
                {#each layout.segments as segment (segment.event.id)}
                  <div class="calendar-event timeline-event" data-event-id={segment.event.id} style:--event-color={segment.event.color ?? "var(--primary)"}
                    style:left={`${(segment.start - config.from) / 60 * effectiveTimelineHourWidth}px`} style:width={`${Math.max(24, (segment.end - segment.start) / 60 * effectiveTimelineHourWidth - 2)}px`} style:top={`${segment.top}px`} style:z-index={segment.zIndex}>
                    <button type="button" class="event-main" disabled={disabled || loading} aria-label={`${segment.event.title} ${segment.event.allDay ? allDayLabel(segment.event) : rangeLabel(segment.event.start, segment.event.end)}`}
                      onclick={(click) => { if (click.detail === 0) interaction.suppressClick = false; openDetails(segment.event, click.currentTarget); }} onkeydown={(key) => eventKey(key, segment.event)}>
                      {#if eventContent}{@render eventContent(segment.event)}{:else}<strong>{segment.event.title}</strong><span>{segment.event.allDay ? "終日" : `${detailTimeLabel(segment.event.start)}～${detailTimeLabel(segment.event.end)}`}</span>{/if}
                    </button>
                    {#if canEdit && !segment.event.allDay && segment.event.editable !== false && onEventChange}
                      {#if segment.startsHere}<button type="button" class="timeline-resize timeline-start" data-resize="start" aria-label={`${segment.event.title}の開始時刻を変更`} onclick={(click) => { if (click.detail === 0) interaction.suppressClick = false; openDetails(segment.event, click.currentTarget); }} onkeydown={(key) => eventKey(key, segment.event, "start")}></button>{/if}
                      {#if segment.endsHere}<button type="button" class="timeline-resize timeline-end" data-resize="end" aria-label={`${segment.event.title}の終了時刻を変更`} onclick={(click) => { if (click.detail === 0) interaction.suppressClick = false; openDetails(segment.event, click.currentTarget); }} onkeydown={(key) => eventKey(key, segment.event, "end")}></button>{/if}
                    {/if}
                  </div>
                {/each}
                {#if preview && !preview.allDay && (view === "date-timeline" ? preview.start.slice(0, 10) === row.date : rowMatches(preview, row.id)) && (interaction.drag?.moved || draft)}
                  {@const base = civilTime(row.date + "T00:00")}
                  {@const times = previewTimes()!}
                  <div class="drag-preview timeline-preview" style:top={`${layout.previewTop}px`} style:--event-color={preview.color ?? "var(--primary)"} style:left={`${Math.max(0, (times.start - base - config.from) / 60 * effectiveTimelineHourWidth)}px`}
                    style:width={`${Math.max(24, (times.end - times.start) / 60 * effectiveTimelineHourWidth)}px`}>
                    <strong>{preview.title}</strong><span>{detailTimeLabel(preview.start)}～{detailTimeLabel(preview.end)}</span>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
{/snippet}

<section data-slot="event-calendar" class:fill-layout={layout === "fill"} class={cn("overflow-hidden rounded-xl border bg-background text-foreground", className)} aria-label={ariaLabel} aria-busy={loading || eventsLoading}>
  <EventCalendarToolbar {date} {view} label={weekLabel} {navigationUnit} {dayCount} {displayDayCount}
    {locale} {weekStartsOn} {disabled} {loading} {readonly} {toolbarFilters} {toolbarActions} {viewSwitcher}
    onNavigate={navigate} onToday={goToToday} onDateChange={selectDate} onViewChange={changeView} />
  {#if error}<p role="alert" class="p-3 text-destructive">{error}</p>{/if}
  <div class="calendar-content">
  <div class="calendar-main">
  {#if eventsLoading}
    <div class="events-state" role="status" data-slot="event-calendar-events-state">予定を取得中…</div>
  {:else if eventsError}
    <div class="events-state" role="alert" data-slot="event-calendar-events-state">
      <span>{eventsError}</span>
      {#if onEventsRetry}<Button size="sm" variant="outline" disabled={disabled || loading} onclick={() => onEventsRetry?.({ ...visibleRange })}>再取得</Button>{/if}
    </div>
  {:else if !loading && visibleEvents.length === 0}
    <div class="events-state" role="status" data-slot="event-calendar-events-state">この期間に予定はありません</div>
  {/if}
  {#if isTimeline}
    <ScrollArea.Root type="auto">
    {#snippet child({ props })}
    <div {...props} class="calendar-frame" style:--calendar-overlay-top={`${scroll.fixedHeaderHeight}px`} role="region" aria-label={`${ariaLabel}のタイムライン`} data-slot="event-calendar-timeline">
      {#if scroll.timelineNowIndicator}<div class="timeline-now" class:has-marker={scroll.timelineNowIndicator.marker} aria-hidden="true" style:left={`${scroll.timelineNowIndicator.left}px`} style:top={`${scroll.timelineNowIndicator.top}px`} style:height={`${scroll.timelineNowIndicator.height}px`}></div>{/if}
      <div class="fixed-calendar-header">
        <div class="timeline-heading"><span class:today={view === "timeline" && date === todayDate} class={cn("timeline-label", view === "timeline" && getCalendarDayColorClass(parseDate(date)))}>{view === "date-timeline" ? "日付" : dayLabel(date)}</span><div class="timeline-hours" style:width={`${timelineWidth}px`}>
          {#each Array.from({ length: endHour - startHour }, (_, i) => startHour + i) as hour}
            <span style:left={`${(hour - startHour) * effectiveTimelineHourWidth}px`}>{String(hour).padStart(2, "0")}</span>
          {/each}
        </div></div>
      </div>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex: keyboard scrolling remains available without event controls -->
      <ScrollArea.Viewport bind:ref={() => viewport ?? null, (value) => viewport = value} {...timelineViewportAttachments} role="region" aria-label={`${ariaLabel}のタイムラインの時間枠`} tabindex={0} class={cn("calendar-viewport timeline-viewport mutsuna-scrollbar mutsuna-scrollbar--auto", view === "date-timeline" && "date-timeline")} data-slot="event-calendar-timeline-scroll">
      <div class="timeline-sheet" style:width={`${144 + timelineWidth}px`}>
        <div class="timeline-pages">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div bind:this={grid} class="timeline-rows" style:--event-top-layer={events.length + 2} onpointerdown={begin} {...touchSelectionAttachments} oncontextmenu={(event) => { if (interaction.drag?.pointerType === "touch") event.preventDefault(); }}>
          {@render timelinePage(timelineRows)}
        </div>
        </div>
      </div>
    </ScrollArea.Viewport>
    {#if view !== "date-timeline"}{@render verticalScrollbar()}{/if}
    </div>
    {/snippet}
    </ScrollArea.Root>
  {:else if view === "month"}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div bind:this={() => viewport, (value) => viewport = value ?? null} use:fitMonthViewport={layout} use:scrollbarVisibility style:height={layout === "fill" ? undefined : `${scroll.monthHeight}px`} role="region" aria-label={`${ariaLabel}の月表示`} tabindex="0" class="calendar-viewport month-viewport mutsuna-scrollbar" data-slot="event-calendar-month">
      <div class="month-sheet">
        <div class="month-weekdays">{#each weeks[0] as day}
          <span class={getCalendarDayColorClass(parseDate(day))}>{weekdayShortFormatter.format(new Date(day + "T12:00:00Z"))}</span>
        {/each}</div>
        <div class="month-pages"><div class="day-scroll-track"><div class="day-scroll-stage">
        <div class="month-dates">
        {#each weeks as week (week[0])}
          {@const weekLayout = monthWeekLayout(week)}
          <div class="month-week" use:measureMonthWeek={week[0]}>
            {#each week as day, index}
              {@const dayLayout = weekLayout.days[index]}
              <div class="month-day" style:grid-column={index + 1} class:outside-month={day.slice(0, 7) !== date.slice(0, 7)} data-month-day={day}>
                {@render rangeBackground(day, "day")}
                <button type="button" class="month-empty" aria-label={`${day}に終日予定を作成`} disabled={!canEdit || !onCreate}
                  onclick={(event) => createAllDay(day, event.currentTarget)}></button>
                <span class:today={day === todayDate} class={cn("month-date", getCalendarDayColorClass(parseDate(day)))}>{Number(day.slice(8))}</span>
                  {#each dayLayout.timed as item (item.event.id)}
                    {@const event = item.event}
                    <button type="button" class="month-event" style:top={`${24 + item.row * 24}px`} style:--event-color={event.color ?? "var(--primary)"} disabled={disabled || loading}
                      aria-label={`${event.title} ${rangeLabel(event.start, event.end)}`} onclick={(click) => { interaction.suppressClick = false; openDetails(event, click.currentTarget); }}>
                      {#if eventContent}{@render eventContent(event)}{:else}<span class="month-event-time">{event.start.slice(0, 10) === day ? detailTimeLabel(event.start) : "継続"}</span><strong>{event.title}</strong>{/if}
                    </button>
                  {/each}
                {#if dayLayout.hidden > 0}
                  <button type="button" class="month-more" disabled={disabled || loading} aria-label={`${detailDateLabel(day)}の予定を全件表示、他${dayLayout.hidden}件`}
                    onclick={(click) => openMore(day, click.currentTarget)}>他{dayLayout.hidden}件</button>
                {/if}
              </div>
            {/each}
            {#each weekLayout.segments as segment (`${segment.event.id}:${segment.start}`)}
              {#if segment.event === preview}
                <div class="all-day-event month-all-day all-day-preview" style:grid-column={`${segment.start + 1} / ${segment.end + 1}`}
                  style:top={`${24 + Math.min(segment.row, Math.max(0, weekLayout.overflowLimit - 1)) * 24}px`} style:--event-color="var(--primary)"><strong>{segment.event.title}</strong></div>
              {:else}
                <button type="button" class="all-day-event month-all-day" style:grid-column={`${segment.start + 1} / ${segment.end + 1}`}
                  style:top={`${24 + segment.row * 24}px`} style:--event-color={segment.event.color ?? "var(--primary)"} disabled={disabled || loading}
                  aria-label={`${segment.event.title} ${allDayLabel(segment.event)}`} onclick={(click) => { interaction.suppressClick = false; openDetails(segment.event, click.currentTarget); }}>
                  {#if eventContent}{@render eventContent(segment.event)}{:else}<strong>{segment.event.title}</strong>{/if}
                </button>
              {/if}
            {/each}
          </div>
        {/each}
      </div>

        </div></div></div>
      </div>
    </div>
  {:else}
  <ScrollArea.Root type="auto">
  {#snippet child({ props })}
  <div {...props} class="calendar-frame" style:--calendar-overlay-top={`${scroll.fixedHeaderHeight}px`}>
  <div class="fixed-calendar-header">
    <div class="calendar-sheet" style:--day-count={days.length} style:--calendar-min-width={`${Math.max(280, 56 + days.length * 100)}px`}>
      <div class="calendar-headings">
      <div class="day-headings">
        <span aria-hidden="true"></span>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex: native keyboard scrolling of the date range -->
        <div class="day-scroll-lane day-heading-lane day-scroller" role="region" aria-label={`${ariaLabel}の日付の横スクロール`} tabindex="0" use:synchronizedDayScroll><div class="day-scroll-track"><div class="day-scroll-stage">
          <div class="day-heading-track">{#each days as day}<div class:today={day === todayDate} class={cn("day-heading", getCalendarDayColorClass(parseDate(day)))}>{dayLabel(day)}</div>{/each}</div>

        </div></div></div>
      </div>
      <div class="all-day-row" data-slot="event-calendar-all-day">
        <span class="all-day-label">終日</span>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex: native keyboard scrolling of all-day dates -->
        <div class="day-scroll-lane day-scroller" role="region" aria-label={`${ariaLabel}の終日予定の横スクロール`} tabindex="0" use:synchronizedDayScroll><div class="day-scroll-track"><div class="day-scroll-stage"><div class="all-day-grid" style:grid-template-rows={`repeat(${allDayLayout.rows}, 24px)`}>
          <div class="all-day-slots">{#each days as day}
            <button type="button" class="all-day-slot" disabled={!canEdit || !onCreate}
              aria-label={`${day}に終日予定を作成`} onclick={(event) => createAllDay(day, event.currentTarget)}></button>
          {/each}</div>
          {#each allDayLayout.segments as segment (segment.event.id)}
            {#if segment.event === preview}
              <div class="all-day-event all-day-preview" style:grid-column={`${segment.start + 1} / ${segment.end + 1}`}
                style:grid-row={segment.row + 1} style:--event-color="var(--primary)"><strong>{segment.event.title}</strong></div>
            {:else}
            <button type="button" class="all-day-event" data-all-day-event-id={segment.event.id}
              style:grid-column={`${segment.start + 1} / ${segment.end + 1}`} style:grid-row={segment.row + 1}
              style:--event-color={segment.event.color ?? "var(--primary)"} disabled={disabled || loading}
              aria-label={`${segment.event.title} ${allDayLabel(segment.event)}`}
              onclick={(event) => { interaction.suppressClick = false; openDetails(segment.event, event.currentTarget); }}>
              {#if eventContent}{@render eventContent(segment.event)}{:else}<strong>{segment.event.title}</strong>{/if}
            </button>
            {/if}
          {/each}
        </div>

        </div></div></div>
      </div>
      </div>
    </div>
  </div>
  <!-- Keyboard focus lets users scroll even when every control is disabled. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex: keyboard scrolling remains available without event controls -->
  <ScrollArea.Viewport bind:ref={() => viewport ?? null, (value) => viewport = value} {...dayViewportAttachments} role="region" aria-label={`${ariaLabel}の時間枠`} tabindex={0} class="calendar-viewport mutsuna-scrollbar mutsuna-scrollbar--auto" data-slot="event-calendar-viewport">
    <div class="calendar-sheet" style:--day-count={days.length} style:--calendar-min-width={`${Math.max(280, 56 + days.length * 100)}px`}>
      <div class="time-body">
        <div class="time-axis" style:height={`${config.height}px`} aria-hidden="true">
          {#each Array.from({ length: endHour - startHour }, (_, i) => startHour + i) as hour}
            <span style:top={`${(hour - startHour) * effectiveHourHeight}px`}>{String(hour).padStart(2, "0")}</span>
          {/each}
        </div>
        {#if days.includes(todayDate) && nowMinute >= config.from && nowMinute < config.to && nowMarkerLeft >= 56 && nowMarkerLeft <= 56 + scroll.dayViewportWidth}
          <div class="now-marker" aria-hidden="true" style:left={`${nowMarkerLeft - 4}px`} style:top={`${(nowMinute - config.from) / 60 * effectiveHourHeight - 3}px`} style:z-index={events.length + 6}></div>
        {/if}
        <div class="day-scroll-lane day-scroller mutsuna-scrollbar mutsuna-scrollbar--auto" role="region" aria-label={`${ariaLabel}の時間枠の横スクロール`} tabindex="0" use:synchronizedDayScroll use:scrollbarVisibility data-slot="event-calendar-day-scroll"><div class="day-scroll-track"><div class="day-scroll-stage">
        <!-- The grid delegates pointer gestures from its focusable slot/event buttons. -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div bind:this={grid} class="week-grid" data-slot="event-calendar-grid" style:--event-top-layer={events.length + 2} style:height={`${config.height}px`}
          onpointerdown={begin} {...touchSelectionAttachments} oncontextmenu={(event) => { if (interaction.drag?.pointerType === "touch") event.preventDefault(); }}>
          {#each days as day}
            <div class="day-column" data-day={day}>
              {@render rangeBackground(day, "y")}
              {#each slots as minutes}
                <button type="button" class="time-slot" class:hour-line={minutes % 60 === 0 && minutes !== config.from}
                  style:top={`${(minutes - config.from) / 60 * effectiveHourHeight}px`} style:height={`${step / 60 * effectiveHourHeight}px`}
                  disabled={!canEdit || !onCreate} aria-label={`${day} ${timeLabel(minutes)}に予定を作成`} onclick={(event) => { if (event.detail === 0) interaction.suppressClick = false; create(day, minutes, event.currentTarget); }}></button>
              {/each}
              {#each timedLayout.get(day) ?? [] as segment (segment.event.id)}
                <div class="calendar-event" data-event-id={segment.event.id} style:top={`${(segment.start - config.from) / 60 * effectiveHourHeight}px`}
                  style:height={`${segment.height}px`} style:left={`calc(${segment.left * 100}% + 2px)`}
                  style:width={`calc(${segment.width * 100}% - 4px)`} style:z-index={segment.zIndex} style:--event-color={segment.event.color ?? "var(--primary)"}>
                  <button type="button" class="event-main" class:compact={segment.height < 40} class:multiline={segment.height >= 56} disabled={disabled || loading}
                    aria-label={`${segment.event.title} ${rangeLabel(segment.event.start, segment.event.end)}`}
                    onclick={(event) => { if (event.detail === 0) interaction.suppressClick = false; openDetails(segment.event, event.currentTarget); }} onkeydown={(key) => eventKey(key, segment.event)}>
                    {#if eventContent}{@render eventContent(segment.event)}{:else}
                      <strong>{segment.event.title}</strong>
                      {#if segment.height >= 40}<span>{segment.event.start.slice(11)} – {segment.event.end.slice(11)}</span>{/if}
                    {/if}
                  </button>
                  {#if canEdit && segment.event.editable !== false && onEventChange}
                    {#if segment.startsHere}<button type="button" class="resize-handle resize-start" data-resize="start" aria-label={`${segment.event.title}の開始時刻を変更`} onclick={(event) => { if (event.detail === 0) interaction.suppressClick = false; openDetails(segment.event, event.currentTarget); }} onkeydown={(key) => eventKey(key, segment.event, "start")}></button>{/if}
                    {#if segment.endsHere}<button type="button" class="resize-handle resize-end" data-resize="end" aria-label={`${segment.event.title}の終了時刻を変更`} onclick={(event) => { if (event.detail === 0) interaction.suppressClick = false; openDetails(segment.event, event.currentTarget); }} onkeydown={(key) => eventKey(key, segment.event, "end")}></button>{/if}
                  {/if}
                </div>
              {/each}
              {#if preview && (interaction.drag?.moved || draft)}
                {@const shape = previewShape(day)}
                {#if shape}
                  <div class="drag-preview" style:--event-color={preview.color ?? "var(--primary)"} class:compact={shape.height < 40} style:top={`${shape.top}px`} style:height={`${shape.height}px`}>
                    <strong>{preview.title}</strong>
                    {#if shape.height >= 40}<span>{preview.start.slice(11)} – {preview.end.slice(11)}</span>{/if}
                  </div>
                {/if}
              {/if}
              {#if day === todayDate && nowMinute >= config.from && nowMinute < config.to}<div class="now-line" style:top={`${(nowMinute - config.from) / 60 * effectiveHourHeight}px`} aria-hidden="true"></div>{/if}
            </div>
          {/each}
        </div>

        </div></div></div>
      </div>
    </div>
  </ScrollArea.Viewport>
  {@render verticalScrollbar()}
  </div>
  {/snippet}
  </ScrollArea.Root>
  {/if}
  {#if view !== "month" && (isTimeline ? scroll.timelineAvailableWidth > 0 && 144 + timelineWidth > scroll.timelineAvailableWidth + 1 : scroll.dayScrollWidth > scroll.dayViewportWidth + 1)}
    <ScrollArea.Root type="auto">
      {#snippet child({ props })}
        <div {...props} class="calendar-horizontal-scrollbar" style:left={`${isTimeline ? 144 : 56}px`}>
          <!-- svelte-ignore a11y_no_noninteractive_tabindex: keyboard scrolling remains available without event controls -->
          <ScrollArea.Viewport {...horizontalViewportAttachments} role="region" aria-label={isTimeline ? "時間軸の横スクロール" : `${ariaLabel}の横スクロール`} tabindex={0}
            class={cn("horizontal-scroll-proxy", isTimeline && "timeline-horizontal-scroll")}>
            <div style:width={`${isTimeline ? timelineWidth : scroll.dayScrollWidth}px`} style:height="1px"></div>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="horizontal">
            {#snippet child({ props })}
              <div {...props} class="calendar-overlay-horizontal">
                <ScrollArea.Thumb>{#snippet child({ props })}<div {...props} class="calendar-overlay-thumb"></div>{/snippet}</ScrollArea.Thumb>
              </div>
            {/snippet}
          </ScrollArea.Scrollbar>
        </div>
      {/snippet}
    </ScrollArea.Root>
  {/if}
  </div>
  </div>
  <p class="sr-only" role="status" aria-live="polite">{interaction.announcement}</p>
</section>

<Dialog bind:open={moreOpen}>
  <DialogContent class="md:min-w-0 md:w-[26rem]" onCloseAutoFocus={closeMore}>
    <DialogTitle class="pr-8 tabular-nums">{moreDay ? detailDateLabel(moreDay) : "予定一覧"}</DialogTitle>
    <DialogDescription class="tabular-nums">{moreEvents.length}件の予定</DialogDescription>
    <div class="mutsuna-scrollbar mt-4 flex max-h-[60vh] flex-col gap-2 overflow-y-auto" use:scrollbarVisibility>
      {#each moreEvents as event (event.id)}
        <button type="button" class="month-list-event" style:--event-color={event.color ?? "var(--primary)"} disabled={disabled || loading}
          onclick={() => selectMoreEvent(event)}>
          <strong>{event.title}</strong><span class="text-xs tabular-nums">{event.allDay ? "終日" : rangeLabel(event.start, event.end)}</span>
        </button>
      {/each}
    </div>
  </DialogContent>
</Dialog>


{#snippet verticalScrollbar()}
  <ScrollArea.Scrollbar orientation="vertical">
    {#snippet child({ props })}
      <div {...props} class="calendar-overlay-scrollbar">
        <ScrollArea.Thumb>
          {#snippet child({ props })}<div {...props} class="calendar-overlay-thumb"></div>{/snippet}
        </ScrollArea.Thumb>
      </div>
    {/snippet}
  </ScrollArea.Scrollbar>
{/snippet}

<style>
  .calendar-overlay-scrollbar { top: var(--calendar-overlay-top, 0px) !important; width: 10px; padding: 2px; display: flex; z-index: 100; opacity: 0; transition: opacity 180ms; }
  .calendar-frame:hover .calendar-overlay-scrollbar, .calendar-frame:focus-within .calendar-overlay-scrollbar,
  .calendar-frame:has(:global([data-scrollbar-state])) .calendar-overlay-scrollbar { opacity: 1; }
  .calendar-overlay-thumb { flex: 1; border-radius: 9999px; background: color-mix(in oklch, var(--primary) 72%, transparent); }
  .fill-layout { display: flex; flex-direction: column; min-height: 0; }
  .fill-layout > .calendar-content, .fill-layout .calendar-main { display: flex; flex-direction: column; flex: 1; min-height: 0; }
  .fill-layout .calendar-frame { flex: 1; max-height: none; }
  .fill-layout .calendar-frame :global(.calendar-viewport) { flex: 1; max-height: none; }
  .fill-layout .calendar-frame :global(.date-timeline) { height: auto; min-height: 0; }
  .fill-layout .month-viewport { flex: 1; min-height: 0; max-height: none; }

  .calendar-frame:not(:has(.timeline-viewport)) .calendar-sheet { min-width: 0; }
  .day-scroller { overflow-x: auto; overflow-y: hidden; overflow-anchor: none; overscroll-behavior-x: contain; }
  .day-scroller { scrollbar-width: none; scrollbar-gutter: auto; }
  .day-scroller::-webkit-scrollbar { display: none; }
  .day-scroll-track, .day-scroll-stage { position: relative; width: var(--day-scroll-width, 100%); }
  .month-pages > .day-scroll-track, .month-pages .day-scroll-stage { height: 100%; }
  .range-background { position: absolute; z-index: -1; pointer-events: none; }
  .timeline-track, .month-day { isolation: isolate; }
  .events-state { position: absolute; bottom: 8px; left: 8px; right: 8px; width: fit-content; max-width: calc(100% - 16px); z-index: 100; display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--background); color: var(--muted-foreground); font-size: 12px; box-shadow: 0 1px 4px #0001; }
  .timeline-sheet { font-variant-numeric: tabular-nums; }
  .timeline-heading, .timeline-row { display: flex; }
  .timeline-heading { position: relative; width: max-content; min-width: 100%; height: 36px; background: var(--background); border-bottom: 1px solid var(--border); }
  .timeline-label { position: sticky; left: 0; z-index: 10; flex-shrink: 0; width: 144px; padding: 10px; overflow-wrap: anywhere; font-size: 12px; background: var(--background); box-shadow: 1px 0 var(--border); }
  .timeline-row-label { display: flex; flex-direction: column; gap: 4px; padding-block: 8px; line-height: 16px; }
  .timeline-row-label .timeline-all-day { flex-shrink: 0; height: 20px; margin-inline: 0; }
  .timeline-hours { position: relative; flex-shrink: 0; font-size: 11px; }
  .timeline-hours span { position: absolute; top: 10px; padding-left: 4px; }
  .timeline-pages { position: relative; overflow: clip; }
  .calendar-frame :global(.date-timeline) { height: min(636px, calc(100dvh - 180px)); min-height: 144px; touch-action: pan-x pan-y pinch-zoom; overscroll-behavior-y: contain; overflow-anchor: none; }
  .calendar-frame :global(.date-timeline) { scrollbar-width: none; scrollbar-gutter: auto; }
  .calendar-frame :global(.date-timeline::-webkit-scrollbar) { display: none; }
  .calendar-horizontal-scrollbar { position: absolute !important; right: 0; bottom: 0; height: 10px; z-index: 100; opacity: 0; transition: opacity 180ms; }
  .calendar-main:hover .calendar-horizontal-scrollbar, .calendar-main:focus-within .calendar-horizontal-scrollbar,
  .calendar-main:has(:global([data-scrollbar-state])) .calendar-horizontal-scrollbar { opacity: 1; }
  .calendar-horizontal-scrollbar :global(.horizontal-scroll-proxy) { overflow-x: auto !important; overflow-y: hidden !important; scrollbar-width: none; scrollbar-gutter: auto; }
  .calendar-horizontal-scrollbar :global(.horizontal-scroll-proxy::-webkit-scrollbar) { display: none; }
  .calendar-overlay-horizontal { height: 10px; padding: 2px; display: flex; }
  .calendar-overlay-horizontal .calendar-overlay-thumb { flex: none; }
  .calendar-frame :global(.date-timeline .timeline-rows) { touch-action: pan-x pan-y pinch-zoom; }
  .calendar-frame :global(.date-timeline [data-event-id]) { touch-action: pan-x pan-y pinch-zoom; }
  .timeline-rows { touch-action: pan-x pan-y pinch-zoom; user-select: none; }
  .timeline-row:not(:last-child) { border-bottom: 1px solid var(--border); }
  .timeline-track { position: relative; flex-shrink: 0; isolation: isolate; }
  .timeline-slot { position: absolute; top: 0; height: 100%; cursor: default; }
  .timeline-slot.hour-line { border-left: 1px solid var(--border); }
  .timeline-event { bottom: 4px; }
  .timeline-resize { position: absolute; top: 0; width: 6px; height: 100%; cursor: ew-resize; z-index: 3; }
  .timeline-start { left: 0; } .timeline-end { right: 0; }
  .timeline-resize:hover { background: var(--event-color); }
  .drag-preview.timeline-preview { inset-inline: auto; bottom: 4px; }
  .timeline-preview strong { line-height: 14px; }
  .timeline-preview span { font-size: 10px; line-height: 14px; white-space: nowrap; }
  .timeline-now { position: absolute; width: 2px; transform: translateX(-1px); background: var(--destructive); pointer-events: none; z-index: 40; }
  .timeline-now.has-marker::before { content: ""; position: absolute; top: -4px; left: -3px; width: 8px; height: 8px; border-radius: 50%; background: var(--destructive); }
  .calendar-main { isolation: isolate; position: relative; min-width: 0; overflow: hidden; }
  .calendar-frame { position: relative; display: flex; flex-direction: column; max-height: 42rem; min-height: 0; }
  .fixed-calendar-header { overflow: hidden; flex-shrink: 0; }
  .calendar-frame > :global(.calendar-viewport) { min-height: 0; }
  .calendar-frame > :global(.timeline-viewport) { max-height: calc(42rem - 36px); }
  .month-sheet { min-width: 0; width: 100%; height: 100%; display: flex; flex-direction: column; font-variant-numeric: tabular-nums; }
  .month-weekdays, .month-week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
  .month-weekdays { height: 32px; flex-shrink: 0; align-items: center; background: var(--background); border-bottom: 1px solid var(--border); text-align: center; font-size: 12px; }
  .month-week { position: relative; flex: 1; min-height: 0; border-bottom: 1px solid var(--border); }
  .month-week:last-child { border-bottom: 0; }
  .month-day { grid-row: 1; position: relative; min-width: 0; min-height: 0; height: 100%; border-right: 1px solid var(--border); padding: 2px; }
  .month-day:nth-child(7) { border-right: 0; }
  .month-empty { position: absolute; inset: 0; width: 100%; height: 100%; cursor: default; }
  .month-date { position: relative; display: block; width: fit-content; margin-inline: auto; padding: 0 6px; font-size: 12px; line-height: 20px; pointer-events: none; border-radius: 4px; }
  .outside-month { background: color-mix(in srgb, var(--muted) 35%, var(--background)); }
  .outside-month .month-date { color: var(--muted-foreground); }
  .month-event { position: absolute; inset-inline: 2px; height: 20px; display: flex; align-items: center; gap: 4px; min-width: 0; overflow: hidden; padding: 2px 4px; border-radius: 4px; font-size: 11px; text-align: left; white-space: nowrap; background: color-mix(in srgb, var(--event-color) 16%, var(--background)); cursor: pointer; }
  .month-more { position: absolute; bottom: 2px; left: 2px; max-width: calc(100% - 4px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; line-height: 16px; font-weight: 600; cursor: pointer; }
  .month-list-event { display: flex; flex-direction: column; gap: 4px; padding: 8px; border-radius: 5px; text-align: left; overflow-wrap: anywhere; background: color-mix(in srgb, var(--event-color) 16%, var(--background)); cursor: pointer; }
  .month-event-time { flex-shrink: 0; }
  .month-event strong { overflow: hidden; text-overflow: clip; }
  .month-all-day { grid-row: 1; align-self: start; height: 20px; z-index: 2; }
  .day-heading, .time-axis, .all-day-event, .event-main, .drag-preview { font-variant-numeric: tabular-nums; }
  .calendar-frame :global(.calendar-viewport), .month-viewport { max-height: 42rem; overflow: auto; overflow-anchor: none; overscroll-behavior-x: none; transition: transform 180ms ease-out; }
  @media (prefers-reduced-motion: reduce) { .calendar-frame :global(.calendar-viewport), .month-viewport { transition: none; } }
  .calendar-frame :global(.calendar-viewport:not(.timeline-viewport)), .month-viewport { touch-action: pan-x pan-y pinch-zoom; }
  .calendar-viewport.month-viewport { max-height: none; overflow: hidden; scrollbar-gutter: auto; touch-action: pan-x pan-y pinch-zoom; }
  .calendar-frame :global([data-scroll-area-viewport]) { overflow: auto !important; }
  .month-pages { position: relative; flex: 1; min-height: 0; overflow: hidden; }
  .month-dates { height: 100%; display: flex; flex-direction: column; }
  .calendar-sheet { min-width: var(--calendar-min-width); }
  .calendar-headings { position: relative; z-index: 20; background: var(--background); }
  .day-headings { display: flex; border-bottom: 1px solid var(--border); }
  .day-headings > span { width: 56px; flex-shrink: 0; }
  .day-scroll-lane { position: relative; flex: 1; min-width: 0; }
  .day-heading-track { display: grid; grid-template-columns: repeat(var(--day-count), minmax(0, 1fr)); }
  .day-headings > span, .all-day-label, .time-axis { position: sticky; left: 0; z-index: 5; background: var(--background); box-shadow: 1px 0 var(--border); }
  .all-day-row { display: flex; border-bottom: 1px solid var(--border); }
  .all-day-label { width: 56px; flex-shrink: 0; padding: 8px; text-align: right; font-size: 11px; color: var(--muted-foreground); }
  .all-day-grid { position: relative; flex: 1; display: grid; grid-template-columns: repeat(var(--day-count), minmax(0, 1fr)); row-gap: 4px; padding-block: 4px; }
  .all-day-slots { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(var(--day-count), minmax(0, 1fr)); }
  .all-day-slot { border-left: 1px solid var(--border); cursor: default; }
  .all-day-preview { display: flex; align-items: center; pointer-events: none; }
  .all-day-event { position: relative; min-width: 0; margin-inline: 2px; padding: 0 6px; text-align: left; overflow: hidden; white-space: nowrap; border-radius: 5px; background: color-mix(in srgb, var(--event-color) 16%, var(--background)); font-size: 12px; cursor: pointer; }
  .day-heading { padding: 14px 4px; text-align: center; font-size: 13px; border-left: 1px solid var(--border); }
  .today { font-weight: 700; background: color-mix(in srgb, var(--primary) 8%, var(--background)); }
  .time-body { position: relative; display: flex; }
  .time-axis { width: 56px; flex-shrink: 0; }
  .time-axis span { position: absolute; right: 8px; font-size: 11px; color: var(--muted-foreground); }
  .week-grid { flex: 1; display: grid; grid-template-columns: repeat(var(--day-count), minmax(0, 1fr)); touch-action: pan-x pan-y pinch-zoom; user-select: none; }
  .day-column { isolation: isolate; position: relative; border-left: 1px solid var(--border); }
  .time-slot { position: absolute; width: 100%; cursor: default; }
  .time-slot.hour-line { border-top: 1px solid var(--border); }
  .calendar-event { touch-action: pan-x pan-y pinch-zoom; position: absolute; z-index: 2; border-radius: 5px; background: color-mix(in srgb, var(--event-color) 16%, var(--background)); box-shadow: 0 0 0 1px var(--background); color: var(--foreground); }
  .event-main { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: stretch; text-align: left; overflow: hidden; padding: 6px; font-size: 12px; cursor: grab; border-radius: 3px; }
  .event-main.compact { padding: 0 6px; justify-content: center; }
  .event-main.compact strong { text-overflow: clip; }
  .event-main strong { flex-shrink: 0; line-height: 14px; overflow: hidden; text-overflow: clip; white-space: nowrap; }
  .event-main.multiline strong { max-height: 28px; white-space: normal; overflow-wrap: anywhere; }
  .event-main span { flex-shrink: 0; font-size: 10px; white-space: nowrap; }
  .resize-handle { position: absolute; left: 0; width: 100%; height: 6px; cursor: ns-resize; z-index: 3; border-radius: 3px; }
  .resize-start { top: 0; } .resize-end { bottom: 0; }
  .resize-handle:hover { background: var(--event-color); }
  button:focus-visible { outline: 2px solid var(--ring); outline-offset: -2px; z-index: 10; }
  .calendar-event:focus-within { z-index: calc(var(--event-top-layer) + 1) !important; }
  .drag-preview { position: absolute; inset-inline: 2px; z-index: calc(var(--event-top-layer) + 2); pointer-events: none; padding: 5px; display: flex; flex-direction: column; overflow: hidden; border-radius: 5px; background: color-mix(in srgb, var(--event-color) 16%, var(--background)); font-size: 12px; }
  .drag-preview.compact { padding: 0 4px; justify-content: center; line-height: 14px; }
  .drag-preview.compact strong { text-overflow: clip; }
  .drag-preview strong { flex-shrink: 0; overflow: hidden; text-overflow: clip; white-space: nowrap; }
  .now-line { position: absolute; width: 100%; height: 2px; pointer-events: none; z-index: calc(var(--event-top-layer) + 3); }
  .now-marker { position: absolute; width: 8px; height: 8px; border-radius: 50%; background: var(--destructive); pointer-events: none; }
  .now-line::after { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--destructive); }
</style>
