import assert from "node:assert/strict";
import { test } from "node:test";
import { startEditorLifecycle } from "../dist/internal/markdown/lifecycle.js";

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const settle = () => new Promise(resolve => setImmediate(resolve));

test("disposing during creation defers teardown and never publishes the editor", async () => {
  const creation = deferred();
  const events = [];
  const stop = startEditorLifecycle({ create: () => creation.promise, destroy: async () => { events.push("destroy"); } },
    () => events.push("ready"), () => events.push("failure"));
  stop(); stop();
  assert.deepEqual(events, []);
  creation.resolve();
  await settle();
  assert.deepEqual(events, ["destroy"]);
});

test("ready editors are destroyed once and late destruction failures are handled", async () => {
  const events = [];
  const stop = startEditorLifecycle({ create: async () => {}, destroy: async () => { events.push("destroy"); throw Error("teardown"); } },
    () => events.push("ready"), () => events.push("failure"));
  await settle();
  stop(); stop();
  await settle();
  assert.deepEqual(events, ["ready", "destroy"]);
});

test("initialization errors are reported only to a live component", async () => {
  for (const disposed of [false, true]) {
    const creation = deferred();
    const errors = [];
    let destroyed = false;
    const stop = startEditorLifecycle({ create: () => creation.promise, destroy: async () => { destroyed = true; } },
      () => assert.fail("must not become ready"), error => errors.push(error.message));
    if (disposed) stop();
    creation.reject(Error("initialization"));
    await settle();
    assert.deepEqual(errors, disposed ? [] : ["initialization"]);
    assert.equal(destroyed, false, "Do not ask Milkdown to destroy a failed OnCreate instance");
  }
});
