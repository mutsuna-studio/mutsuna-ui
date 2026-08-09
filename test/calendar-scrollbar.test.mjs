import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourceUrl = new URL(
  "../src/lib/calendar/calendar-caption.svelte",
  import.meta.url
);

test("calendar uses the shared themed scrollbar for year and month options", async () => {
  const source = await readFile(sourceUrl, "utf8");

  assert.match(
    source,
    /import ScrollbarArea from "@mutsuna\/ui\/scrollbar\/scrollbar-area\.svelte"/
  );
  assert.match(source, /yearListElement = \$state<HTMLDivElement \| null>\(null\)/);
  assert.match(source, /monthListElement = \$state<HTMLDivElement \| null>\(null\)/);
  assert.match(
    source,
    /<ScrollbarArea[\s\S]*?bind:ref=\{yearListElement\}[\s\S]*?data-calendar-year-list/
  );
  assert.match(
    source,
    /<ScrollbarArea[\s\S]*?bind:ref=\{monthListElement\}[\s\S]*?data-calendar-month-list/
  );
  assert.equal(source.match(/<ScrollbarArea/g)?.length, 2);
});
