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

test("drawer exposes scroll-safe escape hatches and a functional drag handle", async () => {
  const [content, root, nestedRoot, trigger, close] = await Promise.all([
    readFile(join(packageRoot, "src/lib/drawer/drawer-content.svelte"), "utf8"),
    readFile(join(packageRoot, "src/lib/drawer/drawer.svelte"), "utf8"),
    readFile(join(packageRoot, "src/lib/drawer/drawer-nested.svelte"), "utf8"),
    readFile(join(packageRoot, "src/lib/drawer/drawer-trigger.svelte"), "utf8"),
    readFile(join(packageRoot, "src/lib/drawer/drawer-close.svelte"), "utf8"),
  ]);
  const index = await readFile(join(packageRoot, "src/lib/drawer/index.ts"), "utf8");

  assert.match(content, /showHandle = true/);
  assert.match(content, /<DrawerHandle/);
  assert.match(root, /autoFocus = true/);
  assert.match(nestedRoot, /autoFocus = true/);
  assert.match(root, /open = \$bindable\(defaultOpen\)/);
  assert.match(nestedRoot, /open = \$bindable\(defaultOpen\)/);
  assert.match(nestedRoot, /ComponentProps<typeof DrawerPrimitive\.NestedRoot>/);
  assert.doesNotMatch(nestedRoot, /DrawerPrimitive\.NestedRootProps/);
  assert.match(trigger, /type = "button"/);
  assert.match(close, /type = "button"/);
  assert.match(index, /Handle as DrawerHandle/);
});
