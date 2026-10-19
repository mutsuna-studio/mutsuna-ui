import { expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import Probe from "../fixtures/astro/svelte/src/components/RoundedScrollbarProbe.svelte";
import { render } from "./render.js";

for (const direction of ["ltr", "rtl"] as const) {
  test(`rounded scrollbar clips the corners and retains keyboard focus and two-axis scrolling in ${direction}`, async () => {
    const view = render(Probe, { direction });
    const area = view.getByRole("region", { name: "角丸のスクロール領域" });
    const box = area.getBoundingClientRect();
    expect(getComputedStyle(area).clipPath).toBe("border-box");
    expect(area.contains(document.elementFromPoint(box.left + 1, box.top + 1))).toBe(false);
    expect(area.contains(document.elementFromPoint(box.right - 1, box.bottom - 1))).toBe(false);
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(area);
    expect(area.matches(":focus-visible")).toBe(true);
    const style = getComputedStyle(area);
    expect(style.outlineStyle).toBe("solid");
    expect(parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth)).toBeLessThanOrEqual(0);
    expect(area.getBoundingClientRect().width).toBe(box.width);
    await userEvent.keyboard("{PageDown}");
    await expect.poll(() => area.scrollTop).toBeGreaterThan(0);
    await userEvent.keyboard(direction === "rtl" ? "{ArrowLeft}" : "{ArrowRight}");
    await expect.poll(() => Math.abs(area.scrollLeft)).toBeGreaterThan(0);
    expect(document.activeElement).toBe(area);
  });
}

test("clipping follows independently rounded corners without changing the frame", () => {
  const view = render(Probe, { radius: "32px 8px 24px 4px" });
  const area = view.getByRole("region", { name: "角丸のスクロール領域" });
  const style = getComputedStyle(area);
  expect([style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius]).toEqual(["32px", "8px", "24px", "4px"]);
  expect(style.clipPath).toBe("border-box");
  expect(style.borderTopWidth).toBe("1px");
});
