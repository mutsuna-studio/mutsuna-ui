import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { oklchToHex } from "../dist/theme/theme.js";

const packageRoot = join(import.meta.dirname, "..");

async function readSource(path) {
  return readFile(join(packageRoot, path), "utf8");
}

function themeBlock(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector} \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `${selector} theme block should exist`);
  return match[1];
}

function themeColor(block, property) {
  const match = block.match(new RegExp(`--${property}: ([^;]+);`));
  assert.ok(match, `--${property} should exist`);
  return match[1];
}

function relativeLuminance(hex) {
  const channels = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

function blend(first, second, opacity) {
  const channels = [1, 3, 5].map((index) =>
    Math.round(
      Number.parseInt(first.slice(index, index + 2), 16) * opacity +
        Number.parseInt(second.slice(index, index + 2), 16) * (1 - opacity),
    ),
  );
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

test("light theme muted and destructive text keep WCAG AA contrast", async () => {
  const css = await readSource("dist/tokens.css");
  const root = themeBlock(css, ":root");
  const background = oklchToHex(themeColor(root, "background"));
  const muted = oklchToHex(themeColor(root, "muted"));
  const mutedForeground = oklchToHex(themeColor(root, "muted-foreground"));
  const destructive = oklchToHex(themeColor(root, "destructive"));
  const destructiveSurface = blend(destructive, background, 0.1);

  assert.ok(contrastRatio(mutedForeground, muted) >= 4.5);
  assert.ok(contrastRatio(destructive, destructiveSurface) >= 4.5);
});
