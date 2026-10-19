import { expect, test } from "vitest";
import { userEvent, within } from "storybook/test";
import { page } from "vitest/browser";
import Fixture from "./chat-metadata-fixture.svelte";
import { render } from "./render.js";

test("consumer-owned conversation information updates in both list and header", async () => {
  const view = render(Fixture, {});
  const header = view.target.querySelector("[data-slot=chat-header]") as HTMLElement;
  expect(within(header).getByText("下書き")).toBeTruthy();
  const list = view.getByRole("navigation");
  expect(within(list).getByText("下書き")).toBeTruthy();
  const firstRow = within(list).getByRole("button", { name: /^最初の会話/ });
  const titleTop = firstRow.querySelector(".thread-title")!.getBoundingClientRect().top;
  expect(firstRow.querySelector("[data-slot=chat-thread-list-metadata]")!.getBoundingClientRect().top).toBe(titleTop);
  await userEvent.click(view.getByRole("button", { name: "会話情報を更新" }));
  expect(within(header).getByText("完了")).toBeTruthy();
  expect(within(list).getByText("完了")).toBeTruthy();
  const next = within(list).getByRole("button", { name: /^次の会話/ });
  next.focus();
  await userEvent.keyboard("{Enter}");
  expect(within(header).getByRole("heading", { level: 1 }).textContent).toBe("次の会話");
  expect(within(header).getByText("確認待ち")).toBeTruthy();
  expect(next.getAttribute("aria-current")).toBe("true");
  const memo = within(header).getByRole("button", { name: "メモを開く" });
  await userEvent.click(memo);
  expect(view.getByLabelText("開いたメモの数").textContent).toBe("1");
  expect(document.activeElement).toBe(memo);
  await userEvent.click(within(list).getByRole("button", { name: "補足なし" }));
  expect(getComputedStyle(header.querySelector("[data-slot=chat-header-metadata]")!).display).toBe("none");
  expect(getComputedStyle(within(list).getByRole("button", { name: "補足なし" }).querySelector("[data-slot=chat-thread-list-metadata]")!).display).toBe("none");
});
test("conversation metadata stays visible and wraps in narrow mobile layouts", async () => {
  const previous = { width: innerWidth, height: innerHeight };
  try {
    await page.viewport(320, 600);
    const view = render(Fixture, { long: true }); view.target.style.cssText = "width:100%;padding:0";
    const header = view.target.querySelector("[data-slot=chat-header]") as HTMLElement;
    const list = view.getByRole("navigation");
    expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth);
    expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
    const info = header.querySelector("[data-slot=chat-header-metadata]")!;
    expect(getComputedStyle(info).display).not.toBe("none");
    expect(info.getBoundingClientRect().height).toBeGreaterThan(20);
    expect(header.querySelectorAll("button")).toHaveLength(1);
    expect(list.querySelector("button button, button a, button input")).toBeNull();
  } finally { await page.viewport(previous.width, previous.height); }
});
