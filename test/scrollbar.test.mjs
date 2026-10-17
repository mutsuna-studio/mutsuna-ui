import assert from "node:assert/strict";
import { test } from "node:test";
import { scrollbarVisibility } from "../dist/scrollbar/scrollbar.js";

function setup(t, options) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const node = Object.assign(new EventTarget(), { dataset: {} });
  const action = scrollbarVisibility(node, options);
  t.after(() => action?.destroy?.());
  return { node, action, scroll: () => node.dispatchEvent(new Event("scroll")) };
}

test("scrollbar moves through visible, fading-out and hidden states at the configured times", t => {
  const { node, scroll } = setup(t, { hideDelayMs: 5, fadeDurationMs: 5 });
  scroll();
  assert.equal(node.dataset.scrollbarState, "visible");
  t.mock.timers.tick(4);
  assert.equal(node.dataset.scrollbarState, "visible");
  t.mock.timers.tick(1);
  assert.equal(node.dataset.scrollbarState, "fading-out");
  t.mock.timers.tick(5);
  assert.equal(node.dataset.scrollbarState, undefined);
});

test("scrolling during fade cancels the old deadline and uses updated durations", t => {
  const { node, action, scroll } = setup(t, { hideDelayMs: 5, fadeDurationMs: 5 });
  scroll();
  t.mock.timers.tick(5);
  action.update({ hideDelayMs: 20, fadeDurationMs: 10 });
  scroll();
  t.mock.timers.tick(5);
  assert.equal(node.dataset.scrollbarState, "visible");
  t.mock.timers.tick(15);
  assert.equal(node.dataset.scrollbarState, "fading-out");
  t.mock.timers.tick(10);
  assert.equal(node.dataset.scrollbarState, undefined);
});

test("destroy clears timers, state and the scroll listener", t => {
  const { node, action, scroll } = setup(t);
  scroll();
  action.destroy();
  t.mock.timers.tick(1000);
  scroll();
  assert.equal(node.dataset.scrollbarState, undefined);
});
