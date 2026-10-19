import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { userEvent, within } from "storybook/test";
import { ChatMemo } from "@mutsuna/ui/chat-memo";
import Preview from "../../stories/chat-memo-preview.svelte";
import Screen from "../../stories/chat-screen-preview.svelte";
import { render } from "./render.js";
import { reactiveProps } from "./props.svelte.js";

async function editMemo() {
  const body = within(document.body);
  await userEvent.click(body.getByRole("button", { name: "会話のメモの本文" }));
  return body.getByRole("textbox", { name: "会話のメモの本文" }) as HTMLTextAreaElement;
}
test("the note uses borderless EditableText, commits without a save button and stays pinned", async () => {
  const onSave = vi.fn();
  const view = render(ChatMemo, { value: "元のメモ", onSave });
  const trigger = view.getByRole("button", { name: "会話のメモ" });
  await userEvent.click(trigger);
  const body = within(document.body);
  const dialog = body.getByRole("dialog", { name: "会話のメモ" });
  expect(within(dialog).queryByRole("heading")).toBeNull();
  expect(within(dialog).queryByRole("button", { name: "保存" })).toBeNull();
  const input = await editMemo();
  expect(getComputedStyle(input).borderWidth).toBe("0px");
  await userEvent.clear(input);
  await userEvent.type(input, "変更したメモ");
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  expect(onSave).toHaveBeenCalledWith("変更したメモ");
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(body.queryByRole("textbox")).toBeNull();
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => body.queryByRole("dialog", { name: "会話のメモ" })).toBeNull();
  await expect.poll(() => document.activeElement).toBe(trigger);
  await userEvent.click(trigger);
  expect(body.getByRole("button", { name: "会話のメモの本文" }).textContent).toBe("変更したメモ");
});
test("the pinned note fits a narrow viewport and permits conversation interaction", async () => {
  const previous = { width: innerWidth, height: innerHeight };
  try {
    await page.viewport(320, 420);
    const view = render(Preview, {}); view.target.style.cssText = "width:100%;padding:0";
    await userEvent.click(view.getByRole("button", { name: "会話のメモ" }));
    const dialog = within(document.body).getByRole("dialog", { name: "会話のメモ" });
    const rect = dialog.getBoundingClientRect();
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(innerWidth);
    expect(rect.bottom).toBeLessThanOrEqual(innerHeight);
    expect(getComputedStyle(document.body).pointerEvents).not.toBe("none");
    expect(document.body.style.overflow).not.toBe("hidden");
    await userEvent.click(view.getByRole("button", { name: "会話側の操作" }));
    expect(view.getByText("操作回数：1")).toBeTruthy();
    expect(within(document.body).getByRole("dialog", { name: "会話のメモ" })).toBe(dialog);
    dialog.focus();
    const left = dialog.getBoundingClientRect().left;
    await userEvent.keyboard("{ArrowLeft}");
    expect(dialog.getBoundingClientRect().left).toBeLessThan(left);
  } finally { await page.viewport(previous.width, previous.height); }
});
test("consumer saving, errors, read-only and empty commits are supported", async () => {
  const onSave = vi.fn();
  const props = reactiveProps({ open: true, value: "メモ", saving: true, readOnly: false, error: undefined as string | undefined, onSave });
  render(ChatMemo, props);
  const body = within(document.body);
  expect((body.getByRole("button", { name: "会話のメモの本文" }) as HTMLButtonElement).disabled).toBe(true);
  props.saving = false; props.error = "保存できませんでした。";
  await expect.poll(() => body.queryByRole("alert")).not.toBeNull();
  const input = await editMemo();
  await userEvent.clear(input);
  await userEvent.keyboard("{Control>}{Enter}{/Control}");
  expect(onSave).toHaveBeenCalledWith("");
  props.readOnly = true;
  await expect.poll(() => body.queryByRole("button", { name: "会話のメモの本文" })).toBeNull();
  expect(body.queryByRole("textbox")).toBeNull();
});
test("screen memo is per conversation, non-overlapping and indicated only on its trigger", async () => {
  const previous = { width: innerWidth, height: innerHeight };
  try {
    await page.viewport(1280, 812);
    const view = render(Screen, { layout: "timeline", scenario: "assistant" }); view.target.style.cssText = "width:100%;padding:0";
    const body = within(document.body);
    const trigger = body.getByRole("button", { name: "会話のメモ" });
    await userEvent.click(trigger);
    const dialog = body.getByRole("dialog", { name: "会話のメモ" });
    const history = view.getByLabelText("メッセージ履歴");
    expect(history.getBoundingClientRect().right).toBeLessThanOrEqual(dialog.getBoundingClientRect().left);
    expect(view.queryByText("メモあり")).toBeNull();
    let input = await editMemo();
    await userEvent.clear(input); await userEvent.type(input, "この会話のメモ");
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    expect(body.getByRole("dialog", { name: "会話のメモ" })).toBeTruthy();
    await userEvent.click(view.getByRole("button", { name: /^ミーティングの振り返り/ }));
    await userEvent.click(body.getByRole("button", { name: "会話のメモ" }));
    expect(body.getByRole("button", { name: "会話のメモの本文" }).textContent).not.toBe("この会話のメモ");
    await userEvent.keyboard("{Escape}");
    await userEvent.click(view.getByRole("button", { name: /^文章とアイデア/ }));
    await userEvent.click(body.getByRole("button", { name: "会話のメモ" }));
    expect(body.getByRole("button", { name: "会話のメモの本文" }).textContent).toBe("この会話のメモ");
    input = await editMemo(); await userEvent.clear(input);
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    await userEvent.click(body.getByRole("button", { name: "メモを最小化" }));
    expect(body.queryByText("メモあり")).toBeNull();
  } finally { await page.viewport(previous.width, previous.height); }
});

test.each([375, 1280])("memo height stays stable when editing unchanged text at %ipx", async (width) => {
  const previous = { width: innerWidth, height: innerHeight };
  try {
    await page.viewport(width, 812);
    const props = reactiveProps({ open: true, value: "短いメモ" });
    render(ChatMemo, props);
    const body = within(document.body);
    const dialog = body.getByRole("dialog", { name: "会話のメモ" });
    for (const value of ["短いメモ", "折り返される長いメモです。同じ文章のまま編集を開始してもカードの高さが変わらないことを確認します。", "一行目\n二行目", ""]) {
      props.value = value;
      const trigger = body.getByRole("button", { name: "会話のメモの本文" });
      await expect.poll(() => trigger.textContent).toBe(value || "メモを追加…");
      const height = dialog.getBoundingClientRect().height;
      const fontSize = getComputedStyle(trigger).fontSize;
      const input = await editMemo();
      expect(getComputedStyle(input).fontSize).toBe(fontSize);
      expect(dialog.getBoundingClientRect().height).toBe(height);
      await userEvent.keyboard("{Control>}{Enter}{/Control}");
      expect(dialog.getBoundingClientRect().height).toBe(height);
    }
  } finally { await page.viewport(previous.width, previous.height); }
});


test("save icon commits the draft once, supports retry, and minimize restores focus", async () => {
  const onSave = vi.fn();
  const props = reactiveProps({ open: true, value: "元のメモ", error: undefined as string | undefined, saving: false, onSave });
  const view = render(ChatMemo, props);
  const body = within(document.body);
  const input = await editMemo();
  await userEvent.clear(input); await userEvent.type(input, "保存ボタンで確定");
  await userEvent.click(body.getByRole("button", { name: "メモを保存" }));
  expect(onSave).toHaveBeenCalledExactlyOnceWith("保存ボタンで確定");
  expect(body.queryByRole("textbox")).toBeNull();
  props.error = "保存できませんでした";
  await expect.poll(() => body.queryByRole("button", { name: "メモの保存を再試行" })).not.toBeNull();
  await userEvent.click(body.getByRole("button", { name: "メモの保存を再試行" }));
  expect(onSave).toHaveBeenCalledTimes(2);
  props.saving = true;
  await expect.poll(() => body.queryByRole("status")).not.toBeNull();
  expect((body.getByRole("button", { name: "保存中" }) as HTMLButtonElement).disabled).toBe(true);
  await userEvent.click(body.getByRole("button", { name: "メモを最小化" }));
  await expect.poll(() => body.queryByRole("dialog")).toBeNull();
  await expect.poll(() => document.activeElement).toBe(view.getByRole("button", { name: "会話のメモ" }));
});


test("confirmed save status tracks edits, cancellation, pending requests and retry without redundant saves", async () => {
  const onSave = vi.fn();
  const props = reactiveProps({ open: true, value: "保存した本文", savedValue: "保存した本文", saving: false, error: undefined as string | undefined, onSave });
  render(ChatMemo, props);
  const body = within(document.body);
  const savedButton = body.getByRole("button", { name: "保存済み" });
  expect(savedButton.getAttribute("aria-disabled")).toBe("true");
  await userEvent.click(savedButton);
  expect(onSave).not.toHaveBeenCalled();
  let input = await editMemo();
  await userEvent.clear(input); await userEvent.type(input, "編集中の本文");
  expect(body.getByRole("button", { name: "メモを保存" }).hasAttribute("aria-disabled")).toBe(false);
  await userEvent.keyboard("{Escape}");
  expect(body.getByRole("button", { name: "保存済み" })).toBeTruthy();
  expect(onSave).not.toHaveBeenCalled();
  input = await editMemo();
  await userEvent.clear(input); await userEvent.type(input, "新しい本文");
  await userEvent.click(body.getByRole("button", { name: "メモを保存" }));
  expect(onSave).toHaveBeenCalledExactlyOnceWith("新しい本文");
  expect(body.queryByRole("button", { name: "保存済み" })).toBeNull();
  props.saving = true;
  await expect.poll(() => body.queryByRole("button", { name: "保存中" })).not.toBeNull();
  props.saving = false; props.error = "保存失敗";
  await expect.poll(() => body.queryByRole("button", { name: "メモの保存を再試行" })).not.toBeNull();
  await userEvent.click(body.getByRole("button", { name: "メモの保存を再試行" }));
  expect(onSave).toHaveBeenCalledTimes(2);
  props.error = undefined; props.savedValue = "新しい本文";
  await expect.poll(() => body.queryByRole("button", { name: "保存済み" })).not.toBeNull();
  await userEvent.click(body.getByRole("button", { name: "保存済み" }));
  expect(onSave).toHaveBeenCalledTimes(2);
  const grip = document.querySelector<HTMLElement>("[data-note-grip=header]")!;
  expect(grip.getBoundingClientRect().width).toBeGreaterThan(100);
  expect(grip.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
  expect(grip.querySelector("button")).toBeNull();
});
