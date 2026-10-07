import assert from "node:assert/strict";
import { test } from "node:test";
import { nextEnabledIndex } from "../dist/internal/select/navigation.js";

test("searchable selection skips disabled options in either direction and wraps", () => {
  const options = [{ disabled: true }, {}, { disabled: true }, {}];
  assert.equal(nextEnabledIndex(options, -1, 1), 1);
  assert.equal(nextEnabledIndex(options, -1, -1), 3);
  assert.equal(nextEnabledIndex(options, 1, 1), 3);
  assert.equal(nextEnabledIndex(options, 3, 1), 1);
  assert.equal(nextEnabledIndex(options, 1, -1), 3);
  assert.equal(nextEnabledIndex(options, 3, -1), 1);
});

test("empty, disabled-only and shortened search results do not yield invalid candidates", () => {
  for (const direction of [-1, 1]) {
    assert.equal(nextEnabledIndex([], -1, direction), -1);
    assert.equal(nextEnabledIndex([{ disabled: true }], -1, direction), -1);
    assert.equal(nextEnabledIndex([{}], 10, direction), 0);
    assert.equal(nextEnabledIndex([{}], 0, direction), 0);
  }
});
