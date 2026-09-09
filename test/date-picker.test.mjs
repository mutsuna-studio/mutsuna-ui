import assert from "node:assert/strict";
import { test } from "node:test";
import { fromDigits, isPickerValue } from "../dist/date-picker/date-picker-utils.js";

test("precision validates exact formats and Gregorian leap days", () => {
  for (const value of ["2026-02-29", "2026-04-31", "0000-01-01", "2026-13-01"]) assert.equal(isPickerValue(value, "day"), false);
  assert.equal(isPickerValue("2028-02-29", "day"), true);
  assert.equal(isPickerValue("1900-02-29", "day"), false);
  assert.equal(isPickerValue("2000-02-29", "day"), true);
  assert.equal(isPickerValue("2026-09", "year"), false);
  assert.equal(isPickerValue("2026-09-09", "month"), false);
  assert.equal(fromDigits("2026", "year"), "2026");
  assert.equal(fromDigits("202609", "month"), "2026-09");
  assert.equal(fromDigits("20260909", "day"), "2026-09-09");
  assert.equal(fromDigits("２０２６", "year"), "");
});
