import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { readAstroCoverage, validateAstroCoverage } from "./astro-coverage.mjs";

const exports = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")).exports;

test("all public exports are registered for Astro consumer verification", async () => {
  await readAstroCoverage();
});

test("Astro coverage rejects an unregistered new component or removed public entry", async () => {
  const coverage = await readAstroCoverage();
  assert.throws(() => validateAstroCoverage({ ...exports, "./new-component": { default: "./dist/new-component/index.js" } }, coverage), /added\/removed/);
  const removed = { ...exports };
  delete removed["./button"];
  assert.throws(() => validateAstroCoverage(removed, coverage), /added\/removed/);
});

test("Astro coverage rejects duplicates, generic exclusions and unrelated wildcard paths", async () => {
  const coverage = await readAstroCoverage();
  assert.throws(() => validateAstroCoverage(exports, { ...coverage, modules: [...coverage.modules, "./button"] }), /duplicate/);
  assert.throws(() => validateAstroCoverage(exports, {
    ...coverage, modules: coverage.modules.filter((key) => key !== "./button"),
    excluded: { ...coverage.excluded, "./button": "Not tested" },
  }), /Only the SvelteKit/);
  assert.throws(() => validateAstroCoverage({ ...exports, "./button/*": { default: "./dist/other/*" } }, coverage), /must belong/);
});
