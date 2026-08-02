import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import test from "node:test";

const packageRoot = join(import.meta.dirname, "..");
const sourceRoot = join(packageRoot, "src");
const storiesRoot = join(packageRoot, "stories");

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

test("published UI source and catalog remain independent from mutsuna-reserve internals", async () => {
  const sourceFiles = [...(await listSourceFiles(sourceRoot)), ...(await listSourceFiles(storiesRoot))];
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

test("every public component has a package-owned story", async () => {
  const packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
  const nonComponentExports = new Set(["./theme.css", "./utils"]);
  const exportedComponents = Object.keys(packageJson.exports)
    .filter((subpath) => /^\.\/[^/*]+$/.test(subpath) && !nonComponentExports.has(subpath))
    .map((subpath) => subpath.slice(2))
    .sort();
  const storyComponents = (await readdir(storiesRoot))
    .filter((fileName) => fileName.endsWith(".stories.svelte"))
    .map((fileName) => fileName.replace(".stories.svelte", ""))
    .sort();

  assert.deepEqual(storyComponents, exportedComponents);
});

test("theme imports are declared by the package", async () => {
  const packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
  const theme = await readFile(join(sourceRoot, "lib/theme.css"), "utf8");
  const declaredPackages = new Set([...Object.keys(packageJson.dependencies ?? {}), ...Object.keys(packageJson.peerDependencies ?? {})]);
  const importedPackages = [...theme.matchAll(/@import\s+"([^".][^"]*)"/g)].map(([, specifier]) =>
    specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0],
  );

  assert.deepEqual(
    importedPackages.filter((dependency) => !declaredPackages.has(dependency)),
    [],
  );
});

test("package metadata stays ready for public npm releases", async () => {
  const packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
  const license = await readFile(join(packageRoot, "LICENSE"), "utf8");
  const readme = await readFile(join(packageRoot, "README.md"), "utf8");

  assert.equal(packageJson.private, false);
  assert.equal(packageJson.license, "MIT");
  assert.deepEqual(packageJson.publishConfig, { access: "public" });
  assert.deepEqual(packageJson.repository, {
    type: "git",
    url: "git+https://github.com/mutsuna-studio/mutsuna-reserve.git",
    directory: "packages/ui",
  });
  assert.match(license, /Copyright \(c\) 2026 むつな工房 \/ Mutsuna/);
  assert.match(license, /Copyright \(c\) 2023 Hunter Johnston <https:\/\/github\.com\/huntabyte>/);
  assert.match(license, /Copyright \(c\) 2023 CokaKoala <https:\/\/github\.com\/adriangonz97>/);
  assert.match(license, /Copyright \(c\) 2023 shadcn/);
  assert.match(readme, /components adapted from\s+\[shadcn-svelte\]/);
  assert.match(readme, /not affiliated with or endorsed by shadcn-svelte/);
});
