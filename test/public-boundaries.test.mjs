import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { sep } from "node:path";
import test from "node:test";
import { inspectPublicBoundaries, forwardedModules, validateLegacyDeepImports } from "./public-boundaries.mjs";

const root = new URL("../src/lib/", import.meta.url);

test("public entries and internal implementations have explicit boundaries", async () => {
  const { exports } = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const files = (await readdir(root, { recursive: true })).filter(file => /\.(?:svelte|ts|css)$/.test(file));
  const sources = new Map(await Promise.all(files.map(async file => [file.split(sep).join("/"), await readFile(new URL(file.split(sep).join("/"), root), "utf8")])));
  const { violations, unindexedDeepImports, deepImports } = inspectPublicBoundaries(exports, sources);
  assert.deepEqual(violations, []);
  const legacy = JSON.parse(await readFile(new URL("./fixtures/legacy-deep-imports.json", import.meta.url), "utf8"));
  validateLegacyDeepImports(unindexedDeepImports, legacy, deepImports);
});

const exports = {
  "./button": { default: "./dist/button/index.js" },
  "./button/*": { default: "./dist/button/*" },
};
const sources = () => new Map([
  ["button/index.ts", 'export { default as Button } from "./button.svelte";'],
  ["button/button.svelte", "<button />"],
  ["internal/button/state.ts", "export const state = 1;"],
]);

test("helpers in internal stay private; new wildcard-only files require an explicit index export", () => {
  const files = sources();
  assert.deepEqual(inspectPublicBoundaries(exports, files).violations, []);
  assert.deepEqual(inspectPublicBoundaries(exports, files).unindexedDeepImports, []);
  files.set("button/helper.ts", "export const value = 1;");
  const exposed = inspectPublicBoundaries(exports, files).unindexedDeepImports;
  assert.throws(() => validateLegacyDeepImports(exposed, []), /wildcard/);
  files.set("button/index.ts", 'export { default as Button } from "./button.svelte"; export { value } from "./helper.js";');
  assert.deepEqual(inspectPublicBoundaries(exports, files).unindexedDeepImports, []);
  files.set("button/private.css", ".private { color: red; }");
  assert.throws(() => validateLegacyDeepImports(inspectPublicBoundaries(exports, files).unindexedDeepImports, []), /wildcard/);
  files.delete("button/private.css");
  const promoted = inspectPublicBoundaries(exports, files);
  validateLegacyDeepImports(promoted.unindexedDeepImports, ["./button/helper.js"], promoted.deepImports);
});

test("private folders, internal exports and indirect re-exports are rejected", () => {
  const files = sources();
  files.set("private/helper.ts", "export const value = 1;");
  files.set("button/index.ts", 'import { state as value } from "../internal/button/state.js"; export { value };');
  const result = inspectPublicBoundaries({ ...exports, "./internal/*": { default: "./dist/internal/*" } }, files);
  assert.ok(result.violations.some(message => message.includes("Private source")));
  assert.ok(result.violations.some(message => message.includes("forwards internal")));
  assert.ok(result.violations.some(message => message.includes("package export")));
  const disguised = inspectPublicBoundaries({ ...exports, "./button/*": { default: "./dist/internal/*" } }, sources());
  assert.ok(disguised.violations.some(message => message.includes("package export")));
});

test("root aggregation uses component entries rather than exposing new files behind their index", () => {
  const files = sources();
  files.set("index.ts", 'export { value } from "./button/helper.js";');
  files.set("button/helper.ts", 'export const value = 1;');
  const result = inspectPublicBoundaries({ ...exports, ".": { default: "./dist/index.js" } }, files);
  assert.ok(result.violations.some(message => message.includes("registered entry")));
  assert.deepEqual(result.unindexedDeepImports, ["./button/helper.js"]);
});

test("forwarding recognizes aliases, namespace, type and default exports without counting implementation imports", () => {
  const modules = forwardedModules(`
    import Impl from "./component.svelte";
    import * as Variants from "./variants.js";
    import { helper } from "../internal/helper.js";
    export { Impl as Button, Variants };
    export type { Props } from "./types.js";
    export default Impl;
  `, "button/index.ts");
  assert.deepEqual([...modules].sort(), ["button/component.svelte", "button/types.ts", "button/variants.ts"]);
});

test("legacy deep paths cannot be silently added, removed or duplicated", () => {
  validateLegacyDeepImports(["./button/helper.js"], ["./button/helper.js"]);
  assert.throws(() => validateLegacyDeepImports([], ["./button/helper.js"]), /paths changed/);
  assert.throws(() => validateLegacyDeepImports([], ["./button/helper.js", "./button/helper.js"]), /Duplicate/);
});
