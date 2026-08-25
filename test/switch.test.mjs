import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const packageRoot = join(import.meta.dirname, "..");

test("Switch shares the Slider visual weight while preserving its toggle states", async () => {
  const source = await readFile(
    join(packageRoot, "src/lib/switch/switch.svelte"),
    "utf8"
  );

  assert.match(source, /data-checked:bg-primary data-unchecked:bg-input/);
  assert.match(source, /data-\[size=default\]:h-5 data-\[size=default\]:w-9/);
  assert.match(
    source,
    /data-\[size=default\]:\[--switch-thumb-active-scale:0\.875\]/
  );
  assert.match(source, /data-\[size=sm\]:h-4 data-\[size=sm\]:w-7/);
  assert.match(
    source,
    /data-\[size=sm\]:\[--switch-thumb-active-scale:0\.833333\]/
  );
  assert.match(source, /rounded-full p-0\.5/);
  assert.match(source, /before:-inset-y-1\.5/);
  assert.match(source, /data-\[size=sm\]:before:-inset-x-0\.5/);
  assert.match(
    source,
    /focus-visible:after:ring-2.*focus-visible:after:ring-inset/
  );
  assert.match(
    source,
    /aria-invalid:after:ring-2.*aria-invalid:after:ring-inset/
  );
  assert.match(
    source,
    /data-disabled:cursor-not-allowed data-disabled:opacity-50/
  );
  assert.match(source, /group-data-\[size=default\]\/switch:size-4/);
  assert.match(source, /group-data-\[size=sm\]\/switch:size-3/);
  assert.match(source, /group-data-checked\/switch:translate-x-full/);
  assert.match(
    source,
    /group-hover\/switch:scale-\[var\(--switch-thumb-active-scale\)\]/
  );
  assert.match(
    source,
    /group-focus-visible\/switch:scale-\[var\(--switch-thumb-active-scale\)\]/
  );
  assert.match(
    source,
    /group-active\/switch:scale-\[var\(--switch-thumb-active-scale\)\]/
  );
  assert.match(source, /motion-reduce:transition-none/);
  assert.doesNotMatch(source, /focus-visible:ring-3/);
  assert.doesNotMatch(source, /ring-ring\/50/);
  assert.doesNotMatch(source, /group-hover\/switch:scale-105/);
});
