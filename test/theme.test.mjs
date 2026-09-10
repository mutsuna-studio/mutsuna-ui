import assert from "node:assert/strict";
import { test } from "node:test";
import { createTheme, defaultTheme, findThemeTemplate, hexToOklch, isValidOklchColor, oklchToHex, themeTemplates, themeAppearanceVariableNames, themeToCssVariables } from "../src/lib/theme/theme.ts";

test("theme templates use valid OKLCH colors", () => {
  assert.equal(defaultTheme.primary, "oklch(0.575 0.2 45)");
  assert.equal(defaultTheme.primaryForeground, "oklch(0.987 0.022 95.277)");
  assert.equal(findThemeTemplate("orange").primaryForeground, defaultTheme.primaryForeground);
  assert.equal(themeTemplates.length, 18);
  assert.equal(new Set(themeTemplates.map(({ key }) => key)).size, themeTemplates.length);
  assert.equal(findThemeTemplate("unknown"), null);
  assert.equal(findThemeTemplate("svelte").previewHex, "#d43008");

  for (const template of themeTemplates) {
    assert.equal(isValidOklchColor(template.primary), true, template.key);
    assert.match(template.previewHex, /^#[0-9a-f]{6}$/);
    assert.equal(template.sidebarPrimary, template.primary);
    assert.equal(findThemeTemplate(template.key), template);
    assert.equal(template.source, template.key);
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
  assert.deepEqual(themeToCssVariables(theme).slice(0, 5), [
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
    themeToCssVariables(null).slice(0, 5).map(([name, value]) => [name, value]),
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
  const firstLuminance = relativeLuminance(isValidOklchColor(first) ? oklchToHex(first) : first);
  const secondLuminance = relativeLuminance(isValidOklchColor(second) ? oklchToHex(second) : second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

function relativeLuminance(hex) {
  const channels = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}


test("full theme tokens reset when switching to a color preset or clearing", () => {
  const full = new Map(themeToCssVariables(findThemeTemplate("svelte")));
  assert.match(full.get("--background"), /light-dark/);
  assert.match(full.get("--theme-font-ui"), /Fira Sans/);
  for (const theme of [findThemeTemplate("orange"), null]) {
    const variables = new Map(themeToCssVariables(theme));
    for (const name of themeAppearanceVariableNames) assert.equal(variables.get(name), null, name);
  }
});


for (const key of ["claude", "github", "linear", "notion"]) test(`${key} appearance covers every token and keeps light/dark text readable`, () => {
  const theme = findThemeTemplate(key);
  const variables = new Map(themeToCssVariables(theme));
  for (const name of themeAppearanceVariableNames) assert.ok(variables.get(name), name);
  const pairs = [
    ["--primary", "--primary-foreground"], ["--background", "--foreground"],
    ["--card", "--card-foreground"], ["--popover", "--popover-foreground"],
    ["--secondary", "--secondary-foreground"], ["--muted", "--muted-foreground"],
    ["--accent", "--accent-foreground"], ["--sidebar", "--sidebar-foreground"],
    ["--sidebar-primary", "--sidebar-primary-foreground"], ["--sidebar-accent", "--sidebar-accent-foreground"],
  ];
  for (const mode of [0, 1]) {
    const resolve = (name) => variables.get(name).match(/^light-dark\((#[0-9a-f]+), (#[0-9a-f]+)\)$/)[mode + 1];
    for (const [background, foreground] of pairs) {
      assert.ok(contrastRatio(resolve(background), resolve(foreground)) >= 4.5, `${background} / ${foreground}, mode ${mode}`);
    }
  }
  if (key === "claude") {
    assert.match(variables.get("--theme-font-heading"), /Georgia/);
    assert.match(variables.get("--theme-font-body"), /Inter Variable/);
  }
  assert.notEqual(variables.get("--sidebar-primary"), variables.get("--primary"));
  const reset = new Map(themeToCssVariables(findThemeTemplate("blue")));
  for (const name of themeAppearanceVariableNames) assert.equal(reset.get(name), null, name);
});
