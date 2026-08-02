import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/svelte-vite";
import { mergeConfig } from "vite";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.svelte"],
  staticDirs: ["../public"],
  addons: ["@storybook/addon-svelte-csf"],
  framework: {
    name: "@storybook/svelte-vite",
    options: {},
  },
  managerHead: (head) =>
    (head ?? "")
      .replace("<title>storybook</title>", "<title>むつな工房 UIコンポーネント集</title>")
      .replace('href="./favicon.svg"', 'href="./favicon.ico"')
      .concat(`
        <style>
          a[title="むつな工房 UIコンポーネント集"] {
            align-items: center;
            display: flex;
            gap: 10px;
            width: 100%;
          }

          a[title="むつな工房 UIコンポーネント集"] img {
            height: 48px;
            width: 48px;
          }

          a[title="むつな工房 UIコンポーネント集"]::after {
            color: #17233c;
            content: "むつな工房\\A UIコンポーネント集";
            font-size: 14px;
            font-weight: 700;
            line-height: 1.35;
            white-space: pre;
          }
        </style>
      `),
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
