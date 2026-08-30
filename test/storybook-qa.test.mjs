import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  assert.match(vitestConfig, /provider: playwright\(\{\}\)/);
  assert.match(vitestConfig, /instances: \[\{ browser: "chromium" \}\]/);
  assert.match(packageJson, /"test:storybook":/);
  assert.match(workflow, /pnpm test:storybook/);
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
