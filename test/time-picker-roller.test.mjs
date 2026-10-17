import assert from "node:assert/strict";
import test from "node:test";
import { normalizeNumericInput } from "../dist/rolling-text/numeric-input.js";
test("numeric input converts full width digits, removes other characters and limits length", () => {
  assert.equal(normalizeNumericInput("２０a２９年", 4), "2029");
  assert.equal(normalizeNumericInput("１月２", 2), "12");
  assert.equal(normalizeNumericInput("+０９.５", 2), "09");
  assert.equal(normalizeNumericInput("abc", 4), "");
  assert.equal(normalizeNumericInput("２０２９９", 4), "2029");
});
