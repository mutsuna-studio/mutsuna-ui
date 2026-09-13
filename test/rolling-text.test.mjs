import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const componentSource = await readFile(new URL("../src/lib/rolling-text/rolling-text.svelte", import.meta.url), "utf8");
const indexSource = await readFile(new URL("../src/lib/rolling-text/index.ts", import.meta.url), "utf8");
const wheelSource = await readFile(new URL("../src/lib/rolling-text/wheel-navigation.ts", import.meta.url), "utf8");

test("rolling text exposes reusable direction and duration controls", () => {
  assert.match(componentSource, /direction = "up"/);
  assert.match(componentSource, /duration = 280/);
  assert.match(indexSource, /RollingTextDirection/);
  assert.match(indexSource, /RollingTextProps/);
});

test("rolling text keeps outgoing and incoming values in one clipped viewport", () => {
  assert.match(componentSource, /rolling-text-item-out/);
  assert.match(componentSource, /rolling-text-item-in/);
  assert.match(componentSource, /overflow: hidden/);
});

test("rolling text can reserve the widest candidate width without consumer layout CSS", () => {
  assert.match(componentSource, /widthValues\?: readonly string\[\]/);
  assert.match(componentSource, /widthValues\?\.length \? widthValues : \[current\]/);
  assert.match(componentSource, /#each sizingValues as sizingValue/);
  assert.match(componentSource, /\.rolling-text-size > span \{ grid-area: 1 \/ 1; \}/);
});

test("rolling text owns its alignment instead of inheriting an unstable parent alignment", () => {
  assert.match(componentSource, /align = "start"/);
  assert.match(componentSource, /data-align=\{align\}/);
  assert.match(componentSource, /\.rolling-text\[data-align="start"\] \{ text-align: start; \}/);
  assert.match(indexSource, /RollingTextAlign/);
});

test("rolling text respects reduced motion", () => {
  assert.match(componentSource, /prefers-reduced-motion: reduce/);
  assert.match(componentSource, /\.rolling-text-item \{ animation: none; \}/);
});

test("rolling text shares gesture-safe wheel navigation with composite controls", () => {
  assert.match(componentSource, /onPrevious: onPrevious \? handlePrevious : undefined/);
  assert.match(componentSource, /activeDirection = "up";[\s\S]*?onPrevious\?\.\(steps\)/);
  assert.match(componentSource, /activeDirection = "down";[\s\S]*?onNext\?\.\(steps\)/);
  assert.match(wheelSource, /addEventListener\("wheel", handleWheel, \{ passive: false \}\)/);
  assert.match(wheelSource, /delta > 0 \? options\.onNext : options\.onPrevious/);
  assert.match(wheelSource, /if \(gestureActive\) return/);
  assert.match(indexSource, /wheelNavigation/);
  assert.match(indexSource, /WheelNavigationOptions/);
});

test("wheel navigation supports accumulated multi-step continuous movement", () => {
  assert.match(wheelSource, /mode\?: "gesture" \| "continuous"/);
  assert.match(wheelSource, /accumulatedDelta \+= delta/);
  assert.match(wheelSource, /navigate\(steps\)/);
  assert.match(wheelSource, /normalizeWheelDelta/);
});

test("continuous wheel navigation treats a physical mouse notch as one step", () => {
  assert.match(wheelSource, /isDiscreteWheelInput\(event\)/);
  assert.match(wheelSource, /Math\.abs\(event\.deltaY\) >= 80/);
  assert.match(wheelSource, /if \(isDiscreteWheelInput\(event\)\) \{[\s\S]*?navigate\(1\);[\s\S]*?return;/);
});
