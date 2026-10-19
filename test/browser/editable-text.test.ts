import { expect, test } from "vitest";
import { userEvent } from "storybook/test";
import { EditableText } from "@mutsuna/ui/editable-text";
import { render } from "./render.js";

test.each([false, true])("editor inherits trigger typography and spacing (multiline=%s)", async (multiline) => {
  const view = render(EditableText, {
    value: multiline ? "文章の一行目\n二行目" : "編集できる文章",
    multiline, "aria-label": "本文", class: "text-xl leading-9 font-semibold px-3 py-2 m-0",
  });
  const trigger = view.getByRole("button", { name: "本文" });
  const before = trigger.getBoundingClientRect();
  const parentHeight = trigger.parentElement!.getBoundingClientRect().height;
  const properties = ["fontSize", "fontFamily", "fontWeight", "lineHeight", "letterSpacing", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginLeft"] as const;
  const computed = getComputedStyle(trigger);
  const styles = Object.fromEntries(properties.map(p => [p, computed[p]]));
  await userEvent.click(trigger);
  const input = view.getByRole("textbox", { name: "本文" });
  for (const property of properties) expect(getComputedStyle(input)[property]).toBe(styles[property]);
  expect(input.getBoundingClientRect().height).toBe(before.height);
  expect(trigger.parentElement).toBeNull();
  expect(input.parentElement!.getBoundingClientRect().height).toBe(parentHeight);
  await userEvent.keyboard("{Escape}");
  expect(view.getByRole("button", { name: "本文" }).getBoundingClientRect().height).toBe(before.height);
});

test("inputClass can explicitly override inherited typography and spacing", async () => {
  const view = render(EditableText, { value: "本文", "aria-label": "本文", class: "text-xl leading-9 px-3", inputClass: "text-sm leading-6 px-1 font-normal italic" });
  await userEvent.click(view.getByRole("button", { name: "本文" }));
  const style = getComputedStyle(view.getByRole("textbox", { name: "本文" }));
  expect(style.fontSize).toBe("14px");
  expect(style.lineHeight).toBe("24px");
  expect(style.paddingLeft).toBe("4px");
  expect(style.fontWeight).toBe("400");
  expect(style.fontStyle).toBe("italic");
});
