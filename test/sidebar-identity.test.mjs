import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL("../src/lib/sidebar-identity/sidebar-workspace-switcher.svelte", import.meta.url);

test("workspace switcher keeps its avatar visible when the sidebar collapses to an icon", async () => {
  const source = await readFile(componentUrl, "utf8");
  const avatarClass = "aspect-square size-8 shrink-0";

  assert.equal(source.split(avatarClass).length - 1, 2);
});
