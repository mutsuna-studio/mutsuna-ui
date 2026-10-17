import { expect, test } from "vitest";
import { userEvent } from "storybook/test";
import { Input } from "@mutsuna/ui/input";
import { Textarea } from "@mutsuna/ui/textarea";
import { Switch } from "@mutsuna/ui/switch";
import { Slider } from "@mutsuna/ui/slider";
import { render } from "./render.js";

type FieldProps = { label?: string; placeholder?: string; readonly?: boolean; disabled?: boolean; "aria-invalid"?: "true"; "aria-describedby"?: string; value?: string };
for (const [name, mountField] of [
  ["Input", (props: FieldProps) => render(Input, props)],
  ["Textarea", (props: FieldProps) => render(Textarea, props)],
] as const) {
  test(`${name}: label, placeholder and focus/value states remain independent`, async () => {
    const view = mountField( { label: "表示名", placeholder: "入力例" });
    const control = view.getByRole("textbox", { name: "表示名" }) as HTMLInputElement;
    const label = view.getByText("表示名", { selector: "label" });
    const top = () => label.getBoundingClientRect().top;
    const initial = top();
    expect(control.placeholder).toBe("入力例");
    await userEvent.click(label);
    expect(document.activeElement).toBe(control);
    await expect.poll(top).toBeLessThan(initial);
    expect(getComputedStyle(control).boxShadow).toBe("none");
    const outline = control.parentElement?.querySelector("fieldset") ?? control;
    for (const side of ["Top", "Right", "Bottom", "Left"] as const) expect(getComputedStyle(outline)[`border${side}Width`]).toBe("1px");
    await userEvent.type(control, "サンプル");
    await userEvent.tab();
    await expect.poll(top).toBeLessThan(initial);
    await userEvent.clear(control);
    await userEvent.tab();
    await expect.poll(top).toBeCloseTo(initial, 0);
    const plain = mountField( { placeholder: "ラベルなし" });
    expect(plain.target.querySelector("label")).toBeNull();
    expect((plain.getByPlaceholderText("ラベルなし") as HTMLInputElement).placeholder).toBe("ラベルなし");
  });

  test(`${name}: readonly, disabled and error attributes reach the control`, () => {
    const view = mountField( { label: "状態", readonly: true, disabled: true, "aria-invalid": "true", "aria-describedby": "error", value: "保持する値" });
    const control = view.getByRole("textbox", { name: "状態" }) as HTMLInputElement;
    expect(control.readOnly).toBe(true);
    expect(control.disabled).toBe(true);
    expect(control.value).toBe("保持する値");
    expect(control.getAttribute("aria-invalid")).toBe("true");
    expect(control.getAttribute("aria-describedby")).toBe("error");
  });
}

test("Switch: keyboard toggles state, disabled stays unchanged, sizes preserve operation area", async () => {
  const view = render(Switch, { "aria-label": "通知", checked: false });
  const control = view.getByRole("switch", { name: "通知" });
  await userEvent.tab();
  expect(document.activeElement).toBe(control);
  await userEvent.keyboard(" ");
  await expect.poll(() => control.getAttribute("aria-checked")).toBe("true");
  const small = render(Switch, { "aria-label": "無効", size: "sm", disabled: true });
  const disabled = small.getByRole("switch", { name: "無効" }) as HTMLButtonElement;
  expect(disabled.disabled).toBe(true);
  expect(disabled.getAttribute("aria-checked")).toBe("false");
  expect(control.getBoundingClientRect().width).toBe(36);
  expect(control.getBoundingClientRect().height).toBe(20);
  expect(disabled.getBoundingClientRect().width).toBe(28);
  expect(disabled.getBoundingClientRect().height).toBe(16);
  const hitArea = getComputedStyle(disabled, "::before");
  expect(parseFloat(hitArea.height)).toBeGreaterThanOrEqual(28);
});

test("Slider: generated thumbs expose labels, formatted values and keyboard changes", async () => {
  const changes: number[][] = [];
  const view = render(Slider, { type: "multiple", value: [20, 80], min: 0, max: 100, step: 5,
    thumbLabels: ["最低価格", "最高価格"], getThumbValueText: (value: number) => `${value}万円`, onValueChange: (value: number[]) => changes.push(value) });
  const first = view.getByRole("slider", { name: "最低価格" });
  const last = view.getByRole("slider", { name: "最高価格" });
  expect(view.getAllByRole("slider")).toHaveLength(2);
  expect(first.getAttribute("aria-valuetext")).toBe("20万円");
  expect(last.getAttribute("aria-valuetext")).toBe("80万円");
  first.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect.poll(() => first.getAttribute("aria-valuenow")).toBe("25");
  expect(changes.at(-1)).toEqual([25, 80]);
  expect(getComputedStyle(first).boxShadow).toBe("none");
});

test("Slider: vertical keyboard axis and disabled values remain accessible", async () => {
  const vertical = render(Slider, { type: "single", value: 40, min: 0, max: 100, orientation: "vertical", "aria-label": "縦方向" });
  const control = vertical.getByRole("slider", { name: "縦方向" });
  expect(control.getAttribute("aria-orientation")).toBe("vertical");
  control.focus();
  await userEvent.keyboard("{ArrowUp}");
  await expect.poll(() => control.getAttribute("aria-valuenow")).toBe("41");
  const disabled = render(Slider, { type: "single", value: 40, disabled: true, "aria-label": "固定値" });
  const fixed = disabled.getByRole("slider", { name: "固定値" });
  expect(fixed.getAttribute("aria-disabled")).toBe("true");
  expect(fixed.tabIndex).toBe(-1);
});

test("TimePicker accepts full-width numeric input and commits hours without replacing minutes", async () => {
  const { TimePicker } = await import("@mutsuna/ui/time-picker");
  const { within } = await import("storybook/test");
  const view = render(TimePicker, { value: "09:30" });
  const trigger = view.getByRole("button", { name: "時間" });
  await userEvent.click(trigger);
  const hours = await within(document.body).findByRole("spinbutton", { name: "時" });
  await userEvent.clear(hours);
  await userEvent.type(hours, "１２");
  await userEvent.keyboard("{Enter}");
  await expect.poll(() => trigger.textContent).toContain("12");
  expect(trigger.textContent).toContain("30");
  await userEvent.keyboard("{Escape}");
});
