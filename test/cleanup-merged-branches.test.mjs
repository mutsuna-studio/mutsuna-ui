import assert from "node:assert/strict";
import test from "node:test";

import {
  findMatchingMergedPull,
  parseWorktreeBranches,
} from "../scripts/cleanup-merged-branches.mjs";

test("finds only a merged PR whose head commit and base branch match", () => {
  const pull = findMatchingMergedPull({
    branch: "codex/example",
    commit: "abc123",
    defaultBranch: "main",
    pulls: [
      {
        number: 1,
        headRefName: "codex/example",
        headRefOid: "old123",
        baseRefName: "main",
        mergedAt: "2026-08-01T00:00:00Z",
      },
      {
        number: 2,
        headRefName: "codex/example",
        headRefOid: "abc123",
        baseRefName: "develop",
        mergedAt: "2026-08-02T00:00:00Z",
      },
      {
        number: 3,
        headRefName: "codex/example",
        headRefOid: "abc123",
        baseRefName: "main",
        mergedAt: "2026-08-03T00:00:00Z",
      },
    ],
  });

  assert.equal(pull?.number, 3);
});

test("does not match a branch that has commits after its PR was merged", () => {
  const pull = findMatchingMergedPull({
    branch: "codex/example",
    commit: "new456",
    defaultBranch: "main",
    pulls: [
      {
        number: 3,
        headRefName: "codex/example",
        headRefOid: "abc123",
        baseRefName: "main",
        mergedAt: "2026-08-03T00:00:00Z",
      },
    ],
  });

  assert.equal(pull, undefined);
});

test("parses branches currently checked out by any worktree", () => {
  const branches = parseWorktreeBranches(`worktree /repo
HEAD abc123
branch refs/heads/main

worktree /repo-feature
HEAD def456
branch refs/heads/codex/example
`);

  assert.deepEqual([...branches], ["main", "codex/example"]);
});
