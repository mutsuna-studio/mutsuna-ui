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
  assert.match(source, /aria-label=\{type === "multiple"/);
});
