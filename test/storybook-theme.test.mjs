import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const packageRoot = join(import.meta.dirname, "..");

test("Storybook exposes the shared theme presets through a global toolbar", async () => {
  const preview = await readFile(join(packageRoot, ".storybook/preview.ts"), "utf8");

  assert.match(preview, /themeTemplates\.map/);
  assert.match(preview, /themeColor:/);
  assert.match(preview, /title: "テーマカラー"/);
  assert.match(preview, /initialGlobals:\s*\{\s*themeColor: "orange"/);
  assert.match(preview, /themeToCssVariables\(selectedTheme\)/);
  assert.match(preview, /applyPreviewTheme\(context\.globals\.themeColor\)/);
});
