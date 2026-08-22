#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildReview,
  fetchUpstreamSnapshot,
  pathExists,
  readSnapshot,
  renderReviewSummary,
  resolveLatestStable,
  stableJson,
  writeFileWithParents,
  writeSnapshot,
} from "./shadcn-upstream-lib.mjs";

const packageRoot = process.env.MUTSUNA_UI_SHADCN_ROOT
  ? resolve(process.env.MUTSUNA_UI_SHADCN_ROOT)
  : join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(await readFile(join(packageRoot, "scripts/shadcn-upstream.json"), "utf8"));
const upstreamRoot = join(packageRoot, "upstream/shadcn-svelte");
const baseRoot = join(upstreamRoot, "base");
const candidateRoot = join(upstreamRoot, "candidate");

if (await pathExists(join(candidateRoot, "manifest.json"))) {
  throw new Error("An upstream candidate is already awaiting review. Finalize or remove it before syncing again.");
}

const upstream = await resolveLatestStable(config, { githubToken: process.env.GITHUB_TOKEN });
const base = await readSnapshot(baseRoot);
if (base?.manifest.commit === upstream.commit) {
  console.log(`shadcn-svelte ${upstream.version} (${upstream.commit.slice(0, 12)}) is already the reviewed BASE.`);
  process.exit(0);
}

const snapshot = await fetchUpstreamSnapshot(config, upstream);
const packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
let installedVersion = null;
try {
  installedVersion = JSON.parse(await readFile(join(packageRoot, "node_modules/shadcn-svelte/package.json"), "utf8")).version;
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
snapshot.manifest.localDependency = {
  range: packageJson.dependencies?.[config.packageName] ?? packageJson.devDependencies?.[config.packageName] ?? null,
  installedVersion,
};

await writeSnapshot(candidateRoot, snapshot);
const review = await buildReview(config, base, snapshot, packageRoot);
await writeFileWithParents(join(candidateRoot, "review.json"), stableJson(review));
await writeFileWithParents(join(candidateRoot, "SUMMARY.md"), renderReviewSummary(review));

const changed = review.entries.filter((entry) => entry.change !== "unchanged");
console.log(`Prepared shadcn-svelte ${upstream.version} (${upstream.commit.slice(0, 12)}).`);
console.log(`${changed.length} component(s) require review. src/lib was not modified.`);
console.log(`Review summary: ${join(candidateRoot, "SUMMARY.md")}`);
