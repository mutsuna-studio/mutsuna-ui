import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { userEvent } from "storybook/test";
import Probe from "../fixtures/astro/svelte/src/components/AdminShellProbe.svelte";
import { render } from "./render.js";
for (const width of [375, 1280]) {
  test(`default shell keeps one rounded frame and the workspace owns scrolling at ${width}px`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      await page.viewport(width, 812);
      const view = render(Probe, {}); view.target.style.cssText = "width:100%;padding:0";
      const content = view.target.querySelector<HTMLElement>('[data-slot="admin-shell-content"]')!;
      const footer = view.target.querySelector<HTMLElement>('[data-slot="admin-shell-footer"]')!;
      const footerY = footer.getBoundingClientRect().top;
      const style = getComputedStyle(content);
      expect(style.borderRadius).toBe("14px");
      expect(style.borderTopWidth).toBe("1px");
      expect(style.padding).toBe("0px");
      expect(style.scrollbarGutter).toBe("auto");
      expect(style.overflowY).toBe("hidden");
      const workspace = view.getByRole("region", { name: "Shell workspace" });
      expect(workspace.getBoundingClientRect().left).toBe(content.getBoundingClientRect().left + parseFloat(style.borderLeftWidth));
      workspace.scrollTop = 180;
      await expect.poll(() => workspace.scrollTop).toBeGreaterThan(0);
      expect(content.scrollTop).toBe(0);
      expect(content.scrollHeight).toBe(content.clientHeight);
      expect(footer.getBoundingClientRect().top).toBe(footerY);
      expect(content.getBoundingClientRect().bottom).toBeLessThanOrEqual(footerY);
      const action = view.getByRole("button", { name: "Shell action" });
      await userEvent.click(action);
      expect(view.getByLabelText("Shell action count").textContent).toBe("1");
      expect(document.activeElement).toBe(action);
    } finally { await page.viewport(previous.width, previous.height); }
  });
}
test("explicit padding and gutter override defaults without changing the single frame", () => {
  const view = render(Probe, { explicitPadding: "default", explicitGutter: "both-edges" });
  const content = view.target.querySelector<HTMLElement>('[data-slot="admin-shell-content"]')!;
  expect(parseFloat(getComputedStyle(content).paddingLeft)).toBeGreaterThan(0);
  expect(getComputedStyle(content).scrollbarGutter).toBe("stable both-edges");
  expect(getComputedStyle(content).borderRadius).toBe("14px");
});

for (const initiallyOpen of [false, true]) {
  test(`compact sidebar account leaves a small bottom inset in the footer row when ${initiallyOpen ? "expanded" : "collapsed"}`, async () => {
    const previous = { width: innerWidth, height: innerHeight };
    try {
      await page.viewport(1280, 812);
      const view = render(Probe, { initiallyOpen });
      view.target.style.cssText = "width:100%;padding:0";
      const footer = view.target.querySelector<HTMLElement>('[data-slot="admin-shell-footer"]')!;
      const sidebarFooter = view.target.querySelector<HTMLElement>('[data-slot="sidebar-footer"]')!;
      const account = sidebarFooter.querySelector('button')!;
      expect(account.getBoundingClientRect().height).toBe(32);
      expect(sidebarFooter.textContent).not.toContain("user@example.com");
      await expect.poll(() => sidebarFooter.getBoundingClientRect().height).toBe(footer.getBoundingClientRect().height + 8);
      expect(sidebarFooter.getBoundingClientRect().bottom).toBe(812);
      const center = (el: Element) => { const box = el.getBoundingClientRect(); return box.top + box.height / 2; };
      expect(center(account)).toBe(center(footer) - 4);
      footer.style.height = "96px";
      await expect.poll(() => sidebarFooter.getBoundingClientRect().height).toBe(104);
      expect(center(account)).toBe(center(footer) - 4);
      await userEvent.click(account);
      await expect.poll(() => document.querySelector('[data-slot="dropdown-menu-content"]')?.textContent).toContain("user@example.com");
      await userEvent.keyboard("{Escape}");
      expect(document.activeElement).toBe(account);
    } finally { await page.viewport(previous.width, previous.height); }
  });
}
