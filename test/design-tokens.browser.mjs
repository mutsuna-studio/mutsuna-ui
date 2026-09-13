import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { chromium } from "playwright";
import { themeTemplates } from "../dist/theme/theme.js";

test("theme appearances render identically before and after token migration", async () => {
  const before = JSON.parse(await readFile(new URL("./fixtures/theme-before-tokens.json", import.meta.url), "utf8"));
  // Browser resolves light-dark() and converts both legacy HSL and canonical sRGB
  // to the same canvas color space. This tests rendering, not our converter twice.
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const differences = await page.evaluate(({ current, previous }) => {
      const element = document.createElement("span");
      document.body.append(element);
      const context = document.createElement("canvas").getContext("2d");
      const render = (value, name, mode) => {
        element.style.cssText = `color-scheme: ${mode}`;
        if (name.startsWith("--theme-font-")) {
          element.style.fontFamily = value;
          return getComputedStyle(element).fontFamily.replaceAll('"', "");
        }
        if (name === "--radius") {
          element.style.borderRadius = value;
          return getComputedStyle(element).borderRadius;
        }
        if (!CSS.supports("color", value)) throw new Error(`Invalid generated color: ${value}`);
        element.style.color = value;
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = getComputedStyle(element).color;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data].join(",");
      };
      const differences = [];
      for (const [index, theme] of current.entries()) {
        for (const [name, value] of Object.entries(theme.appearance ?? {})) {
          for (const mode of ["light", "dark"]) {
            const a = render(value, name, mode);
            const b = render(previous[index].appearance[name], name, mode);
            if (a !== b) differences.push({ theme: theme.key, name, mode, actual: a, expected: b });
          }
        }
      }
      return differences;
    }, { current: themeTemplates, previous: before.templates });
    assert.deepEqual(differences, []);
  } finally {
    await browser.close();
  }
});
