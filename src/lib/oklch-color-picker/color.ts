export const colorFormats = ["hex", "rgb", "hsl", "oklch"] as const;

export type ColorFormat = (typeof colorFormats)[number];
export type RgbColor = { readonly r: number; readonly g: number; readonly b: number };
export type HsvColor = { readonly h: number; readonly s: number; readonly v: number };
export type ParsedColor = { readonly rgb: RgbColor; readonly format: ColorFormat };

const hexPattern = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const rgbPattern = /^rgb\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*\)$/i;
const hslPattern = /^hsl\(\s*([+-]?\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)%\s*[, ]\s*(\d+(?:\.\d+)?)%\s*\)$/i;
const oklchPattern = /^oklch\(\s*([+-]?\d+(?:\.\d+)?)(%)?\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s*\)$/i;

export function parseColor(value: string): ParsedColor | null {
  const source = value.trim();
  const hex = hexPattern.exec(source);
  if (hex) {
    const digits = hex[1]!.length === 3 ? [...hex[1]!].map((digit) => digit.repeat(2)).join("") : hex[1]!;
    return { format: "hex", rgb: { r: Number.parseInt(digits.slice(0, 2), 16), g: Number.parseInt(digits.slice(2, 4), 16), b: Number.parseInt(digits.slice(4, 6), 16) } };
  }

  const rgb = rgbPattern.exec(source);
  if (rgb) {
    const color = { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
    if (Object.values(color).every((channel) => channel >= 0 && channel <= 255)) return { format: "rgb", rgb: color };
  }

  const hsl = hslPattern.exec(source);
  if (hsl) {
    const h = normalizeHue(Number(hsl[1]));
    const s = Number(hsl[2]);
    const l = Number(hsl[3]);
    if (s >= 0 && s <= 100 && l >= 0 && l <= 100) return { format: "hsl", rgb: hslToRgb(h, s, l) };
  }

  const oklch = oklchPattern.exec(source);
  if (oklch) {
    const l = Number(oklch[1]) / (oklch[2] ? 100 : 1);
    const c = Number(oklch[3]);
    const h = Number(oklch[4]);
    if (l >= 0 && l <= 1 && c >= 0 && c <= 0.4 && h >= 0 && h <= 360) return { format: "oklch", rgb: oklchToRgb(l, c, h) };
  }
  return null;
}

export function formatColor(rgb: RgbColor, format: ColorFormat): string {
  const safe = clampRgb(rgb);
  if (format === "hex") return `#${toHex(safe.r)}${toHex(safe.g)}${toHex(safe.b)}`.toUpperCase();
  if (format === "rgb") return `rgb(${safe.r}, ${safe.g}, ${safe.b})`;
  if (format === "hsl") {
    const { h, s, l } = rgbToHsl(safe);
    return `hsl(${round(h, 1)} ${round(s, 1)}% ${round(l, 1)}%)`;
  }
  const { l, c, h } = rgbToOklch(safe);
  return `oklch(${round(l * 100, 1)}% ${round(c, 3)} ${round(h, 1)})`;
}

export function rgbToHsv(rgb: RgbColor): HsvColor {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
  }
  return { h: normalizeHue(h), s: max === 0 ? 0 : (delta / max) * 100, v: max * 100 };
}

export function hsvToRgb(hsv: HsvColor): RgbColor {
  const c = (hsv.v / 100) * (hsv.s / 100);
  const x = c * (1 - Math.abs(((normalizeHue(hsv.h) / 60) % 2) - 1));
  const m = hsv.v / 100 - c;
  const [r, g, b] = hsv.h < 60 ? [c, x, 0] : hsv.h < 120 ? [x, c, 0] : hsv.h < 180 ? [0, c, x] : hsv.h < 240 ? [0, x, c] : hsv.h < 300 ? [x, 0, c] : [c, 0, x];
  return clampRgb({ r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 });
}

function rgbToHsl(rgb: RgbColor): { h: number; s: number; l: number } {
  const hsv = rgbToHsv(rgb), value = hsv.v / 100, saturation = hsv.s / 100;
  const l = value * (1 - saturation / 2);
  const s = l === 0 || l === 1 ? 0 : (value - l) / Math.min(l, 1 - l);
  return { h: hsv.h, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): RgbColor {
  const lightness = l / 100, saturation = s / 100;
  const value = lightness + saturation * Math.min(lightness, 1 - lightness);
  return hsvToRgb({ h, s: value === 0 ? 0 : 200 * (1 - lightness / value), v: value * 100 });
}

function rgbToOklch(rgb: RgbColor): { l: number; c: number; h: number } {
  const r = linear(rgb.r / 255), g = linear(rgb.g / 255), b = linear(rgb.b / 255);
  const ll = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const ss = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const l = 0.2104542553 * ll + 0.793617785 * mm - 0.0040720468 * ss;
  const a = 1.9779984951 * ll - 2.428592205 * mm + 0.4505937099 * ss;
  const axisB = 0.0259040371 * ll + 0.7827717662 * mm - 0.808675766 * ss;
  const c = Math.hypot(a, axisB);
  return { l, c, h: c < 0.0001 ? 0 : normalizeHue(Math.atan2(axisB, a) * 180 / Math.PI) };
}

function oklchToRgb(l: number, c: number, h: number): RgbColor {
  const radians = h * Math.PI / 180, a = c * Math.cos(radians), b = c * Math.sin(radians);
  const ll = l + 0.3963377774 * a + 0.2158037573 * b;
  const mm = l - 0.1055613458 * a - 0.0638541728 * b;
  const ss = l - 0.0894841775 * a - 1.291485548 * b;
  return clampRgb({
    r: delinear(4.0767416621 * ll ** 3 - 3.3077115913 * mm ** 3 + 0.2309699292 * ss ** 3) * 255,
    g: delinear(-1.2684380046 * ll ** 3 + 2.6097574011 * mm ** 3 - 0.3413193965 * ss ** 3) * 255,
    b: delinear(-0.0041960863 * ll ** 3 - 0.7034186147 * mm ** 3 + 1.707614701 * ss ** 3) * 255,
  });
}

function clampRgb(rgb: RgbColor): RgbColor { return { r: Math.round(clamp(rgb.r, 0, 255)), g: Math.round(clamp(rgb.g, 0, 255)), b: Math.round(clamp(rgb.b, 0, 255)) }; }
function linear(value: number): number { return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; }
function delinear(value: number): number { return value <= 0.0031308 ? 12.92 * value : 1.055 * Math.max(value, 0) ** (1 / 2.4) - 0.055; }
function normalizeHue(value: number): number { return ((value % 360) + 360) % 360; }
function clamp(value: number, min: number, max: number): number { return Math.min(Math.max(value, min), max); }
function toHex(value: number): string { return Math.round(value).toString(16).padStart(2, "0"); }
function round(value: number, precision: number): number { return Number(value.toFixed(precision)); }
