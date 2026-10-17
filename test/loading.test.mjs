import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import {
  classifyCssOnlyCandidate,
  parseRepeatingIndicator,
  parseStaticIndicator,
  renderPatternComponent,
  renderStaticPatternComponent,
} from "../scripts/sync-loading-ui-css-patterns.mjs";

import { loadingVariants } from "../dist/loading/loading-variants.js";

const packageRoot = join(import.meta.dirname, "..");

const dotsSource = `import { cn } from "@/lib/utils";
function Dots({ className, dots = 3, ...props }: React.ComponentProps<"span"> & { dots?: number }) {
  return (<><style>{\`@keyframes loading-ui-dots { to { opacity: 1; } }\`}</style><span role="status" className={cn("inline-flex gap-2", className)} {...props}>{Array.from({ length: dots }, (_, index) => (<span aria-hidden="true" className="grow rounded-full bg-current" style={{ animation: "loading-ui-dots 1s infinite", animationDelay: \`calc(0.2s * \${index})\` }} />))}<span className="sr-only">Loading</span></span></>);
}`;

test("Loading UI sync only accepts dependency-free CSS animation components", () => {
  const item = { type: "registry:component", files: [{ path: "dots.tsx" }] };
  assert.deepEqual(classifyCssOnlyCandidate(item, dotsSource), { eligible: true, reason: "css-only" });
  assert.equal(
    classifyCssOnlyCandidate({ ...item, dependencies: ["motion"] }, 'import { motion } from "motion/react";').eligible,
    false,
  );
});

test("repeating CSS indicators are converted to accessible Svelte components", () => {
  const pattern = parseRepeatingIndicator("dots", dotsSource);
  assert.ok(pattern);
  const component = renderPatternComponent(pattern);
  assert.match(component, /role="status"/);
  assert.match(component, /aria-label=\{label\}/);
  assert.match(component, /prefers-reduced-motion: reduce/);
  assert.match(component, /Loading UI \(dots\), MIT License/);
});

test("sync rejects CSS that could load remote content", () => {
  const unsafeSource = dotsSource.replace(
    "@keyframes loading-ui-dots {",
    '@import url("https://example.com/tracker.css"); @keyframes loading-ui-dots {',
  );
  assert.equal(parseRepeatingIndicator("dots", unsafeSource), null);
});

test("known static DOM shapes are adapted without executing upstream code", () => {
  const source = `import { cn } from "@/lib/utils";
function Arc() { return (<><style>{\`@keyframes loading-ui-arc-spin { to { transform: rotate(360deg); } }\`}</style><div className="border-t-current" /></>); }`;
  const pattern = parseStaticIndicator("arc", source);
  assert.ok(pattern);
  const component = renderStaticPatternComponent(pattern);
  assert.match(component, /data-slot="loading-arc"/);
  assert.match(component, /loading-ui-arc-spin var\(--duration, 1s\)/);
});

test("loading catalog exposes generated and manual CSS-only variants", async () => {
  const lock = JSON.parse(await readFile(join(packageRoot, "scripts/loading-ui-css-patterns.lock.json"), "utf8"));
  assert.equal(lock.manual["morphing-infinity"].adapter, "manual-svelte-v1");
  assert.match(lock.manual["morphing-infinity"].sourceSha256, /^[a-f0-9]{64}$/);
  for (const name of ["dots", "bars", "arc", "classic", "diamond", "ring", "swirling", "wave"]) {
    assert.ok(lock.generated[name], `${name} should be generated`);
  }
  assert.equal(new Set(loadingVariants).size, loadingVariants.length);
  assert.deepEqual([...loadingVariants].sort(), [...Object.keys(lock.generated), ...Object.keys(lock.manual)].sort());
  for (const name of [...Object.keys(lock.generated), ...Object.keys(lock.manual)]) {
    assert.ok(loadingVariants.includes(name), `${name} should be available at runtime`);
  }
});

test("manual morphing infinity adapter stays dependency-free", async () => {
  const component = await readFile(
    join(packageRoot, "src/lib/loading/loading-morphing-infinity.svelte"),
    "utf8",
  );
  assert.doesNotMatch(component, /motion\/react|requestAnimationFrame|setInterval/);
});
