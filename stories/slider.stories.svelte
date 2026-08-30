<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { Slider } from "@mutsuna/ui/slider";
import { expect, userEvent, within } from "storybook/test";

const { Story } = defineMeta({
  title: "UI/Slider",
  component: Slider,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
let volume = $state(50);
let priceRange = $state([20, 80]);
let verticalValue = $state(65);
</script>

<Story
  name="States"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const volumeSlider = canvas.getByRole("slider", { name: "音量" });

    await userEvent.tab();
    await expect(volumeSlider).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(volumeSlider).toHaveAttribute("aria-valuenow", "51");
    await expect(canvas.getByText("51%")).toBeVisible();
  }}
  asChild
>
  <div class="grid max-w-md gap-8">
    <label class="grid gap-2 text-sm">
      <span class="flex justify-between"><span>音量</span><output>{volume}%</output></span>
      <Slider type="single" bind:value={volume} min={0} max={100} step={1} aria-label="音量" />
    </label>
    <div class="grid gap-2 text-sm">
      <span>価格帯: {priceRange[0]}〜{priceRange[1]}万円</span>
      <Slider
        type="multiple"
        bind:value={priceRange}
        min={0}
        max={100}
        step={5}
        aria-label="価格帯"
        thumbLabels={["最低価格", "最高価格"]}
        getThumbValueText={(value) => `${value}万円`}
      />
    </div>
    <label class="grid gap-2 text-sm">
      <span>変更できない値</span>
      <Slider type="single" value={40} min={0} max={100} disabled aria-label="変更できない値" />
    </label>
    <div class="flex h-40 items-center gap-3 text-sm">
      <Slider type="single" bind:value={verticalValue} min={0} max={100} orientation="vertical" aria-label="縦方向の値" />
      <output>{verticalValue}%</output>
    </div>
  </div>
</Story>
