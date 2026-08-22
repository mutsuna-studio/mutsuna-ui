import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, posix, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

export const knownPlaceholders = new Set(["$UTILS$", "$UI$", "$HOOKS$"]);

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function assertSafeRelativePath(value, label = "path") {
  if (typeof value !== "string" || value.length === 0 || isAbsolute(value) || value.includes("\\")) {
    throw new Error(`${label} must be a non-empty POSIX relative path: ${String(value)}`);
  }

  const normalized = posix.normalize(value);
  if (normalized !== value || normalized === ".." || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error(`${label} escapes its snapshot root: ${value}`);
  }
  return normalized;
}

function relativeImport(fromFile, target) {
  const value = posix.relative(posix.dirname(fromFile), target) || ".";
  return value.startsWith(".") ? value : `./${value}`;
}

export function materializeRegistryContent(content, target) {
  const placeholders = [...content.matchAll(/\$[A-Z]+\$/g)].map(([placeholder]) => placeholder);
  const unknown = [...new Set(placeholders.filter((placeholder) => !knownPlaceholders.has(placeholder)))];
  if (unknown.length > 0) {
    throw new Error(`Unknown registry placeholder(s) in ${target}: ${unknown.join(", ")}`);
  }

  const replacements = {
    "$UTILS$": relativeImport(target, "utils"),
    "$UI$": relativeImport(target, "."),
    "$HOOKS$": relativeImport(target, "hooks"),
  };

  return content.replace(/\$[A-Z]+\$/g, (placeholder) => replacements[placeholder]);
}

export function validateRegistryItem(item, expectedName) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new Error(`Registry item ${expectedName} must be an object`);
  }
  if (item.name !== expectedName) {
    throw new Error(`Registry item name mismatch: expected ${expectedName}, received ${String(item.name)}`);
  }
  if (typeof item.type !== "string" || !item.type.startsWith("registry:")) {
    throw new Error(`Registry item ${expectedName} has an invalid type`);
  }
  if (!Array.isArray(item.files) || item.files.length === 0) {
    throw new Error(`Registry item ${expectedName} has no files`);
  }

  const seenTargets = new Set();
  const files = item.files.map((file, index) => {
    if (!file || typeof file !== "object" || typeof file.content !== "string") {
      throw new Error(`Registry item ${expectedName} file ${index} is invalid`);
    }
    const target = assertSafeRelativePath(file.target ?? file.path, `${expectedName} file target`);
    if (seenTargets.has(target)) {
      throw new Error(`Registry item ${expectedName} repeats target ${target}`);
    }
    seenTargets.add(target);
    return { ...file, target };
  });

  for (const key of ["dependencies", "devDependencies", "registryDependencies"]) {
    if (item[key] !== undefined && (!Array.isArray(item[key]) || item[key].some((entry) => typeof entry !== "string"))) {
      throw new Error(`Registry item ${expectedName} has invalid ${key}`);
    }
  }

  return { ...item, files };
}

export async function fetchText(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

export async function fetchJson(url, options = {}) {
  const text = await fetchText(url, options);
  try {
    return { json: JSON.parse(text), text };
  } catch (error) {
    throw new Error(`Invalid JSON from ${url}: ${error.message}`, { cause: error });
  }
}

function githubHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "mutsuna-ui-shadcn-sync",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function resolveGitHubTagCommit({ repository, tag, token, fetchJsonImpl = fetchJson }) {
  const encodedTag = encodeURIComponent(tag);
  const refUrl = `https://api.github.com/repos/${repository}/git/ref/tags/${encodedTag}`;
  const { json: ref } = await fetchJsonImpl(refUrl, { headers: githubHeaders(token) });
  let object = ref.object;
  const visited = new Set();

  while (object?.type === "tag") {
    if (visited.has(object.sha)) throw new Error(`Circular annotated tag while resolving ${tag}`);
    visited.add(object.sha);
    const tagUrl = `https://api.github.com/repos/${repository}/git/tags/${object.sha}`;
    ({ json: { object } } = await fetchJsonImpl(tagUrl, { headers: githubHeaders(token) }));
  }

  if (object?.type !== "commit" || !/^[0-9a-f]{40}$/.test(object.sha ?? "")) {
    throw new Error(`Tag ${tag} did not resolve to a commit`);
  }
  return object.sha;
}

export async function resolveLatestStable(config, options = {}) {
  const fetchJsonImpl = options.fetchJsonImpl ?? fetchJson;
  const npmUrl = `https://registry.npmjs.org/${encodeURIComponent(config.packageName)}/latest`;
  const { json: packageMetadata } = await fetchJsonImpl(npmUrl);
  if (typeof packageMetadata.version !== "string" || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageMetadata.version)) {
    throw new Error(`npm latest metadata for ${config.packageName} has no valid version`);
  }

  const version = packageMetadata.version;
  const tag = `${config.packageName}@${version}`;
  const commit = await resolveGitHubTagCommit({
    repository: config.repository,
    tag,
    token: options.githubToken,
    fetchJsonImpl,
  });

  return {
    version,
    tag,
    commit,
    npmIntegrity: packageMetadata.dist?.integrity ?? null,
    npmTarball: packageMetadata.dist?.tarball ?? null,
  };
}

export function registryUrl(config, commit, name) {
  const registryPath = config.registryPath.replace("{style}", config.style).replace("{name}", name);
  return `https://raw.githubusercontent.com/${config.repository}/${commit}/${registryPath}`;
}

function dependencyMetadata(item) {
  return {
    dependencies: [...(item.dependencies ?? [])].sort(),
    devDependencies: [...(item.devDependencies ?? [])].sort(),
    registryDependencies: [...(item.registryDependencies ?? [])].sort(),
  };
}

function snapshotTargetFor(item, file) {
  if (item.type === "registry:hook" && !file.target.includes("/")) return `hooks/${file.target}`;
  if (item.type === "registry:lib" && !file.target.includes("/")) return `lib/${file.target}`;
  return file.target;
}

export async function fetchUpstreamSnapshot(config, upstream, options = {}) {
  const fetchJsonImpl = options.fetchJsonImpl ?? fetchJson;
  const allItems = [
    ...config.components.map((component) => ({ ...component, kind: "component", owner: component.name })),
    ...(config.supportItems ?? []).map((item) => ({ ...item, kind: "support" })),
  ];
  const targets = new Set();
  const registry = new Map();
  const source = new Map();
  const itemManifests = [];

  for (const tracked of allItems) {
    const url = registryUrl(config, upstream.commit, tracked.name);
    const { json, text } = await fetchJsonImpl(url);
    const item = validateRegistryItem(json, tracked.name);
    const fileManifests = [];

    for (const file of item.files) {
      const target = snapshotTargetFor(item, file);
      if (targets.has(target)) throw new Error(`Registry target collision: ${target}`);
      targets.add(target);
      const materialized = materializeRegistryContent(file.content, target);
      source.set(target, materialized);
      fileManifests.push({
        target,
        type: file.type,
        sourceSha256: sha256(materialized),
        upstreamSha256: sha256(file.content),
      });
    }

    const registryTarget = `${tracked.kind === "support" ? "support" : "components"}/${tracked.name}.json`;
    const storedRegistry = stableJson(item);
    registry.set(registryTarget, storedRegistry);
    itemManifests.push({
      name: tracked.name,
      owner: tracked.owner,
      kind: tracked.kind,
      classification: tracked.classification ?? null,
      localPath: tracked.localPath ?? null,
      registryUrl: url,
      registrySha256: sha256(text),
      registryPath: registryTarget,
      storedRegistrySha256: sha256(storedRegistry),
      ...dependencyMetadata(item),
      files: fileManifests.sort((left, right) => left.target.localeCompare(right.target)),
    });
  }

  const manifest = {
    schemaVersion: 1,
    packageName: config.packageName,
    style: config.style,
    repository: config.repository,
    version: upstream.version,
    tag: upstream.tag,
    commit: upstream.commit,
    npmIntegrity: upstream.npmIntegrity,
    npmTarball: upstream.npmTarball,
    items: itemManifests.sort((left, right) => left.name.localeCompare(right.name)),
  };
  return { manifest, registry, source };
}

export async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export async function listFiles(root) {
  if (!(await pathExists(root))) return [];
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(root, entry.name);
      return entry.isDirectory() ? listFiles(path) : entry.isFile() ? [path] : [];
    }),
  );
  return nested.flat().sort();
}

export async function readSnapshot(root) {
  if (!(await pathExists(join(root, "manifest.json")))) return null;
  const manifest = JSON.parse(await readFile(join(root, "manifest.json"), "utf8"));
  const source = new Map();
  for (const file of await listFiles(join(root, "source"))) {
    source.set(relative(join(root, "source"), file).split(sep).join("/"), await readFile(file, "utf8"));
  }
  const registry = new Map();
  for (const file of await listFiles(join(root, "registry"))) {
    registry.set(relative(join(root, "registry"), file).split(sep).join("/"), await readFile(file, "utf8"));
  }
  const snapshot = { manifest, registry, source };
  verifySnapshot(snapshot);
  return snapshot;
}

export function verifySnapshot(snapshot) {
  const expectedSource = new Set();
  const expectedRegistry = new Set();
  for (const item of snapshot.manifest.items ?? []) {
    if (!item.registryPath || !expectedRegistry.add(item.registryPath)) {
      throw new Error(`Snapshot manifest has an invalid or duplicate registry path for ${item.name}`);
    }
    const registryContent = snapshot.registry.get(item.registryPath);
    if (registryContent === undefined || sha256(registryContent) !== item.storedRegistrySha256) {
      throw new Error(`Snapshot registry hash mismatch: ${item.registryPath}`);
    }
    for (const file of item.files ?? []) {
      if (!expectedSource.add(file.target)) throw new Error(`Snapshot manifest repeats source target ${file.target}`);
      const sourceContent = snapshot.source.get(file.target);
      if (sourceContent === undefined || sha256(sourceContent) !== file.sourceSha256) {
        throw new Error(`Snapshot source hash mismatch: ${file.target}`);
      }
    }
  }
  const extraSource = [...snapshot.source.keys()].filter((target) => !expectedSource.has(target));
  const extraRegistry = [...snapshot.registry.keys()].filter((target) => !expectedRegistry.has(target));
  if (extraSource.length > 0 || extraRegistry.length > 0) {
    throw new Error(`Snapshot contains untracked files: ${[...extraSource, ...extraRegistry].join(", ")}`);
  }
}

export async function writeSnapshot(root, snapshot) {
  await rm(root, { recursive: true, force: true });
  for (const [target, content] of snapshot.registry) {
    const output = join(root, "registry", assertSafeRelativePath(target));
    await writeFileWithParents(output, content);
  }
  for (const [target, content] of snapshot.source) {
    const output = join(root, "source", assertSafeRelativePath(target));
    await writeFileWithParents(output, content);
  }
  await writeFileWithParents(join(root, "manifest.json"), stableJson(snapshot.manifest));
}

export async function writeFileWithParents(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

function sameArray(left, right) {
  return JSON.stringify(left ?? []) === JSON.stringify(right ?? []);
}

function itemChanged(baseItem, candidateItem, baseSource, candidateSource) {
  if (!baseItem) return true;
  if (!sameArray(baseItem.dependencies, candidateItem.dependencies)) return true;
  if (!sameArray(baseItem.devDependencies, candidateItem.devDependencies)) return true;
  if (!sameArray(baseItem.registryDependencies, candidateItem.registryDependencies)) return true;
  const targets = new Set([
    ...baseItem.files.map((file) => file.target),
    ...candidateItem.files.map((file) => file.target),
  ]);
  return [...targets].some((target) => baseSource.get(target) !== candidateSource.get(target));
}

function localFileFor(config, item, target) {
  if (item.kind === "support") {
    const support = (config.supportItems ?? []).find((entry) => entry.name === item.name);
    return support?.localFiles?.[target] ?? null;
  }
  return `src/lib/${target}`;
}

export async function mergeFilePreview(ours, base, theirs) {
  const temporary = await mkdtemp(join(tmpdir(), "mutsuna-shadcn-merge-"));
  try {
    const paths = {
      ours: join(temporary, "ours"),
      base: join(temporary, "base"),
      theirs: join(temporary, "theirs"),
    };
    await Promise.all(Object.entries(paths).map(([key, path]) => writeFile(path, { ours, base, theirs }[key])));
    const result = spawnSync("git", ["merge-file", "--diff3", "-p", paths.ours, paths.base, paths.theirs], {
      encoding: "utf8",
    });
    if (result.status !== 0 && result.status !== 1) {
      throw new Error(`git merge-file failed: ${result.stderr || `exit ${result.status}`}`);
    }
    return { status: result.status === 0 ? "clean" : "conflict", content: result.stdout };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

export async function buildReview(config, base, candidate, packageRoot) {
  const baseItems = new Map((base?.manifest.items ?? []).map((item) => [item.name, item]));
  const candidateItems = new Map(candidate.manifest.items.map((item) => [item.name, item]));
  const entries = [];

  for (const component of config.components) {
    const reviewGroup = Object.entries(config.reviewGroups ?? {}).find(([, names]) => names.includes(component.name))?.[0] ?? null;
    const ownedItems = [...candidateItems.values()].filter((item) => item.owner === component.name);
    const baseOwnedItems = [...baseItems.values()].filter((item) => item.owner === component.name);
    const itemNames = new Set([...ownedItems.map((item) => item.name), ...baseOwnedItems.map((item) => item.name)]);
    const changed = !base || [...itemNames].some((name) => {
      const next = candidateItems.get(name);
      return !next || itemChanged(baseItems.get(name), next, base?.source ?? new Map(), candidate.source);
    });
    const files = [];

    for (const itemName of [...itemNames].sort()) {
      const item = candidateItems.get(itemName) ?? baseItems.get(itemName);
      const oldItem = baseItems.get(itemName);
      const nextItem = candidateItems.get(itemName);
      const targets = new Set([
        ...(oldItem?.files.map((file) => file.target) ?? []),
        ...(nextItem?.files.map((file) => file.target) ?? []),
      ]);
      for (const target of [...targets].sort()) {
        const oldSource = base?.source.get(target);
        const nextSource = candidate.source.get(target);
        if (base && oldSource === nextSource) continue;
        const localPath = localFileFor(config, item, target);
        let mergeStatus = "bootstrap";
        if (base) {
          if (oldSource === undefined) mergeStatus = "manual-added";
          else if (nextSource === undefined) mergeStatus = "manual-removed";
          else if (!localPath || !(await pathExists(join(packageRoot, localPath)))) mergeStatus = "missing-local";
          else {
            const ours = await readFile(join(packageRoot, localPath), "utf8");
            mergeStatus = (await mergeFilePreview(ours, oldSource, nextSource)).status;
          }
        }
        files.push({ item: itemName, target, localPath, mergeStatus });
      }
    }

    const dependencyChanges = [];
    for (const itemName of [...itemNames].sort()) {
      const before = baseItems.get(itemName);
      const after = candidateItems.get(itemName);
      for (const key of ["dependencies", "devDependencies", "registryDependencies"]) {
        if (!sameArray(before?.[key], after?.[key])) {
          dependencyChanges.push({ item: itemName, type: key, before: before?.[key] ?? [], after: after?.[key] ?? [] });
        }
      }
    }

    entries.push({
      component: component.name,
      classification: component.classification,
      reviewGroup,
      change: !base ? "bootstrap" : changed ? "changed" : "unchanged",
      decision: !base || changed ? "pending" : "not-required",
      note: null,
      files,
      dependencyChanges,
    });
  }

  return {
    schemaVersion: 1,
    from: base ? { version: base.manifest.version, commit: base.manifest.commit } : null,
    to: { version: candidate.manifest.version, commit: candidate.manifest.commit },
    entries,
  };
}

function listOrNone(values) {
  return values.length > 0 ? values.map((value) => `\`${value}\``).join(", ") : "なし";
}

export function renderReviewSummary(review) {
  const changed = review.entries.filter((entry) => entry.change !== "unchanged");
  const statuses = changed.flatMap((entry) => entry.files.map((file) => file.mergeStatus));
  const dependencyComponents = changed.filter((entry) => entry.dependencyChanges.length > 0).map((entry) => entry.component);
  const from = review.from ? `${review.from.version} (${review.from.commit.slice(0, 12)})` : "初回BASEなし";
  const lines = [
    "# shadcn-svelte upstream review",
    "",
    `- From: ${from}`,
    `- To: ${review.to.version} (${review.to.commit.slice(0, 12)})`,
    `- Review対象: ${changed.length} component`,
    `- Clean preview: ${statuses.filter((status) => status === "clean").length}`,
    `- Conflict preview: ${statuses.filter((status) => status === "conflict").length}`,
    `- Manual added/removed: ${statuses.filter((status) => status.startsWith("manual-")).length}`,
    `- Dependency差分: ${listOrNone(dependencyComponents)}`,
    "",
    "## Components",
    "",
  ];

  const discoveredGroups = new Set(changed.map((entry) => entry.reviewGroup ?? "other"));
  const groups = ["heavily-customized", "interaction", "presentation", ...discoveredGroups].filter(
    (group, index, values) => discoveredGroups.has(group) && values.indexOf(group) === index,
  );
  for (const group of groups) {
    lines.push(`### ${group}`, "");
    for (const entry of changed.filter((candidate) => (candidate.reviewGroup ?? "other") === group)) {
      const statusCounts = new Map();
      for (const file of entry.files) statusCounts.set(file.mergeStatus, (statusCounts.get(file.mergeStatus) ?? 0) + 1);
      const statusesText = [...statusCounts].map(([status, count]) => `${status} ${count}`).join(", ") || "metadata only";
      const checked = entry.decision === "pending" ? " " : "x";
      const decision = entry.decision === "pending" ? "" : `; decision=${entry.decision}`;
      const note = entry.note ? ` — ${entry.note.replaceAll("\n", " ")}` : "";
      lines.push(`- [${checked}] \`${entry.component}\` (${entry.classification}): ${statusesText}${decision}${note}`);
    }
    lines.push("");
  }
  lines.push(
    "## Review commands",
    "",
    "```sh",
    "pnpm review:shadcn -- <component>",
    "pnpm review:shadcn -- <component> --decision applied --note \"取り込んだ内容\"",
    "pnpm review:shadcn -- <component> --decision reviewed-no-change --note \"採用しない理由\"",
    "pnpm review:shadcn -- --finalize",
    "```",
    "",
    "`src/lib`、dependency、公開contractは自動変更しない。",
  );
  return `${lines.join("\n")}\n`;
}

export function assertInside(root, target) {
  const resolvedRoot = resolve(root);
  const resolvedTarget = resolve(target);
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}${sep}`)) {
    throw new Error(`Path is outside ${resolvedRoot}: ${resolvedTarget}`);
  }
  return resolvedTarget;
}
