import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/svelte-vite";
import { mergeConfig } from "vite";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.svelte"],
  addons: ["@storybook/addon-svelte-csf"],
  framework: {
    name: "@storybook/svelte-vite",
    options: {},
  },
  viteFinal: async (config) =>
    mergeConfig(config, {
      resolve: {
        alias: [
          {
            find: /^@mutsuna\/ui\/([^/]+)\/(.*)$/,
            replacement: path.resolve(packageRoot, "src/lib/$1/$2"),
          },
          {
            find: /^@mutsuna\/ui\/([^/]+)$/,
            replacement: path.resolve(packageRoot, "src/lib/$1/index.ts"),
          },
          {
            find: /^@mutsuna\/ui$/,
            replacement: path.resolve(packageRoot, "src/lib/index.ts"),
          },
        ],
      },
    }),
};

export default config;
