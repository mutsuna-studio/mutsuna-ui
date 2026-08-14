import "../src/lib/theme.css";

import type { Preview } from "@storybook/svelte-vite";
import { findThemeTemplate, themeTemplates, themeToCssVariables } from "../src/lib/theme/theme.js";

const themeToolbarItems = themeTemplates.map((theme) => ({
  value: theme.key,
  title: theme.name,
  right: theme.previewHex,
}));

function applyPreviewTheme(themeKey: unknown): void {
  const theme = typeof themeKey === "string" ? findThemeTemplate(themeKey) : null;
  const selectedTheme = theme ?? themeTemplates[0];

  for (const [name, value] of themeToCssVariables(selectedTheme)) {
    if (value === null) {
      document.documentElement.style.removeProperty(name);
      continue;
    }
    document.documentElement.style.setProperty(name, value);
  }
}

const preview: Preview = {
  globalTypes: {
    themeColor: {
      description: "全ストーリーへ適用するMutsuna UIのテーマカラー",
      toolbar: {
        title: "テーマカラー",
        icon: "paintbrush",
        items: themeToolbarItems,
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    themeColor: "orange",
  },
  decorators: [
    (Story, context) => {
      applyPreviewTheme(context.globals.themeColor);
      return Story();
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
