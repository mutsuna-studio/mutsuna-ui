import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const packageRoot = join(import.meta.dirname, "..");

test("drawer is a separate public component backed by a pinned Svelte 5 Vaul release", async () => {
  const packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
  const sheet = await readFile(join(packageRoot, "src/lib/sheet/sheet-content.svelte"), "utf8");
  const sidebar = await readFile(join(packageRoot, "src/lib/sidebar/sidebar.svelte"), "utf8");

  assert.equal(packageJson.dependencies["vaul-svelte"], "1.0.0-next.7");
  assert.equal(packageJson.exports["./drawer"].types, "./dist/drawer/index.d.ts");
  assert.doesNotMatch(sheet, /vaul-svelte/);
  assert.doesNotMatch(sidebar, /vaul-svelte|@mutsuna\/ui\/drawer/);
});
