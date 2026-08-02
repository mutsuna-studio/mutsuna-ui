import assert from "node:assert/strict";
import test from "node:test";
import { readFormActionToast } from "../dist/sveltekit-form/form-action-toast-state.js";

test("successのform action結果をtoastへ正規化する", () => {
  assert.deepEqual(readFormActionToast({ status: "success", message: "保存しました。" }), {
    status: "success",
    message: "保存しました。",
  });
});

test("success以外のmessage付き結果をerrorへ正規化する", () => {
  assert.deepEqual(readFormActionToast({ status: "failure", message: "保存できませんでした。" }), {
    status: "error",
    message: "保存できませんでした。",
  });
});

test("messageを持たない結果はtoastを表示しない", () => {
  assert.equal(readFormActionToast({ status: "success" }), undefined);
  assert.equal(readFormActionToast(null), undefined);
});
