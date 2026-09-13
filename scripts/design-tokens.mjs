import { readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));
const aliasPattern = /^\{([^{}]+)\}$/;

// Deliberately a small DTCG 2025.10 subset, not a general DTCG resolver.
export function flattenTokens(group, prefix = "", result = new Map()) {
  for (const [key, value] of Object.entries(group)) {
    if (key.startsWith("$")) continue;
    if (/[.{}]/.test(key) || !value || typeof value !== "object") throw new Error(`Invalid token group: ${prefix}${key}`);
    const path = prefix ? `${prefix}.${key}` : key;
    if ("$value" in value) {
      if (result.has(path)) throw new Error(`Duplicate token: ${path}`);
      result.set(path, value);
    } else flattenTokens(value, path, result);
  }
  return result;
}

export function resolveToken(path, tokens, trail = []) {
  if (trail.includes(path)) throw new Error(`Circular alias: ${[...trail, path].join(" -> ")}`);
  const token = tokens.get(path);
  if (!token) throw new Error(`Unknown token: ${path}`);
  const alias = typeof token.$value === "string" && aliasPattern.exec(token.$value);
  if (!alias) {
    colorOrValueToCss(token); // Validate unused tokens too.
    return token;
  }
  const resolved = resolveToken(alias[1], tokens, [...trail, path]);
  if (token.$type && token.$type !== resolved.$type) throw new Error(`Alias type mismatch: ${path}`);
  return resolved;
}

export function colorOrValueToCss({ $type: type, $value: value }) {
  if (type === "dimension") {
    if (!value || !Number.isFinite(value.value) || !["px", "rem"].includes(value.unit)) throw new Error("Invalid dimension");
    return `${value.value}${value.unit}`;
  }
  if (type === "fontFamily") {
    const families = typeof value === "string" ? [value] : value;
    if (!Array.isArray(families) || !families.length || families.some((family) => typeof family !== "string" || !family.trim())) throw new Error("Invalid fontFamily");
    return families.map((family) => /^[a-zA-Z_-][\w-]*$/.test(family) ? family : JSON.stringify(family)).join(", ");
  }
  if (type !== "color") throw new Error(`Unsupported token type: ${type}`);
  const { colorSpace, components, alpha = 1, hex } = value ?? {};
  if (!["oklch", "srgb", "display-p3"].includes(colorSpace)) throw new Error(`Unsupported color space: ${colorSpace}`);
  if (!Array.isArray(components) || components.length !== 3 || components.some((n) => !Number.isFinite(n))) throw new Error("Invalid color components (numeric subset required)");
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new Error("Invalid alpha");
  if (hex !== undefined && !/^#[\da-fA-F]{6}$/.test(hex)) throw new Error("Invalid hex fallback");
  if (colorSpace === "oklch") {
    if (components[0] < 0 || components[0] > 1 || components[1] < 0 || components[2] < 0 || components[2] > 360) throw new Error("Invalid OKLCH range");
    return `oklch(${components.join(" ")}${alpha === 1 ? "" : ` / ${Number((alpha * 100).toFixed(10))}%`})`;
  }
  if (components.some((n) => n < 0 || n > 1)) throw new Error("Invalid RGB range");
  // Generate from components. The optional hex fallback never overrides them.
  if (colorSpace === "srgb" && alpha === 1 && components.every((n) => Math.abs(n * 255 - Math.round(n * 255)) < 1e-10)) {
    return `#${components.map((n) => Math.round(n * 255).toString(16).padStart(2, "0")).join("")}`;
  }
  return `color(${colorSpace} ${components.join(" ")}${alpha === 1 ? "" : ` / ${alpha}`})`;
}

function semanticCss(group, core) {
  return Object.fromEntries(Object.entries(group).map(([key, token]) => {
    const alias = typeof token.$value === "string" && aliasPattern.exec(token.$value);
    if (!alias) throw new Error(`Semantic token must be an alias: ${key}`);
    const resolved = resolveToken(alias[1], core);
    if (token.$type !== resolved.$type) throw new Error(`Semantic type mismatch: ${key}`);
    return [`--${key}`, colorOrValueToCss(resolved)];
  }));
}

export async function generateTokens({ check = false } = {}) {
  const core = new Map();
  for (const file of (await readdir(resolve(root, "tokens/core"))).filter((name) => name.endsWith(".json")).sort()) {
    flattenTokens(await readJson(`tokens/core/${file}`), "", core);
  }
  for (const path of core.keys()) resolveToken(path, core);
  const catalog = await readJson("tokens/catalog.json");
  if (new Set(catalog.themes.map(({ key }) => key)).size !== catalog.themes.length || !catalog.themes.some(({ key }) => key === catalog.defaultTheme)) throw new Error("Invalid theme catalog");
  const definitions = [];
  for (const metadata of catalog.themes) {
    const { theme } = await readJson(`tokens/themes/${metadata.key}.json`);
    const primary = semanticCss({ primary: theme.primary }, core)["--primary"];
    // The existing Theme.primary API accepts opaque OKLCH with C <= 0.4.
    // Appearance colors are free to use sRGB/P3; seed values must stay compatible.
    const seed = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(primary);
    if (!seed || Number(seed[2]) > 0.4) throw new Error(`Primary seed must satisfy the existing Theme API: ${metadata.key}`);
    const definition = { ...metadata, primary };
    if (theme.light || theme.dark) {
      const light = semanticCss(theme.light, core);
      const dark = semanticCss(theme.dark, core);
      if (JSON.stringify(Object.keys(light).sort()) !== JSON.stringify(Object.keys(dark).sort())) throw new Error(`Mode keys differ: ${metadata.key}`);
      definition.appearance = Object.fromEntries(Object.keys(light).map((name) => {
        const isColor = theme.light[name.slice(2)].$type === "color";
        return [name, isColor ? `light-dark(${light[name]}, ${dark[name]})` : light[name]];
      }));
      for (const name of Object.keys(light)) {
        if (theme.light[name.slice(2)].$type !== "color" && light[name] !== dark[name]) throw new Error(`Mode-dependent non-color is unsupported: ${name}`);
      }
      definition.previewHex = semanticCss({ preview: theme.preview }, core)["--preview"];
      if (!/^#[\da-f]{6}$/.test(definition.previewHex)) throw new Error(`Preview must be an opaque sRGB hex color: ${metadata.key}`);
    }
    definitions.push(definition);
  }
  const contrast = semanticCss((await readJson("tokens/semantic/contrast.json")).contrast, core);
  const contrastColors = Object.fromEntries(Object.entries(contrast).map(([key, value]) => [key.slice(2), value]));
  const ts = `// Generated by pnpm tokens:generate. Edit tokens/*.json instead.\nexport const defaultThemeKey = ${JSON.stringify(catalog.defaultTheme)} as const;\n\nexport const contrastColors = ${JSON.stringify(contrastColors, null, 2)} as const;\n\nexport const themeDefinitions = ${JSON.stringify(definitions, null, 2)} as const;\n`;
  const blocks = [];
  for (const [mode, selector] of [["light", ":root"], ["dark", ".dark"]]) {
    const variables = semanticCss((await readJson(`tokens/semantic/${mode}.json`)).semantic, core);
    blocks.push(`${selector} {\n  color-scheme: ${mode};\n${Object.entries(variables).map(([name, value]) => `  ${name}: ${value};`).join("\n")}\n}`);
  }
  const cssPath = "src/lib/theme.css";
  const cssSource = await readFile(resolve(root, cssPath), "utf8");
  const marker = /\/\* BEGIN GENERATED TOKENS \*\/[\s\S]*?\/\* END GENERATED TOKENS \*\//g;
  if ([...cssSource.matchAll(marker)].length !== 1) throw new Error("Missing or duplicate CSS token markers");
  const css = cssSource.replace(marker, `/* BEGIN GENERATED TOKENS */\n/* Generated by pnpm tokens:generate. Edit tokens/*.json instead. */\n${blocks.join("\n\n")}\n/* END GENERATED TOKENS */`);
  for (const [path, output] of [["src/lib/theme/tokens.generated.ts", ts], [cssPath, css]]) {
    const previous = await readFile(resolve(root, path), "utf8").catch((error) => { if (error.code === "ENOENT") return null; throw error; });
    if (previous === output) continue;
    if (check) throw new Error(`Generated tokens are stale: ${path}. Run pnpm tokens:generate.`);
    await writeFile(resolve(root, path), output);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateTokens({ check: process.argv.includes("--check") });
}
