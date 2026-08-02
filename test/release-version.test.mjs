import assert from "node:assert/strict";
import test from "node:test";

import { resolvePublishState } from "../scripts/resolve-publish-state.mjs";

test("publishes when the committed version is ahead of npm", () => {
  assert.equal(resolvePublishState("0.2.4", "0.2.3"), true);
  assert.equal(resolvePublishState("0.3.0", "0.2.9"), true);
});

test("skips publish when npm already has the committed version", () => {
  assert.equal(resolvePublishState("0.2.3", "0.2.3"), false);
});

test("rejects a committed version behind npm", () => {
  assert.throws(() => resolvePublishState("0.2.2", "0.2.3"), /behind npm/u);
});

test("rejects prerelease and malformed versions", () => {
  assert.throws(() => resolvePublishState("0.2.4-next.0", "0.2.3"), /Unsupported version/u);
  assert.throws(() => resolvePublishState("latest", "0.2.3"), /Unsupported version/u);
});
