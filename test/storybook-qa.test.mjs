import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

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
  assert.match(packageJson, /"test:storybook":/);
  assert.match(workflow, /pnpm test:storybook/);
});

test("Button story compares variants, sizes, disabled, loading, icons, and long content", async () => {
  const buttonStory = await readFile(join(packageRoot, "stories/button.stories.svelte"), "utf8");

  assert.match(
    buttonStory,
    /<Story name="States" parameters=\{\{ controls: \{ disable: true \}, options: \{ showPanel: false \} \}\} asChild>/,
  );
  assert.match(buttonStory, /comparisonVariants/);
  assert.match(buttonStory, /comparisonSizes/);
  assert.match(buttonStory, /<Button \{variant\} disabled>/);
  assert.match(buttonStory, /<Button \{variant\} loading>/);
  assert.match(buttonStory, /icon=\{PlusIcon\}/);
  assert.match(buttonStory, /選択したすべての項目へ同じ設定を適用する/);
  assert.deepEqual(
    [...buttonStory.matchAll(/<Story name="([^"]+)"/g)].map((match) => match[1]),
    ["Default", "States"],
  );
});

test("core action and input stories compare their supported states in one view", async () => {
  const storyFiles = ["button", "input", "checkbox", "select", "textarea", "slider", "switch"];
  const stories = await Promise.all(
    storyFiles.map((fileName) => readFile(join(packageRoot, "stories", `${fileName}.stories.svelte`), "utf8")),
  );

  for (const [index, source] of stories.entries()) {
    assert.match(source, /<Story[\s\S]*?name="States"/, `${storyFiles[index]} should expose a States story`);
    assert.match(
      source,
      /<Story(?:(?!<Story)[\s\S])*?name="States"(?:(?!<Story)[\s\S])*?parameters=\{\{ controls: \{ disable: true \}, options: \{ showPanel: false \} \}\}/,
      `${storyFiles[index]} States should hide its inactive controls and addon panel`,
    );
  }

  const [, inputStory, checkboxStory, selectStory] = stories;

  assert.match(inputStory, /readonly/);
  assert.match(inputStory, /aria-invalid="true"/);
  assert.match(inputStory, /複数拠点で共通利用する非常に長いプロジェクト表示名/);
  assert.match(checkboxStory, /<Checkbox checked disabled \/>/);
  assert.match(checkboxStory, /<Checkbox indeterminate disabled \/>/);
  assert.match(checkboxStory, /aria-invalid="true"/);
  assert.match(selectStory, /<SelectTrigger id="states-select-compact" size="sm"/);
  assert.match(selectStory, /<Select type="single" value="desk" disabled>/);
  assert.match(selectStory, /aria-invalid="true"/);
  assert.match(selectStory, /複数拠点で共通利用する長い名前の会議室/);
});

test("representative keyboard and dialog flows remain executable stories", async () => {
  const [dialogStory, sliderStory] = await Promise.all([
    readFile(join(packageRoot, "stories/dialog.stories.svelte"), "utf8"),
    readFile(join(packageRoot, "stories/slider.stories.svelte"), "utf8"),
  ]);

  assert.match(dialogStory, /play=\{async \(\{ canvasElement \}\)/);
  assert.match(dialogStory, /findByRole\("dialog", \{ name: "項目を作成" \}\)/);
  assert.match(sliderStory, /userEvent\.keyboard\("\{ArrowRight\}"\)/);
  assert.match(sliderStory, /toHaveAttribute\("aria-valuenow", "51"\)/);
});

test("Storybook catalog groups every component by role", async () => {
  const storyFiles = (await readdir(join(packageRoot, "stories"))).filter((fileName) => fileName.endsWith(".stories.svelte"));
  const categoryCounts = new Map();
  const titles = new Set();
  const allowedCategories = new Set([
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
    const metadata = source.match(/defineMeta\(\{[\s\S]*?\btitle: "([^"]+)"/);
    assert.ok(metadata, `${fileName} should declare a categorized title`);

    const [, title] = metadata;
    const category = [...allowedCategories].find((candidate) => title.startsWith(`${candidate}/`));

    assert.ok(category, `${title} should use the catalog taxonomy`);
    assert.equal(titles.has(title), false, `${title} should be unique`);
    titles.add(title);
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }

  assert.deepEqual(Object.fromEntries([...categoryCounts].sort()), {
    "Components/Actions": 2,
    "Components/Data Display": 5,
    "Components/Feedback": 5,
    "Components/Forms": 6,
    "Components/Inputs": 15,
    "Components/Layout": 2,
    "Components/Navigation": 4,
    "Components/Overlays": 7,
    Foundations: 3,
    Patterns: 6,
  });
});
