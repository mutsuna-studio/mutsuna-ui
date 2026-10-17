import { afterEach, expect } from "vitest";
import { mount, unmount, flushSync, type Component } from "svelte";
import { within } from "storybook/test";
import "../../src/lib/theme.css";
import { reactiveProps } from "./props.svelte.js";

const mounted: { instance: ReturnType<typeof mount>; target: HTMLElement }[] = [];

/** Mount through public imports; dispose effects, portals and actions after each case.
 * Props need not have a string index signature (e.g. HTMLButtonAttributes with required props).
 */
export function render<Props extends object>(component: Component<Props>, props: NoInfer<Props>) {
  const target = document.createElement("div");
  target.style.cssText = "width: 600px; padding: 16px";
  document.body.append(target);
  const instance = mount(component, { target, props: reactiveProps(props) });
  mounted.push({ instance, target });
  flushSync();
  return { target, ...within(target) };
}

afterEach(async () => {
  for (const { instance, target } of mounted.splice(0).reverse()) {
    await unmount(instance);
    target.remove();
  }
  await expect.poll(() => getComputedStyle(document.body).pointerEvents).not.toBe("none");
  document.documentElement.classList.remove("dark");
});
