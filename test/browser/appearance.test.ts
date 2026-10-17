import { expect, test } from "vitest";
import { cdp } from "vitest/browser";
import { flushSync } from "svelte";
import { CustomerAvatar } from "@mutsuna/ui/avatar";
import { Loading, loadingVariants } from "@mutsuna/ui/loading";
import { RollingText } from "@mutsuna/ui/rolling-text";
import { Button } from "@mutsuna/ui/button";
import { Badge } from "@mutsuna/ui/badge";
import { render } from "./render.js";
import { reactiveProps } from "./props.svelte.js";

async function reducedMotion(value: "reduce" | "no-preference") {
  await cdp().send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value }] });
}

test("Avatar blend modes stay inside its stacking context in light and dark themes", () => {
  const view = render(CustomerAvatar, { id: "sample", name: "サンプル" });
  const avatar = view.getByRole("img", { name: "サンプル" });
  expect(getComputedStyle(avatar).isolation).toBe("isolate");
  expect(getComputedStyle(avatar, "::after").mixBlendMode).toBe("darken");
  document.documentElement.classList.add("dark");
  expect(getComputedStyle(avatar, "::after").mixBlendMode).toBe("lighten");
});

test("Loading: every registered variant renders a named status and honors reduced motion", async () => {
  expect(loadingVariants.length).toBeGreaterThan(0);
  const views = loadingVariants.map(variant => render(Loading, { variant, label: `処理中 ${variant}` }));
  for (const [index, view] of views.entries()) {
    expect(view.getByRole("status", { name: `処理中 ${loadingVariants[index]}` })).toBeTruthy();
  }
  await reducedMotion("reduce");
  try {
    for (const view of views) {
      const animated = Array.from(view.target.querySelectorAll("*")).filter(element => getComputedStyle(element).animationName !== "none");
      // Generated patterns may use a minimal-duration animation rather than removing it.
      for (const element of animated) expect(parseFloat(getComputedStyle(element).animationDuration)).toBeLessThanOrEqual(0.01);
    }
  } finally { await reducedMotion("no-preference"); }
});

test("RollingText suppresses movement when the OS requests reduced motion", async () => {
  await reducedMotion("reduce");
  try {
    const props = reactiveProps({ value: "HEX" });
    const view = render(RollingText, props);
    flushSync(() => props.value = "OKLCH");
    expect(view.target.getAnimations({ subtree: true })).toHaveLength(0);
    expect(view.target.textContent).toContain("OKLCH");
  } finally { await reducedMotion("no-preference"); }
});

test("destructive Button and Badge retain the same text surface on hover", async () => {
  const { userEvent } = await import("storybook/test");
  const button = render(Button, { variant: "destructive", "aria-label": "削除" }).getByRole("button", { name: "削除" });
  const badge = render(Badge, { variant: "destructive", "aria-label": "エラー" }).target.firstElementChild!;
  for (const element of [button, badge]) {
    const background = getComputedStyle(element).backgroundColor;
    await userEvent.hover(element);
    void getComputedStyle(element).backgroundColor;
    await Promise.all(element.getAnimations().map(animation => animation.finished));
    expect(getComputedStyle(element).backgroundColor).toBe(background);
    await userEvent.unhover(element);
  }
});
