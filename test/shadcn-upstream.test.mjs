import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  assertSafeRelativePath,
  fetchUpstreamSnapshot,
  materializeRegistryContent,
  mergeFilePreview,
  resolveGitHubTagCommit,
  sha256,
  stableJson,
  validateRegistryItem,
  verifySnapshot,
} from "../scripts/shadcn-upstream-lib.mjs";

const packageRoot = join(import.meta.dirname, "..");
const reviewScript = join(packageRoot, "scripts/review-shadcn-upstream.mjs");

async function write(path, content) {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

test("tracking configuration covers the approved 32 nova components", async () => {
  const config = JSON.parse(await readFile(join(packageRoot, "scripts/shadcn-upstream.json"), "utf8"));
  const names = config.components.map((component) => component.name);
  const heavilyCustomized = config.components
    .filter((component) => component.classification === "heavily-customized")
    .map((component) => component.name);

  assert.equal(config.style, "nova");
  assert.equal(new Set(names).size, 32);
  assert.deepEqual(heavilyCustomized, ["avatar", "button", "calendar", "dialog", "select", "slider", "sonner", "tooltip"]);
  assert.deepEqual(config.supportItems.map((item) => [item.name, item.owner]), [["is-mobile", "sidebar"]]);
  const grouped = Object.values(config.reviewGroups).flat();
  assert.equal(new Set(grouped).size, 32);
  assert.deepEqual([...grouped].sort(), [...names].sort());
});

test("registry paths and placeholders are normalized without escaping the snapshot", () => {
  assert.equal(assertSafeRelativePath("button/button.svelte"), "button/button.svelte");
  assert.throws(() => assertSafeRelativePath("../package.json"), /escapes/);
  assert.throws(() => assertSafeRelativePath("/tmp/button.svelte"), /relative path/);
  assert.equal(
    materializeRegistryContent('import { cn } from "$UTILS$.js";\nimport { Button } from "$UI$/button/index.js";\n', "dialog/dialog.svelte"),
    'import { cn } from "../utils.js";\nimport { Button } from "../button/index.js";\n',
  );
  assert.throws(() => materializeRegistryContent('import "$UNKNOWN$/x";', "button/button.svelte"), /Unknown registry placeholder/);
});

test("registry item validation rejects malformed metadata and duplicate targets", () => {
  const valid = validateRegistryItem(
    {
      name: "button",
      type: "registry:ui",
      files: [{ target: "button/button.svelte", type: "registry:file", content: "button" }],
      dependencies: ["bits-ui"],
    },
    "button",
  );
  assert.equal(valid.files[0].target, "button/button.svelte");
  assert.throws(
    () =>
      validateRegistryItem(
        {
          name: "button",
          type: "registry:ui",
          files: [
            { target: "button/index.ts", content: "a" },
            { target: "button/index.ts", content: "b" },
          ],
        },
        "button",
      ),
    /repeats target/,
  );
  assert.throws(() => validateRegistryItem({ name: "badge", type: "registry:ui", files: [] }, "button"), /name mismatch/);
});

test("GitHub tag resolution peels annotated tags to an immutable commit", async () => {
  const calls = [];
  const commit = "a".repeat(40);
  const result = await resolveGitHubTagCommit({
    repository: "owner/repo",
    tag: "package@1.2.3",
    fetchJsonImpl: async (url) => {
      calls.push(url);
      return url.includes("/git/ref/")
        ? { json: { object: { type: "tag", sha: "b".repeat(40) } } }
        : { json: { object: { type: "commit", sha: commit } } };
    },
  });
  assert.equal(result, commit);
  assert.equal(calls.length, 2);
});

test("snapshot generation is deterministic and records source hashes", async () => {
  const config = {
    packageName: "shadcn-svelte",
    repository: "owner/repo",
    style: "nova",
    registryPath: "registry/{style}/{name}.json",
    components: [{ name: "button", localPath: "src/lib/button", classification: "derived" }],
    supportItems: [],
  };
  const item = {
    name: "button",
    type: "registry:ui",
    devDependencies: ["tailwind-variants@^3"],
    files: [{ target: "button/button.svelte", type: "registry:file", content: 'import "$UTILS$.js";\n' }],
  };
  const upstream = { version: "1.0.0", tag: "shadcn-svelte@1.0.0", commit: "c".repeat(40), npmIntegrity: "sha512-x", npmTarball: "x" };
  const fetchJsonImpl = async () => ({ json: structuredClone(item), text: JSON.stringify(item) });
  const first = await fetchUpstreamSnapshot(config, upstream, { fetchJsonImpl });
  const second = await fetchUpstreamSnapshot(config, upstream, { fetchJsonImpl });

  assert.equal(stableJson(first.manifest), stableJson(second.manifest));
  assert.equal(first.source.get("button/button.svelte"), 'import "../utils.js";\n');
  assert.equal(first.manifest.items[0].files[0].sourceSha256, sha256('import "../utils.js";\n'));
  assert.doesNotThrow(() => verifySnapshot(first));
  first.source.set("button/button.svelte", "tampered\n");
  assert.throws(() => verifySnapshot(first), /source hash mismatch/);
});

test("hook support items use their canonical snapshot directory", async () => {
  const config = {
    packageName: "shadcn-svelte",
    repository: "owner/repo",
    style: "nova",
    registryPath: "registry/{style}/{name}.json",
    components: [],
    supportItems: [{ name: "is-mobile", owner: "sidebar", localFiles: { "hooks/is-mobile.svelte.ts": "src/lib/sidebar/is-mobile.svelte.ts" } }],
  };
  const item = {
    name: "is-mobile",
    type: "registry:hook",
    files: [{ target: "is-mobile.svelte.ts", type: "registry:file", content: "export class IsMobile {}\n" }],
  };
  const snapshot = await fetchUpstreamSnapshot(
    config,
    { version: "1.0.0", tag: "shadcn-svelte@1.0.0", commit: "c".repeat(40), npmIntegrity: null, npmTarball: null },
    { fetchJsonImpl: async () => ({ json: item, text: JSON.stringify(item) }) },
  );
  assert.deepEqual([...snapshot.source.keys()], ["hooks/is-mobile.svelte.ts"]);
});

test("three-way preview distinguishes clean merges from conflicts", async () => {
  const clean = await mergeFilePreview("ONE\nbase\nthree\n", "one\nbase\nthree\n", "one\nbase\nTHREE\n");
  assert.equal(clean.status, "clean");
  assert.match(clean.content, /ONE/);
  assert.match(clean.content, /THREE/);

  const conflict = await mergeFilePreview("ours\n", "base\n", "theirs\n");
  assert.equal(conflict.status, "conflict");
  assert.match(conflict.content, /<<<<<<<.*ours/);
  assert.match(conflict.content, />>>>>>>.*theirs/);
});

test("review CLI previews without mutation, applies clean files, records decisions, and finalizes", async () => {
  const root = await mkdtemp(join(tmpdir(), "mutsuna-shadcn-review-test-"));
  const baseSource = "one\nbase\nthree\n";
  const localSource = "ONE\nbase\nthree\n";
  const candidateSource = "one\nbase\nTHREE\n";
  const review = {
    schemaVersion: 1,
    from: { version: "1.0.0", commit: "a".repeat(40) },
    to: { version: "1.1.0", commit: "b".repeat(40) },
    entries: [
      {
        component: "button",
        classification: "derived",
        change: "changed",
        decision: "pending",
        note: null,
        files: [{ item: "button", target: "button/button.svelte", localPath: "src/lib/button/button.svelte", mergeStatus: "clean" }],
        dependencyChanges: [],
      },
    ],
  };

  try {
    const registryContent = "{}\n";
    const snapshotManifest = (version, commit, source) => ({
      version,
      commit,
      items: [
        {
          name: "button",
          registryPath: "components/button.json",
          storedRegistrySha256: sha256(registryContent),
          files: [{ target: "button/button.svelte", sourceSha256: sha256(source) }],
        },
      ],
    });
    await write(join(root, "src/lib/button/button.svelte"), localSource);
    await write(join(root, "upstream/shadcn-svelte/base/source/button/button.svelte"), baseSource);
    await write(join(root, "upstream/shadcn-svelte/base/registry/components/button.json"), registryContent);
    await write(join(root, "upstream/shadcn-svelte/base/manifest.json"), stableJson(snapshotManifest("1.0.0", "a".repeat(40), baseSource)));
    await write(join(root, "upstream/shadcn-svelte/candidate/source/button/button.svelte"), candidateSource);
    await write(join(root, "upstream/shadcn-svelte/candidate/registry/components/button.json"), registryContent);
    await write(join(root, "upstream/shadcn-svelte/candidate/manifest.json"), stableJson(snapshotManifest("1.1.0", "b".repeat(40), candidateSource)));
    await write(join(root, "upstream/shadcn-svelte/candidate/review.json"), stableJson(review));

    const run = (...args) =>
      spawnSync(process.execPath, [reviewScript, ...args], {
        encoding: "utf8",
        env: { ...process.env, MUTSUNA_UI_SHADCN_ROOT: root },
      });

    const preview = run("button");
    assert.equal(preview.status, 0, preview.stderr);
    assert.equal(await readFile(join(root, "src/lib/button/button.svelte"), "utf8"), localSource);
    assert.equal(await readFile(join(root, ".tmp/shadcn-review/button/button/button.svelte"), "utf8"), "ONE\nbase\nTHREE\n");

    const invalidDecision = run("button", "--decision", "reviewed-no-change");
    assert.notEqual(invalidDecision.status, 0);
    assert.match(invalidDecision.stderr, /requires a non-empty --note/);

    const apply = run("button", "--apply", "--decision", "applied", "--note", "button");
    assert.equal(apply.status, 0, apply.stderr);
    assert.equal(await readFile(join(root, "src/lib/button/button.svelte"), "utf8"), "ONE\nbase\nTHREE\n");
    assert.match(
      await readFile(join(root, "upstream/shadcn-svelte/candidate/SUMMARY.md"), "utf8"),
      /- \[x\] `button` \(derived\): clean 1; decision=applied — button/,
    );

    const finalize = run("--finalize");
    assert.equal(finalize.status, 0, finalize.stderr);
    assert.equal(await readFile(join(root, "upstream/shadcn-svelte/base/source/button/button.svelte"), "utf8"), candidateSource);
    await assert.rejects(readFile(join(root, "upstream/shadcn-svelte/candidate/review.json"), "utf8"), /ENOENT/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
