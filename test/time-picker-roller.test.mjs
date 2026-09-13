import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { normalizeNumericInput } from "../dist/rolling-text/numeric-input.js";
const time = await readFile(new URL("../src/lib/time-picker/time-picker.svelte", import.meta.url), "utf8");
const calendar = await readFile(new URL("../src/lib/calendar/calendar-roller.svelte", import.meta.url), "utf8");
test("calendar and time picker use the same numeric roller input", () => {
  assert.equal(time.match(/<NumericRollerInput /g)?.length, 2);
  assert.match(calendar, /<NumericRollerInput /);
});
test("numeric input converts full width digits, removes other characters and limits length", () => {
  assert.equal(normalizeNumericInput("２０a２９年", 4), "2029");
  assert.equal(normalizeNumericInput("１月２", 2), "12");
  assert.equal(normalizeNumericInput("+０９.５", 2), "09");
  assert.equal(normalizeNumericInput("abc", 4), "");
  assert.equal(normalizeNumericInput("２０２９９", 4), "2029");
});
