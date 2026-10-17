import { addDays, civilString, civilTime } from "../../event-calendar/layout.js";
import type { EventCalendarEvent, EventCalendarChange, EventCalendarProps, EventCalendarRange, EventCalendarView } from "../../event-calendar/types.js";

interface InteractionContext {
  readonly grid: HTMLDivElement;
  readonly viewport: HTMLDivElement | null;
  readonly isTimeline: boolean;
  readonly effectiveTimelineHourWidth: number;
  readonly effectiveHourHeight: number;
  readonly step: number;
  readonly config: { from: number; to: number; height: number };
  readonly date: string;
  readonly days: readonly string[];
  readonly canEdit: boolean;
  readonly events: readonly EventCalendarEvent[];
  readonly onEventChange: EventCalendarProps["onEventChange"];
  readonly onCreate: EventCalendarProps["onCreate"];
  readonly onEventClick: EventCalendarProps["onEventClick"];
  readonly view: EventCalendarView;
  readonly preview: EventCalendarEvent | null;
  readonly eventMinHeight: number;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly timelineRows: readonly { id: string | undefined; label: string; date: string }[];
  readonly rangeLabel: (start: string, end: string) => string;
  readonly allDayLabel: (range: EventCalendarRange) => string;
}

/** Pointer/keyboard editing and selection. The consumer continues to own event data. */
export function createCalendarInteraction(context: InteractionContext) {
  const rangeLabel = (start: string, end: string) => context.rangeLabel(start, end);
  const allDayLabel = (range: EventCalendarRange) => context.allDayLabel(range);

  let announcement = $state("");
  type Drag = { pointer: number; pointerType: string; kind: "create" | EventCalendarChange["kind"]; event?: EventCalendarEvent;
    anchor: number; originalStart: number; originalEnd: number; start: number; end: number;
    visualAnchor: number; visualStart: number; visualEnd: number;
    x: number; y: number; moved: boolean; armed: boolean; origin: HTMLElement; rowId?: string; originalRowId?: string };
  let drag = $state<Drag | null>(null);
  let suppressClick = false;
  let touchHoldTimer: ReturnType<typeof setTimeout> | undefined;

  function touchSelection(element: HTMLElement) {
    // Native scrolling wins until a stationary long press arms selection.
    const move = (event: TouchEvent) => {
      if (event.touches.length !== 1) { cancel(); return; }
      if (drag?.pointerType === "touch" && drag.armed) event.preventDefault();
    };
    element.addEventListener("touchmove", move, { passive: false });
    return { destroy() { element.removeEventListener("touchmove", move); cancel(); } };
  }

  function point(x: number, y: number, boundary = false, continuous = false) {
    const rect = context.grid.getBoundingClientRect();
    if (context.isTimeline) {
      const units = (x - rect.left - 144) / context.effectiveTimelineHourWidth * 60 / context.step;
      const minutes = (continuous ? units : boundary ? Math.round(units) : Math.floor(units)) * context.step + context.config.from;
      return civilTime((rowAt(y)?.date ?? context.date) + "T00:00") + Math.max(context.config.from, Math.min(context.config.to - (boundary || continuous ? 0 : context.step), minutes));
    }
    const day = Math.max(0, Math.min(context.days.length - 1, Math.floor((x - rect.left) / (rect.width / context.days.length))));
    const units = (y - rect.top) / context.effectiveHourHeight * 60 / context.step;
    const minutes = (continuous ? units : boundary ? Math.round(units) : Math.floor(units)) * context.step + context.config.from;
    return civilTime(context.days[day] + "T00:00") + Math.max(context.config.from, Math.min(context.config.to - (boundary || continuous ? 0 : context.step), minutes));
  }

  function begin(event: PointerEvent) {
    if (!context.viewport) return;
    if (!event.isPrimary) { if (event.pointerType === "touch") cancel(); return; }
    if (event.button !== 0) return;
    cancel();
    suppressClick = false;
    if (!context.canEdit) return;
    const target = event.target as HTMLElement;
    if (context.isTimeline && target.closest(".timeline-label")) return;
    const eventEl = target.closest<HTMLElement>("[data-event-id]");
    const item = eventEl ? context.events.find(item => item.id === eventEl.dataset.eventId) : undefined;
    if (item && (item.allDay || item.editable === false || !context.onEventChange)) return;
    if (!item && !context.onCreate) return;
    const edge = target.closest<HTMLElement>("[data-resize]")?.dataset.resize;
    const anchor = point(event.clientX, event.clientY, Boolean(edge));
    const start = item ? civilTime(item.start) : anchor;
    const end = item ? civilTime(item.end) : anchor + context.step;
    const kind = item ? (edge === "start" ? "resize-start" : edge === "end" ? "resize-end" : "move") : "create";
    drag = { pointer: event.pointerId, pointerType: event.pointerType, kind, event: item, anchor, originalStart: start, originalEnd: end,
      visualAnchor: point(event.clientX, event.clientY, false, true), visualStart: start, visualEnd: end,
      start, end, x: event.clientX, y: event.clientY, moved: false, armed: event.pointerType !== "touch", origin: target.closest<HTMLElement>("button") ?? context.viewport,
      rowId: context.view === "timeline" ? rowAt(event.clientY)?.id : item?.rowId, originalRowId: item?.rowId };
    if (event.pointerType === "touch") {
      touchHoldTimer = setTimeout(() => {
        touchHoldTimer = undefined;
        if (!drag || drag.pointer !== event.pointerId || !context.canEdit) { cancel(); return; }
        drag.armed = true;
        drag.moved = true;
        context.grid.setPointerCapture(event.pointerId);
        announcement = "範囲を選択できます。指を動かして終了時刻を選んでください。";
      }, 450);
    }
  }

  function move(event: PointerEvent) {
    if (!context.viewport) return;
    if (!drag || drag.pointer !== event.pointerId) return;
    if (!context.canEdit) { cancel(); return; }
    if (!drag.armed) {
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) >= 8) { cancel(); suppressClick = true; }
      return;
    }
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 4 && !drag.moved) return;
    if (!drag.moved) context.grid.setPointerCapture(event.pointerId);
    drag.moved = true;
    const rect = context.viewport.getBoundingClientRect();
    if (event.clientY < rect.top + 40) context.viewport.scrollTop -= 16;
    if (event.clientY > rect.bottom - 40) context.viewport.scrollTop += 16;
    if (context.isTimeline) {
      if (event.clientX < rect.left + 180) context.viewport.scrollLeft -= 16;
      if (event.clientX > rect.right - 40) context.viewport.scrollLeft += 16;
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
      const position = base + Math.max(context.config.from, Math.min(context.config.to - context.step, pointerMinutes));
      drag.start = Math.min(drag.anchor, position); drag.end = Math.max(drag.anchor, position) + context.step;
      const rect = context.grid.getBoundingClientRect();
      const visualMinutes = context.config.from + (context.isTimeline ? (x - rect.left - 144) / context.effectiveTimelineHourWidth : (y - rect.top) / context.effectiveHourHeight) * 60;
      const visualPosition = base + Math.max(context.config.from, Math.min(context.config.to, visualMinutes));
      drag.visualStart = Math.min(drag.visualAnchor, visualPosition);
      drag.visualEnd = Math.max(drag.visualAnchor, visualPosition);
    } else if (drag.kind === "move") {
      drag.start = drag.originalStart + current - drag.anchor;
      drag.end = drag.originalEnd + current - drag.anchor;
      drag.visualStart = drag.originalStart + visualDelta;
      drag.visualEnd = drag.originalEnd + visualDelta;
      if (context.view === "timeline") drag.rowId = rowAt(y)?.id;
    } else if (drag.kind === "resize-start") {
      drag.start = Math.min(drag.originalStart + current - drag.anchor, drag.end - context.step);
      drag.visualStart = Math.min(drag.originalStart + visualDelta, drag.originalEnd - context.step);
    } else {
      drag.end = Math.max(drag.originalEnd + current - drag.anchor, drag.start + context.step);
      drag.visualEnd = Math.max(drag.originalEnd + visualDelta, drag.originalStart + context.step);
    }
  }

  function previewTimes() {
    if (context.preview?.allDay) return null;
    return drag ? { start: drag.visualStart, end: drag.visualEnd }
      : context.preview ? { start: civilTime(context.preview.start), end: civilTime(context.preview.end) } : null;
  }

  function previewShape(day: string) {
    const times = previewTimes();
    if (!times) return null;
    const base = civilTime(day + "T00:00");
    const start = Math.max(context.config.from, times.start - base), end = Math.min(context.config.to, times.end - base);
    if (end < start || times.end <= base + context.config.from || times.start >= base + context.config.to) return null;
    const height = Math.max(context.eventMinHeight, (end - start) / 60 * context.effectiveHourHeight);
    return { top: (start - context.config.from) / 60 * context.effectiveHourHeight, height: Math.min(height, context.config.height - (start - context.config.from) / 60 * context.effectiveHourHeight) };
  }

  function cancel() {
    clearTimeout(touchHoldTimer);
    touchHoldTimer = undefined;
    const previous = drag;
    suppressClick = Boolean(previous?.moved); drag = null;
    if (previous && context.grid.hasPointerCapture(previous.pointer)) context.grid.releasePointerCapture(previous.pointer);
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
    if (!context.canEdit) return;
    const range = { start: civilString(result.start), end: civilString(result.end), ...(context.view === "timeline" ? { rowId: result.rowId } : {}) };
    // A small motion can cross two slot buttons without reaching the drag
    // threshold. The browser then emits no slot click, so complete creation here.
    if (result.kind === "create") { suppressClick = true; openCreation(range, result.origin); return; }
    if (!armed || !result.moved) return;
    else if (result.event && (result.start !== result.originalStart || result.end !== result.originalEnd || result.rowId !== result.originalRowId))
      context.onEventChange?.({ event: result.event, kind: result.kind, ...range });
    announcement = `予定を変更: ${rangeLabel(range.start, range.end)}`;
  }

  function openCreation(range: EventCalendarRange & { allDay?: boolean; rowId?: string }, target: HTMLElement) {
    context.onCreate?.(range, { trigger: target });
    announcement = `作成範囲を選択: ${range.allDay ? allDayLabel(range) : rangeLabel(range.start, range.end)}`;
  }

  function createAllDay(day: string, target: HTMLElement) {
    if (!context.canEdit || !context.onCreate) return;
    suppressClick = false;
    openCreation({ start: day, end: addDays(day, 1), allDay: true }, target);
  }

  function create(day: string, minutes: number, target: HTMLElement, rowId: string | undefined = undefined) {
    if (suppressClick || !context.canEdit || !context.onCreate) return;
    const start = civilTime(day + "T00:00") + minutes;
    openCreation({ start: civilString(start), end: civilString(start + context.step), ...(context.view === "timeline" ? { rowId } : {}) }, target);
  }

  function openDetails(event: EventCalendarEvent, target: HTMLElement) {
    if (suppressClick || context.disabled || context.loading) return;
    context.onEventClick?.(event, { trigger: target });
    announcement = `予定を選択: ${event.title}`;
  }

  function rowAt(y: number) {
    const elements = Array.from(context.grid.querySelectorAll<HTMLElement>("[data-timeline-row]"));
    const index = elements.findIndex(element => y < element.getBoundingClientRect().bottom);
    return context.timelineRows[index < 0 ? context.timelineRows.length - 1 : index];
  }

  function eventKey(key: KeyboardEvent, event: EventCalendarEvent, edge: "start" | "end" | undefined = undefined) {
    if (!key.altKey || !context.canEdit || event.editable === false || !context.onEventChange) return;
    if (context.isTimeline) {
      if (event.allDay) return;
      const delta = key.key === "ArrowLeft" ? -context.step : key.key === "ArrowRight" ? context.step : 0;
      const rowDelta = !edge && key.key === "ArrowUp" ? -1 : !edge && key.key === "ArrowDown" ? 1 : 0;
      if (!delta && !rowDelta) return;
      key.preventDefault();
      const start = civilTime(event.start), end = civilTime(event.end);
      const index = Math.max(0, context.timelineRows.findIndex(row => row.id === event.rowId));
      const rowId = context.view === "date-timeline" ? event.rowId : rowDelta ? context.timelineRows[Math.max(0, Math.min(context.timelineRows.length - 1, index + rowDelta))]?.id : event.rowId;
      const dayDelta = context.view === "date-timeline" ? rowDelta * 1440 : 0;
      context.onEventChange({ event, rowId, kind: edge === "start" ? "resize-start" : edge === "end" ? "resize-end" : "move",
        start: civilString(edge === "end" ? start : edge === "start" ? Math.min(start + delta, end - context.step) : start + delta + dayDelta),
        end: civilString(edge === "start" ? end : edge === "end" ? Math.max(end + delta, start + context.step) : end + delta + dayDelta) });
      return;
    }
    const delta = key.key === "ArrowDown" ? context.step : key.key === "ArrowUp" ? -context.step : !edge && key.key === "ArrowRight" ? 1440 : !edge && key.key === "ArrowLeft" ? -1440 : 0;
    if (!delta) return;
    key.preventDefault();
    const start = civilTime(event.start), end = civilTime(event.end);
    const kind = edge === "start" ? "resize-start" : edge === "end" ? "resize-end" : "move";
    const nextStart = edge === "end" ? start : Math.min(start + delta, end - context.step);
    const nextEnd = edge === "start" ? end : edge === "end" ? Math.max(start + context.step, end + delta) : nextStart + end - start;
    // Moving preserves duration even when the shift exceeds it.
    const range = { start: civilString(edge ? nextStart : start + delta), end: civilString(edge ? nextEnd : end + delta) };
    context.onEventChange({ event, kind, ...range }); announcement = `予定を変更: ${rangeLabel(range.start, range.end)}`;
  }
  return {
    touchSelection,
    begin,
    move,
    previewTimes,
    previewShape,
    cancel,
    finish,
    createAllDay,
    create,
    openDetails,
    eventKey,
    get drag() { return drag; },
    get announcement() { return announcement; },
    set announcement(value: string) { announcement = value; },
    get suppressClick() { return suppressClick; },
    set suppressClick(value: boolean) { suppressClick = value; },
  };
}
