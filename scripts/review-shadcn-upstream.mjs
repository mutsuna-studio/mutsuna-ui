#!/usr/bin/env node

import { cp, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertInside,
  mergeFilePreview,
  pathExists,
  renderReviewSummary,
  readSnapshot,
  stableJson,
  writeFileWithParents,
} from "./shadcn-upstream-lib.mjs";

const packageRoot = process.env.MUTSUNA_UI_SHADCN_ROOT
  ? resolve(process.env.MUTSUNA_UI_SHADCN_ROOT)
  : join(dirname(fileURLToPath(import.meta.url)), "..");
const upstreamRoot = join(packageRoot, "upstream/shadcn-svelte");
const baseRoot = join(upstreamRoot, "base");
const candidateRoot = join(upstreamRoot, "candidate");
const reviewPath = join(candidateRoot, "review.json");
const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

if (!(await pathExists(reviewPath))) {
  throw new Error("No shadcn-svelte candidate is awaiting review. Run pnpm sync:shadcn first.");
}

const review = JSON.parse(await readFile(reviewPath, "utf8"));
const optionValueIndexes = new Set(
  ["--decision", "--note"]
    .map((name) => args.indexOf(name))
    .filter((index) => index !== -1)
    .map((index) => index + 1),
);

if (args.includes("--finalize")) {
  const pending = review.entries.filter((entry) => entry.decision === "pending").map((entry) => entry.component);
  if (pending.length > 0) {
    throw new Error(`Cannot finalize while review is pending: ${pending.join(", ")}`);
  }

  const from = review.from?.version ?? "bootstrap";
  const archiveName = `${from}-to-${review.to.version}-${review.to.commit.slice(0, 12)}`;
  const archiveRoot = join(upstreamRoot, "reviews", archiveName);
  await readSnapshot(candidateRoot);
  await rm(baseRoot, { recursive: true, force: true });
  await cp(join(candidateRoot, "registry"), join(baseRoot, "registry"), { recursive: true });
  await cp(join(candidateRoot, "source"), join(baseRoot, "source"), { recursive: true });
  await cp(join(candidateRoot, "manifest.json"), join(baseRoot, "manifest.json"));
  await writeFileWithParents(join(archiveRoot, "review.json"), stableJson(review));
  await writeFileWithParents(join(archiveRoot, "SUMMARY.md"), renderReviewSummary(review));
  await rm(candidateRoot, { recursive: true, force: true });
  console.log(`Finalized shadcn-svelte ${review.to.version} as the reviewed BASE.`);
  console.log(`Archived review: ${archiveRoot}`);
  process.exit(0);
}

const componentName = args.find((argument, index) => !argument.startsWith("--") && !optionValueIndexes.has(index));
if (!componentName) throw new Error("Specify a tracked component or --finalize.");
const entry = review.entries.find((candidate) => candidate.component === componentName);
if (!entry) throw new Error(`Unknown tracked component: ${componentName}`);

const apply = args.includes("--apply");
if (apply && review.from === null) {
  throw new Error("The initial bootstrap has no BASE, so --apply is disabled. Review and edit Mutsuna source explicitly.");
}

const outputRoot = assertInside(packageRoot, join(packageRoot, ".tmp/shadcn-review", componentName));
await rm(outputRoot, { recursive: true, force: true });
let clean = 0;
let conflicts = 0;
let manual = 0;

for (const file of entry.files) {
  const candidatePath = join(candidateRoot, "source", file.target);
  const basePath = join(baseRoot, "source", file.target);
  const localPath = file.localPath ? assertInside(packageRoot, join(packageRoot, file.localPath)) : null;
  const outputPath = join(outputRoot, file.target);

  if (review.from === null) {
    if (await pathExists(candidatePath)) {
      await writeFileWithParents(outputPath, await readFile(candidatePath, "utf8"));
      if (localPath && (await pathExists(localPath))) {
        const diff = spawnSync("git", ["diff", "--no-index", "--no-prefix", "--", localPath, candidatePath], { encoding: "utf8" });
        if (diff.status !== 0 && diff.status !== 1) {
          throw new Error(`git diff failed for ${file.target}: ${diff.stderr || `exit ${diff.status}`}`);
        }
        await writeFileWithParents(`${outputPath}.diff`, diff.stdout);
      }
    }
    manual += 1;
    continue;
  }

  if (!(await pathExists(basePath)) || !(await pathExists(candidatePath)) || !localPath || !(await pathExists(localPath))) {
    manual += 1;
    continue;
  }

  const merged = await mergeFilePreview(
    await readFile(localPath, "utf8"),
    await readFile(basePath, "utf8"),
    await readFile(candidatePath, "utf8"),
  );
  await writeFileWithParents(outputPath, merged.content);
  if (merged.status === "clean") {
    clean += 1;
    if (apply) await writeFileWithParents(localPath, merged.content);
  } else {
    conflicts += 1;
  }
}

const decision = option("--decision");
const note = option("--note");
if (decision !== null) {
  if (!new Set(["applied", "reviewed-no-change"]).has(decision)) {
    throw new Error("--decision must be applied or reviewed-no-change");
  }
  if (decision === "reviewed-no-change" && !note?.trim()) {
    throw new Error("reviewed-no-change requires a non-empty --note");
  }
  entry.decision = decision;
  entry.note = note?.trim() || null;
  await writeFileWithParents(reviewPath, stableJson(review));
  await writeFileWithParents(join(candidateRoot, "SUMMARY.md"), renderReviewSummary(review));
}

console.log(`Review preview for ${componentName}: ${outputRoot}`);
console.log(`clean=${clean} conflict=${conflicts} manual=${manual}${apply ? " applied-clean-files=true" : ""}`);
if (decision) console.log(`decision=${decision}`);
