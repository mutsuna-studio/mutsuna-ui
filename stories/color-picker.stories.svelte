<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ColorPicker } from "@mutsuna/ui/color-picker";

const { Story } = defineMeta({
  title: "Components/Inputs/Color Picker",
  component: ColorPicker,
  tags: ["autodocs"],
});
</script>

<Story name="Playground"
  args={{ value: "#191A22", name: "themeColor" }} />
<Story name="HEX Interaction Test"
  args={{ value: "#191A22", name: "themeColor" }}
  tags={["!dev", "!autodocs"]}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "色を選択" });
    await userEvent.clear(input);
    await userEvent.type(input, "#FFFFFF");
    await expect(input).toHaveValue("#FFFFFF");
    await userEvent.click(canvas.getByRole("button", { name: /色の表示形式を変更/ }));
    await waitFor(() => expect(input).toHaveValue("rgb(255, 255, 255)"));
    await userEvent.click(input);
    await expect(input).toHaveAttribute("data-state", "open");
  }} />






<Story name="States" asChild parameters={{ controls: { disable: true } }}>
  <div class="grid max-w-3xl gap-5 sm:grid-cols-2">
    <div class="grid gap-2"><span class="text-sm">HEX</span><ColorPicker id="color-state-1" aria-label="HEX形式" value="#191A22" /></div>
    <div class="grid gap-2"><span class="text-sm">OKLCH</span><ColorPicker id="color-state-2" aria-label="OKLCH形式" value="oklch(62% 0.14 250)" /></div>
    <div class="grid gap-2"><span class="text-sm">RGB</span><ColorPicker id="color-state-3" aria-label="RGB形式" value="rgb(37, 99, 235)" /></div>
    <div class="grid gap-2"><span class="text-sm">HSL</span><ColorPicker id="color-state-4" aria-label="HSL形式" value="hsl(221 83% 53%)" /></div>
    <div class="grid gap-2"><span class="text-sm">不正な値</span><ColorPicker id="color-state-5" aria-label="不正な色" value="not-a-color" /></div>
    <div class="grid gap-2"><span class="text-sm">必須・操作不可</span><ColorPicker id="color-state-6" aria-label="操作できない色" value="#D43008" disabled required /></div>
  </div>
</Story>
