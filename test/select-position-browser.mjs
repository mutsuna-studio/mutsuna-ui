import assert from "node:assert/strict";

export async function verifySelectPosition(page, url) {
  // Keep responsive Dialog/Sidebar focus restoration out of this geometry check.
  await page.goto(new URL("select-position/", url).href);
  await page.waitForFunction(() => !document.querySelector("astro-island[ssr]"));
  await page.setViewportSize({ width: 1280, height: 720 });
  const input = page.getByRole("combobox", { name: "Resize select", exact: true });
  await input.click();
  const list = page.getByRole("listbox");
  await list.waitFor({ state: "visible" });
  const expectWidth = async (width) => {
    await page.waitForFunction(width => {
      const list = document.querySelector('[role="listbox"]');
      return list && Math.abs(list.getBoundingClientRect().width - width) < 1;
    }, width);
    assert.equal(await input.getAttribute("aria-expanded"), "true");
    assert.equal(await input.evaluate(element => element === document.activeElement), true);
  };
  await expectWidth(300);
  await page.locator("#select-container").evaluate(element => { element.style.width = "420px"; });
  await expectWidth(420);
  // Exercise the same open list repeatedly, including the return to desktop.
  for (let cycle = 0; cycle < 5; cycle++) {
    await page.setViewportSize({ width: 390, height: 500 });
    await expectWidth(374);
    await page.setViewportSize({ width: 1280, height: 720 });
    await expectWidth(420);
  }
  await input.press("Escape");
  await list.waitFor({ state: "detached" });
  console.log("Astro Select: container resize and five mobile/desktop cycles passed");
}
