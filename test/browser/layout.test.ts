import { createRawSnippet } from "svelte";
import { expect, test } from "vitest";
import { page, userEvent as browserUserEvent } from "vitest/browser";
import { userEvent } from "storybook/test";
import { ScrollbarArea } from "@mutsuna/ui/scrollbar";
import Fixture from "./layout-fixture.svelte";
import { render } from "./render.js";

for (const breadcrumb of [false, true]) {
  test(`AdminShellFrame exposes page heading with breadcrumb=${breadcrumb} and fills the content width`, async () => {
    await page.viewport(1100, 800);
    const view = render(Fixture, { breadcrumb });
    view.target.style.width = "1000px";
    const heading = view.getByRole("heading", { level: 1, name: "コンポーネント一覧" });
    expect(heading.textContent).toBe("コンポーネント一覧");
    const content = view.target.querySelector<HTMLElement>('[data-test-content]')!;
    const surface = content.parentElement!;
    expect(content.getBoundingClientRect().width).toBeGreaterThan(400);
    expect(getComputedStyle(surface).display).not.toBe("flex");
    expect(getComputedStyle(surface).scrollbarGutter).toBe("stable");
    expect(surface.scrollHeight).toBeGreaterThan(surface.clientHeight);
    const trigger = view.getByRole("button", { name: "Toggle Sidebar" });
    for (const control of [trigger, view.getByRole("button", { name: "ヘルプ" })]) {
      expect(control.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
      expect(control.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
    }
    const workspace = view.getByRole("button", { name: /UIライブラリ/ });
    await userEvent.click(trigger);
    await expect.poll(() => workspace.querySelector('svg')!.getBoundingClientRect().width).toBeGreaterThan(0);
  });
}

test("AdminShellFrame supports nested scrolling and edge-to-edge mobile content", async () => {
  await page.viewport(500, 800);
  const view = render(Fixture, { padding: "none", gutter: "auto" });
  view.target.style.cssText = "width: 100%; padding: 0";
  const content = view.target.querySelector<HTMLElement>('[data-test-content]')!;
  const surface = content.parentElement!;
  expect(getComputedStyle(surface).scrollbarGutter).toBe("auto");
  expect(getComputedStyle(surface).paddingLeft).toBe("0px");
  expect(getComputedStyle(surface).paddingRight).toBe("0px");
  expect(getComputedStyle(surface).marginLeft).toBe("0px");
  expect(getComputedStyle(surface).marginRight).toBe("0px");
  expect(getComputedStyle(surface).borderBottomWidth).toBe("1px");
  expect(parseFloat(getComputedStyle(surface).borderBottomLeftRadius)).toBeGreaterThan(0);
});

test("ScrollbarArea keeps its keyboard focus and configurable gutter contract", async () => {
  const stable = render(ScrollbarArea, { tabindex: 0, style: "height: 100px; overflow: auto", children: createRawSnippet(() => ({ render: () => '<div style="height: 1000px">本文</div>' })) });
  const auto = render(ScrollbarArea, { gutter: "auto" });
  const element = stable.target.firstElementChild as HTMLElement;
  expect(getComputedStyle(element).scrollbarGutter).toBe("stable");
  expect(getComputedStyle(auto.target.firstElementChild!).scrollbarGutter).toBe("auto");
  await userEvent.tab();
  expect(document.activeElement).toBe(element);
  const initial = getComputedStyle(element, "::-webkit-scrollbar-thumb").backgroundColor;
  await browserUserEvent.keyboard("{ArrowDown}");
  await expect.poll(() => element.scrollTop).toBeGreaterThan(0);
  await expect.poll(() => element.dataset.scrollbarState).toBe("visible");
  expect(getComputedStyle(element, "::-webkit-scrollbar-thumb").backgroundColor).not.toBe(initial);
});
