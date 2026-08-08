import assert from "node:assert/strict";
import test from "node:test";

import { formatToastCopyText } from "../dist/sonner/toast-copy.js";

test("非表示詳細がなくてもタイトルと表示メッセージをコピー内容にする", () => {
  assert.equal(
    formatToastCopyText("保存しました", "営業時間の設定を更新しました。"),
    "タイトル: 保存しました\nメッセージ: 営業時間の設定を更新しました。"
  );
});

test("コピー内容へタイトル、表示メッセージ、非表示詳細を含める", () => {
  assert.equal(
    formatToastCopyText(
      "保存に失敗しました",
      "時間をおいて再度お試しください。",
      "Booking/create failed"
    ),
    "タイトル: 保存に失敗しました\nメッセージ: 時間をおいて再度お試しください。\nエラー詳細: Booking/create failed"
  );
});

test("構造化された非表示詳細は読みやすいJSONへ変換する", () => {
  assert.equal(
    formatToastCopyText("同期に失敗しました", undefined, {
      code: "timeout",
      retryable: true,
    }),
    'タイトル: 同期に失敗しました\nエラー詳細: {\n  "code": "timeout",\n  "retryable": true\n}'
  );
});

test("Errorの非表示詳細はstackを含める", () => {
  const error = new Error("connection reset");
  const copyText = formatToastCopyText(
    "接続に失敗しました",
    "もう一度お試しください。",
    error
  );

  assert.match(
    copyText,
    /^タイトル: 接続に失敗しました\nメッセージ: もう一度お試しください。\nエラー詳細: Error: connection reset/
  );
});
