import assert from "node:assert/strict";
import test from "node:test";
import { backgroundSegments, addMonths, allDaySegments, calendarDates, civilTime, civilString, daySegments, monthWeeks, weekDates, timelineStack, layoutTimelineEvents, visibleCalendarRange, eventsInCalendarRange, adjacentCalendarRanges } from "../dist/event-calendar/layout.js";
const event = (id, start, end) => ({ id, title: id, start: `2026-10-05T${start}`, end: `2026-10-05T${end}` });
test("prefetch ranges follow navigation steps, month boundaries and custom day counts", () => {
  for (const view of ["week", "date-timeline"]) {
    assert.deepEqual(adjacentCalendarRanges("2026-10-07", view), {
      previous: { start: view === "week" ? "2026-09-28" : "2026-09-30", end: view === "week" ? "2026-10-05" : "2026-10-07", view }, next: { start: view === "week" ? "2026-10-12" : "2026-10-14", end: view === "week" ? "2026-10-19" : "2026-10-21", view },
    });
    assert.equal(adjacentCalendarRanges("2026-10-07", view, 3).next.start, "2026-10-10");
    assert.equal(adjacentCalendarRanges("2026-10-07", view, 3).previous.end, "2026-10-07");
  }
  assert.equal(adjacentCalendarRanges("2026-10-07", "day").next.start, "2026-10-08");
  assert.equal(adjacentCalendarRanges("2026-10-07", "day", 3).next.start, "2026-10-10");
  assert.equal(adjacentCalendarRanges("2026-10-07", "timeline", 3).next.start, "2026-10-08");
  assert.deepEqual(adjacentCalendarRanges("2026-12-31", "month"), {
    previous: { start: "2026-10-26", end: "2026-12-07", view: "month" },
    next: { start: "2026-12-28", end: "2027-02-01", view: "month" },
  });
  assert.equal(adjacentCalendarRanges("2026-10-07", "month", 3, 0).next.start, "2026-11-01");
});
test("fetch ranges cover actual cells in all modes and use exclusive date ends", () => {
  for (const view of ["week", "date-timeline"]) {
    assert.deepEqual(visibleCalendarRange("2026-10-07", view), { start: view === "week" ? "2026-10-05" : "2026-10-07", end: view === "week" ? "2026-10-12" : "2026-10-14", view });
    assert.deepEqual(visibleCalendarRange("2026-10-07", view, 3), { start: "2026-10-07", end: "2026-10-10", view });
    assert.equal(visibleCalendarRange("2026-10-07", view, undefined, 0).start, view === "week" ? "2026-10-04" : "2026-10-07");
  }
  assert.deepEqual(visibleCalendarRange("2026-10-07", "day"), { start: "2026-10-07", end: "2026-10-08", view: "day" });
  assert.equal(visibleCalendarRange("2026-10-07", "day", 3).end, "2026-10-10");
  assert.equal(visibleCalendarRange("2026-10-07", "timeline", 3).end, "2026-10-08");
  assert.deepEqual(visibleCalendarRange("2026-10-07", "month"), { start: "2026-09-28", end: "2026-11-02", view: "month" });
  assert.equal(visibleCalendarRange("2026-03-01", "month").start, "2026-02-23");
  const range = visibleCalendarRange("2026-10-05", "day");
  const events = [event("inside", "09:00", "10:00"), { id: "ended", start: "2026-10-04T22:00", end: "2026-10-05T00:00" },
    { id: "future", start: "2026-10-06T00:00", end: "2026-10-06T01:00" }, { id: "span", allDay: true, start: "2026-10-04", end: "2026-10-06" }];
  assert.deepEqual(eventsInCalendarRange(events, range).map(event => event.id), ["inside", "span"]);
});
test("timeline row layout keeps active all-day events outside the time axis without mutating source data", () => {
  const source = [
    { id: "all-day", title: "終日", allDay: true, start: "2026-10-05", end: "2026-10-06" },
    { id: "past", title: "終了済み", allDay: true, start: "2026-10-04", end: "2026-10-05" },
    event("later", "15:00", "20:00"),
  ];
  const before = structuredClone(source);
  const layout = layoutTimelineEvents(source, "2026-10-05", 480, 1200, 64);
  assert.deepEqual(layout.allDay.map(event => event.id), ["all-day"]);
  assert.deepEqual(layout.segments.map(segment => segment.event.id), ["later"]);
  assert.deepEqual(layout.segments.map(segment => segment.top), [4]);
  assert.equal(layout.height, 56);
  assert.deepEqual(source, before);
  const crowded = layoutTimelineEvents(Array.from({ length: 5 }, (_, index) => ({ ...source[0], id: String(index) })), "2026-10-05", 480, 1200, 64);
  assert.equal(crowded.allDay.length, 5);
  assert.equal(crowded.segments.length, 0);
  assert.equal(crowded.height, 152);
});
test("timeline overlaps tails but preserves nearby headers and reuses finished lanes", () => {
  const segments = timelineStack([{ start: 480, end: 1200 }, { start: 900, end: 1200 }, { start: 1080, end: 1200 }], 64);
  assert.deepEqual(segments.map(segment => segment.top), [4, 16, 28]);
  assert.deepEqual(timelineStack([{ start: 540, end: 720 }, { start: 600, end: 720 }], 64).map(segment => segment.top), [4, 26]);
  const overlapping = layoutTimelineEvents([event("one", "09:15", "10:45"), event("two", "10:00", "11:00")], "2026-10-05", 480, 1200, 64);
  assert.equal(overlapping.height, 70, "nearby events protect titles while overlapping time labels");
  assert.equal(layoutTimelineEvents([], "2026-10-05", 480, 1200, 64).height, 48, "empty rows use a compact baseline");
  assert.deepEqual(timelineStack([{ start: 540, end: 600 }, { start: 600, end: 660 }], 64).map(segment => segment.top), [4, 4]);
});
test("civil time is independent of browser zone, validates dates and spans year boundaries", () => {
  assert.equal(civilString(civilTime("2026-12-31T23:30") + 60), "2027-01-01T00:30");
  for (const date of ["2026-02-30T10:00", "2026-10-05T24:00", "2026-10-05T10:00Z", "bad"]) assert.throws(() => civilTime(date), RangeError);
  assert.deepEqual(weekDates("2027-01-01", 1), ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]);
});
test("calendar ranges share date generation for one day, aligned weeks and custom counts", () => {
  assert.deepEqual(calendarDates("2026-10-07", 1), ["2026-10-07"]);
  assert.deepEqual(calendarDates("2026-10-07", 7, 1), weekDates("2026-10-07", 1));
  assert.deepEqual(calendarDates("2026-12-31", 3), ["2026-12-31", "2027-01-01", "2027-01-02"]);
  assert.equal(calendarDates("2026-10-07", 31).at(-1), "2026-11-06");
  for (const count of [0, -1, 32, 1.5, NaN]) assert.throws(() => calendarDates("2026-10-07", count), RangeError);
  const range = calendarDates("2026-10-07", 3);
  const result = allDaySegments([{ id: "span", title: "span", allDay: true, start: "2026-10-06", end: "2026-10-11" }], range);
  assert.deepEqual(result.segments.map(segment => [segment.start, segment.end]), [[0, 3]]);
});
test("month grids include complete boundary weeks and month navigation handles year boundaries", () => {
  const october = monthWeeks("2026-10-05", 1);
  assert.equal(october.length, 5);
  assert.equal(october[0][0], "2026-09-28");
  assert.equal(october.at(-1).at(-1), "2026-11-01");
  assert.equal(monthWeeks("2026-03-01", 1).length, 6);
  assert.equal(addMonths("2026-12-31", 1), "2027-01-01");
  assert.equal(addMonths("2026-01-31", -1), "2025-12-01");
});
test("overlapping groups use stable columns while adjacent events get the full width", () => {
  const result = daySegments([event("a", "09:00", "11:00"), event("b", "10:00", "12:00"), event("c", "11:00", "11:30"), event("d", "12:00", "13:00")], "2026-10-05", 480, 1200);
  assert.deepEqual(result.map(s => [s.event.id, s.column, s.columns]), [["a", 0, 2], ["b", 1, 2], ["c", 0, 2], ["d", 0, 1]]);
});
test("overnight events clip to both days without invalid geometry", () => {
  const overnight = { id: "night", title: "night", start: "2026-10-05T23:00", end: "2026-10-06T02:00" };
  const first = daySegments([overnight], "2026-10-05", 0, 1440)[0];
  const second = daySegments([overnight], "2026-10-06", 0, 1440)[0];
  assert.deepEqual([first.start, first.end, first.startsHere, first.endsHere], [1380, 1440, true, false]);
  assert.deepEqual([second.start, second.end, second.startsHere, second.endsHere], [0, 120, false, true]);
  assert.equal(daySegments([overnight], "2026-10-07", 0, 1440).length, 0);
  assert.throws(() => daySegments([event("bad", "12:00", "11:00")], "2026-10-05", 0, 1440), RangeError);
});

test("short adjacent events keep real times and stagger minimum-height cards", () => {
  const result = daySegments([event("a", "09:00", "09:15"), event("b", "09:15", "09:30"), event("c", "09:30", "09:45"), event("half", "11:00", "11:30")], "2026-10-05", 480, 1200);
  assert.deepEqual(result.map(s => [s.start, s.end, s.height, s.inset]), [[540, 555, 24, 0], [555, 570, 24, 0.3], [570, 585, 24, 0], [660, 690, 24, 0]]);
  assert.ok(result[1].zIndex > result[0].zIndex);
});

test("all-day ranges clip to the week, use exclusive ends and separate overlapping rows", () => {
  const days = weekDates("2026-10-05", 1);
  const events = [
    { id: "span", title: "span", allDay: true, start: "2026-10-04", end: "2026-10-08" },
    { id: "overlap", title: "overlap", allDay: true, start: "2026-10-06", end: "2026-10-07" },
    { id: "adjacent", title: "adjacent", allDay: true, start: "2026-10-08", end: "2026-10-13" },
  ];
  const result = allDaySegments(events, days);
  assert.equal(result.rows, 2);
  assert.deepEqual(result.segments.map(s => [s.event.id, s.start, s.end, s.row]), [["span", 0, 3, 0], ["overlap", 1, 2, 1], ["adjacent", 3, 7, 0]]);
  assert.deepEqual(daySegments(events, days[0], 480, 1200), []);
  assert.equal(allDaySegments([], days).rows, 1);
  assert.throws(() => allDaySegments([{ ...events[0], end: events[0].start }], days), RangeError);
  assert.throws(() => allDaySegments([{ ...events[0], start: "2026-02-30" }], days), RangeError);
});

test("overlapping cards protect coincident headers while keeping staggered events wide", () => {
  const together = daySegments([event("a", "09:00", "12:00"), event("b", "09:00", "12:00"), event("c", "09:00", "12:00")], "2026-10-05", 480, 1200);
  assert.deepEqual(together.map(s => s.left), [0, 1 / 3, 2 / 3]);
  assert.ok(together.every(s => Math.abs(s.width - 1 / 3) < 0.001));
  const staggered = daySegments(Array.from({ length: 5 }, (_, i) => event(String(i), `${String(9 + i).padStart(2, "0")}:00`, "15:00")), "2026-10-05", 480, 1200);
  assert.ok(staggered.every(s => s.width >= 0.75 && s.left + s.width <= 1.001));
  assert.ok(staggered.every((s, i) => i === 0 || s.left > staggered[i - 1].left));
});

test("background ranges clip across dates, hours and resource rows with exclusive ends", () => {
  const ranges = [
    { id: "overnight", start: "2026-10-04T23:00", end: "2026-10-05T09:30", color: "red" },
    { id: "day", start: "2026-10-05", end: "2026-10-06", color: "var(--muted)" },
    { id: "room", start: "2026-10-05T12:00", end: "2026-10-05T13:00", rowId: "a", color: "blue" },
  ];
  assert.deepEqual(backgroundSegments(ranges, "2026-10-05", 480, 1200), [
    { id: "overnight", color: "red", start: 480, end: 570 },
    { id: "day", color: "var(--muted)", start: 480, end: 1200 },
  ]);
  assert.equal(backgroundSegments(ranges, "2026-10-05", 480, 1200, "a").length, 3);
  assert.equal(backgroundSegments(ranges, "2026-10-05", 480, 1200, "b").length, 2);
  assert.equal(backgroundSegments(ranges, "2026-10-06").length, 0);
  assert.equal(backgroundSegments(ranges, "2026-10-04")[0].start, 1380);
  assert.throws(() => backgroundSegments([{ ...ranges[0], end: ranges[0].start }], "2026-10-05"), RangeError);
  assert.throws(() => backgroundSegments([{ ...ranges[0], start: "2026-02-30" }], "2026-10-05"), RangeError);
});

