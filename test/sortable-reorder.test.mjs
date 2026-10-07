import assert from "node:assert/strict";
import { test } from "node:test";
import { reorderItems } from "../dist/internal/sortable-list/reorder.js";
const items = Object.freeze([{ id: "a" }, { id: "lock", locked: true }, { id: "b" }, { id: "c" }].map(Object.freeze));
const key = item => item.id;
const locked = item => Boolean(item.locked);
const move = (from, to) => reorderItems(items, from, to, key, locked);

test("drag and adjacent moves preserve locked positions and leave the input untouched", () => {
  assert.deepEqual(move("a", "b").map(key), ["b", "lock", "a", "c"]);
  assert.deepEqual(move("c", "a").map(key), ["c", "lock", "a", "b"]);
  assert.deepEqual(move("c", "lock").map(key), ["a", "lock", "c", "b"]);
  for (const from of items) for (const to of items) {
    const result = move(from.id, to.id);
    if (!result) continue;
    assert.equal(result[1], items[1]);
    assert.deepEqual(result.map(key).sort(), items.map(key).sort());
  }
  assert.deepEqual(items.map(key), ["a", "lock", "b", "c"]);
});

test("invalid, locked and unchanged moves do not request a commit", () => {
  for (const pair of [["missing", "a"], ["a", "missing"], ["lock", "c"], ["a", "a"], ["a", "lock"]]) {
    assert.equal(move(...pair), null);
  }
  assert.equal(reorderItems([], "a", "b", key, locked), null);
});
