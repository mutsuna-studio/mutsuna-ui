import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { parse } from "svelte/compiler";

const packageRoot = join(import.meta.dirname, "..");

test("Storybook provides docs, accessibility checks, and browser interaction tests", async () => {
  const [main, preview, vitestConfig, packageJson, workflow] = await Promise.all([
    readFile(join(packageRoot, ".storybook/main.ts"), "utf8"),
    readFile(join(packageRoot, ".storybook/preview.ts"), "utf8"),
    readFile(join(packageRoot, "vitest.config.ts"), "utf8"),
    readFile(join(packageRoot, "package.json"), "utf8"),
    readFile(join(packageRoot, ".github/workflows/ci.yml"), "utf8"),
  ]);

  assert.match(main, /"@storybook\/addon-docs"/);
  assert.match(main, /"@storybook\/addon-a11y"/);
  assert.match(main, /"@storybook\/addon-vitest"/);
  assert.match(preview, /tags: \["autodocs"\]/);
  assert.match(preview, /a11y:\s*\{[\s\S]*?test: "error"/);
  assert.match(preview, /colorMode:\s*\{[\s\S]*?title: "表示モード"[\s\S]*?value: "light"[\s\S]*?value: "dark"/);
  assert.match(preview, /classList\.toggle\("dark", isDark\)/);
  assert.match(preview, /colorMode: "light"/);
  assert.match(preview, /options:\s*\{\s*showPanel: true,/);
  assert.match(preview, /storySort:\s*\{[\s\S]*?"Foundations"[\s\S]*?"Components"[\s\S]*?"Patterns"/);
  assert.match(preview, /\["Actions", "Inputs", "Forms", "Navigation", "Data Display", "Feedback", "Overlays", "Layout"\]/);
  assert.match(vitestConfig, /provider: playwright\(\{\}\)/);
  assert.match(vitestConfig, /instances: \[\{ browser: "chromium" \}\]/);
  assert.ok(JSON.parse(packageJson).scripts["test:components"]);
  assert.match(packageJson, /"test:storybook":/);
  assert.match(workflow, /pnpm test:components/);
  assert.match(workflow, /pnpm test:storybook/);
});

// Metadata is a catalog contract. Parse it so whitespace, attribute order and
// render/snippet extraction do not change what these checks observe.
function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  if (node.type) visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit));
    else if (value && typeof value === "object") walk(value, visit);
  }
}
function property(object, name) {
  return object?.properties?.find(item => (item.key?.name ?? item.key?.value) === name)?.value;
}
function attribute(story, name) {
  const value = story.attributes.find(item => item.type === "Attribute" && item.name === name)?.value;
  return Array.isArray(value) ? value[0]?.data : value?.expression;
}

test("core comparison stories hide inactive controls and panels", async () => {
  for (const name of ["button", "input", "checkbox", "select", "textarea", "slider", "switch"]) {
    const ast = parse(await readFile(join(packageRoot, "stories", `${name}.stories.svelte`), "utf8"), { modern: true });
    let states;
    walk(ast.fragment, node => { if (node.type === "Component" && node.name === "Story" && attribute(node, "name") === "States") states = node; });
    assert.ok(states, `${name} needs a States comparison`);
    const parameters = attribute(states, "parameters");
    assert.equal(property(property(parameters, "controls"), "disable")?.value, true, name);
    assert.equal(property(property(parameters, "options"), "showPanel")?.value, false, name);
  }
});

test("Storybook catalog groups every component by role", async () => {
  const storyFiles = (await readdir(join(packageRoot, "stories"))).filter((fileName) => fileName.endsWith(".stories.svelte"));
  const categoryCounts = new Map();
  const titles = new Set();
  const allowedCategories = new Set([
    "Guides",
    "Foundations",
    "Components/Actions",
    "Components/Inputs",
    "Components/Forms",
    "Components/Navigation",
    "Components/Data Display",
    "Components/Feedback",
    "Components/Overlays",
    "Components/Layout",
    "Patterns",
  ]);

  for (const fileName of storyFiles) {
    const source = await readFile(join(packageRoot, "stories", fileName), "utf8");
    let title;
    walk(parse(source, { modern: true }).module, node => {
      if (node.type === "CallExpression" && node.callee.name === "defineMeta") title = property(node.arguments[0], "title")?.value;
    });
    assert.equal(typeof title, "string", `${fileName} should declare a categorized title`);
    const category = [...allowedCategories].find((candidate) => title.startsWith(`${candidate}/`));

    assert.ok(category, `${title} should use the catalog taxonomy`);
    assert.equal(title.split("/").length, category.startsWith("Components/") ? 3 : 2, `${title} should keep the navigation depth consistent`);
    assert.equal(titles.has(title), false, `${title} should be unique`);
    titles.add(title);
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }

  // New components can join an existing category without updating a count here.
  assert.deepEqual([...categoryCounts.keys()].sort(), [...allowedCategories].sort());
});
