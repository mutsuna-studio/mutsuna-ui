import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

export function validateAstroCoverage(exports, coverage) {
  const entries = [...coverage.modules, ...coverage.styles, ...Object.keys(coverage.excluded)];
  assert.equal(new Set(entries).size, entries.length, "Astro coverage contains duplicate entries");
  assert.deepEqual([...entries].sort(), Object.keys(exports).filter((key) => !key.includes("*")).sort(),
    "Update test/astro-coverage.json for added/removed public exports");
  // Only the dedicated SvelteKit boundary is exempt; do not silently skip generic UI.
  assert.deepEqual(Object.keys(coverage.excluded), ["./sveltekit-form"], "Only the SvelteKit-specific API may be excluded");
  assert.ok(coverage.excluded["./sveltekit-form"].trim(), "Exclusions require a reason");
  for (const key of coverage.styles) assert.ok(key.endsWith(".css"), `Not a stylesheet: ${key}`);
  for (const key of coverage.modules) assert.ok(!key.endsWith(".css"), `CSS must be registered as a stylesheet: ${key}`);
  for (const [key, target] of Object.entries(exports)) {
    if (!key.includes("*")) continue;
    const entry = key.replace(/\/\*$/, "");
    assert.ok(entries.includes(entry), `Wildcard ${key} requires a registered public index`);
    const index = exports[entry];
    assert.ok(typeof target === "object" && typeof index === "object", `Invalid wildcard: ${key}`);
    for (const [condition, path] of Object.entries(target)) {
      assert.equal(path.split("*")[0], index[condition]?.replace(/[^/]+$/, ""),
        `Wildcard ${key} must belong to its tested public index (${condition})`);
    }
  }
}

export async function readAstroCoverage() {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const coverage = JSON.parse(await readFile(new URL("./astro-coverage.json", import.meta.url), "utf8"));
  validateAstroCoverage(packageJson.exports, coverage);
  return coverage;
}

// Generate only in the disposable consumer. Keeping namespace values live checks
// every runtime export in each public index through both SSR and client bundling.
export function createAstroImportProbe({ modules, styles }) {
  const specifier = (key) => key === "." ? "@mutsuna/ui" : `@mutsuna/ui/${key.slice(2)}`;
  return `<script lang="ts">
import { onMount } from "svelte";
${modules.map((key, index) => `import * as entry${index} from ${JSON.stringify(specifier(key))};`).join("\n")}
${styles.map((key) => `import ${JSON.stringify(specifier(key))};`).join("\n")}
const entries = [${modules.map((key, index) => `{ name: ${JSON.stringify(key)}, count: Object.keys(entry${index}).length }`).join(",\n")}];
let ready = $state(false);
onMount(() => { ready = true; });
</script>
<ul data-import-probe data-ready={ready}>
  {#each entries as entry}<li data-entry={entry.name} data-count={entry.count}>{entry.name}: {entry.count}</li>{/each}
</ul>
`;
}
