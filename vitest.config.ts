import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          resolve: {
            alias: [
              { find: /^@mutsuna\/ui\/([^/]+)\/(.*)$/, replacement: path.join(projectRoot, "src/lib/$1/$2") },
              { find: /^@mutsuna\/ui\/([^/]+)$/, replacement: path.join(projectRoot, "src/lib/$1/index.ts") },
              { find: /^@mutsuna\/ui$/, replacement: path.join(projectRoot, "src/lib/index.ts") },
            ],
          },
          optimizeDeps: { entries: ["test/browser/**/*.test.ts"] },
          test: {
            name: "components",
            include: ["test/browser/**/*.test.ts"],
            testTimeout: 15000,
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({}),
              instances: [{ browser: "chromium" }],
            },
          },
        },
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(projectRoot, ".storybook"),
              storybookScript: "pnpm storybook --no-open",
            }),
          ],
          test: {
            name: "storybook",
            // Scrollable calendars render many months; keep all interaction/a11y checks on slower CI runners.
            testTimeout: 30000,
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({}),
              instances: [{ browser: "chromium" }],
            },
          },
        },
      ],
    },
  }),
);
