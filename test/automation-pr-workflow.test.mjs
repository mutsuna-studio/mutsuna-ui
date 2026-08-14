import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const packageRoot = join(import.meta.dirname, "..");

for (const workflow of ["release.yml", "sync-loading-ui.yml"]) {
  test(`${workflow} only updates an open automation pull request`, async () => {
    const source = await readFile(join(packageRoot, ".github/workflows", workflow), "utf8");

    assert.match(source, /gh pr list --state open --base main --head/);
    assert.match(source, /OPEN_PR_NUMBER/);
    assert.doesNotMatch(source, /gh pr view (?:changeset-release|automation\/loading-ui-css-patterns)/);
  });
}
