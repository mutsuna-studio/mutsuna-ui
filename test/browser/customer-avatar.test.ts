import { expect, test } from "vitest";
import { CustomerAvatar } from "@mutsuna/ui/avatar";
import { render } from "./render.js";

test("avatar shape changes the silhouette of the fallback and border, preserving the seed and size", () => {
  const circle = render(CustomerAvatar, { id: "same-user", name: "同じユーザー" }).getByRole("img");
  const rounded = render(CustomerAvatar, { id: "same-user", name: "同じユーザー", shape: "rounded" }).getByRole("img");
  const fallback = (element: Element) => element.querySelector('[data-slot="avatar-fallback"]')!;
  expect(getComputedStyle(fallback(circle)).backgroundImage).toBe(getComputedStyle(fallback(rounded)).backgroundImage);
  expect(circle.getBoundingClientRect().width).toBe(rounded.getBoundingClientRect().width);
  expect(getComputedStyle(circle).borderRadius).not.toBe(getComputedStyle(rounded).borderRadius);
  for (const avatar of [circle, rounded]) {
    expect(getComputedStyle(fallback(avatar)).borderRadius).toBe(getComputedStyle(avatar).borderRadius);
    expect(getComputedStyle(avatar, "::after").borderRadius).toBe(getComputedStyle(avatar).borderRadius);
  }
});
