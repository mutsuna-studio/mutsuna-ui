import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL(
  "../src/lib/admin-shell-frame/admin-shell-frame.svelte",
  import.meta.url
);
const storyUrl = new URL(
  "../stories/admin-shell-frame.stories.svelte",
  import.meta.url
);

test("admin shell content fills the inset instead of shrinking as a horizontal flex item", async () => {
  const source = await readFile(componentUrl, "utf8");
  const contentClass = source.match(
    /<ScrollbarArea[\s\S]*?class=\{cn\(\s*"([^"]+)"/
  )?.[1];

  assert.ok(contentClass, "ScrollbarAreaの標準classを取得できること");
  assert.equal(contentClass.split(/\s+/).includes("flex"), false);
  assert.equal(contentClass.split(/\s+/).includes("flex-1"), true);
});

test("app shell story keeps sidebar identity and menu labels intact when collapsed", async () => {
  const source = await readFile(storyUrl, "utf8");

  assert.match(source, /<SidebarWorkspaceSwitcher/);
  assert.match(source, /menuLabel="店舗切替"/);
  assert.match(
    source,
    /<CalendarDaysIcon aria-hidden="true" \/>[\s\S]*<span>予約<\/span>/
  );
  assert.match(
    source,
    /<MapIcon aria-hidden="true" \/>[\s\S]*<span>マップ<\/span>/
  );
  assert.match(
    source,
    /<UsersIcon aria-hidden="true" \/>[\s\S]*<span>顧客<\/span>/
  );
  assert.match(source, /<SidebarUserMenu/);
  assert.match(source, /<BellIcon aria-hidden="true" \/>/);
  assert.match(source, /<CircleHelpIcon aria-hidden="true" \/>/);
  assert.doesNotMatch(
    source,
    /<Sidebar\.Header[^>]*>Workspace<\/Sidebar\.Header>/
  );
});
