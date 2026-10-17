import { afterEach, expect, test, vi } from "vitest";
import { userEvent, within } from "storybook/test";
import { Toaster, showToast, showErrorToast } from "@mutsuna/ui/sonner";
import { toast } from "svelte-sonner";
import { render } from "./render.js";

afterEach(() => { toast.dismiss(); vi.restoreAllMocks(); });

test("Toast copy feedback keeps the toast and remaining-time animation, then restores its label", async () => {
  const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
  render(Toaster, { duration: 10000, closeButton: true });
  showToast("保存しました", "表示するメッセージ", { detail: "コピーだけの詳細" });
  const body = within(document.body);
  await body.findByText("保存しました");
  const copy = body.getByRole("button", { name: "コピー" });
  const notification = copy.closest<HTMLElement>('[data-sonner-toast]')!;
  const progress = () => notification.getAnimations({ subtree: true }).find(animation => animation instanceof CSSAnimation && animation.animationName.includes("mutsuna-toast-progress"));
  await expect.poll(progress).toBeDefined();
  const original = progress();
  const mask = getComputedStyle(copy, "::before").maskImage;
  const pseudo = getComputedStyle(notification, "::after");
  expect(pseudo.height).toBe("2px");
  expect(pseudo.opacity).toBe("0.55");
  await userEvent.hover(notification);
  expect(getComputedStyle(notification, "::after").animationPlayState).toBe("paused");
  await userEvent.click(copy);
  await expect.poll(() => copy.getAttribute("aria-label")).toBe("コピーしました");
  expect(write).toHaveBeenCalledWith("タイトル: 保存しました\nメッセージ: 表示するメッセージ\nエラー詳細: コピーだけの詳細");
  expect(getComputedStyle(copy, "::before").maskImage).not.toBe(mask);
  expect(progress()).toBe(original);
  expect(copy.closest('[data-sonner-toast]')).toBe(notification);
  await expect.poll(() => copy.textContent, { timeout: 3500 }).toBe("コピー");
  expect(getComputedStyle(copy, "::before").maskImage).toBe(mask);
  expect(progress()).toBe(original);
});

test("Toast keeps copy and close controls inside a one-line notification and aligns multi-line icons", async () => {
  render(Toaster, { duration: 10000, closeButton: true });
  showErrorToast("一行のエラー");
  const copy = await within(document.body).findByRole("button", { name: "コピー" });
  const notification = copy.closest<HTMLElement>('[data-sonner-toast]')!;
  const close = notification.querySelector<HTMLElement>('[data-close-button]')!;
  await expect.poll(() => notification.getBoundingClientRect().height).toBeGreaterThanOrEqual(60);
  const copyRect = copy.getBoundingClientRect(), closeRect = close.getBoundingClientRect(), rect = notification.getBoundingClientRect();
  expect(closeRect.bottom).toBeLessThanOrEqual(copyRect.top);
  expect(copyRect.bottom).toBeLessThanOrEqual(rect.bottom);
  expect(closeRect.top).toBeGreaterThanOrEqual(rect.top);
  expect(getComputedStyle(notification.querySelector('[data-icon]')!).alignSelf).toBe("flex-start");
});
