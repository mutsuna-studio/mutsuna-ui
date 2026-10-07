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

  browser = await chromium.launch({ headless: true });
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
        assert.equal(avatarBounds.width, 32, "Account avatar keeps its intended size");
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
        assert.equal((await page.locator("output").textContent()).trim(), "Hello Astro");
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
        await page.locator("#select-container").evaluate(element => { element.style.width = "420px"; });
        await page.waitForFunction(id => { const list = document.getElementById(id); return list && Math.abs(list.getBoundingClientRect().width - 420) < 1; }, listId);
        await page.setViewportSize({ width: 390, height: 500 });
        // Viewport emulation can move focus when the other responsive islands remount.
        // Keep this assertion about list positioning, independent of their focus restoration.
        await select.focus();
        if (await select.getAttribute("aria-expanded") !== "true") {
          await page.locator("#select-container").getByRole("button", { name: "候補を表示", exact: true }).click();
        }
        await page.waitForFunction(id => { const list = document.getElementById(id); return list && list.getBoundingClientRect().width <= 374; }, listId);
        await page.setViewportSize({ width: 1280, height: 720 });
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
