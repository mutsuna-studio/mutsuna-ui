import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { userEvent, within } from "storybook/test";
import { StickyNote } from "@mutsuna/ui/sticky-note";
import Preview from "../../stories/sticky-note-preview.svelte";
import { render } from "./render.js";
import { reactiveProps } from "./props.svelte.js";

test("floating launcher moves by keyboard, reopens at retained positions and restores focus", async () => {
  render(StickyNote, { value: "汎用のメモ", triggerPosition: { x: 100, y: 150 } });
  const body = within(document.body);
  let trigger = body.getByRole("button", { name: "メモを開く" });
  trigger.focus(); await userEvent.keyboard("{ArrowLeft}");
  const anchor = document.querySelector("[data-slot=sticky-note-floating-trigger]")!;
  expect(anchor.getBoundingClientRect().left).toBe(92);
  await userEvent.keyboard("{Enter}");
  const card = body.getByRole("dialog", { name: "メモ" });
  expect(body.queryByRole("button", { name: "メモを開く" })).toBeNull();
  const before = card.getBoundingClientRect();
  card.focus(); await userEvent.keyboard("{ArrowDown}");
  expect(card.getBoundingClientRect().top).toBe(before.top + 8);
  const moved = card.getBoundingClientRect();
  await userEvent.click(body.getByRole("button", { name: "メモを最小化" }));
  trigger = body.getByRole("button", { name: "メモを開く" });
  await expect.poll(() => document.activeElement).toBe(trigger);
  expect(document.querySelector("[data-slot=sticky-note-floating-trigger]")!.getBoundingClientRect().left).toBe(92);
  await userEvent.click(trigger);
  expect(body.getByRole("dialog", { name: "メモ" }).getBoundingClientRect().top).toBe(moved.top);
});

test("floating launcher clamps on small viewports and a disabled launcher cannot open", async () => {
  const previous = { width: innerWidth, height: innerHeight };
  try {
    await page.viewport(320, 420);
    const props = reactiveProps({ triggerPosition: { x: 9999, y: 9999 }, disabled: true });
    render(StickyNote, props);
    const body = within(document.body);
    const trigger = body.getByRole("button", { name: "メモを開く" });
    const rect = trigger.getBoundingClientRect();
    expect(rect.right).toBeLessThanOrEqual(308); expect(rect.bottom).toBeLessThanOrEqual(408);
    expect((trigger as HTMLButtonElement).disabled).toBe(true);
    (trigger as HTMLButtonElement).click(); expect(body.queryByRole("dialog")).toBeNull();
    props.disabled = false;
    await expect.poll(() => (trigger as HTMLButtonElement).disabled).toBe(false);
    await userEvent.click(trigger);
    const bounds = body.getByRole("dialog", { name: "メモ" }).getBoundingClientRect();
    expect(bounds.left).toBeGreaterThanOrEqual(12); expect(bounds.right).toBeLessThanOrEqual(308);
    expect(bounds.bottom).toBeLessThanOrEqual(408);
  } finally { await page.viewport(previous.width, previous.height); }
});

test.each(["inline", "none"] as const)("custom/external trigger opens a note and receives restored focus (%s)", async (mode) => {
  const view = render(Preview, { mode });
  const body = within(document.body);
  const trigger = view.getByRole("button", { name: mode === "inline" ? "メモを開く" : "外部のボタンからメモを開く" });
  await userEvent.click(trigger);
  expect(body.getByRole("dialog", { name: "メモ" })).toBeTruthy();
  await userEvent.click(body.getByRole("button", { name: "メモを最小化" }));
  await expect.poll(() => document.activeElement).toBe(trigger);
});

test("controlled visibility works without a launcher or browser API at module evaluation", async () => {
  const props = reactiveProps({ open: true, triggerMode: "none" as const, value: "本文", onSave: vi.fn() });
  render(StickyNote, props);
  const body = within(document.body);
  expect(body.queryByRole("button", { name: "メモを開く" })).toBeNull();
  expect(body.getByRole("dialog", { name: "メモ" })).toBeTruthy();
  props.open = false;
  await expect.poll(() => body.queryByRole("dialog")).toBeNull();
});
