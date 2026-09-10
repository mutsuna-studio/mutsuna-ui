<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { expect, userEvent, within } from "storybook/test";
import { ColorPicker } from "@mutsuna/ui/color-picker";

const { Story } = defineMeta({
  title: "Components/Inputs/Color Picker",
  component: ColorPicker,
  tags: ["autodocs"],
});
</script>

<Story
  name="HEX"
  args={{ value: "#191A22", name: "themeColor" }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "色を選択" });
    await userEvent.clear(input);
    await userEvent.type(input, "#FFFFFF");
    await expect(input).toHaveValue("#FFFFFF");
    await userEvent.click(canvas.getByRole("button", { name: /色の表示形式を変更/ }));
    await expect(input).toHaveValue("rgb(255, 255, 255)");
    await userEvent.click(input);
    await expect(input).toHaveAttribute("data-state", "open");
  }}
/>
<Story name="OKLCH" args={{ value: "oklch(62% 0.14 250)" }} />
<Story name="RGB" args={{ value: "rgb(37, 99, 235)" }} />
<Story name="HSL" args={{ value: "hsl(221 83% 53%)" }} />
<Story name="Invalid Input" args={{ value: "not-a-color" }} />
<Story name="Disabled And Required" args={{ value: "#D43008", disabled: true, required: true }} />
