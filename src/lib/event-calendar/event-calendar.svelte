<script lang="ts">
  import { onDestroy, flushSync, untrack, tick } from "svelte";
  import { createAttachmentKey, fromAction } from "svelte/attachments";
  import { ScrollArea } from "bits-ui";
  import { parseDate } from "@internationalized/date";
  import { getCalendarDayColorClass } from "../calendar/calendar-day-color.js";
  import { Button } from "../button/index.js";
  import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../dialog/index.js";
  import { cn } from "../utils.js";
  import { scrollbarVisibility } from "../scrollbar/scrollbar.js";
  import { backgroundSegments, addDays, addMonths, allDaySegments, calendarDates, civilString, civilTime, daySegments, monthWeeks, layoutTimelineEvents, visibleCalendarRange, eventsInCalendarRange, adjacentCalendarRanges } from "./layout.js";
  import EventCalendarToolbar from "./event-calendar-toolbar.svelte";
  import type { EventCalendarProps, EventCalendarEvent, EventCalendarChange, EventCalendarRange, EventCalendarVisibleRange } from "./types.js";

  let { date = $bindable(), view = $bindable("week"), onViewChange, dayCount, events = [], backgroundRanges = [], rows = [], timelineHourWidth = 64, weekStartsOn = 1, locale = "ja-JP", ariaLabel = "イベントカレンダー", startHour = 8, endHour = 20,
    step = 15, hourHeight = 48, eventMinHeight = 24, readonly = false, disabled = false, loading = false, error,
    currentTime, eventsLoading = false, eventsError, onEventsRetry, onVisibleRangeChange, onPrefetchRange, class: className, onDateChange, onCreate, onEventChange, onEventClick, eventContent, draft = null, layout = "content", toolbarFilters, toolbarActions, viewSwitcher
  }: EventCalendarProps = $props();
  let fixedHeaderHeight = $state(0);
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
  let timeViewportHeight = $state(0);
  const effectiveHourHeight = $derived(layout === "fill" && (view === "day" || view === "week")
    ? Math.max(hourHeight, timeViewportHeight / (endHour - startHour)) : hourHeight);
  const config = $derived.by(() => {
    if (!Number.isInteger(startHour) || !Number.isInteger(endHour) || startHour < 0 || endHour > 24 || startHour >= endHour
      || !Number.isInteger(step) || step <= 0 || 60 % step !== 0 || !Number.isFinite(hourHeight) || hourHeight < 40 || !Number.isFinite(eventMinHeight) || eventMinHeight < 20)
      throw new RangeError("Invalid EventCalendar hours, step or hourHeight");
    if (new Set(backgroundRanges.map(range => range.id)).size !== backgroundRanges.length) throw new RangeError("Background range ids must be unique");
    if (new Set(events.map(event => event.id)).size !== events.length) throw new RangeError("Event ids must be unique");
    if (new Set(rows.map(row => row.id)).size !== rows.length || !Number.isFinite(timelineHourWidth) || timelineHourWidth < 48) throw new RangeError("Invalid timeline rows or hour width");
    return { from: startHour * 60, to: endHour * 60, height: (endHour - startHour) * effectiveHourHeight };
  });
  let timelineViewportHeight = $state(0);
  const timelineBufferCount = $derived(Math.max(35, (dayCount ?? 7) + 28, layout === "fill" ? Math.ceil(timelineViewportHeight / 48) + 28 : 0));
  let dateTimelineRange = $state<EventCalendarVisibleRange>();
  let dateTimelineBufferStart = $state("");
  const dateTimelineCount = $derived(dateTimelineRange ? Math.round((civilTime(dateTimelineRange.end + "T00:00") - civilTime(dateTimelineRange.start + "T00:00")) / 1440) : dayCount ?? 7);
  const isTimeline = $derived(view === "timeline" || view === "date-timeline");
  const displayDayCount = $derived(view === "date-timeline" ? dateTimelineCount : view === "day" || view === "week" ? dayCount ?? (view === "day" ? 1 : 7) : 1);
  const days = $derived(calendarDates(date, view === "date-timeline" ? dayCount ?? 7 : displayDayCount, view === "week" && dayCount === undefined ? weekStartsOn : undefined));
  const navigationUnit = $derived(view === "month" ? "月" : view === "week" && dayCount === undefined ? "週" : displayDayCount === 1 ? "日" : `${displayDayCount}日`);
  const timelineRows = $derived.by(() => {
    if (view === "date-timeline") return Array.from({ length: timelineBufferCount }, (_, i) => addDays(dateTimelineBufferStart || addDays(date, -14), i)).map(day => ({ id: undefined, label: dayLabel(day), date: day }));
    const result: { id: string | undefined; label: string; date: string }[] = rows.map(row => ({ ...row, date }));
    if (!rows.length || events.some(event => !rows.some(row => row.id === event.rowId))) result.push({ id: undefined, label: rows.length ? "未指定" : "予定", date });
    return result;
  });
  let timelineAvailableWidth = $state(0);
  const minimumTimelineWidth = $derived((endHour - startHour) * timelineHourWidth);
  const timelineWidth = $derived(Math.max(minimumTimelineWidth, timelineAvailableWidth - 144));
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
  const monthEventLimit = 3;
  let monthHeight = $state(480);
  const monthRowHeight = $derived((monthHeight - 32 - (weeks.length - 1)) / weeks.length);
  // Cards start at 24px and are 20px tall with a 24px pitch. Keep
  // 18px for “more” plus a 2px gap; the last card has no trailing 4px gap.
  const monthVisibleLimit = $derived(Math.min(monthEventLimit, Math.max(0, Math.floor((monthRowHeight - 40) / 24))));
  let moreOpen = $state(false);
  let moreDay = $state("");
  let moreReturnFocus: HTMLElement | undefined;
  let pendingMoreEvent: EventCalendarEvent | undefined;
  const moreEvents = $derived(moreDay ? eventsOnDay(moreDay) : []);
  let announcement = $state("");
  type Drag = { pointer: number; pointerType: string; kind: "create" | EventCalendarChange["kind"]; event?: EventCalendarEvent;
    anchor: number; originalStart: number; originalEnd: number; start: number; end: number;
    visualAnchor: number; visualStart: number; visualEnd: number;
    x: number; y: number; moved: boolean; armed: boolean; origin: HTMLElement; rowId?: string; originalRowId?: string };
  let drag = $state<Drag | null>(null);
  let suppressClick = false;
  let touchHoldTimer: ReturnType<typeof setTimeout> | undefined;
  const touchSelectionAttachments = { [createAttachmentKey()]: fromAction(touchSelection) };
  function touchSelection(element: HTMLElement) {
    // Native scrolling wins until a stationary long press arms selection.
    const move = (event: TouchEvent) => {
      if (event.touches.length !== 1) { cancel(); return; }
      if (drag?.pointerType === "touch" && drag.armed) event.preventDefault();
    };
    element.addEventListener("touchmove", move, { passive: false });
    return { destroy() { element.removeEventListener("touchmove", move); cancel(); } };
  }
  const dayScrollers = new Set<HTMLElement>();
  let dayScrollWidth = $state(0);
  let dayScrollOffset = $state(0);
  let dayViewportWidth = $state(0);
  let timelineNowIndicator = $state<{ left: number; top: number; height: number; marker: boolean } | null>(null);
  const visibleTimedEvents = $derived(events.filter(event => !(drag?.moved && drag.event?.id === event.id)));
  const timedLayout = $derived(new Map(days.map(day => [day, daySegments(visibleTimedEvents, day, config.from, config.to, effectiveHourHeight, eventMinHeight)])));
  let navigationAnimations: Animation[] = [];
  function stopNavigationAnimation() {
    for (const animation of navigationAnimations) animation.cancel();
    navigationAnimations = [];
  }
  onDestroy(() => { stopNavigationAnimation(); cancel(); });
  function animateNavigation(direction: -1 | 1) {
    const root = viewport?.closest('[data-slot="event-calendar"]');
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const vertical = view === "month" || view === "date-timeline";
    const selector = view === "month" ? ".month-dates" : view === "date-timeline" ? ".timeline-rows" : view === "timeline" ? ".timeline-track" : ".day-heading-track, .all-day-grid, .week-grid";
    for (const element of root.querySelectorAll<HTMLElement>(selector)) {
      const transform = getComputedStyle(element).transform;
      const base = transform === "none" ? "" : transform;
      const distance = direction * 24;
      const animation = element.animate([
        { transform: `${vertical ? "translateY" : "translateX"}(${distance}px) ${base}`, opacity: 0 },
        { transform: base || "none", opacity: 1 }
      ], { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" });
      navigationAnimations.push(animation);
      const cleanup = () => {
        navigationAnimations = navigationAnimations.filter(item => item !== animation);
        if (!navigationAnimations.length && view === "date-timeline") viewport?.dispatchEvent(new Event("scroll"));
      };
      animation.onfinish = cleanup;
      animation.oncancel = cleanup;
    }
  }
  function navigate(direction: -1 | 1) {
    if (disabled || loading) return;
    resetNavigation(); cancel();
    const next = view === "month" ? addMonths(date, direction) : addDays(date, direction * displayDayCount);
    flushSync(() => changeDate(next));
    animateNavigation(direction);
  }
  function frameResizeObserver(callback: () => void) {
    let frame: number | undefined;
    const observer = new ResizeObserver(() => {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => { frame = undefined; callback(); });
    });
    return {
      observe: (element: Element) => observer.observe(element),
      disconnect() { observer.disconnect(); if (frame !== undefined) cancelAnimationFrame(frame); }
    };
  }
  function measureTimeViewport(surface: HTMLDivElement) {
    const measure = () => { timeViewportHeight = surface.clientHeight; };
    measure();
    const observer = frameResizeObserver(measure);
    observer.observe(surface);
    return { destroy() { observer.disconnect(); timeViewportHeight = 0; } };
  }
  function preserveTimePosition(surface: HTMLDivElement, mode: EventCalendarProps["layout"]) {
    const candidate = surface.closest('.calendar-frame')?.querySelector<HTMLElement>('.calendar-headings');
    if (!candidate) return;
    const element: HTMLElement = candidate;
    let previousHeight: number | undefined;
    function compensate() {
      const height = element.getBoundingClientRect().height;
      const headingHeight = element.querySelector(".day-headings")?.getBoundingClientRect().height ?? 0;
      // The fixed header uses its own space. Retain enough body scroll range
      // to keep time labels anchored when the all-day row count changes.
      surface.style.maxHeight = mode === "fill" ? "" : `min(calc(42rem - ${height}px), ${config.height - Math.max(0, height - headingHeight - 33)}px)`;
      if (previousHeight === undefined) {
        // Anchor the time grid to the minimum all-day row, including on first render.
        surface.scrollTop += Math.max(0, height - headingHeight - 33);
      } else {
        surface.scrollTop += height - previousHeight;
      }
      previousHeight = height;
    }
    const observer = frameResizeObserver(compensate);
    observer.observe(element);
    observer.observe(surface);
    return { update(value: EventCalendarProps["layout"]) { mode = value; compensate(); }, destroy() { observer.disconnect(); } };
  }
  function fixedHeaderScroll(surface: HTMLDivElement) {
    const header = surface.closest('.calendar-frame')?.querySelector<HTMLElement>('.fixed-calendar-header');
    if (!header) return;
    function forwardWheel(event: WheelEvent) {
      if (event.ctrlKey) return;
      if (!surface.classList.contains("timeline-viewport") && Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? surface.clientHeight : 1;
      surface.scrollTop += event.deltaY * unit;
      if (surface.classList.contains("timeline-viewport")) surface.scrollLeft += event.deltaX * unit;
      if (event.cancelable) event.preventDefault();
    }
    header.addEventListener("wheel", forwardWheel, { passive: false });
    function sync() {
      fixedHeaderHeight = header!.getBoundingClientRect().height;
      header!.style.marginRight = `${surface.offsetWidth - surface.clientWidth}px`;
      header!.scrollLeft = surface.scrollLeft;
      if (surface.classList.contains("timeline-viewport")) {
        const frame = surface.closest(".calendar-frame")!.getBoundingClientRect();
        const body = surface.getBoundingClientRect();
        const rows = Array.from(surface.querySelectorAll<HTMLElement>("[data-timeline-date]"))
          .filter(row => row.dataset.timelineDate === todayDate);
        const first = rows[0];
        const last = rows.at(-1);
        const track = first?.querySelector<HTMLElement>(".timeline-track");
        if (first && track && last && nowMinute >= config.from && nowMinute < config.to) {
          const start = first.getBoundingClientRect().top;
          const end = Math.min(last.getBoundingClientRect().bottom, body.top + surface.clientHeight);
          const top = Math.max(start, body.top);
          const left = track.getBoundingClientRect().left + (nowMinute - config.from) / 60 * effectiveTimelineHourWidth;
          timelineNowIndicator = end > top && left >= body.left + 144 && left < body.left + surface.clientWidth
            ? { left: left - frame.left, top: top - frame.top, height: end - top, marker: start >= body.top - .5 } : null;
        } else timelineNowIndicator = null;
      }
    }
    $effect(() => { void view; void date; void nowMinute; void events; void timelineRows; void effectiveTimelineHourWidth; void config; tick().then(sync); });
    const observer = frameResizeObserver(sync);
    observer.observe(surface);
    surface.addEventListener('scroll', sync);
    sync();
    return { destroy() { observer.disconnect(); surface.removeEventListener('scroll', sync); header!.removeEventListener('wheel', forwardWheel); } };
  }
  /** Only scroll the selected days; range navigation belongs to the toolbar. */
  function synchronizedDayScroll(element: HTMLElement) {
    function measure() {
      const width = Math.max(element.clientWidth, Math.max(280, 56 + days.length * 100) - 56);
      element.style.setProperty("--day-scroll-width", `${width}px`);
      if (element.dataset.slot === "event-calendar-day-scroll") {
        dayScrollWidth = width;
        dayViewportWidth = element.clientWidth;
        dayScrollOffset = element.scrollLeft;
      }
    }
    function sync() {
      dayScrollOffset = element.scrollLeft;
      for (const other of dayScrollers) {
        if (other !== element && Math.abs(other.scrollLeft - element.scrollLeft) > .5) other.scrollLeft = element.scrollLeft;
      }
    }
    dayScrollers.add(element);
    measure();
    $effect(() => { void days.length; untrack(measure); });
    element.addEventListener("scroll", sync, { passive: true });
    const observer = frameResizeObserver(measure); observer.observe(element);
    return { destroy() { observer.disconnect(); element.removeEventListener("scroll", sync); dayScrollers.delete(element); } };
  }
  const preview: EventCalendarEvent | null = $derived(drag ? { id: "__draft", title: drag.event?.title ?? "新しい予定", color: drag.event?.color, start: civilString(drag.start), end: civilString(drag.end), rowId: drag.rowId }
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
  const nowMarkerLeft = $derived(56 + days.indexOf(todayDate) * dayScrollWidth / days.length - dayScrollOffset);
  const nowMinute = $derived(currentTime ? civilTime(currentTime) % 1440 : -1);
  function point(x: number, y: number, boundary = false, continuous = false) {
    const rect = grid.getBoundingClientRect();
    if (isTimeline) {
      const units = (x - rect.left - 144) / effectiveTimelineHourWidth * 60 / step;
      const minutes = (continuous ? units : boundary ? Math.round(units) : Math.floor(units)) * step + config.from;
      return civilTime((rowAt(y)?.date ?? date) + "T00:00") + Math.max(config.from, Math.min(config.to - (boundary || continuous ? 0 : step), minutes));
    }
    const day = Math.max(0, Math.min(days.length - 1, Math.floor((x - rect.left) / (rect.width / days.length))));
    const units = (y - rect.top) / effectiveHourHeight * 60 / step;
    const minutes = (continuous ? units : boundary ? Math.round(units) : Math.floor(units)) * step + config.from;
    return civilTime(days[day] + "T00:00") + Math.max(config.from, Math.min(config.to - (boundary || continuous ? 0 : step), minutes));
  }
  function begin(event: PointerEvent) {
    if (!viewport) return;
    if (!event.isPrimary) { if (event.pointerType === "touch") cancel(); return; }
    if (event.button !== 0) return;
    cancel();
    suppressClick = false;
    if (!canEdit) return;
    const target = event.target as HTMLElement;
    if (isTimeline && target.closest(".timeline-label")) return;
    const eventEl = target.closest<HTMLElement>("[data-event-id]");
    const item = eventEl ? events.find(item => item.id === eventEl.dataset.eventId) : undefined;
    if (item && (item.allDay || item.editable === false || !onEventChange)) return;
    if (!item && !onCreate) return;
    const edge = target.closest<HTMLElement>("[data-resize]")?.dataset.resize;
    const anchor = point(event.clientX, event.clientY, Boolean(edge));
    const start = item ? civilTime(item.start) : anchor;
    const end = item ? civilTime(item.end) : anchor + step;
    const kind = item ? (edge === "start" ? "resize-start" : edge === "end" ? "resize-end" : "move") : "create";
    drag = { pointer: event.pointerId, pointerType: event.pointerType, kind, event: item, anchor, originalStart: start, originalEnd: end,
      visualAnchor: point(event.clientX, event.clientY, false, true), visualStart: start, visualEnd: end,
      start, end, x: event.clientX, y: event.clientY, moved: false, armed: event.pointerType !== "touch", origin: target.closest<HTMLElement>("button") ?? viewport,
      rowId: view === "timeline" ? rowAt(event.clientY)?.id : item?.rowId, originalRowId: item?.rowId };
    if (event.pointerType === "touch") {
      touchHoldTimer = setTimeout(() => {
        touchHoldTimer = undefined;
        if (!drag || drag.pointer !== event.pointerId || !canEdit) { cancel(); return; }
        drag.armed = true;
        drag.moved = true;
        grid.setPointerCapture(event.pointerId);
        announcement = "範囲を選択できます。指を動かして終了時刻を選んでください。";
      }, 450);
    }
  }
  function move(event: PointerEvent) {
    if (!viewport) return;
    if (!drag || drag.pointer !== event.pointerId) return;
    if (!canEdit) { cancel(); return; }
    if (!drag.armed) {
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) >= 8) { cancel(); suppressClick = true; }
      return;
    }
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 4 && !drag.moved) return;
    if (!drag.moved) grid.setPointerCapture(event.pointerId);
    drag.moved = true;
    const rect = viewport.getBoundingClientRect();
    if (event.clientY < rect.top + 40) viewport.scrollTop -= 16;
    if (event.clientY > rect.bottom - 40) viewport.scrollTop += 16;
    if (isTimeline) {
      if (event.clientX < rect.left + 180) viewport.scrollLeft -= 16;
      if (event.clientX > rect.right - 40) viewport.scrollLeft += 16;
    }
    updateDragRange(event.clientX, event.clientY);
    event.preventDefault();
  }
  function updateDragRange(x: number, y: number) {
    if (!drag) return;
    const current = point(x, y, drag.kind.startsWith("resize"));
    const visual = point(x, y, false, true);
    const visualDelta = visual - drag.visualAnchor;
    if (drag.kind === "create") {
      // Creation is confined to the anchor day; moving existing events can cross days.
      const base = Math.floor(drag.anchor / 1440) * 1440;
      // Keep the pointer's time of day when it crosses into another day column.
      const pointerMinutes = current - Math.floor(current / 1440) * 1440;
      const position = base + Math.max(config.from, Math.min(config.to - step, pointerMinutes));
      drag.start = Math.min(drag.anchor, position); drag.end = Math.max(drag.anchor, position) + step;
      const rect = grid.getBoundingClientRect();
      const visualMinutes = config.from + (isTimeline ? (x - rect.left - 144) / effectiveTimelineHourWidth : (y - rect.top) / effectiveHourHeight) * 60;
      const visualPosition = base + Math.max(config.from, Math.min(config.to, visualMinutes));
      drag.visualStart = Math.min(drag.visualAnchor, visualPosition);
      drag.visualEnd = Math.max(drag.visualAnchor, visualPosition);
    } else if (drag.kind === "move") {
      drag.start = drag.originalStart + current - drag.anchor;
      drag.end = drag.originalEnd + current - drag.anchor;
      drag.visualStart = drag.originalStart + visualDelta;
      drag.visualEnd = drag.originalEnd + visualDelta;
      if (view === "timeline") drag.rowId = rowAt(y)?.id;
    } else if (drag.kind === "resize-start") {
      drag.start = Math.min(drag.originalStart + current - drag.anchor, drag.end - step);
      drag.visualStart = Math.min(drag.originalStart + visualDelta, drag.originalEnd - step);
    } else {
      drag.end = Math.max(drag.originalEnd + current - drag.anchor, drag.start + step);
      drag.visualEnd = Math.max(drag.originalEnd + visualDelta, drag.originalStart + step);
    }
  }
  function previewTimes() {
    if (preview?.allDay) return null;
    return drag ? { start: drag.visualStart, end: drag.visualEnd }
      : preview ? { start: civilTime(preview.start), end: civilTime(preview.end) } : null;
  }
  function previewShape(day: string) {
    const times = previewTimes();
    if (!times) return null;
    const base = civilTime(day + "T00:00");
    const start = Math.max(config.from, times.start - base), end = Math.min(config.to, times.end - base);
    if (end < start || times.end <= base + config.from || times.start >= base + config.to) return null;
    const height = Math.max(eventMinHeight, (end - start) / 60 * effectiveHourHeight);
    return { top: (start - config.from) / 60 * effectiveHourHeight, height: Math.min(height, config.height - (start - config.from) / 60 * effectiveHourHeight) };
  }
  function cancel() {
    clearTimeout(touchHoldTimer);
    touchHoldTimer = undefined;
    const previous = drag;
    suppressClick = Boolean(previous?.moved); drag = null;
    if (previous && grid.hasPointerCapture(previous.pointer)) grid.releasePointerCapture(previous.pointer);
  }
  function finish(event: PointerEvent) {
    if (!drag || drag.pointer !== event.pointerId) return;
    const armed = drag.armed;
    if (armed && (drag.moved || Math.hypot(event.clientX - drag.x, event.clientY - drag.y) >= 4)) {
      drag.moved = true;
      updateDragRange(event.clientX, event.clientY);
    }
    const result = drag;
    cancel();
    if (!canEdit) return;
    const range = { start: civilString(result.start), end: civilString(result.end), ...(view === "timeline" ? { rowId: result.rowId } : {}) };
    // A small motion can cross two slot buttons without reaching the drag
    // threshold. The browser then emits no slot click, so complete creation here.
    if (result.kind === "create") { suppressClick = true; openCreation(range, result.origin); return; }
    if (!armed || !result.moved) return;
    else if (result.event && (result.start !== result.originalStart || result.end !== result.originalEnd || result.rowId !== result.originalRowId))
      onEventChange?.({ event: result.event, kind: result.kind, ...range });
    announcement = `予定を変更: ${rangeLabel(range.start, range.end)}`;
  }
  function openCreation(range: EventCalendarRange & { allDay?: boolean; rowId?: string }, target: HTMLElement) {
    onCreate?.(range, { trigger: target });
    announcement = `作成範囲を選択: ${range.allDay ? allDayLabel(range) : rangeLabel(range.start, range.end)}`;
  }
  function createAllDay(day: string, target: HTMLElement) {
    if (!canEdit || !onCreate) return;
    suppressClick = false;
    openCreation({ start: day, end: addDays(day, 1), allDay: true }, target);
  }
  function changeView(value: string) {
    if (value !== "day" && value !== "week" && value !== "month" && value !== "timeline" && value !== "date-timeline") return;
    resetNavigation();
    cancel(); view = value; onViewChange?.(value);
  }
  function resetNavigation() {
    stopNavigationAnimation();
    for (const element of dayScrollers) element.scrollLeft = 0;
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
  function monthDayLayout(day: string, segments: ReturnType<typeof allDaySegments>["segments"], index: number) {
    const visibleAllDay = segments.filter(segment => segment.row < monthVisibleLimit && segment.start <= index && segment.end > index);
    const slots = Array.from({ length: monthVisibleLimit }, (_, row) => row).filter(row => !visibleAllDay.some(segment => segment.row === row));
    const timed = monthEvents(day).slice(0, slots.length).map((event, i) => ({ event, row: slots[i] }));
    return { timed, hidden: Math.max(0, eventsOnDay(day).length - visibleAllDay.filter(segment => segment.event !== preview).length - timed.length) };
  }
  function fitMonthViewport(element: HTMLDivElement, mode: EventCalendarProps["layout"]) {
    function resize() {
      // Size the whole month from its actual screen position, including headers
      // and surrounding app content, rather than fixing the height of each week.
      monthHeight = mode === "fill" ? element.clientHeight : Math.max(0, Math.floor(window.innerHeight - element.getBoundingClientRect().top - 16));
    }
    resize();
    const observer = frameResizeObserver(resize);
    observer.observe(element.parentElement!);
    observer.observe(element);
    window.addEventListener("resize", resize);
    return { update(value: EventCalendarProps["layout"]) { mode = value; resize(); }, destroy() { observer.disconnect(); window.removeEventListener("resize", resize); } };
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
      suppressClick = false;
      openDetails(selectedEvent, target);
    } else target?.focus();
  }
  function create(day: string, minutes: number, target: HTMLElement, rowId: string | undefined = undefined) {
    if (suppressClick || !canEdit || !onCreate) return;
    const start = civilTime(day + "T00:00") + minutes;
    openCreation({ start: civilString(start), end: civilString(start + step), ...(view === "timeline" ? { rowId } : {}) }, target);
  }
  function openDetails(event: EventCalendarEvent, target: HTMLElement) {
    if (suppressClick || disabled || loading) return;
    onEventClick?.(event, { trigger: target });
    announcement = `予定を選択: ${event.title}`;
  }
  function observeTimelineScrollbar(element: HTMLElement) {
    function resize() {
      timelineAvailableWidth = element.clientWidth;
    }
    resize();
    const observer = frameResizeObserver(resize);
    observer.observe(element);
    return { destroy() { observer.disconnect(); timelineAvailableWidth = 0; } };
  }
  function horizontalScroll(element: HTMLElement) {
    $effect(() => {
      const body = isTimeline ? viewport : viewport?.querySelector<HTMLElement>('[data-slot="event-calendar-day-scroll"]');
      if (!body) return;
      const fromBody = () => { if (Math.abs(element.scrollLeft - body.scrollLeft) > .5) element.scrollLeft = body.scrollLeft; };
      const fromBar = () => { if (Math.abs(body.scrollLeft - element.scrollLeft) > .5) body.scrollLeft = element.scrollLeft; };
      fromBody();
      body.addEventListener("scroll", fromBody, { passive: true });
      element.addEventListener("scroll", fromBar, { passive: true });
      return () => { body.removeEventListener("scroll", fromBody); element.removeEventListener("scroll", fromBar); };
    });
  }
  function continuousDateTimeline(element: HTMLElement) {
    timelineViewportHeight = element.clientHeight;
    let frame: number | undefined;
    let generation = 0;
    let aligning = true;
    let scrollDate = "";
    let lastEvents: readonly EventCalendarEvent[] | undefined;
    let lastCount: number | undefined;
    let lastBufferCount: number | undefined;
    function measure() {
      if (view !== "date-timeline" || aligning || drag?.moved || navigationAnimations.length) return;
      if (layout === "fill" && timelineViewportHeight !== element.clientHeight) {
        timelineViewportHeight = element.clientHeight;
        schedule();
        return;
      }
      const bounds = element.getBoundingClientRect();
      const visible = Array.from(element.querySelectorAll<HTMLElement>("[data-timeline-date]")).filter(row => {
        const rect = row.getBoundingClientRect();
        return rect.bottom > bounds.top + 1 && rect.top < bounds.top + element.clientHeight - 1;
      });
      if (!visible.length) return;
      const first = visible[0], start = first.dataset.timelineDate!;
      const end = addDays(visible[visible.length - 1].dataset.timelineDate!, 1);
      if (date !== start) {
        scrollDate = start;
        flushSync(() => changeDate(start));
      }
      const index = timelineRows.findIndex(row => row.date === start);
      if (index < 7 || index > timelineRows.length - 14) {
        const offset = first.getBoundingClientRect().top - bounds.top;
        aligning = true;
        flushSync(() => dateTimelineBufferStart = addDays(start, -14));
        const anchor = element.querySelector<HTMLElement>(`[data-timeline-date="${start}"]`);
        if (anchor) element.scrollTop += anchor.getBoundingClientRect().top - bounds.top - offset;
        aligning = false;
      }
      if (dateTimelineRange?.start !== start || dateTimelineRange.end !== end) dateTimelineRange = { start, end, view: "date-timeline" };
    }
    function schedule() {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => { frame = undefined; measure(); });
    }
    // Preserve the first visible date and its pixel offset when the bounded
    // date window is rebased or fetched events change row heights.
    $effect.pre(() => {
      const value = date, mode = view, currentEvents = events, currentCount = dayCount, currentBufferCount = timelineBufferCount;
      if (mode !== "date-timeline") { scrollDate = ""; return; }
      untrack(() => {
        if (value === scrollDate && currentEvents === lastEvents && currentCount === lastCount && currentBufferCount === lastBufferCount) return;
        const before = element.querySelector<HTMLElement>(`[data-timeline-date="${value}"]`);
        const offset = value === scrollDate && before && currentBufferCount === lastBufferCount ? before.getBoundingClientRect().top - element.getBoundingClientRect().top : 0;
        lastEvents = currentEvents; lastCount = currentCount; lastBufferCount = currentBufferCount;
        dateTimelineBufferStart = addDays(value, -14);
        const id = ++generation;
        aligning = true;
        void tick().then(() => {
          if (id !== generation || view !== "date-timeline") return;
          const anchor = element.querySelector<HTMLElement>(`[data-timeline-date="${value}"]`);
          if (anchor) element.scrollTop += anchor.getBoundingClientRect().top - element.getBoundingClientRect().top - offset;
          scrollDate = value;
          aligning = false;
          measure();
        });
      });
    });
    element.addEventListener("scroll", schedule, { passive: true });
    const observer = frameResizeObserver(schedule);
    observer.observe(element);
    return { destroy() { generation++; element.removeEventListener("scroll", schedule); observer.disconnect(); if (frame !== undefined) cancelAnimationFrame(frame); } };
  }
  function rowAt(y: number) {
    const elements = Array.from(grid.querySelectorAll<HTMLElement>("[data-timeline-row]"));
    const index = elements.findIndex(element => y < element.getBoundingClientRect().bottom);
    return timelineRows[index < 0 ? timelineRows.length - 1 : index];
  }
  function rowMatches(event: EventCalendarEvent, id: string | undefined) {
    return id === undefined ? !rows.some(row => row.id === event.rowId) : event.rowId === id;
  }
  function timelineLayout(row: { id: string | undefined; date: string }) {
    const rowEvents = view === "date-timeline" ? events : events.filter(event => rowMatches(event, row.id));
    const layout = layoutTimelineEvents(rowEvents, row.date, config.from, config.to, effectiveTimelineHourWidth);
    const previewTop = layout.segments.find(segment => segment.event.id === drag?.event?.id)?.top ?? 4;
    return { ...layout, previewTop, segments: layout.segments.filter(segment => !(drag?.moved && drag.event?.id === segment.event.id)) };
  }
  function eventKey(key: KeyboardEvent, event: EventCalendarEvent, edge: "start" | "end" | undefined = undefined) {
    if (!key.altKey || !canEdit || event.editable === false || !onEventChange) return;
    if (isTimeline) {
      if (event.allDay) return;
      const delta = key.key === "ArrowLeft" ? -step : key.key === "ArrowRight" ? step : 0;
      const rowDelta = !edge && key.key === "ArrowUp" ? -1 : !edge && key.key === "ArrowDown" ? 1 : 0;
      if (!delta && !rowDelta) return;
      key.preventDefault();
      const start = civilTime(event.start), end = civilTime(event.end);
      const index = Math.max(0, timelineRows.findIndex(row => row.id === event.rowId));
      const rowId = view === "date-timeline" ? event.rowId : rowDelta ? timelineRows[Math.max(0, Math.min(timelineRows.length - 1, index + rowDelta))]?.id : event.rowId;
      const dayDelta = view === "date-timeline" ? rowDelta * 1440 : 0;
      onEventChange({ event, rowId, kind: edge === "start" ? "resize-start" : edge === "end" ? "resize-end" : "move",
        start: civilString(edge === "end" ? start : edge === "start" ? Math.min(start + delta, end - step) : start + delta + dayDelta),
        end: civilString(edge === "start" ? end : edge === "end" ? Math.max(end + delta, start + step) : end + delta + dayDelta) });
      return;
    }
    const delta = key.key === "ArrowDown" ? step : key.key === "ArrowUp" ? -step : !edge && key.key === "ArrowRight" ? 1440 : !edge && key.key === "ArrowLeft" ? -1440 : 0;
    if (!delta) return;
    key.preventDefault();
    const start = civilTime(event.start), end = civilTime(event.end);
    const kind = edge === "start" ? "resize-start" : edge === "end" ? "resize-end" : "move";
    const nextStart = edge === "end" ? start : Math.min(start + delta, end - step);
    const nextEnd = edge === "start" ? end : edge === "end" ? Math.max(start + step, end + delta) : nextStart + end - start;
    // Moving preserves duration even when the shift exceeds it.
    const range = { start: civilString(edge ? nextStart : start + delta), end: civilString(edge ? nextEnd : end + delta) };
    onEventChange({ event, kind, ...range }); announcement = `予定を変更: ${rangeLabel(range.start, range.end)}`;
  }
</script>

<!-- Capture loss alone does not cancel: window listeners still receive the release. -->
<svelte:window onpointerdowncapture={(event) => { if (event.pointerType === "touch" && !event.isPrimary && drag?.pointerType === "touch") cancel(); }} onpointermove={move} onpointerupcapture={finish} onpointercancelcapture={cancel} onkeydown={(event) => { if (event.key === "Escape" && !(event.target as HTMLElement)?.closest?.('[role="dialog"], [role="listbox"]') && drag) { event.preventDefault(); resetNavigation(); cancel(); announcement = "操作をキャンセルしました"; } }} onblur={() => { resetNavigation(); cancel(); }} />

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
                    onclick={(click) => { if (click.detail === 0) suppressClick = false; openDetails(event, click.currentTarget); }}>
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
                    onclick={(click) => { if (click.detail === 0) suppressClick = false; create(row.date, minutes, click.currentTarget, row.id); }}></button>
                {/each}
                {#each layout.segments as segment (segment.event.id)}
                  <div class="calendar-event timeline-event" data-event-id={segment.event.id} style:--event-color={segment.event.color ?? "var(--primary)"}
                    style:left={`${(segment.start - config.from) / 60 * effectiveTimelineHourWidth}px`} style:width={`${Math.max(24, (segment.end - segment.start) / 60 * effectiveTimelineHourWidth - 2)}px`} style:top={`${segment.top}px`} style:z-index={segment.zIndex}>
                    <button type="button" class="event-main" disabled={disabled || loading} aria-label={`${segment.event.title} ${segment.event.allDay ? allDayLabel(segment.event) : rangeLabel(segment.event.start, segment.event.end)}`}
                      onclick={(click) => { if (click.detail === 0) suppressClick = false; openDetails(segment.event, click.currentTarget); }} onkeydown={(key) => eventKey(key, segment.event)}>
                      {#if eventContent}{@render eventContent(segment.event)}{:else}<strong>{segment.event.title}</strong><span>{segment.event.allDay ? "終日" : `${detailTimeLabel(segment.event.start)}～${detailTimeLabel(segment.event.end)}`}</span>{/if}
                    </button>
                    {#if canEdit && !segment.event.allDay && segment.event.editable !== false && onEventChange}
                      {#if segment.startsHere}<button type="button" class="timeline-resize timeline-start" data-resize="start" aria-label={`${segment.event.title}の開始時刻を変更`} onclick={(click) => { if (click.detail === 0) suppressClick = false; openDetails(segment.event, click.currentTarget); }} onkeydown={(key) => eventKey(key, segment.event, "start")}></button>{/if}
                      {#if segment.endsHere}<button type="button" class="timeline-resize timeline-end" data-resize="end" aria-label={`${segment.event.title}の終了時刻を変更`} onclick={(click) => { if (click.detail === 0) suppressClick = false; openDetails(segment.event, click.currentTarget); }} onkeydown={(key) => eventKey(key, segment.event, "end")}></button>{/if}
                    {/if}
                  </div>
                {/each}
                {#if preview && !preview.allDay && (view === "date-timeline" ? preview.start.slice(0, 10) === row.date : rowMatches(preview, row.id)) && (drag?.moved || draft)}
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
    <div {...props} class="calendar-frame" style:--calendar-overlay-top={`${fixedHeaderHeight}px`} role="region" aria-label={`${ariaLabel}のタイムライン`} data-slot="event-calendar-timeline">
      {#if timelineNowIndicator}<div class="timeline-now" class:has-marker={timelineNowIndicator.marker} aria-hidden="true" style:left={`${timelineNowIndicator.left}px`} style:top={`${timelineNowIndicator.top}px`} style:height={`${timelineNowIndicator.height}px`}></div>{/if}
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
        <div bind:this={grid} class="timeline-rows" style:--event-top-layer={events.length + 2} onpointerdown={begin} {...touchSelectionAttachments} oncontextmenu={(event) => { if (drag?.pointerType === "touch") event.preventDefault(); }}>
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
    <div bind:this={() => viewport, (value) => viewport = value ?? null} use:fitMonthViewport={layout} use:scrollbarVisibility style:height={layout === "fill" ? undefined : `${monthHeight}px`} role="region" aria-label={`${ariaLabel}の月表示`} tabindex="0" class="calendar-viewport month-viewport mutsuna-scrollbar" data-slot="event-calendar-month">
      <div class="month-sheet">
        <div class="month-weekdays">{#each weeks[0] as day}
          <span class={getCalendarDayColorClass(parseDate(day))}>{weekdayShortFormatter.format(new Date(day + "T12:00:00Z"))}</span>
        {/each}</div>
        <div class="month-pages"><div class="day-scroll-track"><div class="day-scroll-stage">
        <div class="month-dates">
        {#each weeks as week}
          {@const allDay = allDaySegments(preview?.allDay ? [...events, preview] : events, week)}
          <div class="month-week">
            {#each week as day, index}
              {@const dayLayout = monthDayLayout(day, allDay.segments, index)}
              <div class="month-day" style:grid-column={index + 1} class:outside-month={day.slice(0, 7) !== date.slice(0, 7)} data-month-day={day}>
                {@render rangeBackground(day, "day")}
                <button type="button" class="month-empty" aria-label={`${day}に終日予定を作成`} disabled={!canEdit || !onCreate}
                  onclick={(event) => createAllDay(day, event.currentTarget)}></button>
                <span class:today={day === todayDate} class={cn("month-date", getCalendarDayColorClass(parseDate(day)))}>{Number(day.slice(8))}</span>
                  {#each dayLayout.timed as item (item.event.id)}
                    {@const event = item.event}
                    <button type="button" class="month-event" style:top={`${24 + item.row * 24}px`} style:--event-color={event.color ?? "var(--primary)"} disabled={disabled || loading}
                      aria-label={`${event.title} ${rangeLabel(event.start, event.end)}`} onclick={(click) => { suppressClick = false; openDetails(event, click.currentTarget); }}>
                      {#if eventContent}{@render eventContent(event)}{:else}<span class="month-event-time">{event.start.slice(0, 10) === day ? detailTimeLabel(event.start) : "継続"}</span><strong>{event.title}</strong>{/if}
                    </button>
                  {/each}
                {#if dayLayout.hidden > 0}
                  <button type="button" class="month-more" disabled={disabled || loading} aria-label={`${detailDateLabel(day)}の予定を全件表示、他${dayLayout.hidden}件`}
                    onclick={(click) => openMore(day, click.currentTarget)}>他{dayLayout.hidden}件</button>
                {/if}
              </div>
            {/each}
            {#each allDay.segments as segment (segment.event.id)}
              {#if segment.event === preview}
                <div class="all-day-event month-all-day all-day-preview" style:grid-column={`${segment.start + 1} / ${segment.end + 1}`}
                  style:top={`${24 + Math.min(segment.row, Math.max(0, monthVisibleLimit - 1)) * 24}px`} style:--event-color="var(--primary)"><strong>{segment.event.title}</strong></div>
              {:else if segment.row < monthVisibleLimit}
                <button type="button" class="all-day-event month-all-day" style:grid-column={`${segment.start + 1} / ${segment.end + 1}`}
                  style:top={`${24 + segment.row * 24}px`} style:--event-color={segment.event.color ?? "var(--primary)"} disabled={disabled || loading}
                  aria-label={`${segment.event.title} ${allDayLabel(segment.event)}`} onclick={(click) => { suppressClick = false; openDetails(segment.event, click.currentTarget); }}>
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
  <div {...props} class="calendar-frame" style:--calendar-overlay-top={`${fixedHeaderHeight}px`}>
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
              onclick={(event) => { suppressClick = false; openDetails(segment.event, event.currentTarget); }}>
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
        {#if days.includes(todayDate) && nowMinute >= config.from && nowMinute < config.to && nowMarkerLeft >= 56 && nowMarkerLeft <= 56 + dayViewportWidth}
          <div class="now-marker" aria-hidden="true" style:left={`${nowMarkerLeft - 4}px`} style:top={`${(nowMinute - config.from) / 60 * effectiveHourHeight - 3}px`} style:z-index={events.length + 6}></div>
        {/if}
        <div class="day-scroll-lane day-scroller mutsuna-scrollbar mutsuna-scrollbar--auto" role="region" aria-label={`${ariaLabel}の時間枠の横スクロール`} tabindex="0" use:synchronizedDayScroll use:scrollbarVisibility data-slot="event-calendar-day-scroll"><div class="day-scroll-track"><div class="day-scroll-stage">
        <!-- The grid delegates pointer gestures from its focusable slot/event buttons. -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div bind:this={grid} class="week-grid" data-slot="event-calendar-grid" style:--event-top-layer={events.length + 2} style:height={`${config.height}px`}
          onpointerdown={begin} {...touchSelectionAttachments} oncontextmenu={(event) => { if (drag?.pointerType === "touch") event.preventDefault(); }}>
          {#each days as day}
            <div class="day-column" data-day={day}>
              {@render rangeBackground(day, "y")}
              {#each slots as minutes}
                <button type="button" class="time-slot" class:hour-line={minutes % 60 === 0 && minutes !== config.from}
                  style:top={`${(minutes - config.from) / 60 * effectiveHourHeight}px`} style:height={`${step / 60 * effectiveHourHeight}px`}
                  disabled={!canEdit || !onCreate} aria-label={`${day} ${timeLabel(minutes)}に予定を作成`} onclick={(event) => { if (event.detail === 0) suppressClick = false; create(day, minutes, event.currentTarget); }}></button>
              {/each}
              {#each timedLayout.get(day) ?? [] as segment (segment.event.id)}
                <div class="calendar-event" data-event-id={segment.event.id} style:top={`${(segment.start - config.from) / 60 * effectiveHourHeight}px`}
                  style:height={`${segment.height}px`} style:left={`calc(${segment.left * 100}% + 2px)`}
                  style:width={`calc(${segment.width * 100}% - 4px)`} style:z-index={segment.zIndex} style:--event-color={segment.event.color ?? "var(--primary)"}>
                  <button type="button" class="event-main" class:compact={segment.height < 40} class:multiline={segment.height >= 56} disabled={disabled || loading}
                    aria-label={`${segment.event.title} ${rangeLabel(segment.event.start, segment.event.end)}`}
                    onclick={(event) => { if (event.detail === 0) suppressClick = false; openDetails(segment.event, event.currentTarget); }} onkeydown={(key) => eventKey(key, segment.event)}>
                    {#if eventContent}{@render eventContent(segment.event)}{:else}
                      <strong>{segment.event.title}</strong>
                      {#if segment.height >= 40}<span>{segment.event.start.slice(11)} – {segment.event.end.slice(11)}</span>{/if}
                    {/if}
                  </button>
                  {#if canEdit && segment.event.editable !== false && onEventChange}
                    {#if segment.startsHere}<button type="button" class="resize-handle resize-start" data-resize="start" aria-label={`${segment.event.title}の開始時刻を変更`} onclick={(event) => { if (event.detail === 0) suppressClick = false; openDetails(segment.event, event.currentTarget); }} onkeydown={(key) => eventKey(key, segment.event, "start")}></button>{/if}
                    {#if segment.endsHere}<button type="button" class="resize-handle resize-end" data-resize="end" aria-label={`${segment.event.title}の終了時刻を変更`} onclick={(event) => { if (event.detail === 0) suppressClick = false; openDetails(segment.event, event.currentTarget); }} onkeydown={(key) => eventKey(key, segment.event, "end")}></button>{/if}
                  {/if}
                </div>
              {/each}
              {#if preview && (drag?.moved || draft)}
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
  {#if view !== "month" && (isTimeline ? timelineAvailableWidth > 0 && 144 + timelineWidth > timelineAvailableWidth + 1 : dayScrollWidth > dayViewportWidth + 1)}
    <ScrollArea.Root type="auto">
      {#snippet child({ props })}
        <div {...props} class="calendar-horizontal-scrollbar" style:left={`${isTimeline ? 144 : 56}px`}>
          <!-- svelte-ignore a11y_no_noninteractive_tabindex: keyboard scrolling remains available without event controls -->
          <ScrollArea.Viewport {...horizontalViewportAttachments} role="region" aria-label={isTimeline ? "時間軸の横スクロール" : `${ariaLabel}の横スクロール`} tabindex={0}
            class={cn("horizontal-scroll-proxy", isTimeline && "timeline-horizontal-scroll")}>
            <div style:width={`${isTimeline ? timelineWidth : dayScrollWidth}px`} style:height="1px"></div>
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
  <p class="sr-only" role="status" aria-live="polite">{announcement}</p>
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
