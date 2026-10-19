import { expect, test } from "vitest";
import { page, userEvent as browserUserEvent } from "vitest/browser";
import { userEvent, within } from "storybook/test";
import * as Message from "@mutsuna/ui/message";
import { render } from "./render.js";
import { reactiveProps } from "./props.svelte.js";
import FocusFixture from "./message-actions-focus-fixture.svelte";

test("touch actions expose reply, copy and reactions in an Escape-dismissible drawer", async () => {
  const previous = { width: innerWidth, height: innerHeight };
  try {
    await page.viewport(375, 812);
    let reply = 0; let copied = 0; let reaction = "";
    const props = reactiveProps({ onReply: () => { reply++; }, onCopy: () => { copied++; }, onReact: (emoji: string) => { reaction = emoji; }, disabled: false });
    const view = render(Message.Actions, props);
    const trigger = view.getByRole("button", { name: "その他の操作" });
    expect(trigger.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
    expect(trigger.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    const body = within(document.body);
    expect(getComputedStyle(trigger.closest("[data-slot=message-actions]")!.querySelector(".direct-actions")!).display).toBe("none");
    await userEvent.click(trigger);
    await userEvent.click(within(body.getByRole("dialog", { name: "メッセージの操作" })).getByRole("button", { name: "リプライ" }));
    await expect.poll(() => reply).toBe(1);
    await expect.poll(() => getComputedStyle(trigger).pointerEvents).not.toBe("none");
    await userEvent.click(trigger);
    await userEvent.click(within(body.getByRole("dialog", { name: "メッセージの操作" })).getByRole("button", { name: "コピー" }));
    expect(copied).toBe(1);
    await expect.poll(() => getComputedStyle(trigger).pointerEvents).not.toBe("none");
    await userEvent.click(trigger);
    await userEvent.click(within(body.getByRole("dialog", { name: "メッセージの操作" })).getByRole("button", { name: "ハート" }));
    expect(reaction).toBe("❤️");
    await expect.poll(() => getComputedStyle(trigger).pointerEvents).not.toBe("none");
    trigger.focus(); await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => document.activeElement).toBe(trigger);
    props.disabled = true;
    await expect.poll(() => (trigger as HTMLButtonElement).disabled).toBe(true);
  } finally { await page.viewport(previous.width, previous.height); }
});

test("desktop actions reveal on keyboard focus and show controlled copy feedback", async () => {
  const previous = { width: innerWidth, height: innerHeight };
  try {
    await page.viewport(1280, 812);
    let reaction = "";
    const props = reactiveProps({ onCopy: () => {}, onReact: (emoji: string) => { reaction = emoji; }, copyState: "idle" as "idle" | "copied" | "error" });
    const view = render(Message.Actions, props);
    await browserUserEvent.keyboard("{Tab}");
    view.getByRole("button", { name: "リアクションを追加" }).focus();
    await expect.poll(() => getComputedStyle(view.getByRole("group")).opacity).toBe("1");
    await userEvent.keyboard("{Enter}");
    const body = within(document.body);
    await userEvent.click(body.getByRole("button", { name: "いいね" }));
    expect(reaction).toBe("👍");
    props.copyState = "copied";
    await expect.poll(() => view.getByRole("status").textContent).toBe("コピーしました");
    expect(getComputedStyle(view.getByRole("status")).clipPath).toBe("inset(50%)");
    expect(view.getByRole("button", { name: "コピーしました" }).querySelector(".lucide-check")).not.toBeNull();
    props.copyState = "error";
    await expect.poll(() => view.getByRole("status").textContent).toBe("コピーできませんでした");
  } finally { await page.viewport(previous.width, previous.height); }
});

test("reaction chips expose selection and counts without rendering zero-count items", async () => {
  let toggled = "";
  const props = reactiveProps({ items: [{ emoji: "👍", label: "いいね", count: 2, selected: true }, { emoji: "❤️", label: "ハート", count: 0 }], onToggle: (emoji: string) => { toggled = emoji; }, disabled: false });
  const view = render(Message.Reactions, props);
  const chip = view.getByRole("button", { name: "いいね 2件" });
  expect(chip.getAttribute("aria-pressed")).toBe("true");
  expect(view.queryByRole("button", { name: /ハート/ })).toBeNull();
  await userEvent.click(chip); expect(toggled).toBe("👍");
  props.disabled = true;
  await expect.poll(() => (chip as HTMLButtonElement).disabled).toBe(true);
});

test("quotes navigate and dismiss using independently named controls", async () => {
  let moved = 0; let dismissed = 0;
  const view = render(Message.Quote, { author: "佐藤", text: "長い文章".repeat(100), onNavigate: () => { moved++; }, onDismiss: () => { dismissed++; } });
  view.getByRole("button", { name: "佐藤の元のメッセージへ移動" }).focus();
  await userEvent.keyboard("{Enter}"); expect(moved).toBe(1);
  await userEvent.click(view.getByRole("button", { name: "リプライを解除" })); expect(dismissed).toBe(1);
});

test("clicking a message or attachment does not pin its action bar after hover ends", async () => {
  const previous = { width: innerWidth, height: innerHeight };
  try {
    await page.viewport(1280, 812);
    const view = render(FocusFixture, {});
    const bar = view.getByRole("group", { name: "メッセージの操作" });
    await page.getByText("メッセージ本文", { exact: true }).click();
    await expect.poll(() => getComputedStyle(bar).opacity).toBe("1");
    await page.getByRole("button", { name: "外側" }).hover();
    await expect.poll(() => getComputedStyle(bar).opacity).toBe("0");
    await page.getByRole("button", { name: "添付ファイル" }).click();
    await page.getByRole("button", { name: "外側" }).hover();
    await expect.poll(() => getComputedStyle(bar).opacity).toBe("0");
    await page.getByRole("article", { name: "操作対象" }).hover();
    await page.getByRole("button", { name: "コピー", exact: true }).click();
    await page.getByRole("button", { name: "外側" }).hover();
    await expect.poll(() => getComputedStyle(bar).opacity).toBe("0");
    await browserUserEvent.keyboard("{Tab}");
    view.getByRole("button", { name: "コピー" }).focus();
    await expect.poll(() => getComputedStyle(bar).opacity).toBe("1");
  } finally { await page.viewport(previous.width, previous.height); }
});

test("long press opens the touch drawer while movement, scrolling and interactive controls cancel it", async () => {
  const previous = { width: innerWidth, height: innerHeight };
  const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  try {
    await page.viewport(375, 812);
    const view = render(FocusFixture, {});
    const text = view.getByText("メッセージ本文");
    const body = within(document.body);
    const down = (target = text) => target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch", pointerId: 1, isPrimary: true, clientX: 30, clientY: 30 }));
    down();
    text.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "touch", pointerId: 1, clientX: 50, clientY: 30 }));
    await pause(550);
    expect(body.queryByRole("dialog", { name: "メッセージの操作" })).toBeNull();
    down(); window.dispatchEvent(new Event("scroll"));
    await pause(550);
    expect(body.queryByRole("dialog", { name: "メッセージの操作" })).toBeNull();
    down(); window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
    await pause(550);
    expect(body.queryByRole("dialog", { name: "メッセージの操作" })).toBeNull();
    down(); window.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch", pointerId: 2, isPrimary: false }));
    await pause(550);
    expect(body.queryByRole("dialog", { name: "メッセージの操作" })).toBeNull();
    down(view.getByRole("button", { name: "添付ファイル" }));
    await pause(550);
    expect(body.queryByRole("dialog", { name: "メッセージの操作" })).toBeNull();
    down();
    await expect.poll(() => body.queryByRole("dialog", { name: "メッセージの操作" })).not.toBeNull();
    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
    await userEvent.click(within(body.getByRole("dialog", { name: "メッセージの操作" })).getByRole("button", { name: "閉じる" }));
    await expect.poll(() => body.queryByRole("dialog", { name: "メッセージの操作" })).toBeNull();
  } finally { await page.viewport(previous.width, previous.height); }
});
