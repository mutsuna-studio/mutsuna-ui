import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { colorFormats, formatColor, hsvToRgb, parseColor, rgbToHsv } from "../src/lib/oklch-color-picker/color.ts";

const componentSource = await readFile(new URL("../src/lib/oklch-color-picker/oklch-color-picker.svelte", import.meta.url), "utf8");

test("color picker parses every supported display format", () => {
  assert.deepEqual(colorFormats, ["hex", "rgb", "hsl", "oklch"]);
  assert.equal(parseColor("#191A22")?.format, "hex");
  assert.equal(parseColor("rgb(25, 26, 34)")?.format, "rgb");
  assert.equal(parseColor("hsl(233 15% 12%)")?.format, "hsl");
  assert.equal(parseColor("oklch(21.8% 0.014 277.7)")?.format, "oklch");
  assert.equal(parseColor("not-a-color"), null);
});

test("color formats round-trip through RGB", () => {
  const source = parseColor("#2563EB")?.rgb;
  assert.ok(source);
  for (const format of colorFormats) {
    const formatted = formatColor(source, format);
    const reparsed = parseColor(formatted);
    assert.ok(reparsed, `${format} should parse after formatting`);
    assert.ok(Math.abs(reparsed.rgb.r - source.r) <= 2);
    assert.ok(Math.abs(reparsed.rgb.g - source.g) <= 2);
    assert.ok(Math.abs(reparsed.rgb.b - source.b) <= 2);
  }
});

test("HSV plane conversion preserves a selected color", () => {
  const rgb = { r: 25, g: 26, b: 34 };
  assert.deepEqual(hsvToRgb(rgbToHsv(rgb)), rgb);
});

test("selected color is reflected in the editable trigger background", () => {
  assert.match(componentSource, /--picker-preview: \$\{previewColor\}/);
  assert.match(componentSource, /background: var\(--picker-preview\)/);
  assert.match(componentSource, /color: var\(--picker-preview-foreground\)/);
});

test("clicking the editable trigger opens the visual picker", () => {
  assert.match(componentSource, /<PopoverTrigger>[\s\S]*?<input \{\.\.\.inputTriggerProps\(props\)\} type="text"/);
  assert.match(componentSource, /<PipetteIcon[^>]+pointer-events-none[^>]+aria-hidden="true"/);
});
