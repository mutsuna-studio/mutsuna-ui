import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const packageRoot = join(import.meta.dirname, "..");

for (const workflow of ["release.yml", "sync-loading-ui.yml", "sync-shadcn-svelte.yml"]) {
  test(`${workflow} only updates an open automation pull request`, async () => {
    const source = await readFile(join(packageRoot, ".github/workflows", workflow), "utf8");

    assert.match(source, /gh pr list --state open --base main --head/);
    assert.match(source, /OPEN_PR_NUMBER/);
    assert.doesNotMatch(source, /gh pr view (?:changeset-release|automation\/loading-ui-css-patterns)/);
  });
}

test("shadcn upstream automation preserves open review work and creates draft-only PRs", async () => {
  const source = await readFile(join(packageRoot, ".github/workflows/sync-shadcn-svelte.yml"), "utf8");

  assert.match(source, /cron: "41 4 \* \* 1"/);
  assert.match(source, /OPEN_PR_NUMBER/);
  assert.match(source, /blocked=true/);
  assert.match(source, /gh pr create --draft/);
  assert.match(source, /git push --force-with-lease/);
  assert.doesNotMatch(source, /git add src\/lib/);
  assert.doesNotMatch(source, /pnpm (?:publish|release)/);
});
