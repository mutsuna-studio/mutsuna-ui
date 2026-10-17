import assert from "node:assert/strict";
import test from "node:test";
import { wheelNavigation } from "../dist/rolling-text/wheel-navigation.js";

// The action only needs EventTarget and WheelEvent's unit constants. Geometry,
// rendering and focus are covered in test/browser/rolling-text.test.ts.
function setup(t, options = {}) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const previous = globalThis.WheelEvent;
  globalThis.WheelEvent = { DOM_DELTA_PIXEL: 0, DOM_DELTA_LINE: 1, DOM_DELTA_PAGE: 2 };
  const node = Object.assign(new EventTarget(), { clientHeight: 200 });
  const calls = [];
  const callbacks = { onPrevious: steps => calls.push([-1, steps]), onNext: steps => calls.push([1, steps]) };
  const action = wheelNavigation(node, { ...callbacks, ...options });
  t.after(() => { action.destroy(); if (previous === undefined) delete globalThis.WheelEvent; else globalThis.WheelEvent = previous; });
  return { calls, action, callbacks, wheel(deltaY, deltaMode = 0) {
    const event = Object.assign(new Event("wheel", { cancelable: true }), { deltaY, deltaMode });
    node.dispatchEvent(event);
    return event.defaultPrevented;
  } };
}

test("gesture navigation ignores noise and emits once until the gesture expires", t => {
  const { calls, wheel } = setup(t);
  assert.equal(wheel(3), false);
  assert.equal(wheel(5), true);
  wheel(12); wheel(-12);
  assert.deepEqual(calls, [[1, 1]]);
  t.mock.timers.tick(161);
  wheel(-5);
  assert.deepEqual(calls, [[1, 1], [-1, 1]]);
});

test("continuous navigation accumulates sub-threshold deltas and retains the remainder", t => {
  const { calls, wheel } = setup(t, { mode: "continuous", threshold: 4 });
  wheel(2); wheel(7); wheel(3);
  assert.deepEqual(calls, [[1, 2], [1, 1]]);
});

test("continuous navigation resets accumulated motion on direction changes and timeout", t => {
  const { calls, wheel } = setup(t, { mode: "continuous" });
  wheel(3); wheel(-3); wheel(-1);
  assert.deepEqual(calls, [[-1, 1]]);
  wheel(3);
  t.mock.timers.tick(161);
  wheel(1);
  assert.deepEqual(calls, [[-1, 1]]);
});

test("physical wheel notches, line units and page units each advance one semantic step", t => {
  const { calls, wheel } = setup(t, { mode: "continuous" });
  wheel(100); wheel(-120); wheel(3, 1); wheel(-1, 2);
  assert.deepEqual(calls, [[1, 1], [-1, 1], [1, 1], [-1, 1]]);
});

test("gesture thresholds normalize line and page units", t => {
  const { calls, wheel } = setup(t, { threshold: 100 });
  assert.equal(wheel(1, 1), false);
  assert.equal(wheel(1, 2), true);
  assert.deepEqual(calls, [[1, 1]]);
});

test("disabled or unavailable directions preserve native scrolling", t => {
  const { calls, wheel, action, callbacks } = setup(t, { disabled: true });
  assert.equal(wheel(10), false);
  action.update({ onNext: callbacks.onNext });
  assert.equal(wheel(-10), false);
  assert.equal(wheel(10), true);
  assert.deepEqual(calls, [[1, 1]]);
});

test("updated callbacks and options are used without remounting", t => {
  const { calls, wheel, action } = setup(t);
  action.update({ mode: "continuous", threshold: 10, onNext: steps => calls.push([2, steps]) });
  wheel(25);
  assert.deepEqual(calls, [[2, 2]]);
});

test("destroy removes wheel listeners and cancels pending gesture work", t => {
  const { calls, wheel, action } = setup(t);
  wheel(10);
  action.destroy();
  t.mock.timers.tick(1000);
  assert.equal(wheel(10), false);
  assert.deepEqual(calls, [[1, 1]]);
});
