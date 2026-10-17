import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { userEvent, within } from "storybook/test";
import Fixture from "./overlay-fixture.svelte";
import { render } from "./render.js";

test("Drawer defaults focus into its dialog, supports nested controls and restores focus", async () => {
  const view = render(Fixture, { initialOpen: true });
  const body = within(document.body);
  const dialog = await body.findByRole("dialog", { name: "親の画面" });
  await expect.poll(() => dialog.contains(document.activeElement)).toBe(true);
  expect(dialog.querySelector('[data-slot="drawer-handle"]')).not.toBeNull();
  const nestedTrigger = body.getByRole("button", { name: "子を開く" }) as HTMLButtonElement;
  expect(nestedTrigger.type).toBe("button");
  await userEvent.click(nestedTrigger);
  const nested = await body.findByRole("dialog", { name: "子の画面" });
  await userEvent.click(within(nested).getByRole("button", { name: "子を閉じる" }));
  await expect.poll(() => nestedTrigger === document.activeElement).toBe(true);
  await userEvent.click(body.getByRole("button", { name: "閉じる" }));
  await expect.poll(() => body.queryByRole("dialog", { name: "親の画面" })).toBeNull();
  const trigger = view.getByRole("button", { name: "開く" });
  expect((trigger as HTMLButtonElement).type).toBe("button");
  await expect.poll(() => getComputedStyle(trigger).pointerEvents).not.toBe("none");
  await userEvent.click(trigger);
  await body.findByRole("dialog", { name: "親の画面" });
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => document.activeElement).toBe(trigger);
});

test("Drawer can hide the handle without changing dialog semantics", async () => {
  render(Fixture, { initialOpen: true, showHandle: false });
  const dialog = await within(document.body).findByRole("dialog", { name: "親の画面" });
  expect(dialog.querySelector('[data-slot="drawer-handle"]')).toBeNull();
  await userEvent.click(within(dialog).getByRole("button", { name: "閉じる" }));
  await expect.poll(() => within(document.body).queryByRole("dialog")).toBeNull();
});

test("ResponsiveDialog keeps an open mode stable and selects the new mode after closing", async () => {
  await page.viewport(1000, 800);
  const view = render(Fixture, { kind: "responsive" });
  const body = within(document.body);
  await userEvent.click(view.getByRole("button", { name: "開く" }));
  const desktop = await body.findByRole("dialog", { name: "応答する画面" });
  expect(desktop.getAttribute("data-slot")).toBe("dialog-content");
  await page.viewport(500, 800);
  expect(body.getByRole("dialog", { name: "応答する画面" })).toBe(desktop);
  await userEvent.click(body.getByRole("button", { name: "閉じる" }));
  await expect.poll(() => body.queryByRole("dialog")).toBeNull();
  await expect.poll(() => document.activeElement).toBe(view.getByRole("button", { name: "開く" }));
  await expect.poll(() => getComputedStyle(document.body).pointerEvents).not.toBe("none");
  await userEvent.click(view.getByRole("button", { name: "開く" }));
  const mobile = await body.findByRole("dialog", { name: "応答する画面" });
  expect(mobile.getAttribute("data-slot")).toBe("drawer-content");
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => body.queryByRole("dialog")).toBeNull();
  await expect.poll(() => getComputedStyle(document.body).pointerEvents).not.toBe("none");
  await expect.poll(() => document.activeElement).toBe(view.getByRole("button", { name: "開く" }));
});
