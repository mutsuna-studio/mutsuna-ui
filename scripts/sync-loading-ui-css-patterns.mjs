import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(packageRoot, "scripts/loading-ui-css-patterns.json");
const lockPath = join(packageRoot, "scripts/loading-ui-css-patterns.lock.json");
const outputDirectory = join(packageRoot, "src/lib/loading");
const changesetPath = join(packageRoot, ".changeset/sync-loading-ui-css-patterns.md");

const manualPatterns = [
  {
    adapter: "manual-svelte-v1",
    name: "morphing-infinity",
    componentName: "LoadingMorphingInfinity",
    equalWidth: true,
  },
];

const forbiddenSourcePatterns = [
  /(?:from|import\()\s*["'](?:motion|motion\/|framer-motion)/,
  /\buse(?:State|Effect|Memo|Ref|Callback|LayoutEffect)\b/,
  /\b(?:window|document|requestAnimationFrame|setInterval)\b/,
  /\bon[A-Z][A-Za-z]+\s*=/,
  /\bref\s*=/,
];

const staticPatternSpecs = {
  classic: {
    markers: ["loading-ui-classic-fade", "index * 30"],
    body: '<span aria-hidden="true" class="relative top-1/2 left-1/2 block size-full">\n  {#each Array.from({ length: 12 }, (_, index) => index) as index (index)}\n    <span class="loading-ui-motion loading-ui-classic-item absolute top-[-3.9%] left-[-10%] block h-[8%] w-[24%] rounded-(--radius) bg-current" style:transform={`rotate(${index * 30}deg) translate(146%)`} style:animation-delay={`calc(var(--duration, 1.2s) / 12 * ${index - 12})`}></span>\n  {/each}\n</span>',
    styles: ".loading-ui-classic-item { animation: loading-ui-classic-fade var(--duration, 1.2s) linear infinite; }",
  },
  arc: {
    markers: ["loading-ui-arc-spin", "border-t-current"],
    body: '<span aria-hidden="true" class="loading-ui-motion size-full rounded-full border-[5px] border-current/10 border-t-current"></span>',
    styles: ".loading-ui-motion { animation: loading-ui-arc-spin var(--duration, 1s) linear infinite; }",
  },
  "dual-arc": {
    markers: ["loading-ui-dual-arc-spin", "border-y-current"],
    body: '<span aria-hidden="true" class="loading-ui-motion size-full rounded-full border-[5px] border-transparent border-y-current"></span>',
    styles: ".loading-ui-motion { animation: loading-ui-dual-arc-spin var(--duration, 1s) linear infinite; }",
  },
  diamond: {
    markers: ["spin-pixel", 'className="pixel-8"'],
    cssOverride: "@keyframes loading-ui-diamond-spin { 0% { opacity: 0; } 1% { opacity: 1; } 100% { opacity: 0; } }",
    body: `<svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" class="size-full">
  <rect class="loading-ui-motion loading-ui-diamond-pixel" x="8" y="0" width="4" height="4"></rect>
  <rect class="loading-ui-motion loading-ui-diamond-pixel" x="12" y="4" width="4" height="4"></rect>
  <rect class="loading-ui-motion loading-ui-diamond-pixel" x="16" y="8" width="4" height="4"></rect>
  <rect class="loading-ui-motion loading-ui-diamond-pixel" x="12" y="12" width="4" height="4"></rect>
  <rect class="loading-ui-motion loading-ui-diamond-pixel" x="8" y="16" width="4" height="4"></rect>
  <rect class="loading-ui-motion loading-ui-diamond-pixel" x="4" y="12" width="4" height="4"></rect>
  <rect class="loading-ui-motion loading-ui-diamond-pixel" x="0" y="8" width="4" height="4"></rect>
  <rect class="loading-ui-motion loading-ui-diamond-pixel" x="4" y="4" width="4" height="4"></rect>
</svg>`,
    styles: `.loading-ui-diamond-pixel { animation: loading-ui-diamond-spin 0.8s ease-in-out infinite; }
.loading-ui-diamond-pixel:nth-child(2) { animation-delay: 0.1s; }
.loading-ui-diamond-pixel:nth-child(3) { animation-delay: 0.2s; }
.loading-ui-diamond-pixel:nth-child(4) { animation-delay: 0.3s; }
.loading-ui-diamond-pixel:nth-child(5) { animation-delay: 0.4s; }
.loading-ui-diamond-pixel:nth-child(6) { animation-delay: 0.5s; }
.loading-ui-diamond-pixel:nth-child(7) { animation-delay: 0.6s; }
.loading-ui-diamond-pixel:nth-child(8) { animation-delay: 0.7s; }`,
  },
  pulse: {
    markers: ["loading-ui-thin-pulse", "border-2 border-current"],
    body: '<span aria-hidden="true" class="loading-ui-motion absolute inset-0 rounded-full border-2 border-current"></span>',
    styles: ".loading-ui-motion { animation: loading-ui-thin-pulse var(--duration, 1.5s) ease-in-out infinite; }",
  },
  "pulse-dot": {
    markers: ["loading-ui-pulse-dot", "rounded-full bg-current"],
    body: '<span aria-hidden="true" class="loading-ui-motion size-full rounded-full bg-current"></span>',
    styles: ".loading-ui-motion { animation: loading-ui-pulse-dot var(--duration, 1.2s) ease-in-out infinite; }",
  },
  "concentric-ring": {
    markers: ["loading-ui-concentric-ring-rotation", 'width: "83.333%"'],
    body: `<span aria-hidden="true" class="loading-ui-motion relative block size-full">
  <span class="absolute inset-0 rounded-full border-2 border-current opacity-25"></span>
  <span class="absolute top-1/2 left-1/2 size-5/6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-transparent border-b-current"></span>
</span>`,
    styles: ".loading-ui-motion { animation: loading-ui-concentric-ring-rotation var(--duration, 1s) linear infinite; }",
  },
  "orbit-ring": {
    markers: ["loading-ui-orbit-ring-rotation", 'width: "116.667%"'],
    body: `<span aria-hidden="true" class="loading-ui-motion relative block size-full">
  <span class="absolute inset-0 rounded-full border-2 border-current opacity-25"></span>
  <span class="absolute top-1/2 left-1/2 size-7/6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-transparent border-b-current"></span>
</span>`,
    styles: ".loading-ui-motion { animation: loading-ui-orbit-ring-rotation var(--duration, 1s) linear infinite; }",
  },
  "satellite-ring": {
    markers: ["loading-ui-satellite-ring-rotation", 'width: "33.333%"'],
    body: `<span aria-hidden="true" class="loading-ui-motion relative block size-full rounded-full border-2 border-current/25">
  <span class="absolute top-0 left-0 size-1/3 -translate-x-1/2 translate-y-1/2 rounded-full bg-current"></span>
</span>`,
    styles: ".loading-ui-motion { animation: loading-ui-satellite-ring-rotation var(--duration, 1.5s) linear infinite; }",
  },
  "clock-ring": {
    markers: ["loading-ui-clock-ring-rotation", 'height: "50%"'],
    body: `<span aria-hidden="true" class="loading-ui-motion relative block size-full rounded-full border-2 border-current">
  <span class="absolute top-0 left-1/2 h-1/2 w-[6.25%] -translate-x-1/2 bg-current"></span>
</span>`,
    styles: ".loading-ui-motion { animation: loading-ui-clock-ring-rotation var(--duration, 1.5s) linear infinite; }",
  },
  "quarter-ring": {
    markers: ["loading-ui-quarter-ring-rotation", "border-r-transparent"],
    body: '<span aria-hidden="true" class="loading-ui-motion size-full rounded-full border-t-[3px] border-r-[3px] border-t-current border-r-transparent"></span>',
    styles: ".loading-ui-motion { animation: loading-ui-quarter-ring-rotation var(--duration, 1s) linear infinite; }",
  },
  "twin-orbit": {
    markers: ["loading-ui-twin-orbit-rotate", "translate(155%)"],
    body: `<span aria-hidden="true" class="relative block size-[28%] rounded-full bg-current">
  <span class="loading-ui-motion absolute inset-0 rounded-full bg-current"></span>
  <span class="loading-ui-motion loading-ui-motion-delayed absolute inset-0 rounded-full bg-current"></span>
</span>`,
    styles: `.loading-ui-motion { animation: loading-ui-twin-orbit-rotate var(--duration, 1s) ease infinite; transform: rotate(0deg) translate(155%); }
.loading-ui-motion-delayed { animation-delay: calc(var(--duration, 1s) / 2); }`,
  },
  "triple-dot-spinner": {
    markers: ["loading-ui-triple-dot-rotation", "-translate-x-[200%]"],
    body: `<span aria-hidden="true" class="loading-ui-motion relative block size-[18%] rounded-full bg-current">
  <span class="absolute top-1/2 left-1/2 size-full -translate-x-[200%] -translate-y-1/2 rounded-full bg-current"></span>
  <span class="absolute top-1/2 left-1/2 size-full translate-x-full -translate-y-1/2 rounded-full bg-current"></span>
</span>`,
    styles: ".loading-ui-motion { animation: loading-ui-triple-dot-rotation var(--duration, 2s) ease-in-out infinite; }",
  },
  terminal: {
    markers: ["loading-ui-terminal-blink", "font-mono"],
    body: `<span aria-hidden="true" class="font-mono">&gt;</span>
<span aria-hidden="true" class="loading-ui-motion inline-block h-[1em] w-[0.5em] bg-current"></span>`,
    styles: ".loading-ui-motion { animation: loading-ui-terminal-blink var(--duration, 1s) step-end infinite; }",
    square: false,
    rootClass: "inline-flex items-center justify-center gap-[0.25em]",
  },
  ring: {
    markers: ["loading-ui-ring-spin", 'viewBox="0 0 24 24"'],
    body: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="loading-ui-motion size-full">
  <path d="M21 12.0004C20.9999 13.901 20.3981 15.7528 19.2809 17.2904C18.1637 18.8279 16.5885 19.9723 14.7809 20.5596C12.9733 21.1469 11.0262 21.1468 9.21864 20.5594C7.41109 19.9721 5.83588 18.8276 4.71876 17.29C3.60165 15.7523 2.99999 13.9005 3 11.9999C3.00001 10.0993 3.60171 8.24755 4.71884 6.70994C5.83598 5.17233 7.4112 4.02785 9.21877 3.44052C11.0263 2.85319 12.9734 2.85316 14.781 3.44044" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
</svg>`,
    styles: ".loading-ui-motion { animation: loading-ui-ring-spin var(--duration, 1s) linear infinite; }",
  },
  spokes: {
    markers: ["loading-ui-spokes-spin", "M12 2V6"],
    body: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="loading-ui-motion size-full">
  <path d="M12 2V6M16.2 7.8L19.1 4.9M18 12H22M16.2 16.2L19.1 19.1M12 18V22M4.9 19.1L7.8 16.2M2 12H6M4.9 4.9L7.8 7.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
</svg>`,
    styles: ".loading-ui-motion { animation: loading-ui-spokes-spin var(--duration, 1s) linear infinite; }",
  },
  swirling: {
    markers: ["loading-ui-swirling-dash", "loading-ui-swirling-circle"],
    body: `<svg aria-hidden="true" viewBox="0 0 800 800" class="size-full">
  <circle class="loading-ui-motion loading-ui-swirling-circle" cx="400" cy="400" r="200" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="50"></circle>
</svg>`,
    styles: "",
  },
  infinity: {
    markers: ["loading-ui-infinity-dash", "205.271142578125"],
    body: `<svg aria-hidden="true" viewBox="0 0 100 100" fill="none" class="size-full">
  <path class="loading-ui-motion" d="M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-dasharray="205.271142578125 51.317785644531256"></path>
</svg>`,
    styles: ".loading-ui-motion { animation: loading-ui-infinity-dash var(--duration, 2s) linear infinite; transform: scale(0.8); transform-origin: 50px 50px; }",
  },
  wave: {
    markers: ["loading-ui-wave", "WAVE_BAR_HEIGHTS"],
    body: `<span aria-hidden="true" class="loading-ui-wave-bar h-1/2"></span>
<span aria-hidden="true" class="loading-ui-wave-bar h-3/4"></span>
<span aria-hidden="true" class="loading-ui-wave-bar h-full"></span>
<span aria-hidden="true" class="loading-ui-wave-bar h-3/4"></span>
<span aria-hidden="true" class="loading-ui-wave-bar h-1/2"></span>`,
    styles: `.loading-ui-wave-bar { width: 12.5%; border-radius: 9999px; background: currentColor; animation: loading-ui-wave var(--duration, 1s) ease-in-out infinite; }
.loading-ui-wave-bar:nth-child(2) { animation-delay: calc(var(--delay, 100ms) * 1); }
.loading-ui-wave-bar:nth-child(3) { animation-delay: calc(var(--delay, 100ms) * 2); }
.loading-ui-wave-bar:nth-child(4) { animation-delay: calc(var(--delay, 100ms) * 3); }
.loading-ui-wave-bar:nth-child(5) { animation-delay: calc(var(--delay, 100ms) * 4); }`,
    square: false,
    rootClass: "inline-flex items-center justify-center gap-[2.5%]",
  },
};

function sha256(source) {
  return createHash("sha256").update(source).digest("hex");
}

function pascalCase(value) {
  return value.split("-").map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join("");
}

function extractAnimationCss(source) {
  return source.match(/<style>\s*\{?`([\s\S]*?)`\}?\s*<\/style>/)?.[1]?.trim() ?? null;
}

function isSafeAnimationCss(css) {
  return (
    /^@keyframes\s+loading-ui-[a-z0-9-]+\s*\{/.test(css.trim()) &&
    !/@(?:import|font-face|supports|media|layer|property|namespace|page|charset)|url\s*\(|expression\s*\(|<\/style/i.test(css)
  );
}

function indent(value, spaces) {
  const prefix = " ".repeat(spaces);
  const lines = value.trim().split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const commonIndent = Math.min(...nonEmptyLines.map((line) => line.match(/^\s*/)[0].length));
  return lines
    .map((line) => line.slice(Math.min(commonIndent, line.length)))
    .map((line) => `${prefix}${line.trimEnd()}`)
    .join("\n");
}

export function classifyCssOnlyCandidate(item, source) {
  if (item.type !== "registry:component" || item.files?.length !== 1) {
    return { eligible: false, reason: "not-a-single-component" };
  }

  if ((item.dependencies ?? []).length > 0 || (item.registryDependencies ?? []).some((dependency) => dependency !== "utils")) {
    return { eligible: false, reason: "runtime-dependency" };
  }

  const forbiddenPattern = forbiddenSourcePatterns.find((pattern) => pattern.test(source));
  if (forbiddenPattern) {
    return { eligible: false, reason: "runtime-behavior" };
  }

  const imports = [...source.matchAll(/^import\s+.+$/gm)].map(([statement]) => statement.trim());
  if (imports.some((statement) => statement !== 'import { cn } from "@/lib/utils";')) {
    return { eligible: false, reason: "unsupported-import" };
  }

  if (!source.includes("<style>") || !source.includes("@keyframes")) {
    return { eligible: false, reason: "missing-css-animation" };
  }

  return { eligible: true, reason: "css-only" };
}

export function parseRepeatingIndicator(name, source) {
  const componentName = source.match(/function\s+([A-Z][A-Za-z0-9]*)\s*\(/)?.[1];
  const countProp = source.match(/className,\s*([a-z][A-Za-z0-9]*)\s*=\s*(\d+)/s);
  const css = source.match(/<style>\{`([\s\S]*?)`\}<\/style>/)?.[1];
  const rootClass = source.match(/role="status"[\s\S]*?className=\{cn\(\s*"([^"]+)"/)?.[1];
  const animation = source.match(/animation:\s*(?:\n\s*)?"([^"]+)"/)?.[1];
  const animationDelay = source.match(/animationDelay:\s*`([^`]+)`/)?.[1];

  if (!componentName || !countProp || !css || !rootClass || !animation || !animationDelay) {
    return null;
  }

  if (
    !isSafeAnimationCss(css) ||
    /[;{}]/.test(animation) ||
    /[;{}]/.test(animationDelay.replace("${index}", "")) ||
    /(?:url|content-|before:|after:)/i.test(`${rootClass} ${source.match(/className="([^"]+)"/)?.[1] ?? ""}`)
  ) {
    return null;
  }

  const [, upstreamCountProp, defaultCountText] = countProp;
  if (!source.includes(`React.ComponentProps<"span"> & { ${upstreamCountProp}?: number }`)) {
    return null;
  }

  const loopMarker = `Array.from({ length: ${upstreamCountProp} }, (_, index) => (`;
  const loopStart = source.indexOf(loopMarker);
  if (loopStart === -1 || source.indexOf("Array.from(", loopStart + loopMarker.length) !== -1) {
    return null;
  }

  const loopSource = source.slice(loopStart);
  const itemClass = loopSource.match(/className="([^"]+)"/)?.[1];
  if (!itemClass || !loopSource.includes('aria-hidden="true"')) {
    return null;
  }

  if (/\bconst\s+|\bMath\.|\.(?:map|filter|reduce)\(/.test(source.slice(source.indexOf(") {", source.indexOf("function")) + 3, source.indexOf("return (")))) {
    return null;
  }

  return {
    adapter: "repeating-indicator-v1",
    name,
    componentName: `Loading${componentName}`,
    defaultCount: Number(defaultCountText),
    rootClass,
    itemClass,
    animation,
    animationDelay: animationDelay.replace("${index}", "var(--loading-index)"),
    css: css.trim(),
    equalWidth: new RegExp(`width:\\s*\u0060\\$\\{100 / ${upstreamCountProp}\\}%\u0060`).test(loopSource),
  };
}

export function parseStaticIndicator(name, source) {
  const spec = staticPatternSpecs[name];
  if (!spec || !spec.markers.every((marker) => source.includes(marker))) return null;
  const css = spec.cssOverride ?? extractAnimationCss(source);
  if (!css || !isSafeAnimationCss(css)) return null;

  return {
    adapter: "static-indicator-v1",
    name,
    componentName: `Loading${pascalCase(name)}`,
    css,
    body: spec.body,
    styles: spec.styles,
    equalWidth: spec.square !== false,
    rootClass: spec.rootClass ?? "relative inline-flex items-center justify-center",
  };
}

function defaultSizeClass(pattern) {
  return pattern.equalWidth ? "size-6" : "h-2 w-8";
}

export function renderPatternComponent(pattern) {
  const typeName = `${pattern.componentName}Props`;
  const itemWidth = pattern.equalWidth ? `; width: \${100 / safeCount}%` : "";

  return `<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type ${typeName} = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  count?: number;
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  count = ${pattern.defaultCount},
  label = "読み込み中",
  ...restProps
}: ${typeName} = $props();

const safeCount = $derived(Number.isFinite(count) ? Math.max(1, Math.floor(count)) : ${pattern.defaultCount});
const itemIndexes = $derived(Array.from({ length: safeCount }, (_, index) => index));

function itemStyle(index: number): string {
  return \`--loading-index: \${index}${itemWidth}\`;
}
</script>

<!-- Adapted from Loading UI (${pattern.name}), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-${pattern.name}"
  class={cn("${defaultSizeClass(pattern)}", "${pattern.rootClass}", className)}
>
  {#each itemIndexes as index (index)}
    <span
      aria-hidden="true"
      data-slot="loading-item"
      class={cn("loading-ui-item", "${pattern.itemClass}")}
      style={itemStyle(index)}
    ></span>
  {/each}
</span>

<style>
${indent(pattern.css, 0)}

  .loading-ui-item {
    animation: ${pattern.animation};
    animation-delay: ${pattern.animationDelay};
  }

  @media (prefers-reduced-motion: reduce) {
    .loading-ui-item {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
`;
}

export function renderStaticPatternComponent(pattern) {
  const typeName = `${pattern.componentName}Props`;
  const componentStyles = pattern.styles ? `${indent(pattern.styles, 2)}\n\n` : "";
  return `<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef, type WithoutChildren } from "../utils.js";

export type ${typeName} = WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & {
  label?: string;
};

let {
  ref = $bindable(null),
  class: className,
  label = "読み込み中",
  ...restProps
}: ${typeName} = $props();
</script>

<!-- Adapted from Loading UI (${pattern.name}), MIT License. -->
<span
  bind:this={ref}
  {...restProps}
  role="status"
  aria-label={label}
  data-slot="loading-${pattern.name}"
  class={cn("${defaultSizeClass(pattern)}", "${pattern.rootClass}", className)}
>
${indent(pattern.body, 2)}
</span>

<style>
${indent(pattern.css, 0)}

${componentStyles}
  @media (prefers-reduced-motion: reduce) {
    .loading-ui-motion,
    .loading-ui-wave-bar {
      animation: none;
      opacity: 0.65;
    }
  }
</style>
`;
}

function renderLoadingComponent(patterns) {
  const imports = patterns.map((pattern) => `import ${pattern.componentName} from "./loading-${pattern.name}.svelte";`).join("\n");
  const branches = patterns
    .map(
      (pattern, index) => `${index === 0 ? "{#if" : "{:else if"} variant === "${pattern.name}"}
  <${pattern.componentName}${pattern.adapter === "repeating-indicator-v1" ? " {count}" : ""} {label} class={cn(sizeClasses[variant][size], className)} {...restProps} />`,
    )
    .join("\n");
  const sizeClassEntries = patterns
    .map((pattern) => {
      const sizes = pattern.equalWidth
        ? '{ sm: "size-4", md: "size-6", lg: "size-8" }'
        : '{ sm: "h-1.5 w-6", md: "h-2 w-8", lg: "h-3 w-12" }';
      return `  "${pattern.name}": ${sizes},`;
    })
    .join("\n");

  return `<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithoutChildren } from "../utils.js";
import type { LoadingVariant } from "./loading-variants.js";
${imports}

export type { LoadingVariant } from "./loading-variants.js";
export type LoadingSize = "sm" | "md" | "lg";
export type LoadingProps = WithoutChildren<HTMLAttributes<HTMLSpanElement>> & {
  variant?: LoadingVariant;
  size?: LoadingSize;
  count?: number;
  label?: string;
};

let {
  variant = "dots",
  size = "md",
  count,
  label = "読み込み中",
  class: className,
  ...restProps
}: LoadingProps = $props();

const sizeClasses: Record<LoadingVariant, Record<LoadingSize, string>> = {
${sizeClassEntries}
};
</script>

${branches}
{/if}
`;
}

function renderLoadingVariants(patterns) {
  return `export const loadingVariants = [${patterns.map((pattern) => `"${pattern.name}"`).join(", ")}] as const;

export type LoadingVariant = (typeof loadingVariants)[number];
`;
}

function renderIndex(patterns) {
  const imports = patterns.map((pattern) => `import ${pattern.componentName} from "./loading-${pattern.name}.svelte";`).join("\n");
  const typeExports = patterns.map((pattern) => `export type { ${pattern.componentName}Props } from "./loading-${pattern.name}.svelte";`).join("\n");
  const names = patterns.map((pattern) => `  ${pattern.componentName},`).join("\n");

  return `import Loading from "./loading.svelte";
import { loadingVariants } from "./loading-variants.js";
${imports}

export type { LoadingProps, LoadingSize } from "./loading.svelte";
export type { LoadingVariant } from "./loading-variants.js";
${typeExports}

export {
  Loading,
  Loading as Root,
  loadingVariants,
${names}
};
`;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "mutsuna-ui-loading-sync" } });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function writeIfChanged(path, contents) {
  let current = null;
  try {
    current = await readFile(path, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  if (current === contents) return false;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents);
  return true;
}

async function resolveCommit(repository, ref) {
  const response = await fetch(`https://api.github.com/repos/${repository}/commits/${ref}`, {
    headers: { accept: "application/vnd.github+json", "user-agent": "mutsuna-ui-loading-sync" },
  });
  if (!response.ok) {
    throw new Error(`Failed to resolve ${repository}@${ref}: ${response.status} ${response.statusText}`);
  }
  return (await response.json()).sha;
}

export async function syncLoadingUi({ createChangeset = false } = {}) {
  const config = await readJson(configPath);
  const previousLock = await readJson(lockPath).catch(() => ({ generated: {} }));
  const commit = await resolveCommit(config.repository, config.ref);
  const rawBase = `https://raw.githubusercontent.com/${config.repository}/${commit}`;
  const registry = JSON.parse(await fetchText(`${rawBase}/registry.json`));
  const componentItems = registry.items.filter((item) => item.type === "registry:component" && item.files?.length === 1);
  const inspected = await Promise.all(
    componentItems.map(async (item) => {
      const source = await fetchText(`${rawBase}/${item.files[0].path}`);
      const classification = classifyCssOnlyCandidate(item, source);
      const pattern = classification.eligible
        ? parseRepeatingIndicator(item.name, source) ?? parseStaticIndicator(item.name, source)
        : null;
      return { item, source, classification, pattern };
    }),
  );

  const preferredOrder = new Map(["dots", "bars", "bouncing-dots", "typing"].map((name, index) => [name, index]));
  const generatedPatterns = inspected
    .filter(({ pattern }) => pattern !== null)
    .map(({ pattern }) => pattern)
    .sort((left, right) => (preferredOrder.get(left.name) ?? 100) - (preferredOrder.get(right.name) ?? 100) || left.name.localeCompare(right.name));

  const patterns = [...generatedPatterns, ...manualPatterns]
    .sort((left, right) => (preferredOrder.get(left.name) ?? 100) - (preferredOrder.get(right.name) ?? 100) || left.name.localeCompare(right.name));

  if (generatedPatterns.length === 0) {
    throw new Error("Loading UI contained no source compatible with the repeating indicator adapter.");
  }

  const generatedNames = new Set(generatedPatterns.map((pattern) => pattern.name));
  const removedPatterns = Object.keys(previousLock.generated ?? {}).filter((name) => !generatedNames.has(name));
  if (removedPatterns.length > 0) {
    throw new Error(`Previously generated patterns became unsupported: ${removedPatterns.join(", ")}`);
  }

  const changedFiles = [];
  await mkdir(outputDirectory, { recursive: true });
  for (const pattern of generatedPatterns) {
    const path = join(outputDirectory, `loading-${pattern.name}.svelte`);
    const component = pattern.adapter === "repeating-indicator-v1"
      ? renderPatternComponent(pattern)
      : renderStaticPatternComponent(pattern);
    if (await writeIfChanged(path, component)) changedFiles.push(path);
  }

  const loadingPath = join(outputDirectory, "loading.svelte");
  if (await writeIfChanged(loadingPath, renderLoadingComponent(patterns))) changedFiles.push(loadingPath);
  const variantsPath = join(outputDirectory, "loading-variants.ts");
  if (await writeIfChanged(variantsPath, renderLoadingVariants(patterns))) changedFiles.push(variantsPath);
  const indexPath = join(outputDirectory, "index.ts");
  if (await writeIfChanged(indexPath, renderIndex(patterns))) changedFiles.push(indexPath);

  const lock = {
    repository: config.repository,
    ref: config.ref,
    adapter: config.adapter,
    cssOnlyCandidates: inspected.filter(({ classification }) => classification.eligible).map(({ item }) => item.name).sort(),
    generated: Object.fromEntries(
      inspected
        .filter(({ pattern }) => pattern !== null)
        .map(({ item, source, pattern }) => [item.name, { adapter: pattern.adapter, sourceSha256: sha256(source) }])
        .sort(([left], [right]) => left.localeCompare(right)),
    ),
    manual: Object.fromEntries(
      manualPatterns.map((pattern) => {
        const upstream = inspected.find(({ item }) => item.name === pattern.name);
        return [
          pattern.name,
          {
            adapter: pattern.adapter,
            ...(upstream ? { sourceSha256: sha256(upstream.source) } : {}),
          },
        ];
      }),
    ),
    skipped: Object.fromEntries(
      inspected
        .filter(({ classification, pattern }) => classification.eligible && pattern === null)
        .map(({ item }) => [item.name, "unsupported-source-shape"])
        .sort(([left], [right]) => left.localeCompare(right)),
    ),
  };
  if (await writeIfChanged(lockPath, `${JSON.stringify(lock, null, 2)}\n`)) changedFiles.push(lockPath);

  const previousNames = new Set(Object.keys(previousLock.generated ?? {}));
  const addedPatterns = generatedPatterns.filter((pattern) => !previousNames.has(pattern.name)).map((pattern) => pattern.name);
  const componentChanged = changedFiles.some((path) => dirname(path) === outputDirectory);
  if (createChangeset && componentChanged) {
    const releaseType = addedPatterns.length > 0 ? "minor" : "patch";
    const summary = addedPatterns.length > 0
      ? `Loading UIからCSS-only loading pattern（${addedPatterns.join("、")}）を同期します。`
      : "Loading UI由来のCSS-only loading patternを上流へ同期します。";
    await writeIfChanged(changesetPath, `---\n"@mutsuna/ui": ${releaseType}\n---\n\n${summary}\n`);
  }

  return {
    commit,
    generated: generatedPatterns.map((pattern) => pattern.name),
    manual: manualPatterns.map((pattern) => pattern.name),
    skipped: Object.keys(lock.skipped),
    changedFiles: changedFiles.map((path) => basename(path)),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await syncLoadingUi({ createChangeset: process.argv.includes("--changeset") });
  console.log(JSON.stringify(result, null, 2));
}
