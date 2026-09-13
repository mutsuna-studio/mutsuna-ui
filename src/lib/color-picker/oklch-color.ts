export type OklchColor = {
  readonly lightness: number;
  readonly chroma: number;
  readonly hue: number;
  readonly value: string;
};

export type OklchColorParseResult = { readonly ok: true; readonly color: OklchColor } | { readonly ok: false; readonly error: string };

const oklchPattern = /^oklch\(\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))%\s+([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s+([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*\)$/i;

export function parseOklchColor(value: string): OklchColorParseResult {
  const match = oklchPattern.exec(value.trim());
  if (match === null) return { ok: false, error: "OKLCH形式で入力してください。例: oklch(62% 0.14 250)" };

  const lightness = Number(match[1]);
  const chroma = Number(match[2]);
  const hue = Number(match[3]);

  if (lightness < 0 || lightness > 100) return { ok: false, error: "明度は0から100の範囲で入力してください。" };
  if (chroma < 0 || chroma > 0.4) return { ok: false, error: "彩度は0から0.4の範囲で入力してください。" };
  if (hue < 0 || hue > 360) return { ok: false, error: "色相は0から360の範囲で入力してください。" };

  return { ok: true, color: { lightness, chroma, hue, value: formatOklchColor({ lightness, chroma, hue }) } };
}

export function formatOklchColor(input: Omit<OklchColor, "value">): string {
  return `oklch(${formatNumber(input.lightness)}% ${formatNumber(input.chroma)} ${formatNumber(input.hue)})`;
}

function formatNumber(value: number): string {
  return Number(value.toFixed(4)).toString();
}
