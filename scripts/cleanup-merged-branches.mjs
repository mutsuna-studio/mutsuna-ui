#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

function run(command, args, options = {}) {
  const output = execFileSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
  });
  return typeof output === "string" ? output.trim() : "";
}

export function findMatchingMergedPull({ branch, commit, defaultBranch, pulls }) {
  return pulls.find(
    (pull) =>
      pull.headRefName === branch &&
      pull.headRefOid === commit &&
      pull.baseRefName === defaultBranch &&
      pull.mergedAt !== null,
  );
}

export function parseWorktreeBranches(output) {
  return new Set(
    output
      .split("\n")
      .filter((line) => line.startsWith("branch refs/heads/"))
      .map((line) => line.slice("branch refs/heads/".length)),
  );
}

function parseArguments(argv) {
  const unknown = argv.filter((argument) => argument !== "--dry-run" && argument !== "--no-fetch");
  if (unknown.length > 0) {
    throw new Error(`Unknown argument: ${unknown.join(", ")}`);
  }

  return {
    dryRun: argv.includes("--dry-run"),
    fetch: !argv.includes("--no-fetch"),
  };
}

export function cleanupMergedBranches({ cwd = process.cwd(), argv = process.argv.slice(2) } = {}) {
  const options = parseArguments(argv);
  const repositoryRoot = run("git", ["rev-parse", "--show-toplevel"], { cwd });

  run("gh", ["auth", "status"], { cwd: repositoryRoot });

  if (options.fetch) {
    run("git", ["fetch", "origin", "--prune"], {
      cwd: repositoryRoot,
      stdio: "inherit",
    });
  }

  const repository = JSON.parse(
    run("gh", ["repo", "view", "--json", "nameWithOwner,defaultBranchRef"], {
      cwd: repositoryRoot,
    }),
  );
  const defaultBranch = repository.defaultBranchRef.name;
  const worktreeBranches = parseWorktreeBranches(
    run("git", ["worktree", "list", "--porcelain"], { cwd: repositoryRoot }),
  );
  const branches = run(
    "git",
    ["for-each-ref", "--format=%(refname:short)\t%(objectname)", "refs/heads"],
    { cwd: repositoryRoot },
  )
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [branch, commit] = line.split("\t");
      return { branch, commit };
    });

  const deleted = [];
  const skipped = [];

  for (const localBranch of branches) {
    if (localBranch.branch === defaultBranch) {
      skipped.push({ branch: localBranch.branch, reason: "default branch" });
      continue;
    }
    if (worktreeBranches.has(localBranch.branch)) {
      skipped.push({ branch: localBranch.branch, reason: "checked out in a worktree" });
      continue;
    }

    const pulls = JSON.parse(
      run(
        "gh",
        [
          "pr",
          "list",
          "--repo",
          repository.nameWithOwner,
          "--state",
          "merged",
          "--head",
          localBranch.branch,
          "--limit",
          "20",
          "--json",
          "number,headRefName,headRefOid,baseRefName,mergedAt",
        ],
        { cwd: repositoryRoot },
      ),
    );
    const matchingPull = findMatchingMergedPull({
      ...localBranch,
      defaultBranch,
      pulls,
    });

    if (matchingPull === undefined) {
      skipped.push({ branch: localBranch.branch, reason: "no merged PR matches its current commit" });
      continue;
    }

    if (!options.dryRun) {
      run("git", ["branch", "-D", "--", localBranch.branch], {
        cwd: repositoryRoot,
        stdio: "inherit",
      });
    }
    deleted.push({ branch: localBranch.branch, pull: matchingPull.number });
  }

  for (const item of deleted) {
    const prefix = options.dryRun ? "Would delete" : "Deleted";
    process.stdout.write(`${prefix} ${item.branch} (merged PR #${item.pull})\n`);
  }
  if (deleted.length === 0) process.stdout.write("No merged local branches to delete.\n");

  return { deleted, skipped };
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    cleanupMergedBranches();
  } catch (error) {
    process.stderr.write(`Local branch cleanup failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
