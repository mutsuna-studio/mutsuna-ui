import { page } from "vitest/browser";
import { expect, test } from "vitest";
import { userEvent, within } from "storybook/test";
import { OutlineNav } from "@mutsuna/ui/outline-nav";
import { render } from "./render.js";

test("each line has its own preview and navigation target", async () => {
  const selected: string[] = [];
  const view = render(OutlineNav, { items: [{ id: "a", label: "最初の質問" }, { id: "b", label: "次の質問" }], activeId: "a", onNavigate: id => selected.push(id) });
  const first = view.getByRole("button", { name: "1：最初の質問" });
  const second = view.getByRole("button", { name: "2：次の質問" });
  expect(first.getAttribute("aria-current")).toBe("location");
  await page.getByRole("button", { name: "2：次の質問" }).hover();
  await expect.poll(() => within(document.body).queryByRole("dialog", { name: "目次" })?.textContent).toContain("次の質問");
  expect(within(document.body).getByRole("dialog", { name: "目次" }).textContent).toContain("最初の質問");
  expect(getComputedStyle(second).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  await userEvent.click(second);
  expect(selected).toEqual(["b"]);
  first.focus();
  await userEvent.keyboard("{Enter}");
  expect(selected).toEqual(["b", "a"]);
});

test("disabled lines do not navigate", async () => {
  let navigated = false;
  const view = render(OutlineNav, { items: [{ id: "a", label: "項目" }], disabled: true, onNavigate: () => navigated = true });
  const button = view.getByRole("button", { name: "1：項目" }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  button.click();
  expect(navigated).toBe(false);
});


test("heading levels affect indentation and large outlines fit without rail scrolling", async () => {
  const items = Array.from({ length: 40 }, (_, index) => ({ id: String(index), label: `見出し${index}`, level: (index % 3 + 1) as 1 | 2 | 3 }));
  const view = render(OutlineNav, { items, activeId: "1" });
  const nav = view.getByRole("navigation");
  nav.style.height = "240px";
  const lines = nav.querySelector("ol")!;
  expect(lines.scrollHeight).toBeLessThanOrEqual(lines.clientHeight);
  expect(getComputedStyle(lines).overflowY).toBe("hidden");
  const first = view.getByRole("button", { name: "1：見出し0" });
  first.focus();
  await expect.poll(() => within(document.body).queryByRole("dialog", { name: "目次" })).not.toBeNull();
  const dialog = within(document.body).getByRole("dialog", { name: "目次" });
  const heading = within(dialog).getByRole("button", { name: "1 見出し0" });
  const subheading = within(dialog).getByRole("button", { name: "2 見出し1" });
  expect(parseFloat(getComputedStyle(subheading).paddingInlineStart)).toBeGreaterThan(parseFloat(getComputedStyle(heading).paddingInlineStart));
});


test("hovering different lines keeps the full outline in the same place", async () => {
  const view = render(OutlineNav, { items: [{ id: "a", label: "最初" }, { id: "b", label: "次" }] });
  await page.getByRole("button", { name: "1：最初" }).hover();
  const body = within(document.body);
  await expect.poll(() => body.queryByRole("dialog", { name: "目次" })).not.toBeNull();
  const first = body.getByRole("dialog", { name: "目次" });
  await Promise.all(first.getAnimations().map(animation => animation.finished));
  const before = first.getBoundingClientRect();
  await page.getByRole("button", { name: "2：次" }).hover();
  await expect.poll(() => view.getByRole("button", { name: "2：次" }).getAttribute("aria-expanded")).toBe("true");
  await expect.poll(() => body.queryAllByRole("dialog", { name: "目次" }).length).toBe(1);
  const afterDialog = body.getByRole("dialog", { name: "目次" });
  await Promise.all(afterDialog.getAnimations().map(animation => animation.finished));
  const after = afterDialog.getBoundingClientRect();
  expect(after.x).toBeCloseTo(before.x, 0);
  expect(after.y).toBeCloseTo(before.y, 0);
  const lines = view.getAllByRole("button");
  expect(lines[1].getBoundingClientRect().top - lines[0].getBoundingClientRect().top).toBe(12);
});

test("the same panel stays open across lines and scrolls to the hovered item", async () => {
  render(OutlineNav, { items: Array.from({ length: 30 }, (_, i) => ({ id: String(i), label: `項目${i}` })) });
  await page.getByRole("button", { name: "1：項目0" }).hover();
  const body = within(document.body);
  await expect.poll(() => body.queryByRole("dialog", { name: "目次" })).not.toBeNull();
  const dialog = body.getByRole("dialog", { name: "目次" });
  const list = dialog.querySelector("ol")!;
  await page.getByRole("button", { name: "30：項目29" }).hover();
  await expect.poll(() => dialog.querySelector(".previewed")?.textContent).toContain("項目29");
  expect(body.getByRole("dialog", { name: "目次" })).toBe(dialog);
  expect(dialog.getAttribute("data-state")).toBe("open");
  await expect.poll(() => list.scrollTop).toBeGreaterThan(0);
  const hovered = dialog.querySelector(".previewed")!;
  expect(hovered.getBoundingClientRect().bottom).toBeLessThanOrEqual(list.getBoundingClientRect().bottom + 1);
  expect(list.classList.contains("mutsuna-scrollbar")).toBe(true);
  await expect.poll(() => list.getAttribute("data-scrollbar-state")).toBe("visible");
  await page.getByRole("dialog", { name: "目次" }).hover();
  expect(body.getByRole("dialog", { name: "目次" })).toBe(dialog);
  expect(dialog.getAttribute("data-state")).toBe("open");
});
