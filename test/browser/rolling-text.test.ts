import { expect, test } from "vitest";
import { flushSync } from "svelte";
import { RollingText, type RollingTextProps } from "@mutsuna/ui/rolling-text";
import { reactiveProps } from "./props.svelte.js";
import { render } from "./render.js";

test("RollingText reserves candidate width and clips transitions while announcing the current value", async () => {
  const state = reactiveProps<RollingTextProps>({ value: "HEX", widthValues: ["HEX", "OKLCH"], "aria-live": "polite" });
  const view = render(RollingText, state);
  const root = view.target.querySelector<HTMLElement>('[data-slot="rolling-text"]')!;
  const width = root.getBoundingClientRect().width;
  expect(getComputedStyle(root).overflow).toBe("hidden");
  expect(root.getAttribute("aria-live")).toBe("polite");
  expect(getComputedStyle(root).textAlign).toBe("start");
  flushSync(() => { state.value = "RGB"; state.direction = "down"; state.duration = 500; state.align = "end"; });
  await expect.poll(() => root.getAttribute("data-direction")).toBe("down");
  expect(root.getBoundingClientRect().width).toBeCloseTo(width, 0);
  expect(getComputedStyle(root).textAlign).toBe("end");
  const animations = root.getAnimations({ subtree: true });
  expect(animations.length).toBe(2);
  expect(animations.every(animation => animation.effect?.getTiming().duration === 500)).toBe(true);
  expect(root.querySelector('.sr-only')?.textContent).toBe("RGB");
  await expect.poll(() => root.getAnimations({ subtree: true }).length).toBe(0);
});

test("RollingText forwards wheel directions and keeps per-instance gesture state", () => {
  const calls: string[] = [];
  const first = render(RollingText, { value: "A", onPrevious: () => calls.push("previous"), onNext: () => calls.push("next") });
  const second = render(RollingText, { value: "B", onNext: () => calls.push("second") });
  const root = first.target.querySelector<HTMLElement>('[data-slot="rolling-text"]')!;
  root.dispatchEvent(new WheelEvent("wheel", { deltaY: -10, cancelable: true }));
  flushSync();
  expect(root.getAttribute("data-direction")).toBe("up");
  second.target.querySelector('[data-slot="rolling-text"]')!.dispatchEvent(new WheelEvent("wheel", { deltaY: 10, cancelable: true }));
  expect(calls).toEqual(["previous", "second"]);
});
