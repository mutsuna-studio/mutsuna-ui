import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { setTimeout as wait } from "node:timers/promises";
import { scrollbarVisibility } from "../src/lib/scrollbar/scrollbar.ts";

const packageRoot = join(import.meta.dirname, "..");

function createScrollableNode() {
  const node = new EventTarget();
  node.dataset = {};
  return node;
}

test("scrollbar visibility moves through visible, fading-out, and hidden states", async () => {
  const node = createScrollableNode();
  const action = scrollbarVisibility(node, { hideDelayMs: 5, fadeDurationMs: 5 });

  node.dispatchEvent(new Event("scroll"));
  assert.equal(node.dataset.scrollbarState, "visible");

  await wait(8);
  assert.equal(node.dataset.scrollbarState, "fading-out");

  await wait(8);
  assert.equal(node.dataset.scrollbarState, undefined);
  action?.destroy?.();
});

test("scrollbar visibility clears timers and state when destroyed", async () => {
  const node = createScrollableNode();
  const action = scrollbarVisibility(node, { hideDelayMs: 5, fadeDurationMs: 5 });

  node.dispatchEvent(new Event("scroll"));
  action?.destroy?.();
  await wait(16);

  assert.equal(node.dataset.scrollbarState, undefined);
});

test("theme owns the cross-browser scrollbar appearance", async () => {
  const themeCss = await readFile(join(packageRoot, "src", "lib", "theme.css"), "utf8");

  assert.match(themeCss, /\.mutsuna-scrollbar\[data-scrollbar-state="visible"\]/);
  assert.match(themeCss, /\.mutsuna-scrollbar\[data-scrollbar-state="fading-out"\]/);
  assert.match(themeCss, /\.mutsuna-scrollbar::-webkit-scrollbar-button/);
  assert.match(themeCss, /scrollbar-color: transparent transparent/);
  assert.match(themeCss, /background-color: var\(--primary\)/);
});
