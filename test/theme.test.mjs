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
