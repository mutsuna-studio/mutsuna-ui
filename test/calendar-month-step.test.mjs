import assert from "node:assert/strict";
import test from "node:test";
import { stepCalendarMonth } from "../dist/calendar/calendar-month-step.js";
const months = Array.from({ length: 12 }, (_, i) => i + 1);
test("month spin carries years in both directions and across multiple steps", () => {
  assert.deepEqual(stepCalendarMonth(2026, 12, 1, [2025, 2026, 2027], months), { year: 2027, month: 1 });
  assert.deepEqual(stepCalendarMonth(2026, 1, -1, [2025, 2026, 2027], months), { year: 2025, month: 12 });
  assert.deepEqual(stepCalendarMonth(2026, 11, 3, [2026, 2027], months), { year: 2027, month: 2 });
});
test("month spin stops at year limits and respects sparse options", () => {
  assert.deepEqual(stepCalendarMonth(2026, 12, 1, [2026], months), { year: 2026, month: 12 });
  assert.deepEqual(stepCalendarMonth(2026, 1, -1, [2026], months), { year: 2026, month: 1 });
  assert.deepEqual(stepCalendarMonth(2026, 9, 1, [2026, 2028], [3, 9]), { year: 2028, month: 3 });
});
test("month spin skips unavailable months and stops at filtered range boundaries", () => {
  const allowed = (year, month) => `${year}-${String(month).padStart(2, "0")}` >= "2026-11" && `${year}-${String(month).padStart(2, "0")}` <= "2027-03" && !(year === 2027 && month === 2);
  assert.deepEqual(stepCalendarMonth(2026, 12, 1, [2026, 2027], months, allowed), { year: 2027, month: 1 });
  assert.deepEqual(stepCalendarMonth(2027, 1, 1, [2026, 2027], months, allowed), { year: 2027, month: 3 });
  assert.deepEqual(stepCalendarMonth(2027, 3, 1, [2026, 2027], months, allowed), { year: 2027, month: 3 });
});
