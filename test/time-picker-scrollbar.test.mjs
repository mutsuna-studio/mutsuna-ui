import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourceUrl = new URL(
  "../src/lib/time-picker/time-picker.svelte",
  import.meta.url
);

test("time picker uses the shared themed scrollbar for hour and minute options", async () => {
  const source = await readFile(sourceUrl, "utf8");

  assert.match(
    source,
    /import ScrollbarArea from "@mutsuna\/ui\/scrollbar\/scrollbar-area\.svelte"/
  );
  assert.match(source, /hourListElement = \$state<HTMLDivElement \| null>\(null\)/);
  assert.match(source, /minuteListElement = \$state<HTMLDivElement \| null>\(null\)/);
  assert.match(
    source,
    /<ScrollbarArea[\s\S]*?bind:ref=\{hourListElement\}[\s\S]*?data-time-picker-hour-list/
  );
  assert.match(
    source,
    /<ScrollbarArea[\s\S]*?bind:ref=\{minuteListElement\}[\s\S]*?data-time-picker-minute-list/
  );
  assert.equal(source.match(/<ScrollbarArea/g)?.length, 2);
});
