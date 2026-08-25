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

test("admin shell supports nested scrolling without a reserved outer gutter or padding", async () => {
  const source = await readFile(componentUrl, "utf8");

  assert.match(source, /contentGutter = "stable"/);
  assert.match(source, /contentPadding = "default"/);
  assert.match(source, /<ScrollbarArea\s+gutter=\{contentGutter\}/);
  assert.match(source, /contentPadding === "default" && "px-2 sm:p-4 sm:pt-0"/);
});

test("admin shell exposes pageTitle as the page heading", async () => {
  const source = await readFile(componentUrl, "utf8");

  assert.match(
    source,
    /\{#if breadcrumb\}[\s\S]*<h1 class="sr-only">\{pageTitle\}<\/h1>/
  );
  assert.match(
    source,
    /<h1 class="text-foreground font-normal" aria-current="page">\{pageTitle\}<\/h1>/
  );
  assert.doesNotMatch(source, /<Breadcrumb\.Page>\{pageTitle\}<\/Breadcrumb\.Page>/);
});

test("admin shell header controls expose a 44px operation area", async () => {
  const source = await readFile(componentUrl, "utf8");

  assert.match(source, /<Sidebar\.Trigger class="-ms-1 size-11" \/>/);
  assert.match(source, /\[&_\[data-slot=button\]\]:min-h-11/);
  assert.match(source, /\[&_\[data-slot=button\]\]:min-w-11/);
  assert.doesNotMatch(
    source,
    /group-has-data-\[collapsible=icon\]\/sidebar-wrapper:h-10/
  );
});

test("admin shell uses full mobile width while preserving the bottom frame and desktop end frame", async () => {
  const source = await readFile(componentUrl, "utf8");

  assert.match(source, /rounded-\[14px\] border-y sm:me-2 sm:border/);
  assert.doesNotMatch(source, /\sms-2\s/);
  assert.doesNotMatch(source, /\sme-2\s/);
  assert.match(source, /\smb-2\s/);
  assert.doesNotMatch(source, /rounded-t-\[14px\]/);
});

test("app shell story presents a generic UI package catalog", async () => {
  const source = await readFile(storyUrl, "utf8");

  assert.match(source, /<SidebarWorkspaceSwitcher/);
  assert.match(source, /name: "@mutsuna\/ui"/);
  assert.match(source, /menuLabel="ライブラリ"/);
  assert.match(
    source,
    /<BlocksIcon aria-hidden="true" \/>[\s\S]*<span>コンポーネント<\/span>/
  );
  assert.match(
    source,
    /<PanelsTopLeftIcon aria-hidden="true" \/>[\s\S]*<span>パターン<\/span>/
  );
  assert.match(
    source,
    /<PaletteIcon aria-hidden="true" \/>[\s\S]*<span>テーマ<\/span>/
  );
  assert.match(source, /pageTitle="コンポーネント一覧"/);
  assert.match(source, /@mutsuna\/ui の再利用可能なコンポーネント/);
  assert.doesNotMatch(source, /予約|店舗切替|顧客/);
  assert.match(source, /<SidebarUserMenu/);
  assert.match(source, /<BellIcon aria-hidden="true" \/>/);
  assert.match(source, /<CircleHelpIcon aria-hidden="true" \/>/);
  assert.doesNotMatch(
    source,
    /<Sidebar\.Header[^>]*>Workspace<\/Sidebar\.Header>/
  );
});

test("app shell story includes enough main content to exercise scrolling", async () => {
  const source = await readFile(storyUrl, "utf8");
  const componentCount = source.match(/\{ name: "[^"]+", category:/g)?.length ?? 0;

  assert.ok(componentCount >= 18);
  assert.match(source, /\{#each components as component\}/);
});
