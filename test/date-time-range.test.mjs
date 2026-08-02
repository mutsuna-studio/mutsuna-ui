import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDefaultFutureDateTimeRange,
  readMinimumFutureTime,
  readMinimumFutureTimeInTimeZone,
} from "../dist/date-time-range-fields/date-time-utils.js";

test("default range starts at the next 15 minute boundary", () => {
  const range = createDefaultFutureDateTimeRange(new Date("2026-07-31T12:07:00.000Z"));

  assert.equal(range.startsAt.toISOString(), "2026-07-31T12:15:00.000Z");
  assert.equal(range.endsAt.toISOString(), "2026-07-31T13:15:00.000Z");
});

test("minimum time is only applied to the current local date", () => {
  const now = new Date(2026, 6, 31, 21, 7);

  assert.equal(readMinimumFutureTime("2026-07-31", now), "21:15");
  assert.equal(readMinimumFutureTime("2026-08-01", now), undefined);
});

test("minimum time respects the selected time zone", () => {
  const now = new Date("2026-07-31T12:07:00.000Z");

  assert.equal(readMinimumFutureTimeInTimeZone("2026-07-31", "Asia/Tokyo", now), "21:15");
  assert.equal(readMinimumFutureTimeInTimeZone("2026-07-31", "UTC", now), "12:15");
  assert.equal(readMinimumFutureTimeInTimeZone("2026-08-01", "Asia/Tokyo", now), undefined);
});
