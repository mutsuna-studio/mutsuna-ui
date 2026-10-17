import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Architectural guard: the reusable mode state must stay independent of a
// particular overlay primitive. Runtime/focus behavior is tested in the browser.
test("responsive overlay state remains primitive-independent", async () => {
  const context = await readFile(new URL("../src/lib/internal/responsive-overlay/context.svelte.ts", import.meta.url), "utf8");
  assert.doesNotMatch(context, /bits-ui|vaul-svelte|responsive-dialog/);
});
