import { expect, test } from "vitest";
import { userEvent } from "storybook/test";
import { userEvent as nativeUserEvent } from "vitest/browser";
import Fixture from "../../stories/message-scroller-preview.svelte";
import { render } from "./render.js";

test("scroller follows at the live edge, pauses for reading, jumps back and preserves prepended history", async () => {
  const view = render(Fixture, {});
  const viewport = view.getByLabelText("スクロール検証の履歴");
  const atEnd = () => viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;
  await expect.poll(atEnd).toBeLessThan(10);
  await userEvent.click(view.getByRole("button", { name: "メッセージを追加" }));
  await expect.poll(atEnd).toBeLessThan(10);
  await userEvent.click(view.getByRole("button", { name: "末尾の本文を伸ばす" }));
  await expect.poll(atEnd).toBeLessThan(10);
  await nativeUserEvent.click(viewport);
  await nativeUserEvent.keyboard("{Control>}{Home}{/Control}");
  await expect.poll(() => viewport.scrollTop).toBe(0);
  await expect.poll(() => view.getByRole("button", { name: "最新のメッセージへ" }).getAttribute("data-active")).toBe("true");
  const before = viewport.scrollTop;
  await userEvent.click(view.getByRole("button", { name: "メッセージを追加" }));
  await expect.poll(() => view.getAllByText("追加されたメッセージ", { exact: true }).length).toBe(1);
  expect(viewport.scrollTop).toBe(before);
  const first = view.getByRole("article", { name: "row-0" });
  const relativeTop = () => first.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
  const top = relativeTop();
  await userEvent.click(view.getByRole("button", { name: "過去の履歴を追加" }));
  await expect.poll(relativeTop).toBeCloseTo(top, 0);
  const jump = view.getByRole("button", { name: "最新のメッセージへ" });
  jump.focus();
  await userEvent.keyboard("{Enter}");
  await expect.poll(atEnd).toBeLessThan(10);
  await expect.poll(() => jump.tabIndex).toBe(-1);
});


test("an explicitly anchored new turn starts near the top with previous context", async () => {
  const view = render(Fixture, { anchorNew: true });
  const viewport = view.getByLabelText("スクロール検証の履歴");
  await expect.poll(() => viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop).toBeLessThan(10);
  await userEvent.click(view.getByRole("button", { name: "メッセージを追加" }));
  const row = view.getByRole("article", { name: "row-20" });
  // The peek is measured from content padding; verify a new turn is visible
  // near the reading line with context above, rather than the absolute bottom.
  const offset = () => row.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
  await expect.poll(offset).toBeGreaterThanOrEqual(60);
  await expect.poll(offset).toBeLessThan(100);
});
