import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const packageRoot = join(import.meta.dirname, "..");

test("Slider composes the accessible Bits UI primitive with range and generated thumbs", async () => {
  const source = await readFile(join(packageRoot, "src/lib/slider/slider.svelte"), "utf8");

  assert.match(source, /SliderPrimitive\.Root/);
  assert.match(source, /SliderPrimitive\.Range/);
  assert.match(source, /SliderPrimitive\.Thumb/);
  assert.match(source, /\{#each thumbIndexes as index \(index\)\}/);
  assert.match(source, /bind:value/);
  assert.match(source, /thumbLabels\?: readonly string\[\]/);
  assert.match(source, /getThumbValueText\?: \(value: number, index: number\) => string/);
  assert.match(source, /aria-label=\{getThumbLabel\(index\)\}/);
  assert.match(source, /aria-valuetext=\{getThumbAriaValueText\(index\)\}/);
  assert.match(source, /relative flex h-8 w-full/);
  assert.match(source, /data-\[disabled\]:cursor-not-allowed data-\[disabled\]:opacity-50/);
  assert.match(source, /cursor-grab touch-none/);
  assert.match(source, /bg-input relative h-5 w-full/);
  assert.match(source, /orientation=vertical\]:w-8/);
  assert.match(source, /vertical\]\/slider:w-5/);
  assert.match(source, /bg-primary.*size-5.*before:-inset-1\.5.*after:inset-0\.5/);
  assert.match(source, /after:bg-background.*after:transition-\[inset\]/);
  assert.match(source, /focus-visible:bg-ring.*focus-visible:outline-none/);
  assert.doesNotMatch(source, /focus-visible:bg-ring\/50/);
  assert.match(source, /hover:after:inset-\[3px\]/);
  assert.match(source, /focus-visible:after:inset-\[3px\]/);
  assert.match(source, /data-\[active\]:cursor-grabbing.*data-\[active\]:after:inset-\[3px\]/);
  assert.match(source, /motion-reduce:after:transition-none/);
  assert.doesNotMatch(source, /after:shadow/);
  assert.doesNotMatch(source, /after:ring/);
  assert.doesNotMatch(source, /focus-visible:ring-4/);
  assert.doesNotMatch(source, /disabled:opacity-50/);
});
