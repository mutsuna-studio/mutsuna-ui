import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const packageRoot = join(import.meta.dirname, "..");

test("responsive dialog is an explicit public composition of dialog and drawer", async () => {
  const [packageJson, root, index] = await Promise.all([
    readFile(join(packageRoot, "package.json"), "utf8").then(JSON.parse),
    readFile(join(packageRoot, "src/lib/responsive-dialog/responsive-dialog.svelte"), "utf8"),
    readFile(join(packageRoot, "src/lib/responsive-dialog/index.ts"), "utf8"),
  ]);

  assert.equal(packageJson.exports["./responsive-dialog"].types, "./dist/responsive-dialog/index.d.ts");
  assert.match(root, /breakpoint = 768/);
  assert.match(root, /ssrMode = "desktop"/);
  assert.match(root, /mobileQuery: \(\) =>/);
  assert.match(root, /responsive\.sync\(open\)/);
  assert.match(root, /responsive\.trigger\?\.focus\(\)/);
  assert.match(root, /responsive\.content\?\.contains\(activeElement\)/);
  assert.match(root, /responsive\.current === "mobile"/);
  assert.match(root, /<Drawer bind:open/);
  assert.match(root, /<Dialog bind:open/);
  assert.match(index, /Root as ResponsiveDialog/);
});

test("responsive overlay state is primitive-independent for future compositions", async () => {
  const context = await readFile(join(packageRoot, "src/lib/responsive-overlay/context.svelte.ts"), "utf8");

  assert.match(context, /ResponsiveOverlayMode = "auto" \| "desktop" \| "mobile"/);
  assert.match(context, /new MediaQuery\(mobileQuery\(\), ssrMode\(\) === "mobile"\)/);
  assert.match(context, /initialMode === "auto" \? ssrMode\(\) : initialMode/);
  assert.match(context, /get preferred\(\)/);
  assert.match(context, /sync\(open: boolean\)/);
  assert.match(context, /if \(!this\.#clientSynchronized \|\| !open\)/);
  assert.match(context, /this\.#clientSynchronized = true/);
  assert.match(context, /setTrigger\(trigger: HTMLElement \| null\)/);
  assert.match(context, /setContent\(content: HTMLElement \| null\)/);
  assert.doesNotMatch(context, /bits-ui|vaul-svelte|responsive-dialog/);
});
