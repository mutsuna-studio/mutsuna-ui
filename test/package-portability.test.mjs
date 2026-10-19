import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import test from "node:test";
import { parse } from "svelte/compiler";

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

test("deep component exports point TypeScript to generated declaration files", async () => {
  const packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
  const wildcardExports = Object.entries(packageJson.exports).filter(([subpath]) => subpath.includes("*"));

  for (const [subpath, exportTarget] of wildcardExports) {
    assert.match(exportTarget.types, /\/\*\.d\.ts$/, `${subpath} should resolve TypeScript through declaration files`);
  }
});

test("every public component has a package-owned story", async () => {
  const packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
  // ./chat aggregates existing components; Patterns/Chat Screens exercises their composition.
  const nonComponentExports = new Set(["./chat", "./theme.css", "./tokens.css", "./fonts.css", "./utils", "./date-time-range-fields", "./date-time-input"]);
  const exportedComponents = Object.keys(packageJson.exports)
    .filter((subpath) => /^\.\/[^/*]+$/.test(subpath) && !nonComponentExports.has(subpath))
    .map((subpath) => subpath.slice(2))
    .sort();
  const storyComponents = (await readdir(storiesRoot))
    .filter((fileName) => fileName.endsWith(".stories.svelte"))
    .map((fileName) => fileName.replace(".stories.svelte", ""))
    .sort();

  for (const name of exportedComponents) assert.ok(storyComponents.includes(name), `${name} needs a package-owned story`);
  // A composition pattern can have its own story without becoming a public component.
  function metaTitle(node) {
    if (!node || typeof node !== "object") return undefined;
    if (node.type === "CallExpression" && node.callee?.name === "defineMeta") {
      return node.arguments[0]?.properties?.find(property => property.key?.name === "title")?.value?.value;
    }
    for (const value of Object.values(node)) {
      const result = Array.isArray(value) ? value.map(metaTitle).find(Boolean) : metaTitle(value);
      if (result) return result;
    }
  }
  for (const name of storyComponents.filter(name => !exportedComponents.includes(name))) {
    const ast = parse(await readFile(join(storiesRoot, `${name}.stories.svelte`), "utf8"), { modern: true });
    assert.ok(/^(Patterns|Guides)\//.test(metaTitle(ast.module) ?? ""), `${name} must be an explicitly categorized pattern or guide`);
  }
});

test("theme imports are declared by the package", async () => {
  const packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
  const theme = (await Promise.all(["theme.css", "fonts.css"].map((name) => readFile(join(sourceRoot, "lib", name), "utf8")))).join("\n");
  const declaredPackages = new Set([...Object.keys(packageJson.dependencies ?? {}), ...Object.keys(packageJson.peerDependencies ?? {})]);
  const importedPackages = [...theme.matchAll(/@import\s+"([^".][^"]*)"/g)].map(([, specifier]) =>
    specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0],
  );

  assert.deepEqual(
    importedPackages.filter((dependency) => !declaredPackages.has(dependency)),
    [],
  );
});

test("plain theme tokens have no framework, font, or build-tool dependencies", async () => {
  const tokens = await readFile(join(sourceRoot, "lib/tokens.css"), "utf8");
  const theme = await readFile(join(sourceRoot, "lib/theme.css"), "utf8");
  const fonts = await readFile(join(sourceRoot, "lib/fonts.css"), "utf8");
  assert.doesNotMatch(tokens, /@(?:import|apply|theme|source|custom-variant|font-face)\b/);
  assert.match(tokens, /:root\s*\{/);
  assert.match(tokens, /\.dark\s*\{/);
  assert.match(theme, /@import "\.\/tokens\.css"/);
  assert.match(theme, /@import "\.\/fonts\.css"/);
  assert.doesNotMatch(theme, /--background:\s*oklch/);
  assert.equal([...fonts.matchAll(/^@import /gm)].length, 7);
  assert.doesNotMatch(fonts, /@import "(?!@fontsource)/);
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
    url: "git+https://github.com/mutsuna-studio/mutsuna-ui.git",
  });
  assert.match(license, /Copyright \(c\) 2026 むつな工房 \/ Mutsuna/);
  assert.match(license, /Copyright \(c\) 2023 Hunter Johnston <https:\/\/github\.com\/huntabyte>/);
  assert.match(license, /Copyright \(c\) 2023 CokaKoala <https:\/\/github\.com\/adriangonz97>/);
  assert.match(license, /Copyright \(c\) 2023 shadcn/);
  assert.match(license, /Copyright \(c\) 2026 Bartosz Zagrodzki/);
  assert.match(readme, /components adapted from\s+\[shadcn-svelte\]/);
  assert.match(readme, /not affiliated with or endorsed by shadcn-svelte/);
  assert.match(readme, /CSS-only loading indicators are adapted from/);
});

test("catalog keeps automated interactions out of visual examples", async () => {
  for (const file of (await readdir(storiesRoot)).filter(name => name.endsWith(".stories.svelte"))) {
    const source = await readFile(join(storiesRoot, file), "utf8");
    const ast = parse(source, { modern: true });
    for (const story of ast.fragment.nodes.filter(node => node.type === "Component" && node.name === "Story")) {
      if (!story.attributes.some(attribute => attribute.name === "play")) continue;
      const tags = story.attributes.find(attribute => attribute.name === "tags");
      const tagSource = tags ? source.slice(tags.start, tags.end) : "";
      assert.ok(tagSource.includes("!dev") && tagSource.includes("!autodocs"), `${file}: play belongs to a hidden interaction story`);
    }
  }
});
