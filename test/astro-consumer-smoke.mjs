import { verifyAdminShell } from "./admin-shell-browser.mjs";
import { verifyEventCalendar } from "./event-calendar-browser.mjs";
import { verifySelectPosition } from "./select-position-browser.mjs";
import { verifyChatLongAnswer } from "./chat-long-answer-browser.mjs";
import { verifyImageGallery } from "./image-gallery-browser.mjs";
import { verifyImagePreview } from "./image-preview-browser.mjs";
import { verifyChatRevision } from "./chat-revision-browser.mjs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve, sep } from "node:path";
import { chromium } from "playwright";
import { readAstroCoverage, createAstroImportProbe } from "./astro-coverage.mjs";

const packageRoot = resolve(import.meta.dirname, "..");
const temporaryRoot = await mkdtemp(join(tmpdir(), "mutsuna-ui-astro-"));
const consumer = join(temporaryRoot, "consumer");
const packed = join(temporaryRoot, "packed");
const env = { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" };
const run = (command, args, cwd = consumer) => execFileSync(command, args, { cwd, env, stdio: "inherit" });

async function serve(directory) {
  const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".woff": "font/woff", ".woff2": "font/woff2" };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      const file = resolve(directory, `.${pathname.endsWith("/") ? `${pathname}index.html` : pathname}`);
      if (!file.startsWith(`${directory}${sep}`)) throw new Error("Invalid path");
      const body = await readFile(file);
      response.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise((accept, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", accept); });
  return { server, url: `http://127.0.0.1:${server.address().port}/` };
}

let browser;
try {
  await mkdir(packed);
  await cp(join(import.meta.dirname, "fixtures/astro"), consumer, { recursive: true });
  const coverage = await readAstroCoverage();
  await writeFile(join(consumer, "svelte/src/components/ImportProbe.svelte"), createAstroImportProbe(coverage));
  await writeFile(join(consumer, "svelte/src/pages/imports.astro"), `---
import ImportProbe from "../components/ImportProbe.svelte";
---
<html lang="en"><head><title>Public import coverage</title></head><body><ImportProbe client:load /></body></html>
`);
  // prepack builds/checks generated files. Never resolve UI via a workspace alias.
  run("pnpm", ["pack", "--pack-destination", packed], packageRoot);
  const tarballs = (await readdir(packed)).filter((name) => name.endsWith(".tgz"));
  assert.equal(tarballs.length, 1);
  run("npm", ["ci", "--no-audit", "--no-fund"]);
  // Update only the disposable manifest/lock; preserve the locked Astro dependency tree.
  run("npm", ["install", "--save-exact", "--no-audit", "--no-fund", join(packed, tarballs[0])]);
  const installed = JSON.parse(await readFile(join(consumer, "node_modules/@mutsuna/ui/package.json"), "utf8"));
  assert.equal(installed.exports["./tokens.css"], "./dist/tokens.css");
  assert.equal(installed.exports["./fonts.css"], "./dist/fonts.css");
  for (const mode of ["tokens", "svelte"]) {
    run("npm", ["run", `check:${mode}`]);
    run("npm", ["run", `build:${mode}`]);
  }

  browser = await chromium.launch({ headless: true, ignoreDefaultArgs: ["--hide-scrollbars"] });
  for (const mode of ["tokens", "svelte"]) {
    const directory = join(consumer, mode, "dist");
    const html = await readFile(join(directory, "index.html"), "utf8");
    if (mode === "tokens") assert.doesNotMatch(html, /<script|astro-island/);
    else assert.match(html, /Count: 0/); // The island is server rendered, not client-only.
    const { server, url } = await serve(directory);
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      const errors = [];
      const requests = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("requestfailed", (request) => errors.push(request.failure()?.errorText));
      page.on("response", (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      page.on("request", (request) => requests.push(request.url()));
      await page.addInitScript(() => {
        window.__copiedCode = null;
        window.__copyFails = false;
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
          writeText: async (value) => {
            if (window.__copyFails) throw new Error("Clipboard denied");
            window.__copiedCode = value;
          },
        } });
      });
      if (mode === "svelte") await verifySelectPosition(page, url);
      await page.goto(url);
      const style = (selector, property) => page.locator(selector).evaluate((element, property) => getComputedStyle(element).getPropertyValue(property), property);
      if (mode === "tokens") {
        assert.equal(await style("#base", "background-color"), "oklch(1 0 0)");
        assert.equal(await style("#base", "border-radius"), "10px");
        assert.equal(await style("#github", "background-color"), "rgb(255, 255, 255)");
        await page.evaluate(() => document.documentElement.classList.add("dark"));
        assert.equal(await style("#base", "background-color"), "oklch(0.141 0.005 285.823)");
        assert.equal(await style("#github", "background-color"), "rgb(13, 17, 23)");
        assert.equal(requests.some((url) => /\.(?:js|woff2?)(?:\?|$)/.test(url)), false, "Token-only page must not load JS or fonts");
      } else {
        await page.waitForFunction(() => !document.querySelector("astro-island[ssr]"));
        await verifyAdminShell(page, url);
        await verifyChatLongAnswer(page, url);
        await verifyChatRevision(page, url);
        await verifyImagePreview(page, url);
        await verifyImageGallery(page, url);
        const legacy = page.locator("[data-legacy-contract]");
        assert.equal(await legacy.getAttribute("data-numeric"), "2029");
        assert.equal(await legacy.getAttribute("data-accent"), "true");
        const savedViewport = page.viewportSize();
        await page.setViewportSize({ width: 390, height: 844 });
        await page.getByRole("button", { name: "動的ダイアログを開く", exact: true }).click();
        let dynamicDialog = page.getByRole("dialog", { name: "動的な予約作成", exact: true });
        await dynamicDialog.waitFor();
        assert.equal(await dynamicDialog.getAttribute("data-slot"), "drawer-content");
        await dynamicDialog.getByRole("button", { name: "閉じる", exact: true }).click();
        await page.waitForFunction(() => !document.querySelector('[role="dialog"]') && getComputedStyle(document.body).pointerEvents !== "none");
        await page.waitForTimeout(650); // Vaul's delayed style restoration must also leave the page interactive.
        assert.notEqual(await page.locator('body').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
        await page.getByRole("button", { name: "動的ダイアログを開く", exact: true }).click();
        await dynamicDialog.waitFor();
        await dynamicDialog.getByRole("button", { name: "閉じる", exact: true }).click();
        await page.waitForFunction(() => !document.querySelector('[role="dialog"]') && getComputedStyle(document.body).pointerEvents !== "none");
        if (savedViewport) await page.setViewportSize(savedViewport);
        console.log("Astro responsive dialog: initially-open mobile mount closes and reopens without blocking the page");
        const outline = page.getByRole('region', { name: 'Astro outline' });
        await outline.getByRole('button', { name: '2：次の項目' }).hover();
        await page.getByRole('dialog', { name: '目次', exact: true }).getByRole('button', { name: '2 次の項目' }).waitFor();
        await outline.getByRole('button', { name: '2：次の項目' }).click();
        await page.waitForFunction(() => document.querySelector('[data-outline-result]').textContent === 'b');
        await outline.getByRole('button', { name: '1：最初の項目' }).focus();
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.querySelector('[data-outline-result]').textContent === 'a');
        console.log("Astro OutlineNav: full outline hover, click and keyboard navigation passed");
        const roundedScroller = page.getByRole('region', { name: '角丸のスクロール領域', exact: true });
        await roundedScroller.scrollIntoViewIfNeeded();
        assert.equal(await roundedScroller.evaluate(el => getComputedStyle(el).clipPath), 'border-box');
        await roundedScroller.focus();
        await roundedScroller.press('PageDown');
        await page.waitForFunction(() => document.querySelector('[aria-label="角丸のスクロール領域"]').scrollTop > 0);
        assert.equal(await roundedScroller.evaluate(el => document.activeElement === el), true);
        assert.equal(await roundedScroller.evaluate(el => { const s = getComputedStyle(el); return parseFloat(s.outlineOffset) + parseFloat(s.outlineWidth) <= 0; }), true);
        await page.getByRole('button', { name: '領域内の操作', exact: true }).click();
        assert.equal(await page.getByLabel('領域内の操作回数', { exact: true }).textContent(), '1');
        console.log('Astro ScrollbarArea: rounded clipping, inset focus, keyboard scroll and hydration passed');
        await verifyEventCalendar(page);
        const preview = page.locator('#sidebar-preview');
        const sidebarRoot = preview.locator('[data-slot="sidebar"]');
        const panel = preview.locator('[data-slot="sidebar-container"]');
        const inset = preview.locator('[data-slot="sidebar-inset"]');
        await preview.scrollIntoViewIfNeeded();
        const mainBefore = await inset.boundingBox();
        const avatarBounds = await preview.locator('[data-slot="sidebar-footer"] [data-slot="avatar"]').evaluate(avatar => {
          const button = avatar.closest('button');
          const a = avatar.getBoundingClientRect();
          const b = button.getBoundingClientRect();
          const border = parseFloat(getComputedStyle(button).borderLeftWidth);
          return { contained: a.left >= b.left + border && a.right <= b.right - border && a.top >= b.top + border && a.bottom <= b.bottom - border,
            radius: getComputedStyle(avatar).borderTopLeftRadius,
            borderRadius: getComputedStyle(avatar, '::after').borderTopLeftRadius,
            backgroundRadius: getComputedStyle(avatar.querySelector('[data-slot="avatar-fallback"]')).borderTopLeftRadius,
            width: a.width };
        });
        assert.equal(avatarBounds.contained, true, "Collapsed account avatar must fit inside all four button borders");
        assert.equal(avatarBounds.width, 24, "Compact account avatar keeps its intended size");
        assert.equal(avatarBounds.radius, avatarBounds.borderRadius, "Avatar border must match its corner shape");
        assert.equal(avatarBounds.radius, avatarBounds.backgroundRadius, "Avatar background must stay within its border shape");
        const savedCookie = await context.cookies();
        await panel.hover();
        await page.waitForFunction(() => document.querySelector('#sidebar-preview [data-preview]').dataset.preview === 'open');
        await page.waitForFunction(() => document.querySelector('#sidebar-preview [data-slot="sidebar-container"]').getBoundingClientRect().width > 200);
        assert.deepEqual(await inset.boundingBox(), mainBefore, "Hover preview must not shift or resize main content");
        assert.equal(await sidebarRoot.getAttribute('data-state'), 'collapsed');
        assert.equal(await page.locator('#preview-changes').textContent(), '0');
        assert.deepEqual(await context.cookies(), savedCookie, "Hover must not persist an expanded state");
        await page.mouse.move(900, 0);
        await page.waitForFunction(() => document.querySelector('#sidebar-preview [data-preview]').dataset.preview === 'closed');
        await page.locator('#preview-opt-out').click();
        await panel.hover();
        assert.equal(await sidebarRoot.getAttribute('data-preview'), 'closed', "Opt-out must retain icon-only display");
        await page.locator('#preview-opt-out').click();
        for (const variant of ['inset', 'floating']) {
          await page.locator('#preview-variant').click();
          await page.locator('#preview-side').click();
          await page.waitForFunction(() => document.querySelector('#sidebar-preview [data-slot="sidebar-gap"]').getBoundingClientRect().width === 64);
          const before = await inset.boundingBox();
          await panel.hover();
          await page.waitForFunction(() => document.querySelector('#sidebar-preview [data-preview]').dataset.preview === 'open');
          assert.deepEqual(await inset.boundingBox(), before, `${variant} preview must preserve main geometry on either side`);
          await page.mouse.move(900, 0);
          await page.waitForFunction(() => document.querySelector('#sidebar-preview [data-preview]').dataset.preview === 'closed');
        }
        const member = preview.getByRole('button', { name: 'Preview members', exact: true });
        await member.click();
        await page.mouse.move(900, 0);
        await page.waitForFunction(() => document.querySelector('#sidebar-preview [data-preview]').dataset.preview === 'closed');
        await preview.getByRole('button', { name: 'Preview menu', exact: true }).click();
        await page.getByRole('menuitem', { name: 'Preview action', exact: true }).click();
        await page.mouse.move(900, 0);
        await page.waitForFunction(() => document.querySelector('#sidebar-preview [data-preview]').dataset.preview === 'closed');
        await member.focus();
        await member.press('Tab');
        await page.keyboard.press('Shift+Tab');
        await page.waitForFunction(() => document.querySelector('#sidebar-preview [data-preview]').dataset.preview === 'open');
        await member.press('Escape');
        await page.waitForFunction(() => document.querySelector('#sidebar-preview [data-preview]').dataset.preview === 'closed');
        await page.locator('#preview-outside').focus();
        await member.focus();
        await member.press('Tab');
        await page.keyboard.press('Enter');
        await page.getByRole('menuitem', { name: 'Preview action', exact: true }).waitFor();
        await page.mouse.move(900, 0);
        assert.equal(await sidebarRoot.getAttribute('data-preview'), 'open', "Portalled menu focus must keep its sidebar visible");
        await page.keyboard.press('Escape');
        await page.locator('#preview-outside').focus();
        await page.waitForFunction(() => document.querySelector('#sidebar-preview [data-preview]').dataset.preview === 'closed');
        await preview.getByRole('button', { name: 'Pin sidebar', exact: true }).click();
        await page.waitForFunction(() => document.querySelector('#sidebar-preview [data-slot="sidebar"]').dataset.state === 'expanded');
        assert.equal(await page.locator('#preview-changes').textContent(), '1');
        await page.waitForFunction((width) => document.querySelector('#sidebar-preview [data-slot="sidebar-inset"]').getBoundingClientRect().width < width, mainBefore.width);
        await preview.getByRole('button', { name: 'Pin sidebar', exact: true }).click();
        await page.setViewportSize({ width: 600, height: 800 });
        await page.waitForFunction(() => !document.querySelector('#sidebar-preview [data-preview]'));
        await preview.getByRole('button', { name: 'Pin sidebar', exact: true }).click();
        await page.getByRole('dialog', { name: 'Sidebar', exact: true }).waitFor();
        await page.keyboard.press('Escape');
        await page.setViewportSize({ width: 1280, height: 720 });
        const outlined = page.locator('#outlined-fields');
        const floating = outlined.getByRole('textbox', { name: 'Floating input', exact: true });
        await outlined.locator('label').filter({ hasText: /^Floating input$/ }).click();
        assert.equal(await floating.evaluate(el => document.activeElement === el), true);
        await floating.fill('Typed value');
        await page.locator('#outlined-outside').click();
        await page.waitForFunction(() => getComputedStyle(document.querySelector('#outlined-fields .floating-input label')).top === '0px');
        assert.equal(await floating.evaluate(el => getComputedStyle(el.parentElement.querySelector('label')).top), '0px', 'Filled Input keeps its floating label');
        const normalOutline = outlined.getByRole('button', { name: 'Outlined select', exact: true });
        await outlined.locator('label').filter({ hasText: /^Outlined select$/ }).click();
        assert.equal(await normalOutline.evaluate(el => document.activeElement === el), true, 'Select label focuses its trigger');
        await normalOutline.press('ArrowDown');
        await page.getByRole('option', { name: 'Alpha', exact: true }).click();
        assert.equal(await outlined.locator('input[name="outlined-normal"]').inputValue(), 'alpha');
        assert.equal(await normalOutline.evaluate(el => getComputedStyle(el).borderTopColor), 'rgba(0, 0, 0, 0)', 'Outline replaces the control border');
        const searchOutline = outlined.getByRole('combobox', { name: 'Outlined search', exact: true });
        await outlined.locator('label').filter({ hasText: /^Outlined search$/ }).click();
        await searchOutline.fill('Beta');
        await searchOutline.press('ArrowDown');
        await searchOutline.press('Enter');
        await page.locator('#outlined-outside').click();
        assert.equal(await outlined.locator('input[name="outlined-search"]').inputValue(), 'beta');
        assert.equal(await searchOutline.getAttribute('placeholder'), 'Beta');
        assert.notEqual(await searchOutline.evaluate(el => getComputedStyle(el, '::placeholder').color), 'rgba(0, 0, 0, 0)', 'Selected search value stays visible after blur');
        const groupInput = outlined.getByRole('textbox', { name: 'Outlined group', exact: true });
        await outlined.locator('label').filter({ hasText: /^Outlined group$/ }).click();
        assert.equal(await groupInput.evaluate(el => document.activeElement === el), true, 'Explicit group ID associates its label');
        await groupInput.fill('query');
        await outlined.getByRole('button', { name: 'Clear outlined group', exact: true }).click();
        assert.equal(await groupInput.inputValue(), '');
        assert.equal(await groupInput.evaluate(el => document.activeElement === el), true, 'Addon actions can restore input focus');
        for (const name of ['Generated group', 'Outlined notes']) {
          await outlined.locator('label').filter({ hasText: name }).click();
          assert.equal(await outlined.getByRole('textbox', { name, exact: true }).evaluate(el => document.activeElement === el), true, 'Generated group IDs associate native labels');
        }
        assert.equal(await outlined.getByRole('combobox', { name: 'Disabled outlined search', exact: true }).isDisabled(), true);
        const invalidOutline = outlined.getByRole('textbox', { name: 'Invalid outlined group', exact: true });
        assert.equal(await invalidOutline.getAttribute('aria-describedby'), 'outlined-error');
        assert.equal(await invalidOutline.evaluate(el => getComputedStyle(el.closest('.floating-input')).getPropertyValue('--floating-outline').trim() === getComputedStyle(el).getPropertyValue('--color-destructive').trim()), true, 'Group error reaches the outline');
        await page.setViewportSize({ width: 360, height: 800 });
        assert.equal(await outlined.evaluate(el => el.scrollWidth <= el.clientWidth), true, 'Outlined controls fit narrow viewports');
        await page.setViewportSize({ width: 1280, height: 720 });
        assert.equal(await style("#counter", "height"), "32px");
        assert.equal(await style("#counter", "background-color"), "rgb(31, 136, 61)");
        await page.getByRole("button", { name: "Count: 0", exact: true }).click();
        assert.equal((await page.locator("#counter").textContent()).trim(), "Count: 1");
        await page.getByRole("textbox", { name: "Name", exact: true }).fill("Astro");
        assert.equal((await page.locator("#name-preview").textContent()).trim(), "Hello Astro");
        assert.equal(await page.getByRole("button", { name: "Disabled", exact: true }).isDisabled(), true);
        const code = page.getByRole("textbox", { name: "Code", exact: true });
        await code.fill("edited");
        await page.waitForFunction(() => document.querySelector("#code-value").textContent === "edited");
        await code.press("ControlOrMeta+z");
        await page.waitForFunction(() => document.querySelector("#code-value").textContent === "initial");
        await code.press("ControlOrMeta+Shift+z");
        await page.waitForFunction(() => document.querySelector("#code-value").textContent === "edited");
        const editsBeforeReplace = await page.locator("#code-edits").textContent();
        await page.getByRole("button", { name: "Replace code", exact: true }).click();
        await page.waitForFunction(() => document.querySelector('.cm-content').textContent === "external");
        assert.equal(await page.locator("#code-edits").textContent(), editsBeforeReplace, "External updates must not emit onchange");
        await page.getByRole("button", { name: "Toggle readonly", exact: true }).click();
        await code.focus();
        await page.keyboard.type("no-change");
        assert.equal(await code.textContent(), "external");
        assert.equal(await code.getAttribute("aria-readonly"), "true");
        const disabledCode = page.locator('.cm-content[aria-label="Disabled code"]');
        assert.equal(await disabledCode.getAttribute("contenteditable"), "false");

        const editorRoot = page.locator('[data-slot="code-editor"]').first();
        await editorRoot.getByRole("button", { name: "コードをコピー", exact: true }).click();
        assert.equal(await page.evaluate(() => window.__copiedCode), "external", "Readonly editors must copy their current value");
        assert.equal(await editorRoot.getByRole("status").textContent(), "コピーしました");
        assert.equal(await page.locator('[data-slot="code-editor"][data-disabled]').getByRole("button", { name: "コードをコピー" }).isDisabled(), true);
        await page.evaluate(() => { window.__copyFails = true; });
        await editorRoot.getByRole("button", { name: "コードをコピー", exact: true }).click();
        await page.waitForFunction(() => document.querySelector('[data-slot="code-editor"] [role="status"]').textContent === "コピーできませんでした");
        await page.evaluate(() => { window.__copyFails = false; });
        await editorRoot.getByRole("button", { name: "コードをコピー", exact: true }).click();
        await page.waitForFunction(() => document.querySelector('[data-slot="code-editor"] [role="status"]').textContent === "コピーしました");

        const modified = page.getByRole("textbox", { name: "Diff: Modified", exact: true });
        const original = page.getByRole("textbox", { name: "Diff: Original", exact: true });
        await original.focus();
        await page.keyboard.type("not allowed");
        assert.equal(await original.textContent(), "const before = 1;");
        await modified.press("ControlOrMeta+a");
        await page.keyboard.type("changed");
        await page.waitForFunction(() => document.querySelector("#diff-value").textContent === "changed", null, { timeout: 5000 }).catch(async (cause) => {
          throw new Error(JSON.stringify({ value: await page.locator("#diff-value").textContent(), content: await modified.textContent(), errors }), { cause });
        });
        const unifiedButton = page.getByRole("button", { name: "統合表示", exact: true });
        await unifiedButton.focus();
        await page.getByRole("tooltip", { name: "統合表示", exact: true }).waitFor();
        await page.keyboard.press("Escape");
        await unifiedButton.click();
        await page.locator('[data-slot="code-diff"] .cm-deletedChunk').waitFor();
        assert.equal(await page.locator("#diff-mode").textContent(), "unified");
        const deletedKeyword = page.locator('[data-slot="code-diff"] .cm-deletedLine span').filter({ hasText: /^const$/ });
        await deletedKeyword.waitFor();
        const keywordColor = await deletedKeyword.evaluate(element => getComputedStyle(element).color);
        const textColor = await modified.evaluate(element => getComputedStyle(element).color);
        assert.notEqual(keywordColor, textColor, "Deleted JavaScript must be highlighted on first unified render");
        await page.getByRole("button", { name: "Toggle diff language", exact: true }).click();
        await deletedKeyword.waitFor({ state: "detached" });
        await page.getByRole("button", { name: "Toggle diff language", exact: true }).click();
        await deletedKeyword.waitFor();
        assert.equal(await deletedKeyword.evaluate(element => getComputedStyle(element).color), keywordColor);

        const assertDiffGutterAlignment = async () => {
          const gutters = await page.locator('[data-slot="code-diff"] .cm-gutters').evaluateAll(elements => elements.map(element => ({
            right: element.getBoundingClientRect().right,
            border: getComputedStyle(element).borderRightWidth,
            markers: [...element.querySelectorAll('.cm-changeGutter .cm-gutterElement')].map(marker => ({
              right: marker.getBoundingClientRect().right, width: marker.getBoundingClientRect().width,
            })),
          })));
          for (const gutter of gutters) {
            assert.equal(gutter.border, "0px", "A separate gutter border would offset the change markers");
            assert.ok(gutter.markers.length > 0);
            for (const marker of gutter.markers) {
              assert.ok(Math.abs(marker.right - gutter.right) < 0.5, "Change markers must align with the gutter divider");
              assert.equal(marker.width, 2);
            }
          }
        };
        await assertDiffGutterAlignment();
        await modified.press("ControlOrMeta+z");
        await page.waitForFunction(() => document.querySelector("#diff-value").textContent === "after");
        await modified.press("ControlOrMeta+Shift+z");
        await page.waitForFunction(() => document.querySelector("#diff-value").textContent === "changed", null, { timeout: 5000 }).catch(async (cause) => {
          throw new Error(JSON.stringify({ value: await page.locator("#diff-value").textContent(), content: await modified.textContent(), errors }), { cause });
        });
        await page.getByRole("button", { name: "Lock diff", exact: true }).click();
        await modified.focus();
        await page.keyboard.type("not allowed");
        assert.equal(await page.locator("#diff-value").textContent(), "changed");
        const diffEdits = await page.locator("#diff-edits").textContent();
        await page.getByRole("button", { name: "Replace diff", exact: true }).click();
        await page.waitForFunction(() => document.querySelector('[data-slot="code-diff"] .cm-deletedChunk').textContent.includes("baseline"));
        assert.equal(await page.locator("#diff-value").textContent(), "replacement");
        assert.equal(await page.locator("#diff-edits").textContent(), diffEdits);
        await page.getByRole("button", { name: "左右比較", exact: true }).click();
        const diffRoot = page.locator('[data-slot="code-diff"]');
        await diffRoot.getByRole("button", { name: "コードをコピー", exact: true }).click();
        assert.equal(await page.evaluate(() => window.__copiedCode), "replacement", "Diff copy must use the modified value");
        await original.waitFor();
        assert.equal(await original.textContent(), "baseline");
        assert.equal(await modified.textContent(), "replacement");
        await assertDiffGutterAlignment();
        for (const width of [1280, 390]) {
          await page.setViewportSize({ width, height: 900 });
          const layout = await page.locator('[data-slot="code-diff"]').evaluate((element) => {
            const rect = (node) => { const { x, width, height } = node.getBoundingClientRect(); return { x, width, height }; };
            return {
              area: rect(element.querySelector('.cm-mergeView')),
              panes: [...element.querySelectorAll('.cm-mergeViewEditor')].map(rect),
              scrollers: [...element.querySelectorAll('.cm-scroller')].map(rect),
              gutters: [...element.querySelectorAll('.cm-gutters-before')].map(rect),
            };
          });
          assert.ok(Math.abs(layout.panes[0].width - layout.panes[1].width) <= 1, 'Diff columns must be equal width');
          for (let side = 0; side < 2; side++) {
            assert.ok(layout.panes[side].height >= layout.area.height - 1, 'Diff divider must reach the bottom');
            assert.ok(layout.scrollers[side].height >= layout.area.height - 1, 'Diff editors must fill the visible height');
            assert.ok(layout.gutters[side].height >= layout.area.height - 1, 'Diff gutters must fill the visible height');
          }
        }
        await page.setViewportSize({ width: 1280, height: 720 });
        const headerStyles = await page.locator('[data-slot="code-editor-toolbar"]').evaluateAll(elements => elements.map(element => {
          const style = getComputedStyle(element);
          return { height: element.getBoundingClientRect().height, padding: style.padding, background: style.backgroundColor };
        }));
        assert.deepEqual(headerStyles[0], headerStyles[2], "Editor and diff headers must share height, padding and background");
        const disabledHeaderOpacity = await page.locator('[data-slot="code-editor"][data-disabled] .language').evaluate(element => {
          let opacity = 1;
          for (let node = element; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
          return opacity;
        });
        assert.equal(disabledHeaderOpacity, 1, "Disabled editor labels must retain readable contrast");


        await page.getByRole("button", { name: "Astro multi filter、0件選択" }).click();
        await page.getByRole("textbox", { name: "Astro multi filterの候補を検索" }).fill("Alpha");
        await page.getByRole("checkbox", { name: "Alpha", exact: true }).check();
        await page.getByRole("button", { name: "完了", exact: true }).click();
        await page.getByRole("button", { name: "Astro multi filter、1件選択" }).waitFor();
        const rangeStart = page.locator('[data-range-calendar-day][data-value="2026-06-10"]');
        const rangeEnd = page.locator('[data-range-calendar-day][data-value="2026-06-12"]');
        await rangeStart.click();
        await rangeStart.press("ArrowRight");
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("Enter");
        assert.equal(await rangeStart.getAttribute("data-range-start"), "");
        assert.equal(await rangeEnd.getAttribute("data-range-end"), "");
        const select = page.getByRole("combobox", { name: "Astro select", exact: true });
        await select.click();
        const listId = await select.getAttribute("aria-controls");
        await page.getByRole("listbox").waitFor({ state: "visible" });
        await select.press("ArrowDown");
        await select.press("ArrowDown");
        assert.equal(await page.locator(`[id="${await select.getAttribute("aria-activedescendant")}"]`).textContent().then(text => text.trim()), "Charlie");
        await select.press("Enter");
        assert.equal(await page.locator("#selection").textContent(), "c");
        assert.equal(await select.evaluate(element => element === document.activeElement), true);
        const free = page.getByRole("combobox", { name: "Astro free text", exact: true });
        await free.click();
        assert.notEqual(await free.getAttribute("aria-controls"), listId);
        await free.fill("Discard");
        await free.press("Escape");
        await free.press("Tab");
        assert.equal(await page.locator("#free-selection").textContent(), "Original");
        await free.click();
        await free.fill("Committed");
        await free.press("Enter");
        assert.equal(await page.locator("#free-selection").textContent(), "Committed");
        assert.equal(await page.locator("#selection-changes").textContent(), "1");
        const floatingLauncher = page.getByRole('button', { name: '汎用付箋を開く', exact: true });
        await floatingLauncher.waitFor();
        const floatingStart = await floatingLauncher.boundingBox();
        await page.mouse.move(floatingStart.x + 22, floatingStart.y + 22);
        await page.mouse.down();
        await page.mouse.move(floatingStart.x + 102, floatingStart.y + 102, { steps: 6 });
        await page.mouse.up();
        assert.equal(await page.getByRole('dialog', { name: '汎用付箋', exact: true }).count(), 0, 'dragging a minimized note does not open it');
        let floatingMoved = await floatingLauncher.boundingBox();
        assert.ok(Math.abs(floatingMoved.y - floatingStart.y) > 40);
        const noteTouch = await page.context().newCDPSession(page);
        await noteTouch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: floatingMoved.x + 22, y: floatingMoved.y + 22 }] });
        for (let step = 1; step <= 5; step++) await noteTouch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: floatingMoved.x + 22 + step * 4, y: floatingMoved.y + 22 + step * 10 }] });
        await noteTouch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        const touchMoved = await floatingLauncher.boundingBox();
        assert.ok(touchMoved.y - floatingMoved.y > 35, 'touch dragging retains capture while the button moves');
        assert.equal(await page.getByRole('dialog', { name: '汎用付箋', exact: true }).count(), 0);
        floatingMoved = touchMoved;
        await noteTouch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: floatingMoved.x + 22, y: floatingMoved.y + 22 }] });
        await noteTouch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await noteTouch.detach();
        const genericNote = page.getByRole('dialog', { name: '汎用付箋', exact: true });
        await genericNote.waitFor();
        assert.equal(await floatingLauncher.count(), 0, 'floating launcher is hidden while note is open');
        const genericBefore = await genericNote.boundingBox();
        await genericNote.focus(); await genericNote.press('ArrowDown');
        const genericMoved = await genericNote.boundingBox();
        assert.ok(genericMoved.y >= genericBefore.y);
        await genericNote.getByRole('button', { name: 'メモを最小化', exact: true }).click();
        await floatingLauncher.waitFor();
        assert.equal(await floatingLauncher.evaluate(el => document.activeElement === el), true);
        assert.equal((await floatingLauncher.boundingBox()).y, floatingMoved.y);
        await floatingLauncher.click(); await genericNote.waitFor();
        assert.equal((await genericNote.boundingBox()).y, genericMoved.y);
        await genericNote.press('Escape'); await genericNote.waitFor({ state: 'hidden' });
        await page.getByRole('button', { name: 'Unmount generic note', exact: true }).click();
        assert.equal(await floatingLauncher.count(), 0);
        const directMemo = page.getByRole('button', { name: 'Probe memo', exact: true });
        const inlineTools = page.getByLabel('Floating tools header', { exact: true }).locator('[data-slot="floating-action-menu"]');
        assert.equal(await inlineTools.getAttribute('data-placement'), 'inline');
        assert.equal(await inlineTools.evaluate(el => getComputedStyle(el).position), 'static');
        await directMemo.click();
        const toolsNote = page.getByRole('dialog', { name: 'Floating tools memo', exact: true });
        await toolsNote.waitFor();
        await toolsNote.getByRole('button', { name: 'メモを最小化', exact: true }).click();
        await toolsNote.waitFor({ state: 'hidden' });
        assert.equal(await directMemo.evaluate(el => document.activeElement === el), true);
        await page.getByRole('button', { name: 'Probe status', exact: true }).click();
        await page.getByRole('menuitemradio', { name: '完了', exact: true }).click();
        assert.equal(await page.getByLabel('Floating status', { exact: true }).textContent(), '完了');
        const toolsViewport = page.viewportSize();
        await page.setViewportSize({ width: 375, height: 812 });
        const toolsSidebar = page.locator('[role="dialog"][data-slot="sidebar"][data-mobile="true"]');
        if (await toolsSidebar.isVisible()) { await toolsSidebar.locator('[data-slot=sheet-close]').evaluate(el => el.click()); await toolsSidebar.waitFor({ state: 'hidden' }); }
        const compactTools = page.getByRole('button', { name: 'Floating tools', exact: true });
        await compactTools.waitFor({ state: 'visible' });
        assert.equal(await directMemo.isVisible(), false, 'direct icons collapse at narrow viewports');
        await compactTools.hover();
        await page.getByRole('tooltip', { name: 'Floating tools', exact: true }).waitFor();
        await compactTools.click();
        await page.getByRole('menuitem', { name: 'Open probe memo', exact: true }).click();
        await toolsNote.waitFor();
        await toolsNote.getByRole('button', { name: 'メモを最小化', exact: true }).click();
        await toolsNote.waitFor({ state: 'hidden' });
        assert.equal(await compactTools.evaluate(el => document.activeElement === el), true);
        await page.getByRole('button', { name: 'Unmount floating tools', exact: true }).click();
        if (toolsViewport) await page.setViewportSize(toolsViewport);
        const editableTrigger = page.getByRole('button', { name: 'Editable note', exact: true });
        const editableMetrics = await editableTrigger.evaluate(el => ({ height: el.getBoundingClientRect().height, lineHeight: getComputedStyle(el).lineHeight, fontSize: getComputedStyle(el).fontSize }));
        await editableTrigger.click();
        const editableInput = page.getByRole('textbox', { name: 'Editable note', exact: true });
        assert.deepEqual(await editableInput.evaluate(el => ({ height: el.getBoundingClientRect().height, lineHeight: getComputedStyle(el).lineHeight, fontSize: getComputedStyle(el).fontSize })), editableMetrics);
        await editableInput.fill('変更したメモ');
        await editableInput.press('Control+Enter');
        assert.equal(await editableTrigger.textContent(), '変更したメモ');
        assert.equal(await editableTrigger.evaluate(el => document.activeElement === el), true);
        const markdown = page.locator("#astro-markdown [contenteditable=true]");
        await markdown.click();
        await markdown.press("End");
        await page.getByRole("button", { name: "太字", exact: true }).click();
        await markdown.pressSequentially("bold");
        await page.locator("#astro-markdown strong").waitFor();
        assert.equal(await page.locator("#astro-markdown strong").textContent(), "bold");
        await page.getByRole("button", { name: "Mount and remove markdown", exact: true }).click();
        await page.locator("#lifecycle-markdown").waitFor({ state: "detached" });
        await page.getByRole("button", { name: "Mount and update markdown", exact: true }).click();
        await page.waitForFunction(() => document.querySelector("#lifecycle-markdown .ProseMirror")?.textContent === "Latest");
        const lifecycleEditor = page.locator("#lifecycle-markdown .ProseMirror");
        await lifecycleEditor.press("End");
        await lifecycleEditor.pressSequentially(" draft");
        await page.getByRole("button", { name: "Replace markdown", exact: true }).click();
        await page.waitForFunction(() => document.querySelector("#lifecycle-markdown .ProseMirror")?.textContent === "External");
        // The Milkdown listener debounces updates by 200ms; verify an old draft cannot overwrite the replacement.
        await page.waitForTimeout(300);
        assert.equal(await page.getByTestId("markdown-value").textContent(), "External");
        await page.getByRole("button", { name: "Remove markdown", exact: true }).click();
        await page.locator("#lifecycle-markdown").waitFor({ state: "detached" });
        const moveDown = page.getByRole("button", { name: "a down", exact: true });
        await moveDown.focus();
        await page.keyboard.press("Enter");
        assert.deepEqual(await page.locator("[data-sortable-key]").evaluateAll(elements => elements.map(element => element.getAttribute("data-sortable-key"))), ["b", "fixed", "a"]);
        const trigger = page.getByRole("button", { name: "Open dialog", exact: true });
        await trigger.focus();
        await page.keyboard.press("Enter");
        await page.getByRole("dialog", { name: "Astro dialog", exact: true }).waitFor();
        const dialogSelect = page.getByRole("combobox", { name: "Dialog select", exact: true });
        await dialogSelect.click();
        await dialogSelect.press("ArrowDown");
        assert.equal(await page.getByRole("dialog").getByRole("listbox").count(), 1);
        await dialogSelect.press("Escape");
        assert.equal(await page.getByRole("dialog").isVisible(), true, "First Escape closes only the select");
        await page.keyboard.press("Escape");
        await page.getByRole("dialog").waitFor({ state: "hidden" });
        assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
        await page.evaluate(() => document.documentElement.classList.add("dark"));
        await page.waitForFunction(() => getComputedStyle(document.querySelector("#counter")).backgroundColor === "rgb(35, 134, 54)");
        assert.equal(await style("body", "background-color"), "rgb(13, 17, 23)");
        if (process.env.ASTRO_SMOKE_SCREENSHOTS) {
          await mkdir(process.env.ASTRO_SMOKE_SCREENSHOTS, { recursive: true });
          await page.screenshot({ path: join(process.env.ASTRO_SMOKE_SCREENSHOTS, "code-editor-dark.png"), fullPage: true });
          await page.evaluate(() => document.documentElement.classList.remove("dark"));
          await page.screenshot({ path: join(process.env.ASTRO_SMOKE_SCREENSHOTS, "code-editor-light.png"), fullPage: true });
        }
        const importsHtml = await readFile(join(directory, "imports/index.html"), "utf8");
        assert.match(importsHtml, /data-import-probe/);
        const topBarProbe = page.getByRole('region', { name: 'Astro top bar', exact: true });
        const topBar = topBarProbe.locator('[data-slot="message-scroller-top-bar"]');
        const topBarHistory = topBarProbe.getByRole('region', { name: 'Top bar history', exact: true });
        const oldHistoryHeight = await topBarHistory.evaluate(el => el.clientHeight);
        await topBarProbe.getByRole('button', { name: 'Top bar filters', exact: true }).click();
        const filterInput = topBarProbe.getByRole('textbox', { name: 'Top bar filter', exact: true });
        await filterInput.fill('Sample');
        assert.ok(await topBarHistory.evaluate(el => el.clientHeight) < oldHistoryHeight);
        await topBarHistory.evaluate(el => el.scrollTop = el.scrollHeight);
        assert.ok((await topBar.boundingBox()).y + (await topBar.boundingBox()).height <= (await topBarHistory.boundingBox()).y + 1);
        assert.equal(await filterInput.evaluate(el => document.activeElement === el), true);
        await topBarProbe.getByRole('button', { name: 'Top bar filters', exact: true }).click();
        await filterInput.waitFor({ state: 'hidden' });
        assert.equal(await topBarHistory.evaluate(el => el.clientHeight), oldHistoryHeight);
        await topBarProbe.getByRole('button', { name: 'Top bar placement', exact: true }).click();
        assert.equal(await topBar.getAttribute('data-placement'), 'overlay');
        assert.equal(await topBarHistory.evaluate(el => el.clientHeight), 320);
        assert.equal(await topBar.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
        await topBarProbe.getByRole('button', { name: 'Top bar filters', exact: true }).click();
        await filterInput.fill('Overlay');
        await page.waitForFunction(() => { const bar = document.querySelector('[aria-label="Astro top bar"] [data-slot="message-scroller-top-bar"]'); return Number.parseFloat(bar.closest('[data-slot="message-scroller"]').style.getPropertyValue('--message-scroller-top-bar-height')) === Math.ceil(bar.getBoundingClientRect().height); });
        assert.equal(await topBarHistory.evaluate(el => el.clientHeight), 320);
        await topBarProbe.getByRole('button', { name: 'Top bar filters', exact: true }).click();
        await topBarProbe.getByRole('button', { name: 'Top bar placement', exact: true }).click();
        await page.waitForFunction(() => !document.querySelector('[aria-label="Astro top bar"] [data-slot="message-scroller"]').style.getPropertyValue('--message-scroller-top-bar-height'));
        const threads = page.getByRole('region', { name: 'Astro thread list' });
        const threadList = threads.getByRole('navigation', { name: '最近の会話' });
        assert.equal(await threadList.evaluate(el => el.scrollWidth <= el.clientWidth), true);
        assert.equal(await threads.getByLabel('未読120件').textContent(), '99+');
        const nextThread = threads.getByRole('button', { name: /^次の会話/ });
        await nextThread.focus();
        await nextThread.press('Enter');
        await page.waitForFunction(() => document.querySelector('[data-thread-selection]').textContent === 'b');
        assert.equal(await nextThread.getAttribute('aria-current'), 'true');
        assert.equal(await nextThread.evaluate(el => document.activeElement === el), true);
        const conversationHeader = threads.locator('[data-slot=chat-header]');
        assert.equal(await conversationHeader.getByText('確認待ち', { exact: true }).isVisible(), true);
        await threads.getByRole('button', { name: 'Update conversation metadata' }).click();
        assert.equal(await conversationHeader.getByText('完了', { exact: true }).isVisible(), true);
        assert.equal(await nextThread.getByText('完了', { exact: true }).isVisible(), true);
        const memoTrigger = conversationHeader.getByRole('button', { name: '会話のメモ', exact: true });
        const memoViewport = page.viewportSize();
        await page.setViewportSize({ width: 320, height: 600 });
        const fixtureSidebar = page.locator('[role="dialog"][data-slot="sidebar"][data-mobile="true"]');
        if (await fixtureSidebar.isVisible()) { await fixtureSidebar.press('Escape'); await fixtureSidebar.waitFor({ state: 'hidden' }); }
        await memoTrigger.click();
        const memoCard = page.getByRole('dialog', { name: '会話のメモ', exact: true });
        await memoCard.waitFor();
        const memoBounds = await memoCard.boundingBox();
        assert.ok(memoBounds.x >= 0 && memoBounds.x + memoBounds.width <= 320);
        assert.notEqual(await page.locator('body').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
        await memoCard.getByRole('button', { name: '会話のメモの本文' }).click();
        const memoInput = memoCard.getByRole('textbox', { name: '会話のメモの本文' });
        assert.equal(await memoInput.evaluate(el => getComputedStyle(el).borderWidth), '0px');
        await memoInput.fill('Astroで編集したメモ');
        await memoCard.getByRole('button', { name: 'メモを保存', exact: true }).click();
        assert.equal(await memoCard.isVisible(), true);
        assert.equal(await memoCard.getByRole('button', { name: '保存済み', exact: true }).getAttribute('aria-disabled'), 'true');
        assert.equal(await threads.locator('[data-memo-saved]').textContent(), 'Astroで編集したメモ');
        await memoCard.getByRole('button', { name: 'メモを最小化', exact: true }).click();
        await memoCard.waitFor({ state: 'hidden' });
        assert.equal(await memoTrigger.evaluate(el => document.activeElement === el), true);
        await memoTrigger.click();
        assert.equal(await memoCard.getByRole('button', { name: '会話のメモの本文' }).textContent(), 'Astroで編集したメモ');
        const grip = memoCard.locator('[data-note-grip=header]');
        const gripBounds = await grip.boundingBox();
        await page.mouse.move(gripBounds.x + 20, gripBounds.y + 5);
        await page.mouse.down();
        await page.mouse.move(gripBounds.x - 15, gripBounds.y + 5 + (memoBounds.y > 300 ? -40 : 40), { steps: 5 });
        await page.mouse.up();
        const movedBounds = await memoCard.boundingBox();
        assert.ok(Math.abs(movedBounds.y - memoBounds.y) > 10, 'the note can be dragged');
        await memoCard.focus();
        await memoCard.press('ArrowUp');
        assert.ok((await memoCard.boundingBox()).y < movedBounds.y, 'the note can also be moved with the keyboard');
        await memoCard.press('Escape');
        await memoCard.waitFor({ state: 'hidden' });
        if (memoViewport) await page.setViewportSize(memoViewport);

        assert.equal(await nextThread.getAttribute('aria-current'), 'true');

        await threads.getByRole('button', { name: /^最初の会話/ }).click();
        await page.waitForFunction(() => document.querySelector('[data-thread-selection]').textContent === 'a');
        assert.equal(await threads.getByRole('button', { name: '操作不可の会話' }).isDisabled(), true);

        const chat = page.getByRole('region', { name: 'Chat message probe' });
        assert.equal(await chat.getByRole('article').getAttribute('data-layout'), 'timeline');
        await chat.getByRole('button', { name: 'Switch chat layout' }).click();
        assert.equal(await chat.getByRole('article').getAttribute('data-layout'), 'bubble');
        const messageBounds = await chat.locator('[data-slot="bubble"]').boundingBox();
        const deliveryBounds = await chat.locator('[data-slot="chat-message-metadata"]').boundingBox();
        assert.ok(messageBounds && deliveryBounds);
        assert.ok(Math.abs(messageBounds.x - (deliveryBounds.x + deliveryBounds.width) - 8) < 1, 'Bubble delivery metadata sits on the outgoing side');
        const chatAction = chat.getByRole('button', { name: 'Update chat message' });
        await chatAction.focus();
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.querySelector('[data-slot="chat-message-content"]')?.textContent.includes('更新されたメッセージ'));
        assert.equal(await chatAction.evaluate(element => element === document.activeElement), true, 'Message updates preserve focused actions');
        assert.equal(await chat.getByRole('article', { name: 'アシスタント' }).count(), 1);

        const chatHistory = page.getByLabel('Astro chat history', { exact: true });
        await chatHistory.focus();
        await chatHistory.press('Home');
        await page.waitForFunction(() => document.querySelector('[data-astro-scroller] [data-slot="message-scroller-viewport"]').scrollTop === 0);
        const latest = page.locator('[data-astro-scroller]').getByRole('button', { name: '最新のメッセージへ' });
        await latest.focus();
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => { const el = document.querySelector('[data-astro-scroller] [data-slot="message-scroller-viewport"]'); return el.scrollHeight - el.clientHeight - el.scrollTop < 10; });

        const linkedOutline = page.getByRole('navigation', { name: 'Astro conversation outline' });
        await linkedOutline.getByRole('button', { name: '2：途中の質問' }).click();
        await page.waitForFunction(() => document.activeElement?.getAttribute('data-message-id') === 'astro-6');
        await page.waitForFunction(() => document.querySelector('[aria-label="Astro conversation outline"] .outline-mark[aria-current]')?.getAttribute('aria-label') === '2：途中の質問');
        await linkedOutline.getByRole('button', { name: '1：会話のはじめ' }).focus();
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.activeElement?.getAttribute('data-message-id') === 'astro-0');
        const outlineRail = page.locator('[data-astro-scroller] [data-slot="message-scroller-outline"]');
        await page.locator('[data-astro-scroller] [data-slot="message-scroller-content"]').evaluate(el => el.style.paddingRight = '12px');
        await page.mouse.move(0, 0);
        await page.waitForFunction(() => document.querySelector('[data-astro-scroller] [data-slot="message-scroller-outline"]').dataset.visible === 'false');
        assert.equal(await outlineRail.getAttribute('data-mode'), 'scroll');
        await chatHistory.evaluate(el => el.scrollTop += 40);
        await page.waitForFunction(() => document.querySelector('[data-astro-scroller] [data-slot="message-scroller-outline"]').dataset.visible === 'true');
        await linkedOutline.getByRole('button', { name: '1：会話のはじめ' }).focus();
        await page.keyboard.press('Escape');
        assert.equal(await outlineRail.getAttribute('data-visible'), 'true', 'keyboard focus keeps the compact rail visible');
        const composer = page.getByRole('region', { name: 'Astro composer' });
        const composerInput = composer.getByRole('textbox', { name: 'メッセージ' });
        const composerNotice = composer.locator('[data-slot=chat-composer-notice]');
        await composerInput.evaluate(el => el.blur());
        assert.equal(await composerNotice.isVisible(), false);
        const composerTop = await composerInput.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
        await composerInput.focus();
        assert.equal(await composerNotice.isVisible(), true);
        assert.equal(await composerInput.getAttribute('aria-describedby'), await composerNotice.getAttribute('id'));
        assert.equal(await composerInput.evaluate(el => el.getBoundingClientRect().top + window.scrollY), composerTop, 'notice does not move the input after hydration');
        await composerInput.fill('Reply draft');
        await composerInput.evaluate(el => el.blur());
        assert.equal(await composerNotice.isVisible(), true);

        await composer.getByRole('button', { name: 'Load reply context' }).click();
        const replyContext = composer.getByRole('region', { name: 'Astro reply context' });
        assert.equal(await replyContext.evaluate(el => Boolean(el.closest('[data-slot=chat-composer]')) && getComputedStyle(el).borderInlineStartWidth === '0px' && getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)'), true);
        await replyContext.getByRole('button', { name: 'リプライを解除' }).click();
        await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'メッセージ');
        assert.equal(await composer.getByRole('textbox', { name: 'メッセージ' }).inputValue(), 'Reply draft');
        await composer.getByRole('textbox', { name: 'メッセージ' }).fill('');
        await composerInput.evaluate(el => el.blur());
        assert.equal(await composerNotice.isVisible(), false);

        await composerInput.fill('Keyboard mod send');
        await composerInput.press('Enter');
        assert.equal(await composerInput.inputValue(), 'Keyboard mod send\n');
        await composerInput.press('Control+Enter');
        await page.waitForFunction(() => document.querySelector('[data-composer-result]').textContent === 'Keyboard mod send');
        assert.equal(await composerInput.inputValue(), '');
        await composer.getByRole('button', { name: 'Toggle Enter submission' }).click();
        await composerInput.fill('Keyboard enter send');
        await composerInput.press('Shift+Enter');
        assert.equal(await composerInput.inputValue(), 'Keyboard enter send\n');
        await composerInput.evaluate(el => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true })));
        assert.equal(await composerInput.inputValue(), 'Keyboard enter send\n');
        await composerInput.press('Enter');
        await page.waitForFunction(() => document.querySelector('[data-composer-result]').textContent === 'Keyboard enter send');
        assert.equal(await composerInput.inputValue(), '');
        await composer.getByRole('button', { name: 'Toggle Enter submission' }).click();
        await composer.getByRole('button', { name: 'Load image preview' }).click();
        await composer.getByRole('img', { name: 'preview.svg', exact: true }).waitFor();
        await page.waitForFunction(() => document.querySelector('[data-astro-composer] img')?.naturalWidth === 32);
        await composer.getByRole('button', { name: 'preview.svgを拡大表示' }).click();
        await page.getByRole('dialog', { name: 'preview.svg', exact: true }).getByRole('img', { name: 'preview.svg' }).waitFor();
        await page.getByRole('button', { name: '次の画像', exact: true }).click();
        await page.getByRole('dialog', { name: 'alternate.svg', exact: true }).waitFor();
        await page.getByRole('button', { name: '前の画像', exact: true }).click();
        await page.getByRole('dialog', { name: 'preview.svg', exact: true }).waitFor();
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'preview.svgを拡大表示');
        await composer.getByRole('button', { name: 'alternate.svgを削除' }).click();
        await composer.getByRole('button', { name: 'preview.svgを削除' }).click();
        assert.equal(await composer.getByRole('textbox', { name: 'メッセージ' }).evaluate(el => el === document.activeElement), true);
        await composer.getByRole('button', { name: '追加', exact: true }).click();
        const addPopover = page.getByRole('dialog', { name: 'メッセージに追加' });
        await addPopover.getByRole('button', { name: 'ファイルを添付' }).waitFor();
        await page.keyboard.press('Escape');
        assert.equal(await composer.getByRole('button', { name: '追加', exact: true }).evaluate(el => el === document.activeElement), true);
        await composer.locator('input[type="file"]').setInputFiles({ name: 'astro-note.txt', mimeType: 'text/plain', buffer: Buffer.from('sample') });
        await composer.getByRole('button', { name: 'astro-note.txtを削除' }).click();
        await composer.locator('input[type="file"]').setInputFiles({ name: 'astro-note.txt', mimeType: 'text/plain', buffer: Buffer.from('sample') });
        await composer.getByRole('textbox', { name: 'メッセージ' }).fill('Astro send');
        await composer.getByRole('button', { name: 'メッセージを送信' }).focus();
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.querySelector('[data-composer-result]').textContent === 'Astro sendastro-note.txt');
        assert.equal(await composer.getByRole('textbox', { name: 'メッセージ' }).inputValue(), '');

        await page.goto(`${url}message-actions/`);
        await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
        const messageActions = page.getByRole('region', { name: 'Astro message actions' });
        const moreActions = messageActions.getByRole('button', { name: 'その他の操作' });
        async function chooseMessageAction(name) {
          await moreActions.focus();
          await page.keyboard.press('Enter');
          if (await moreActions.getAttribute('aria-haspopup') === 'menu') {
            await page.getByRole('menuitem', { name, exact: true }).click();
          } else {
            await page.getByRole('dialog', { name: 'メッセージの操作', exact: true }).getByRole('button', { name, exact: true }).click();
          }
        }
        await chooseMessageAction('編集');
        await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Edit Astro message');
        await chooseMessageAction('リプライ');
        await messageActions.getByRole('button', { name: 'リプライを解除' }).click();
        await chooseMessageAction('いいね');
        assert.equal(await messageActions.getByRole('button', { name: 'いいね 1件' }).getAttribute('aria-pressed'), 'true');
        await messageActions.getByRole('button', { name: 'いいね 1件' }).click();
        await chooseMessageAction('コピー');
        await page.waitForFunction(() => document.querySelector('[aria-label="Astro message actions"] [role="status"]').textContent === 'コピーしました');
        assert.equal(await messageActions.getByRole('status').evaluate(el => getComputedStyle(el).clipPath), 'inset(50%)');
        const actionViewport = page.viewportSize();
        const actionDrawer = page.getByRole('dialog', { name: 'メッセージの操作', exact: true });
        await messageActions.getByRole('button', { name: 'Switch action layout' }).click();
        for (const width of [1280, 375]) {
          await page.setViewportSize({ width, height: 812 });
          const timeline = messageActions.getByRole('article');
          assert.equal(await timeline.getAttribute('data-layout'), 'timeline');
          if (width === 1280) {
            await messageActions.getByRole('button', { name: 'コピーしました' }).focus();
            const geometry = await timeline.evaluate(element => {
              const header = element.querySelector('[data-slot="chat-message-header"]').getBoundingClientRect();
              const name = element.querySelector('.author').getBoundingClientRect();
              const toolbar = element.querySelector('[data-slot="message-actions"]').getBoundingClientRect();
              const body = element.querySelector('[data-slot="chat-message-content"]').getBoundingClientRect();
              return { separated: name.right <= toolbar.left, headerGap: body.top - header.bottom, bodyTop: body.top, actionBottom: toolbar.bottom };
            });
            assert.ok(geometry.separated, 'Timeline toolbar does not cover the author');
            assert.ok(geometry.headerGap >= 0 && geometry.headerGap <= 8, 'Timeline body stays close to the header');
            assert.ok(geometry.actionBottom <= geometry.bodyTop, 'Timeline toolbar does not cover the body');
          } else {
            const geometry = await timeline.evaluate(element => ({
              contentLeft: element.querySelector('[data-slot="chat-message-content"]').getBoundingClientRect().left,
              left: element.getBoundingClientRect().left, fits: element.scrollWidth <= element.clientWidth,
            }));
            assert.ok(Math.abs(geometry.contentLeft - geometry.left) <= 1 && geometry.fits, 'Mobile timeline uses the full body width');
            await moreActions.click();
            await actionDrawer.waitFor();
            await actionDrawer.getByRole('button', { name: '閉じる', exact: true }).click();
            await page.waitForFunction(() => !document.querySelector('[role="dialog"]') && getComputedStyle(document.body).pointerEvents !== 'none');
          }
        }
        if (actionViewport) await page.setViewportSize(actionViewport);
        await messageActions.getByRole('button', { name: 'Switch action layout' }).click();
        await page.setViewportSize({ width: 375, height: 812 });
        await messageActions.getByRole('button', { name: 'その他の操作' }).click();
        await actionDrawer.waitFor();
        assert.equal(await actionDrawer.getAttribute('data-slot'), 'drawer-content');
        await actionDrawer.getByRole('button', { name: '閉じる', exact: true }).click();
        await page.waitForFunction(() => !document.querySelector('[role="dialog"]') && getComputedStyle(document.body).pointerEvents !== 'none');
        await page.waitForTimeout(650);
        const pressText = messageActions.getByText('アクションを確認するメッセージ', { exact: true });
        await pressText.scrollIntoViewIfNeeded();
        const pressSession = await page.context().newCDPSession(page);
        try {
          await pressSession.send('Emulation.setTouchEmulationEnabled', { enabled: true });
          await pressText.scrollIntoViewIfNeeded();
          const pressBounds = await pressText.boundingBox();
          assert.ok(pressBounds);
          await pressSession.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pressBounds.x + 20, y: pressBounds.y + 10 }] });
          await page.waitForTimeout(650);
          await pressSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await actionDrawer.waitFor();
        } finally {
          await pressSession.send('Emulation.setTouchEmulationEnabled', { enabled: false });
          await pressSession.detach();
        }
        await actionDrawer.getByRole('button', { name: '閉じる', exact: true }).click();
        await page.waitForFunction(() => !document.querySelector('[role="dialog"]') && getComputedStyle(document.body).pointerEvents !== 'none');
        await page.waitForTimeout(650);
        if (actionViewport) await page.setViewportSize(actionViewport);
        await page.goto(url);
        await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
        const attachment = page.getByRole('region', { name: 'Astro attachment' });
        assert.equal(await attachment.getByRole('link').count(), 0, 'Image attachment only shows its thumbnail');
        assert.equal(await attachment.getByText('Astro image.svg', { exact: true }).count(), 0);
        const imageTrigger = attachment.getByRole('button', { name: 'Astro image.svgを拡大表示' });
        await imageTrigger.focus();
        await page.keyboard.press('Enter');
        const imageDialog = page.getByRole('dialog', { name: 'Astro image.svg' });
        await imageDialog.getByRole('img', { name: 'Astro image.svg' }).waitFor();
        await imageDialog.getByRole('button', { name: '次の画像' }).click();
        await page.getByRole('dialog', { name: 'Astro alternate.svg', exact: true }).getByRole('button', { name: '前の画像' }).click();
        await imageDialog.waitFor();
        const downloaded = page.waitForEvent('download');
        await imageDialog.getByRole('link', { name: 'Astro image.svgをダウンロード' }).click();
        assert.equal((await downloaded).suggestedFilename(), 'Astro image.svg');
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Astro image.svgを拡大表示');

        await page.goto(`${url}imports/`);
        await page.locator('[data-import-probe][data-ready="true"]').waitFor();
        const imported = await page.locator("[data-entry]").evaluateAll((elements) => elements.map((element) => ({
          name: element.getAttribute("data-entry"), count: Number(element.getAttribute("data-count")),
        })));
        assert.deepEqual(imported.map(({ name }) => name), coverage.modules);
        for (const entry of imported) assert.ok(entry.count > 0, `No runtime exports: ${entry.name}`);
      }
      assert.deepEqual(errors, [], `${mode} browser errors`);
      if (process.env.ASTRO_SMOKE_SCREENSHOTS) {
        await mkdir(process.env.ASTRO_SMOKE_SCREENSHOTS, { recursive: true });
        await page.screenshot({ path: join(process.env.ASTRO_SMOKE_SCREENSHOTS, `${mode}.png`), fullPage: true });
      }
      console.log(`Astro ${mode}: check, build, light/dark and ${mode === "svelte" ? "hydration/keyboard" : "zero-client-JS"} passed`);
    } finally {
      await context.close();
      await new Promise((accept, reject) => server.close((error) => error ? reject(error) : accept()));
    }
  }
} finally {
  await browser?.close();
  await rm(temporaryRoot, { recursive: true, force: true });
}
