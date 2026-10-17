import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

// Layout-only borders (table rows, separators) are not control focus surfaces.
// Scan new components too, so another bespoke joined control cannot silently
// reintroduce partial border removal.
test("focusable components retain all four control borders", async () => {
  const root = new URL("../src/lib/", import.meta.url);
  const files = await readdir(root, { recursive: true });
  for (const file of files.filter((file) => /\.(svelte|ts)$/.test(file))) {
    const source = await readFile(new URL(file, root), "utf8");
    if (!/focus(?:-visible|-within)?[:\[]/.test(source)) continue;
    assert.doesNotMatch(source, /border-[lrtbsexy]-0(?:[\s"!]|$)/,
      `${file}: keep control borders intact and use ButtonGroup for joined controls`);
  }
});
