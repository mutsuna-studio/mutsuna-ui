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
        assert.equal(await style("#counter", "height"), "32px");
        assert.equal(await style("#counter", "background-color"), "rgb(31, 136, 61)");
        await page.getByRole("button", { name: "Count: 0", exact: true }).click();
        assert.equal((await page.locator("#counter").textContent()).trim(), "Count: 1");
        await page.getByRole("textbox", { name: "Name", exact: true }).fill("Astro");
        assert.equal((await page.locator("output").textContent()).trim(), "Hello Astro");
        assert.equal(await page.getByRole("button", { name: "Disabled", exact: true }).isDisabled(), true);
        const trigger = page.getByRole("button", { name: "Open dialog", exact: true });
        await trigger.focus();
        await page.keyboard.press("Enter");
        await page.getByRole("dialog", { name: "Astro dialog", exact: true }).waitFor();
        await page.keyboard.press("Escape");
        await page.getByRole("dialog").waitFor({ state: "hidden" });
        assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
        await page.evaluate(() => document.documentElement.classList.add("dark"));
        await page.waitForFunction(() => getComputedStyle(document.querySelector("#counter")).backgroundColor === "rgb(35, 134, 54)");
        assert.equal(await style("body", "background-color"), "rgb(13, 17, 23)");
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
