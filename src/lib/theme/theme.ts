export type ThemeTemplateKey = "orange" | "blue" | "green" | "rose" | "neutral";

export type ThemeSource = ThemeTemplateKey | "custom";

export type Theme = {
  readonly source: ThemeSource;
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

export type ThemeCssVariableName = "--primary" | "--primary-foreground" | "--ring" | "--sidebar-primary" | "--sidebar-primary-foreground";

export type ThemeCssVariable = readonly [name: ThemeCssVariableName, value: string | null];

const oklchPattern = /^oklch\(\s*([0-9]+(?:\.[0-9]+)?)\s+([0-9]+(?:\.[0-9]+)?)\s+([0-9]+(?:\.[0-9]+)?)\s*\)$/;
const hexPattern = /^#[0-9a-fA-F]{6}$/;
const lightForeground = "oklch(0.987 0.022 95.277)";
const darkForeground = "oklch(0.141 0.005 285.823)";

export const defaultTheme: Theme = createTheme("orange", "oklch(0.555 0.163 48.998)");

export const themeTemplates: readonly ThemeTemplate[] = [
  createThemeTemplate("orange", "オレンジ", "現在の標準色", "oklch(0.555 0.163 48.998)"),
  createThemeTemplate("blue", "ブルー", "落ち着いた運用色", "oklch(0.546 0.175 252.58)"),
  createThemeTemplate("green", "グリーン", "状態確認に馴染む色", "oklch(0.541 0.145 158.64)"),
  createThemeTemplate("rose", "ローズ", "柔らかい強調色", "oklch(0.586 0.187 12.73)"),
  createThemeTemplate("neutral", "ニュートラル", "控えめな管理画面色", "oklch(0.442 0.017 285.786)"),
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
    ["--primary", theme?.primary ?? null],
    ["--primary-foreground", theme?.primaryForeground ?? null],
    ["--sidebar-primary", theme?.sidebarPrimary ?? null],
    ["--sidebar-primary-foreground", theme?.sidebarPrimaryForeground ?? null],
    ["--ring", theme?.primary ?? null],
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
  return relativeLuminance(oklchToRgb(primary)) > 0.38 ? darkForeground : lightForeground;
}

function relativeLuminance(rgb: RgbColor): number {
  const r = toLinearRgbChannel(rgb.r);
  const g = toLinearRgbChannel(rgb.g);
  const b = toLinearRgbChannel(rgb.b);
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
