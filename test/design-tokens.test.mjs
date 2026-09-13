import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { colorOrValueToCss, flattenTokens, generateTokens, resolveToken } from "../scripts/design-tokens.mjs";
import { defaultTheme, themeTemplates } from "../dist/theme/theme.js";

test("committed token outputs are current", async () => {
  await generateTokens({ check: true });
});

test("token resolver rejects missing, circular, and mistyped aliases", () => {
  const tokens = flattenTokens({
    white: { $type: "color", $value: { colorSpace: "srgb", components: [1, 1, 1] } },
    a: { $type: "color", $value: "{b}" },
    b: { $value: "{a}" },
    wrong: { $type: "dimension", $value: "{white}" },
    alias: { $value: "{white}" },
  });
  assert.equal(resolveToken("alias", tokens), tokens.get("white"));
  assert.throws(() => resolveToken("missing", tokens), /Unknown token/);
  assert.throws(() => resolveToken("a", tokens), /Circular alias/);
  assert.throws(() => resolveToken("wrong", tokens), /type mismatch/);
});

test("color serialization uses components, retains gamut and alpha, and rejects unsupported input", () => {
  const css = (value) => colorOrValueToCss({ $type: "color", $value: value });
  assert.equal(css({ colorSpace: "srgb", components: [1, 0, 0], hex: "#000000" }), "#ff0000");
  assert.equal(css({ colorSpace: "oklch", components: [0.7, 0.15, 230], alpha: 0 }), "oklch(0.7 0.15 230 / 0%)");
  assert.equal(css({ colorSpace: "display-p3", components: [1, 0.5, 0], alpha: 0.4 }), "color(display-p3 1 0.5 0 / 0.4)");
  for (const invalid of [
    { colorSpace: "srgb", components: [1, 0] },
    { colorSpace: "srgb", components: [2, 0, 0] },
    { colorSpace: "srgb", components: [1, 0, 0], alpha: -1 },
    { colorSpace: "srgb", components: [1, 0, 0], hex: "#fff" },
    { colorSpace: "hsl", components: [220, 10, 12] },
    { colorSpace: "oklch", components: [1, -0.1, 20] },
  ]) assert.throws(() => css(invalid));
});

// This fixture is the pre-migration public output, not another authoring source.
// Keep it frozen until an intentional visual/API change updates the baseline.
test("all 18 themes and base CSS retain their pre-migration output", async () => {
  const before = JSON.parse(await readFile(new URL("./fixtures/theme-before-tokens.json", import.meta.url), "utf8"));
  assert.deepEqual(defaultTheme, before.defaultTheme);
  const css = await readFile(new URL("../src/lib/theme.css", import.meta.url), "utf8");
  assert.equal(css.match(/:root \{[\s\S]*?(?=\/\* END GENERATED TOKENS)/)[0].trim(), before.css.trim());
  assert.equal(themeTemplates.length, before.templates.length);
  for (const [index, current] of themeTemplates.entries()) {
    const { appearance: previousAppearance, ...previous } = before.templates[index];
    const { appearance: currentAppearance, ...actual } = current;
    assert.deepEqual(actual, previous);
    assert.deepEqual(Object.keys(currentAppearance ?? {}), Object.keys(previousAppearance ?? {}));
  }
});
