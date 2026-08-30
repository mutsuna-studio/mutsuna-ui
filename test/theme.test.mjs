import assert from "node:assert/strict";
import { test } from "node:test";
import { createTheme, defaultTheme, hexToOklch, isValidOklchColor, oklchToHex, themeTemplates, themeToCssVariables } from "../src/lib/theme/theme.ts";

test("theme templates use valid OKLCH colors", () => {
  assert.equal(defaultTheme.primary, "oklch(0.555 0.163 48.998)");
  assert.equal(themeTemplates.length, 5);

  for (const template of themeTemplates) {
    assert.equal(isValidOklchColor(template.primary), true, template.key);
    assert.match(template.previewHex, /^#[0-9a-f]{6}$/);
    assert.equal(template.sidebarPrimary, template.primary);
  }
});

test("theme colors convert between picker hex and OKLCH", () => {
  const oklch = hexToOklch("#2563eb");
  assert.match(oklch, /^oklch\(/);
  assert.equal(isValidOklchColor(oklch), true);
  assert.match(oklchToHex(oklch), /^#[0-9a-f]{6}$/);
  assert.equal(isValidOklchColor("oklch(1.2 0.1 20)"), false);
  assert.equal(isValidOklchColor("rgb(37 99 235)"), false);
});

test("custom theme derives foreground and CSS variables", () => {
  const theme = createTheme("custom", "oklch(0.546 0.175 252.58)");
  assert.equal(theme.source, "custom");
  assert.equal(theme.sidebarPrimary, theme.primary);
  assert.equal(isValidOklchColor(theme.primaryForeground), true);
  assert.deepEqual(themeToCssVariables(theme), [
    ["--primary", theme.primary],
    ["--primary-foreground", theme.primaryForeground],
    ["--sidebar-primary", theme.sidebarPrimary],
    ["--sidebar-primary-foreground", theme.sidebarPrimaryForeground],
    ["--ring", theme.primary],
  ]);
});

test("theme foregrounds keep normal text at WCAG AA contrast", () => {
  const customThemes = [
    createTheme("custom", "oklch(0.1 0 0)"),
    createTheme("custom", "oklch(0.4 0.12 145)"),
    createTheme("custom", "oklch(0.7 0 0)"),
    createTheme("custom", "oklch(0.75 0.2 250)"),
    createTheme("custom", "oklch(0.95 0 0)"),
  ];

  for (const theme of [...themeTemplates, ...customThemes]) {
    const ratio = contrastRatio(theme.primary, theme.primaryForeground);
    assert.ok(ratio >= 4.5, `${theme.primary} and ${theme.primaryForeground} only have ${ratio.toFixed(2)}:1 contrast`);
  }

  assert.equal(createTheme("custom", "oklch(0.7 0 0)").primaryForeground, "oklch(0.141 0.005 285.823)");
});

test("sampled custom theme colors always resolve to an accessible foreground", () => {
  for (const lightness of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]) {
    for (const chroma of [0, 0.1, 0.2, 0.4]) {
      for (const hue of [0, 60, 120, 180, 240, 300, 360]) {
        const theme = createTheme("custom", `oklch(${lightness} ${chroma} ${hue})`);
        const ratio = contrastRatio(theme.primary, theme.primaryForeground);
        assert.ok(ratio >= 4.5, `${theme.primary} and ${theme.primaryForeground} only have ${ratio.toFixed(2)}:1 contrast`);
      }
    }
  }
});

test("missing theme removes every managed CSS variable", () => {
  assert.deepEqual(
    themeToCssVariables(null).map(([name, value]) => [name, value]),
    [
      ["--primary", null],
      ["--primary-foreground", null],
      ["--sidebar-primary", null],
      ["--sidebar-primary-foreground", null],
      ["--ring", null],
    ],
  );
});

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(oklchToHex(first));
  const secondLuminance = relativeLuminance(oklchToHex(second));
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

function relativeLuminance(hex) {
  const channels = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
