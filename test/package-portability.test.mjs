import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import test from "node:test";

const packageRoot = join(import.meta.dirname, "..");
const sourceRoot = join(packageRoot, "src");

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        return listSourceFiles(entryPath);
      }

      return entry.isFile() && (entry.name.endsWith(".svelte") || entry.name.endsWith(".ts")) ? [entryPath] : [];
    }),
  );

  return files.flat();
}

test("published UI source remains independent from mutsuna-reserve internals", async () => {
  const sourceFiles = await listSourceFiles(sourceRoot);
  const violations = [];

  for (const filePath of sourceFiles) {
    const source = await readFile(filePath, "utf8");
    if (/from\s+["'](?:\$lib|@mutsuna-reserve\/|apps\/)/.test(source)) {
      violations.push(relative(packageRoot, filePath));
    }
  }

  assert.deepEqual(violations, []);
});

test("package exports resolve to generated dist files", async () => {
  const packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
  const exactExports = Object.entries(packageJson.exports).filter(([subpath]) => !subpath.includes("*"));

  for (const [subpath, exportTarget] of exactExports) {
    const targets = typeof exportTarget === "string" ? [exportTarget] : Object.values(exportTarget);
    for (const target of new Set(targets)) {
      await assert.doesNotReject(access(join(packageRoot, target)), `${subpath} should resolve to ${target}`);
    }
  }
});
