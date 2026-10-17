import { expect, test } from "vitest";
import { userEvent, within } from "storybook/test";
import { ColorPicker } from "@mutsuna/ui/color-picker";
import { render } from "./render.js";

test("ColorPicker previews its value, opens on click and keeps the input while cycling formats", async () => {
  const view = render(ColorPicker, { value: "#191A22" });
  const input = view.getByRole("textbox", { name: "色を選択" }) as HTMLInputElement;
  const background = getComputedStyle(input).backgroundColor;
  expect(background).toBe("rgb(25, 26, 34)");
  await userEvent.click(input);
  await expect.poll(() => input.getAttribute("data-state")).toBe("open");
  expect(document.activeElement).toBe(input);
  expect(getComputedStyle(input).backgroundColor).toBe(background);
  expect(getComputedStyle(input).boxShadow).toBe("none");
  expect(getComputedStyle(input).caretColor).not.toBe("rgba(0, 0, 0, 0)");
  const formatButton = view.getByRole("button", { name: /色の表示形式を変更/ });
  await userEvent.click(formatButton);
  await expect.poll(() => input.value).toBe("rgb(25, 26, 34)");
  expect(view.getByRole("textbox", { name: "色を選択" })).toBe(input);
  expect(getComputedStyle(input).backgroundColor).toBe(background);
});

test("ColorPicker validates typed values and outside interaction keeps the new focus target", async () => {
  const view = render(ColorPicker, { value: "#191A22" });
  const input = view.getByRole("textbox", { name: "色を選択" }) as HTMLInputElement;
  const outside = document.createElement("button");
  outside.textContent = "次の操作";
  view.target.append(outside);
  await userEvent.click(input);
  await userEvent.clear(input);
  await userEvent.type(input, "#FFFFFF");
  await userEvent.click(outside);
  await expect.poll(() => input.getAttribute("data-state")).toBe("closed");
  expect(document.activeElement).toBe(outside);
  await expect.poll(() => getComputedStyle(input).backgroundColor).toBe("rgb(255, 255, 255)");
  await userEvent.click(input);
  await userEvent.clear(input);
  await userEvent.type(input, "invalid");
  await userEvent.tab();
  await expect.poll(() => input.getAttribute("aria-invalid")).toBe("true");
  expect(within(document.body).getByRole("alert").textContent).toBeTruthy();
});

test("ColorPicker wheel changes format once per gesture in both directions", async () => {
  const view = render(ColorPicker, { value: "#191A22" });
  const input = view.getByRole("textbox", { name: "色を選択" }) as HTMLInputElement;
  const format = input;
  format.dispatchEvent(new WheelEvent("wheel", { deltaY: 10, bubbles: true, cancelable: true }));
  format.dispatchEvent(new WheelEvent("wheel", { deltaY: 10, bubbles: true, cancelable: true }));
  await expect.poll(() => input.value).toBe("rgb(25, 26, 34)");
  await new Promise(resolve => setTimeout(resolve, 180));
  format.dispatchEvent(new WheelEvent("wheel", { deltaY: -10, bubbles: true, cancelable: true }));
  await expect.poll(() => input.value).toBe("#191A22");
});
