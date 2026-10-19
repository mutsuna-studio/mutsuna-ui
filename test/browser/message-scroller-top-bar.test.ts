import { expect, test } from "vitest";
import { userEvent } from "storybook/test";
import Preview from "../../stories/message-scroller-top-bar-preview.svelte";
import { render } from "./render.js";
for (const width of [280, 640]) {
  test(`top bar shares space with custom actions and an optional row at ${width}px`, async () => {
    const view = render(Preview, {});
    view.target.style.cssText = `width:${width}px;padding:0`;
    const top = view.target.querySelector<HTMLElement>('[data-slot="message-scroller-top-bar"]')!;
    const primary = top.querySelector<HTMLElement>('[data-slot="message-scroller-top-bar-content"]')!;
    const actions = top.querySelector<HTMLElement>('[data-slot="message-scroller-top-bar-actions"]')!;
    const history = view.getByRole("region", { name: "上部領域の検証用履歴" });
    expect(primary.getBoundingClientRect().right + 7).toBeLessThanOrEqual(actions.getBoundingClientRect().left);
    expect(top.scrollWidth).toBeLessThanOrEqual(top.clientWidth);
    const originalHeight = history.clientHeight;
    await userEvent.click(view.getByRole("button", { name: "検索" }));
    const input = view.getByRole("textbox", { name: "履歴の検索" });
    await userEvent.type(input, "確認");
    expect(history.clientHeight).toBeLessThan(originalHeight);
    const y = top.getBoundingClientRect().top;
    history.scrollTop = history.scrollHeight;
    await expect.poll(() => history.scrollTop).toBeGreaterThan(0);
    expect(top.getBoundingClientRect().top).toBe(y);
    expect(top.getBoundingClientRect().bottom).toBeLessThanOrEqual(history.getBoundingClientRect().top);
    expect(document.activeElement).toBe(input);
    await userEvent.click(view.getByRole("button", { name: "検索" }));
    expect(view.queryByRole("textbox", { name: "履歴の検索" })).toBeNull();
    expect(history.clientHeight).toBe(originalHeight);
  });
}

test("overlay keeps history under a transparent top bar and exposes its changing height", async () => {
  const view = render(Preview, { placement: "overlay" });
  const top = view.target.querySelector<HTMLElement>('[data-slot="message-scroller-top-bar"]')!;
  const root = top.closest<HTMLElement>('[data-slot="message-scroller"]')!;
  const history = view.getByRole("region", { name: "上部領域の検証用履歴" });
  expect(top.getBoundingClientRect().top).toBe(history.getBoundingClientRect().top);
  expect(getComputedStyle(top).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  const height = history.clientHeight;
  const blank = top.querySelector<HTMLElement>('[data-slot="message-scroller-top-bar-content"]')!.getBoundingClientRect();
  expect(top.contains(document.elementFromPoint(blank.right - 4, blank.top + 4))).toBe(false);
  await userEvent.click(view.getByRole("button", { name: "検索" }));
  await userEvent.type(view.getByRole("textbox", { name: "履歴の検索" }), "透過表示");
  expect(history.clientHeight).toBe(height);
  await expect.poll(() => parseFloat(root.style.getPropertyValue("--message-scroller-top-bar-height")) - Math.ceil(top.getBoundingClientRect().height)).toBe(0);
  expect(top.getBoundingClientRect().bottom).toBeGreaterThan(history.getBoundingClientRect().top);
});
