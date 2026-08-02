import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

document.title = "むつな工房 UIコンポーネント集";

addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "むつな工房 UIコンポーネント集",
    brandUrl: "https://mutsuna.net",
    brandImage: "./favicon.ico",
    brandTarget: "_blank",
  }),
});
