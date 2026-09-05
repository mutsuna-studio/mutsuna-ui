import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { formatToastCopyText } from "../dist/sonner/toast-copy.js";

const sonnerSource = new URL("../src/lib/sonner/sonner.svelte", import.meta.url);
const toastSource = new URL("../src/lib/sonner/toast.ts", import.meta.url);

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

test("トーストの残り時間を控えめなバーで示し、操作中は一時停止する", async () => {
  const source = await readFile(sonnerSource, "utf8");

  assert.match(source, /--mutsuna-toast-duration/);
  assert.match(source, /inset-inline: 0/);
  assert.match(source, /bottom: 0/);
  assert.match(source, /height: 2px/);
  assert.match(source, /opacity: 0\.55/);
  assert.match(source, /animation-play-state: paused/);
  assert.match(source, /:not\(\[data-type="loading"\]\)/);
});

test("コピー完了はアイコンだけを変更し、トーストの残り時間を維持する", async () => {
  const [sonner, toast] = await Promise.all([
    readFile(sonnerSource, "utf8"),
    readFile(toastSource, "utf8"),
  ]);

  assert.match(sonner, /\[data-button\]\[data-copied="true"\]::before/);
  assert.match(sonner, /\[data-button\][\s\S]*?top: calc\(50% \+ 0\.125rem\)/);
  assert.match(sonner, /\[data-close-button\][\s\S]*?top: calc\(50% - 1\.625rem\)/);
  assert.match(sonner, /justify-content: center/);
  assert.match(sonner, /\[data-close-button\] svg\)[\s\S]*?width: 1rem/);
  assert.equal(sonner.match(/transition: opacity 150ms ease/g)?.length, 2);
  assert.match(toast, /COPY_FEEDBACK_DURATION = 2000/);
  assert.match(toast, /actionButton\.dataset\.copied = "true"/);
  assert.match(toast, /actionButton\.setAttribute\("aria-label", "コピーしました"\)/);
  assert.match(toast, /delete actionButton\.dataset\.copied/);
  assert.match(toast, /actionButton\.textContent = copyLabel/);
  assert.doesNotMatch(toast, /progressRestart|id: toastId/);
});

test("1行トーストでもコピーと閉じる操作の高さを確保する", async () => {
  const source = await readFile(sonnerSource, "utf8");

  assert.match(
    source,
    /\[data-sonner-toast\]\[data-styled="true"\]:has\(\[data-button\]\):has\(\[data-close-button\]\)[\s\S]*?min-block-size: 3\.75rem/
  );
});
