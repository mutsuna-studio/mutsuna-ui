export const themeAppearanceVariableNames = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--border",
  "--input",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
  "--radius",
  "--theme-font-ui",
  "--theme-font-body",
  "--theme-font-heading",
  "--theme-font-mono",
] as const;

export type ThemeAppearanceVariableName = (typeof themeAppearanceVariableNames)[number];
export type ThemeAppearance = Readonly<Partial<Record<ThemeAppearanceVariableName | "--primary" | "--primary-foreground" | "--sidebar-primary" | "--sidebar-primary-foreground" | "--ring", string>>>;

export type ThemeTemplateKey = "orange" | "blue" | "green" | "rose" | "neutral" | "amber" | "lime" | "teal" | "cyan" | "indigo" | "violet" | "fuchsia" | "slate" | "svelte" | "claude" | "github" | "linear" | "notion";

export type ThemeSource = ThemeTemplateKey | "custom";

export type Theme = {
  readonly source: ThemeSource;
  readonly appearance?: ThemeAppearance;
  readonly primary: string;
  readonly primaryForeground: string;
  readonly sidebarPrimary: string;
  readonly sidebarPrimaryForeground: string;
};

type OklchColor = {
  readonly l: number;
  readonly c: number;
  readonly h: number;
};

type RgbColor = {
  readonly r: number;
  readonly g: number;
  readonly b: number;
};

export type ThemeTemplate = Theme & {
  readonly key: ThemeTemplateKey;
  readonly name: string;
  readonly description: string;
  readonly previewHex: string;
};

export type ThemeCssVariableName = ThemeAppearanceVariableName | "--primary" | "--primary-foreground" | "--ring" | "--sidebar-primary" | "--sidebar-primary-foreground";

export type ThemeCssVariable = readonly [name: ThemeCssVariableName, value: string | null];

const oklchPattern = /^oklch\(\s*([0-9]+(?:\.[0-9]+)?)\s+([0-9]+(?:\.[0-9]+)?)\s+([0-9]+(?:\.[0-9]+)?)\s*\)$/;
const hexPattern = /^#[0-9a-fA-F]{6}$/;
const lightForeground = "oklch(0.987 0.022 95.277)";
const darkForeground = "oklch(0.141 0.005 285.823)";
const absoluteLightForeground = "oklch(1 0 0)";
const absoluteDarkForeground = "oklch(0 0 0)";
const minimumTextContrastRatio = 4.5;

// Palette and font roles adapted from https://svelte.dev (September 2026).
const svelteAppearance: ThemeAppearance = {
  "--primary": "light-dark(#d43008, #b32d00)",
  "--primary-foreground": "#fff",
  "--sidebar-primary": "light-dark(#d43008, #b32d00)",
  "--sidebar-primary-foreground": "#fff",
  "--ring": "light-dark(#d43008, #f96743)",
  "--background": "light-dark(white, hsl(220 10% 12%))",
  "--foreground": "light-dark(#141414, hsl(220 2% 90%))",
  "--card": "light-dark(#fdfdfd, hsl(220 12% 14%))",
  "--card-foreground": "light-dark(#262626, hsl(220 3% 80%))",
  "--popover": "light-dark(#fff, hsl(220 14% 16%))",
  "--popover-foreground": "light-dark(#141414, hsl(220 2% 90%))",
  "--secondary": "light-dark(#f2f2f2, hsl(220 15% 21%))",
  "--secondary-foreground": "light-dark(#262626, hsl(220 3% 80%))",
  "--muted": "light-dark(#fafafa, hsl(220 14% 16%))",
  "--muted-foreground": "light-dark(#666, hsl(220 5% 65%))",
  "--accent": "light-dark(#f2f2f2, hsl(220 15% 21%))",
  "--accent-foreground": "light-dark(#d43008, #f96743)",
  "--border": "light-dark(#ebebeb, hsl(220 15% 22%))",
  "--input": "light-dark(#ebebeb, hsl(220 15% 22%))",
  "--sidebar": "light-dark(#fdfdfd, hsl(220 12% 14%))",
  "--sidebar-foreground": "light-dark(#262626, hsl(220 3% 80%))",
  "--sidebar-accent": "light-dark(#f2f2f2, hsl(220 15% 21%))",
  "--sidebar-accent-foreground": "light-dark(#d43008, #f96743)",
  "--sidebar-border": "light-dark(#ebebeb, hsl(220 15% 22%))",
  "--sidebar-ring": "light-dark(#d43008, #f96743)",
  "--radius": "0.25rem",
  "--theme-font-ui": '"Fira Sans", -apple-system, sans-serif',
  "--theme-font-body": '"EB Garamond", Georgia, serif',
  "--theme-font-heading": '"DM Serif Display", Georgia, serif',
  "--theme-font-mono": '"Fira Mono", monospace',
};

// Based on claude.ai app v2 tokens and the official Chat tutorial (September 2026).
// Anthropic's proprietary fonts are not redistributed; use OFL font substitutes.
const claudeAppearance: ThemeAppearance = {
  "--primary": "light-dark(#d97757, #c46849)",
  "--primary-foreground": "light-dark(#09090b, #09090b)",
  "--sidebar-primary": "light-dark(#e7e6e1, #2c2c2a)",
  "--sidebar-primary-foreground": "light-dark(#131313, #f9f9f7)",
  "--ring": "light-dark(#c46849, #d97757)",
  "--background": "light-dark(#f9f9f7, #151515)",
  "--foreground": "light-dark(#131313, #f9f9f7)",
  "--card": "light-dark(#ffffff, #20201f)",
  "--card-foreground": "light-dark(#383835, #f9f9f7)",
  "--popover": "light-dark(#ffffff, #20201f)",
  "--popover-foreground": "light-dark(#131313, #f9f9f7)",
  "--secondary": "light-dark(#f0efec, #2c2c2a)",
  "--secondary-foreground": "light-dark(#383835, #f9f9f7)",
  "--muted": "light-dark(#f3f3f0, #20201f)",
  "--muted-foreground": "light-dark(#6d6b67, #97958d)",
  "--accent": "light-dark(#f0efec, #2c2c2a)",
  "--accent-foreground": "light-dark(#131313, #f9f9f7)",
  "--border": "light-dark(#e5e4df, #353533)",
  "--input": "light-dark(#d9d8d2, #444440)",
  "--sidebar": "light-dark(#f3f3f0, #111111)",
  "--sidebar-foreground": "light-dark(#383835, #c3c2b7)",
  "--sidebar-accent": "light-dark(#e7e6e1, #2c2c2a)",
  "--sidebar-accent-foreground": "light-dark(#131313, #f9f9f7)",
  "--sidebar-border": "light-dark(#e5e4df, #353533)",
  "--sidebar-ring": "light-dark(#c46849, #d97757)",
  "--radius": "0.75rem",
  "--theme-font-ui": '"Inter Variable", system-ui, sans-serif',
  "--theme-font-heading": 'Georgia, "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif',
  "--theme-font-body": '"Inter Variable", "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif',
  "--theme-font-mono": '"Fira Mono", ui-monospace, monospace',
};

// Non-official app-inspired palettes. Sources and approximation scope are in README.md.
const githubAppearance: ThemeAppearance = {
  "--primary": "light-dark(#1f883d, #238636)",
  "--primary-foreground": "light-dark(#ffffff, #ffffff)",
  "--ring": "light-dark(#0969da, #58a6ff)",
  "--background": "light-dark(#ffffff, #0d1117)",
  "--foreground": "light-dark(#1f2328, #f0f6fc)",
  "--card": "light-dark(#ffffff, #161b22)",
  "--card-foreground": "light-dark(#1f2328, #f0f6fc)",
  "--popover": "light-dark(#ffffff, #161b22)",
  "--popover-foreground": "light-dark(#1f2328, #f0f6fc)",
  "--secondary": "light-dark(#f6f8fa, #161b22)",
  "--secondary-foreground": "light-dark(#1f2328, #f0f6fc)",
  "--muted": "light-dark(#f6f8fa, #161b22)",
  "--muted-foreground": "light-dark(#59636e, #9198a1)",
  "--accent": "light-dark(#ddf4ff, #172d43)",
  "--accent-foreground": "light-dark(#0550ae, #79c0ff)",
  "--border": "light-dark(#d1d9e0, #3d444d)",
  "--input": "light-dark(#d1d9e0, #3d444d)",
  "--sidebar": "light-dark(#f6f8fa, #161b22)",
  "--sidebar-foreground": "light-dark(#1f2328, #f0f6fc)",
  "--sidebar-primary": "light-dark(#ddf4ff, #172d43)",
  "--sidebar-primary-foreground": "light-dark(#0550ae, #79c0ff)",
  "--sidebar-accent": "light-dark(#ddf4ff, #172d43)",
  "--sidebar-accent-foreground": "light-dark(#0550ae, #79c0ff)",
  "--sidebar-border": "light-dark(#d1d9e0, #3d444d)",
  "--sidebar-ring": "light-dark(#0969da, #58a6ff)",
  "--radius": "0.375rem",
  "--theme-font-ui": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Noto Sans\", Helvetica, Arial, sans-serif",
  "--theme-font-body": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Noto Sans\", Helvetica, Arial, sans-serif",
  "--theme-font-heading": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Noto Sans\", Helvetica, Arial, sans-serif",
  "--theme-font-mono": 'ui-monospace, "SFMono-Regular", Consolas, monospace',
};

const linearAppearance: ThemeAppearance = {
  "--primary": "light-dark(#5e6ad2, #747fea)",
  "--primary-foreground": "light-dark(#ffffff, #09090b)",
  "--ring": "light-dark(#5e6ad2, #919bff)",
  "--background": "light-dark(#ffffff, #17181c)",
  "--foreground": "light-dark(#202124, #eeeff2)",
  "--card": "light-dark(#ffffff, #202127)",
  "--card-foreground": "light-dark(#202124, #eeeff2)",
  "--popover": "light-dark(#ffffff, #202127)",
  "--popover-foreground": "light-dark(#202124, #eeeff2)",
  "--secondary": "light-dark(#f5f5f7, #202127)",
  "--secondary-foreground": "light-dark(#202124, #eeeff2)",
  "--muted": "light-dark(#f5f5f7, #202127)",
  "--muted-foreground": "light-dark(#64656f, #a1a3ad)",
  "--accent": "light-dark(#eeeef9, #2c2d45)",
  "--accent-foreground": "light-dark(#4e57ba, #b5bcff)",
  "--border": "light-dark(#dedee5, #34353f)",
  "--input": "light-dark(#dedee5, #34353f)",
  "--sidebar": "light-dark(#f5f5f7, #202127)",
  "--sidebar-foreground": "light-dark(#202124, #eeeff2)",
  "--sidebar-primary": "light-dark(#eeeef9, #2c2d45)",
  "--sidebar-primary-foreground": "light-dark(#4e57ba, #b5bcff)",
  "--sidebar-accent": "light-dark(#eeeef9, #2c2d45)",
  "--sidebar-accent-foreground": "light-dark(#4e57ba, #b5bcff)",
  "--sidebar-border": "light-dark(#dedee5, #34353f)",
  "--sidebar-ring": "light-dark(#5e6ad2, #919bff)",
  "--radius": "0.375rem",
  "--theme-font-ui": "\"Inter Variable\", -apple-system, \"Segoe UI\", sans-serif",
  "--theme-font-body": "\"Inter Variable\", -apple-system, \"Segoe UI\", sans-serif",
  "--theme-font-heading": "\"Inter Variable\", -apple-system, \"Segoe UI\", sans-serif",
  "--theme-font-mono": 'ui-monospace, "SFMono-Regular", Consolas, monospace',
};

const notionAppearance: ThemeAppearance = {
  "--primary": "light-dark(#2383e2, #529cca)",
  "--primary-foreground": "light-dark(#09090b, #09090b)",
  "--ring": "light-dark(#2383e2, #529cca)",
  "--background": "light-dark(#ffffff, #191919)",
  "--foreground": "light-dark(#37352f, #ebebeb)",
  "--card": "light-dark(#ffffff, #202020)",
  "--card-foreground": "light-dark(#37352f, #ebebeb)",
  "--popover": "light-dark(#ffffff, #202020)",
  "--popover-foreground": "light-dark(#37352f, #ebebeb)",
  "--secondary": "light-dark(#f7f7f5, #202020)",
  "--secondary-foreground": "light-dark(#37352f, #ebebeb)",
  "--muted": "light-dark(#f7f7f5, #202020)",
  "--muted-foreground": "light-dark(#686761, #a5a5a2)",
  "--accent": "light-dark(#efefed, #2c2c2c)",
  "--accent-foreground": "light-dark(#37352f, #ebebeb)",
  "--border": "light-dark(#e3e3e0, #373737)",
  "--input": "light-dark(#e3e3e0, #373737)",
  "--sidebar": "light-dark(#f7f7f5, #202020)",
  "--sidebar-foreground": "light-dark(#37352f, #ebebeb)",
  "--sidebar-primary": "light-dark(#efefed, #2c2c2c)",
  "--sidebar-primary-foreground": "light-dark(#37352f, #ebebeb)",
  "--sidebar-accent": "light-dark(#efefed, #2c2c2c)",
  "--sidebar-accent-foreground": "light-dark(#37352f, #ebebeb)",
  "--sidebar-border": "light-dark(#e3e3e0, #373737)",
  "--sidebar-ring": "light-dark(#2383e2, #529cca)",
  "--radius": "0.25rem",
  "--theme-font-ui": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Helvetica, Arial, sans-serif",
  "--theme-font-body": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Helvetica, Arial, sans-serif",
  "--theme-font-heading": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Helvetica, Arial, sans-serif",
  "--theme-font-mono": 'ui-monospace, "SFMono-Regular", Consolas, monospace',
};


export const defaultTheme: Theme = createTheme("orange", "oklch(0.575 0.2 45)");

export const themeTemplates: readonly ThemeTemplate[] = [
  createThemeTemplate("orange", "オレンジ", "現在の標準色", "oklch(0.575 0.2 45)"),
  createThemeTemplate("blue", "ブルー", "落ち着いた運用色", "oklch(0.546 0.175 252.58)"),
  createThemeTemplate("green", "グリーン", "状態確認に馴染む色", "oklch(0.541 0.145 158.64)"),
  createThemeTemplate("rose", "ローズ", "柔らかい強調色", "oklch(0.586 0.187 12.73)"),
  createThemeTemplate("neutral", "ニュートラル", "控えめな管理画面色", "oklch(0.442 0.017 285.786)"),
  createThemeTemplate("amber", "アンバー", "温かみのある黄金色", "oklch(0.795 0.184 86.047)"),
  createThemeTemplate("lime", "ライム", "軽やかな黄緑色", "oklch(0.648 0.16 125)"),
  createThemeTemplate("teal", "ティール", "穏やかな青緑色", "oklch(0.52 0.09 185)"),
  createThemeTemplate("cyan", "シアン", "澄んだ印象の水色", "oklch(0.715 0.143 215.221)"),
  createThemeTemplate("indigo", "インディゴ", "深みのある藍色", "oklch(0.48 0.18 275)"),
  createThemeTemplate("violet", "バイオレット", "上品な紫色", "oklch(0.54 0.19 300)"),
  createThemeTemplate("fuchsia", "フューシャ", "華やかな赤紫色", "oklch(0.56 0.19 335)"),
  createThemeTemplate("slate", "スレート", "青みを帯びた落ち着いた灰色", "oklch(0.446 0.043 257.281)"),
  { ...createThemeTemplate("svelte", "Svelte", "Svelteの配色とタイポグラフィ", "oklch(0.568 0.204 33.189)"), appearance: svelteAppearance, previewHex: "#d43008" },
  { ...createThemeTemplate("claude", "Claude-inspired", "チャット向けの穏やかな背景と控えめなクレイ色", "oklch(0.672 0.131 38.756)"), appearance: claudeAppearance, previewHex: "#d97757" },
  { ...createThemeTemplate("github", "GitHub-inspired", "明確な境界線と緑の主要操作", "oklch(0.552 0.145 148.215)"), appearance: githubAppearance, previewHex: "#1f883d" },
  { ...createThemeTemplate("linear", "Linear-inspired", "静かな背景階調と青紫のアクセント", "oklch(0.567 0.159 275.206)"), appearance: linearAppearance, previewHex: "#5e6ad2" },
  { ...createThemeTemplate("notion", "Notion-inspired", "白い文書面と控えめな青い操作色", "oklch(0.606 0.167 252.702)"), appearance: notionAppearance, previewHex: "#2383e2" },
];

export function createTheme(source: ThemeSource, primary: string): Theme {
  const parsedPrimary = parseOklchColor(primary);
  if (parsedPrimary === null) {
    return defaultTheme;
  }

  const primaryForeground = resolvePrimaryForeground(parsedPrimary);
  return {
    source,
    primary: formatOklchColor(parsedPrimary),
    primaryForeground,
    sidebarPrimary: formatOklchColor(parsedPrimary),
    sidebarPrimaryForeground: primaryForeground,
  };
}

export function findThemeTemplate(key: string): ThemeTemplate | null {
  return themeTemplates.find((template) => template.key === key) ?? null;
}

export function themeToCssVariables(theme: Theme | null | undefined): readonly ThemeCssVariable[] {
  return [
    ["--primary", theme?.appearance?.["--primary"] ?? theme?.primary ?? null],
    ["--primary-foreground", theme?.appearance?.["--primary-foreground"] ?? theme?.primaryForeground ?? null],
    ["--sidebar-primary", theme?.appearance?.["--sidebar-primary"] ?? theme?.sidebarPrimary ?? null],
    ["--sidebar-primary-foreground", theme?.appearance?.["--sidebar-primary-foreground"] ?? theme?.sidebarPrimaryForeground ?? null],
    ["--ring", theme?.appearance?.["--ring"] ?? theme?.primary ?? null],
    ...themeAppearanceVariableNames.map((name): ThemeCssVariable => [name, theme?.appearance?.[name] ?? null]),
  ];
}

export function parseOklchColor(value: string): OklchColor | null {
  const match = oklchPattern.exec(value.trim());
  if (match === null) {
    return null;
  }

  const l = Number(match[1]);
  const c = Number(match[2]);
  const h = Number(match[3]);
  if (!Number.isFinite(l) || !Number.isFinite(c) || !Number.isFinite(h)) {
    return null;
  }
  if (l < 0 || l > 1 || c < 0 || c > 0.4 || h < 0 || h > 360) {
    return null;
  }

  return { l, c, h };
}

export function isValidOklchColor(value: string): boolean {
  return parseOklchColor(value) !== null;
}

export function hexToOklch(value: string): string {
  const rgb = parseHexColor(value);
  if (rgb === null) {
    return defaultTheme.primary;
  }

  return formatOklchColor(rgbToOklch(rgb));
}

export function oklchToHex(value: string): string {
  const oklch = parseOklchColor(value);
  if (oklch === null) {
    return oklchToHex(defaultTheme.primary);
  }

  const rgb = oklchToRgb(oklch);
  return `#${toHexChannel(rgb.r)}${toHexChannel(rgb.g)}${toHexChannel(rgb.b)}`;
}

function createThemeTemplate(key: ThemeTemplateKey, name: string, description: string, primary: string): ThemeTemplate {
  return {
    ...createTheme(key, primary),
    key,
    name,
    description,
    previewHex: oklchToHex(primary),
  };
}

function formatOklchColor(color: OklchColor): string {
  return `oklch(${formatDecimal(color.l)} ${formatDecimal(color.c)} ${formatDecimal(color.h)})`;
}

function formatDecimal(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function parseHexColor(value: string): RgbColor | null {
  if (!hexPattern.test(value)) {
    return null;
  }

  return {
    r: Number.parseInt(value.slice(1, 3), 16) / 255,
    g: Number.parseInt(value.slice(3, 5), 16) / 255,
    b: Number.parseInt(value.slice(5, 7), 16) / 255,
  };
}

function toHexChannel(value: number): string {
  return Math.round(clamp(value, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0");
}

function resolvePrimaryForeground(primary: OklchColor): string {
  const primaryRgb = oklchToRgb(primary);
  const preferredForeground = findHighestContrastForeground(primaryRgb, [lightForeground, darkForeground]);
  if (preferredForeground.contrastRatio >= minimumTextContrastRatio) {
    return preferredForeground.color;
  }

  return findHighestContrastForeground(primaryRgb, [absoluteLightForeground, absoluteDarkForeground]).color;
}

function findHighestContrastForeground(primary: RgbColor, candidates: readonly string[]): { color: string; contrastRatio: number } {
  let selectedColor = candidates[0] ?? absoluteDarkForeground;
  let selectedContrastRatio = Number.NEGATIVE_INFINITY;

  for (const candidate of candidates) {
    const parsedCandidate = parseOklchColor(candidate);
    if (parsedCandidate === null) {
      continue;
    }

    const candidateContrastRatio = contrastRatio(primary, oklchToRgb(parsedCandidate));
    if (candidateContrastRatio > selectedContrastRatio) {
      selectedColor = candidate;
      selectedContrastRatio = candidateContrastRatio;
    }
  }

  return { color: selectedColor, contrastRatio: selectedContrastRatio };
}

function contrastRatio(first: RgbColor, second: RgbColor): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

function relativeLuminance(rgb: RgbColor): number {
  const r = toLinearRgbChannel(clamp(rgb.r, 0, 1));
  const g = toLinearRgbChannel(clamp(rgb.g, 0, 1));
  const b = toLinearRgbChannel(clamp(rgb.b, 0, 1));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function rgbToOklch(rgb: RgbColor): OklchColor {
  const r = toLinearRgbChannel(rgb.r);
  const g = toLinearRgbChannel(rgb.g);
  const b = toLinearRgbChannel(rgb.b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const axisB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.sqrt(a * a + axisB * axisB);
  const hue = chroma === 0 ? 0 : normalizeHue((Math.atan2(axisB, a) * 180) / Math.PI);
  return { l: lightness, c: chroma, h: hue };
}

function oklchToRgb(color: OklchColor): RgbColor {
  const hueRadians = (color.h * Math.PI) / 180;
  const a = color.c * Math.cos(hueRadians);
  const b = color.c * Math.sin(hueRadians);
  const lPrime = color.l + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = color.l - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = color.l - 0.0894841775 * a - 1.291485548 * b;
  const l = lPrime * lPrime * lPrime;
  const m = mPrime * mPrime * mPrime;
  const s = sPrime * sPrime * sPrime;
  return {
    r: fromLinearRgbChannel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: fromLinearRgbChannel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: fromLinearRgbChannel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

function toLinearRgbChannel(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function fromLinearRgbChannel(value: number): number {
  return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
}

function normalizeHue(value: number): number {
  return ((value % 360) + 360) % 360;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
