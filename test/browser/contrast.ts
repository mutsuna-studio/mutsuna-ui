/** Resolve browser-supported CSS colors before applying the WCAG contrast formula. */
export function contrastRatio(foreground: string, background: string): number {
  if (!CSS.supports("color", foreground) || !CSS.supports("color", background)) throw new Error("Expected browser-supported colors");
  const context = document.createElement("canvas").getContext("2d")!;
  const read = (color: string, base?: string) => {
    context.clearRect(0, 0, 1, 1);
    if (base) { context.fillStyle = base; context.fillRect(0, 0, 1, 1); }
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = Array.from(context.getImageData(0, 0, 1, 1).data).map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return .2126 * r + .7152 * g + .0722 * b;
  };
  const a = read(foreground, background), b = read(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
