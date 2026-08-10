import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("avatar confines its blend mode to the component stacking context", async () => {
  const files = await Promise.all([
    readFile(new URL("../src/lib/avatar/avatar.svelte", import.meta.url), "utf8"),
    readFile(new URL("../dist/avatar/avatar.svelte", import.meta.url), "utf8"),
  ]);

  for (const source of files) {
    assert.match(source, /group\/avatar relative isolate flex/);
    assert.match(source, /after:mix-blend-darken dark:after:mix-blend-lighten/);
  }
});
