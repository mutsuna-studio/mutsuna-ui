import assert from "node:assert/strict";
import test from "node:test";
import { parseDateTimeInput as parse } from "../dist/date-time-input/index.js";
test("common year-first formats normalize without relying on local timezone", () => {
  for (const input of ["202609", "2026-9", "2026-09", "2026/9", "2026.9", "２０２６年９月", "2026/9/13", "2026-9-13 9:30"]) assert.equal(parse(input, "month"), "2026-09", input);
  for (const input of ["20260913", "2026-9-13", "2026/9/13", "２０２６年９月１３日"]) assert.equal(parse(input, "day"), "2026-09-13", input);
  assert.equal(parse("2026/9/13", "year"), "2026");
  for (const input of ["202613", "2026-13", "2026-2-29", "2026-9-31", "9/13/26", "2026/9junk"]) assert.equal(parse(input, "day"), null, input);
  assert.equal(parse("2028/2/29", "day"), "2028-02-29");
});
test("clock formats and fullwidth input share normalization", () => {
  for (const input of ["9:30", "０９：３０", "0930", "9時30分", "9:30 AM", "午前9時30分"]) assert.equal(parse(input, "time"), "09:30", input);
  assert.equal(parse("9:30 PM", "time"), "21:30");
  assert.equal(parse("2026-9-13 09:30:45", "time"), "09:30");
  assert.equal(parse("24:00", "time"), null);
  assert.equal(parse("9:60", "time"), null);
});
test("Excel serial conversion includes fractional days and both date systems", () => {
  assert.equal(parse(1, "day"), "1900-01-01");
  assert.equal(parse(59, "day"), "1900-02-28");
  assert.equal(parse(60, "day"), null);
  assert.equal(parse(61, "day"), "1900-03-01");
  assert.equal(parse(0, "day", { excelDateSystem: "1904" }), "1904-01-01");
  assert.equal(parse(1462, "day"), "1904-01-01");
  assert.equal(parse(46278.5, "day"), "2026-09-13");
  assert.equal(parse("46278", "month"), "2026-09");
  assert.equal(parse("0.5", "time"), "12:00");
  assert.equal(parse("46278.5", "time"), "12:00");
  assert.equal(parse("excel:1", "month"), "1900-01");
  assert.equal(parse(-1, "day"), null);
  assert.equal(parse(Infinity, "day"), null);
  assert.equal(parse("2026", "year"), "2026");
});
