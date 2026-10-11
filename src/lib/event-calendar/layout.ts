import type { EventCalendarBackgroundRange, EventCalendarEvent, EventCalendarView, EventCalendarVisibleRange, EventCalendarPrefetchRange } from "./types.js";
const minute = 60_000;
export function civilTime(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new RangeError("Expected YYYY-MM-DDTHH:mm without a time zone");
  const time = Date.parse(value + ":00Z");
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 16) !== value) throw new RangeError("Invalid calendar date/time");
  return time / minute;
}
export function civilString(minutes: number): string {
  return new Date(minutes * minute).toISOString().slice(0, 16);
}
export function addDays(date: string, days: number): string {
  return civilString(civilTime(date + "T00:00") + days * 1440).slice(0, 10);
}
export function weekDates(date: string, startsOn: number): string[] {
  return calendarDates(date, 7, startsOn);
}
export function calendarDates(date: string, count: number, startsOn: number | undefined = undefined): string[] {
  if (!Number.isInteger(count) || count < 1 || count > 31) throw new RangeError("Display day count must be between 1 and 31");
  const weekday = new Date(civilTime(date + "T00:00") * minute).getUTCDay();
  const start = startsOn === undefined ? date : addDays(date, -((weekday - startsOn + 7) % 7));
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}
export function monthWeeks(date: string, startsOn: number): string[][] {
  const first = date.slice(0, 7) + "-01";
  civilTime(first + "T00:00");
  const value = new Date(first + "T00:00:00Z");
  value.setUTCMonth(value.getUTCMonth() + 1);
  const next = value.toISOString().slice(0, 10);
  const weeks: string[][] = [];
  for (let start = weekDates(first, startsOn)[0]; start < next; start = addDays(start, 7)) weeks.push(weekDates(start, startsOn));
  return weeks;
}
export function addMonths(date: string, amount: number): string {
  civilTime(date + "T00:00");
  const value = new Date(date.slice(0, 7) + "-01T00:00:00Z");
  value.setUTCMonth(value.getUTCMonth() + amount);
  return value.toISOString().slice(0, 10);
}

export function visibleCalendarRange(date: string, view: EventCalendarView, dayCount?: number, weekStartsOn = 1): EventCalendarVisibleRange {
  const dates = view === "month" ? monthWeeks(date, weekStartsOn).flat()
    : calendarDates(date, view === "timeline" ? 1 : dayCount ?? (view === "day" ? 1 : 7),
      view === "week" && dayCount === undefined ? weekStartsOn : undefined);
  return { start: dates[0], end: addDays(dates[dates.length - 1], 1), view };
}
export function eventsInCalendarRange(events: readonly EventCalendarEvent[], range: EventCalendarVisibleRange) {
  const start = civilTime(range.start + "T00:00"), end = civilTime(range.end + "T00:00");
  return events.filter(event => civilTime(event.start + (event.allDay ? "T00:00" : "")) < end && civilTime(event.end + (event.allDay ? "T00:00" : "")) > start);
}
export function adjacentCalendarRanges(date: string, view: EventCalendarView, dayCount?: number, weekStartsOn = 1): EventCalendarPrefetchRange {
  const count = view === "timeline" ? 1 : dayCount ?? (view === "day" ? 1 : 7);
  const shifted = (direction: number) => view === "month" ? addMonths(date, direction) : addDays(date, direction * count);
  return { previous: visibleCalendarRange(shifted(-1), view, dayCount, weekStartsOn), next: visibleCalendarRange(shifted(1), view, dayCount, weekStartsOn) };
}
export interface CalendarSegment {
  event: EventCalendarEvent;
  start: number;
  end: number;
  column: number;
  columns: number;
  startsHere: boolean;
  endsHere: boolean;
  height: number;
  inset: number;
  zIndex: number;
  left: number;
  width: number;
}
/** Interval partitioning per connected overlap group, including clipped overnight events. */
export function daySegments(events: readonly EventCalendarEvent[], date: string, from: number, to: number, hourHeight = 48, eventMinHeight = 24): CalendarSegment[] {
  const base = civilTime(date + "T00:00");
  const segments = events.flatMap(event => {
    if (event.allDay) return [];
    const start = civilTime(event.start) - base, end = civilTime(event.end) - base;
    if (end <= start) throw new RangeError("Event end must follow start");
    if (end <= from || start >= to) return [];
    return [{ event, start: Math.max(from, start), end: Math.min(to, end), column: 0, columns: 1,
      startsHere: start >= from, endsHere: end <= to,
      height: Math.max((Math.min(to, end) - Math.max(from, start)) / 60 * hourHeight, eventMinHeight),
      inset: 0, zIndex: 0, left: 0, width: 1 }];
  }).sort((a, b) => a.start - b.start || b.end - a.end || a.event.id.localeCompare(b.event.id));
  let group: CalendarSegment[] = [], ends: number[] = [], groupEnd = -Infinity;
  function finish() {
    for (const segment of group) segment.columns = ends.length;
    // Protect title/time areas, rather than dividing the entire connected group
    // into narrow columns. Events starting later can reuse the broad area below.
    let headers: { segment: CalendarSegment; column: number }[] = [];
    let headerEnds: number[] = [], headerEnd = -Infinity;
    function finishHeaders() {
      if (!headers.length) return;
      const step = 0.3 / ends.length;
      const firstColumn = Math.min(...headers.map(item => item.segment.column));
      const left = firstColumn * step;
      const available = 1 - left - Math.max(0, ends.length - firstColumn - headerEnds.length) * step;
      for (const item of headers) {
        item.segment.width = available / headerEnds.length;
        item.segment.left = left + item.column * item.segment.width;
      }
    }
    for (const segment of group) {
      if (segment.start >= headerEnd) { finishHeaders(); headers = []; headerEnds = []; headerEnd = -Infinity; }
      let column = headerEnds.findIndex(end => end <= segment.start);
      if (column < 0) column = headerEnds.length;
      const protectedHeight = segment.height < 40 ? 14 : segment.height >= 56 ? 48 : 36;
      const end = segment.start + Math.min(segment.height, protectedHeight) / hourHeight * 60;
      headerEnds[column] = end;
      headerEnd = Math.max(headerEnd, end);
      headers.push({ segment, column });
    }
    finishHeaders();
  }
  for (const segment of segments) {
    if (segment.start >= groupEnd) { finish(); group = []; ends = []; groupEnd = -Infinity; }
    let column = ends.findIndex(end => end <= segment.start);
    if (column < 0) column = ends.length;
    segment.column = column; ends[column] = segment.end;
    group.push(segment); groupEnd = Math.max(groupEnd, segment.end);
  }
  finish();
  // Actual simultaneous events keep their columns. Only the visual extension of
  // a short, non-simultaneous event creates the staggered overlay within a column.
  const placed: { segment: CalendarSegment; lane: number; until: number }[] = [];
  for (const [index, segment] of segments.entries()) {
    segment.height = Math.max((segment.end - segment.start) / 60 * hourHeight, eventMinHeight);
    const overlaps = placed.filter(item => item.segment.column === segment.column
      && item.segment.columns === segment.columns && item.until > segment.start
      && item.segment.end <= segment.start);
    let lane = 0;
    while (overlaps.some(item => item.lane === lane)) lane++;
    segment.inset = Math.min(lane * 0.3, 0.6);
    segment.left += segment.inset * segment.width;
    segment.width *= 1 - segment.inset;
    segment.zIndex = index + 2;
    placed.push({ segment, lane, until: segment.start + segment.height / hourHeight * 60 });
  }
  return segments;
}

/** Stagger horizontal cards while keeping only their title area unobscured. */
export function timelineStack<T extends { start: number; end: number }>(segments: readonly T[], hourWidth: number) {
  const placed: (T & { top: number; zIndex: number })[] = [];
  for (const segment of [...segments].sort((a, b) => a.start - b.start || b.end - a.end)) {
    const left = segment.start / 60 * hourWidth;
    let top = 4;
    for (const previous of placed) {
      const previousLeft = previous.start / 60 * hourWidth;
      const width = Math.max(24, (previous.end - previous.start) / 60 * hourWidth - 2);
      if (left >= previousLeft + width) continue;
      // Nearby starts protect the title only; time labels may overlap.
      const protectsText = left < previousLeft + Math.min(width, 160);
      top = Math.max(top, previous.top + (protectsText ? 22 : 12));
    }
    placed.push({ ...segment, top, zIndex: placed.length + 2 });
  }
  return placed;
}

/** Layout a single timeline row; persistence and resource filtering belong to the caller. */
export function layoutTimelineEvents(events: readonly EventCalendarEvent[], date: string, from: number, to: number, hourWidth: number) {
  const allDay = events.filter(event => event.allDay && event.start <= date && event.end > date);
  const segments = timelineStack(daySegments(events, date, from, to), hourWidth);
  return { allDay, segments, height: Math.max(48, 32 + allDay.length * 24, ...segments.map(segment => segment.top + 44)) };
}

/** Date-only all-day ranges use an exclusive end, just like timed ranges. */
export function allDaySegments(events: readonly EventCalendarEvent[], days: readonly string[]) {
  const from = civilTime(days[0] + "T00:00");
  const segments = events.filter(event => event.allDay).flatMap(event => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.start) || !/^\d{4}-\d{2}-\d{2}$/.test(event.end))
      throw new RangeError("All-day events require YYYY-MM-DD dates");
    const start = (civilTime(event.start + "T00:00") - from) / 1440;
    const end = (civilTime(event.end + "T00:00") - from) / 1440;
    if (end <= start) throw new RangeError("Event end must follow start");
    if (end <= 0 || start >= days.length) return [];
    return [{ event, start: Math.max(0, start), end: Math.min(days.length, end), row: 0 }];
  }).sort((a, b) => a.start - b.start || b.end - a.end || a.event.id.localeCompare(b.event.id));
  const ends: number[] = [];
  for (const segment of segments) {
    let row = ends.findIndex(end => end <= segment.start);
    if (row < 0) row = ends.length;
    segment.row = row; ends[row] = segment.end;
  }
  return { segments, rows: Math.max(1, ends.length) };
}

/** Clip decorative ranges to one visible civil day and optional resource row. */
export function backgroundSegments(ranges: readonly EventCalendarBackgroundRange[], day: string, from = 0, to = 1440, rowId?: string) {
  const base = civilTime(day + "T00:00");
  return ranges.flatMap(range => {
    const start = civilTime(range.start + (range.start.length === 10 ? "T00:00" : ""));
    const end = civilTime(range.end + (range.end.length === 10 ? "T00:00" : ""));
    if (end <= start) throw new RangeError("Background range end must follow start");
    if (range.rowId !== undefined && range.rowId !== rowId) return [];
    const clippedStart = Math.max(from, start - base), clippedEnd = Math.min(to, end - base);
    return clippedEnd > clippedStart ? [{ id: range.id, color: range.color, start: clippedStart, end: clippedEnd }] : [];
  });
}
