import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { oklchToHex } from "../src/lib/theme/theme.ts";

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
  const css = await readSource("src/lib/theme.css");
  const root = themeBlock(css, ":root");
  const background = oklchToHex(themeColor(root, "background"));
  const muted = oklchToHex(themeColor(root, "muted"));
  const mutedForeground = oklchToHex(themeColor(root, "muted-foreground"));
  const destructive = oklchToHex(themeColor(root, "destructive"));
  const destructiveSurface = blend(destructive, background, 0.1);

  assert.ok(contrastRatio(mutedForeground, muted) >= 4.5);
  assert.ok(contrastRatio(destructive, destructiveSurface) >= 4.5);
});

test("destructive variants preserve their accessible surface on hover", async () => {
  const [button, badge] = await Promise.all([
    readSource("src/lib/button/button.svelte"),
    readSource("src/lib/badge/badge.svelte"),
  ]);

  for (const source of [button, badge]) {
    assert.doesNotMatch(source, /(?:^|\s)hover:bg-destructive\/20/);
    assert.doesNotMatch(source, /dark:hover:bg-destructive\/30/);
  }
});

test("shared form and editor controls expose accessible names", async () => {
  const [businessHours, markdown] = await Promise.all([
    readSource("src/lib/business-hours-fields/business-hours-fields.svelte"),
    readSource("src/lib/markdown/markdown-editor.svelte"),
  ]);

  assert.match(businessHours, /aria-label=\{`\$\{hours\.label\}の開始時刻`\}/);
  assert.match(businessHours, /aria-label=\{`\$\{hours\.label\}の終了時刻`\}/);
  assert.match(businessHours, /aria-label="祝日の開始時刻"/);
  assert.match(businessHours, /aria-label="祝日の終了時刻"/);
  assert.match(markdown, /editorViewOptionsCtx/);
  assert.match(markdown, /"aria-labelledby": `\$\{id\}-label`/);
});

test("shared visual and scrolling primitives expose semantic keyboard contracts", async () => {
  const [avatar, scrollbar, calendar, calendarDayColor] = await Promise.all([
    readSource("src/lib/avatar/customer-avatar.svelte"),
    readSource("src/lib/scrollbar/scrollbar-area.svelte"),
    readSource("src/lib/calendar/calendar.svelte"),
    readSource("src/lib/calendar/calendar-day-color.ts"),
  ]);

  assert.match(avatar, /role="img" aria-label=\{name\}/);
  assert.match(scrollbar, /tabindex = 0/);
  assert.match(scrollbar, /\{tabindex\}/);
  assert.match(calendar, /<Calendar\.Header>[\s\S]*?#snippet child\(\{ props \}\)[\s\S]*?<div \{\.\.\.props\}>/);
  assert.match(calendarDayColor, /text-red-700/);
  assert.doesNotMatch(calendarDayColor, /text-red-600/);
});
