<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { OklchColorPicker } from "@mutsuna/ui/oklch-color-picker";

const { Story } = defineMeta({
  title: "UI/OKLCH Color Picker",
  component: OklchColorPicker,
  tags: ["autodocs"],
});
</script>

<Story name="Initial Value" args={{ value: "oklch(62% 0.14 250)", name: "themeColor" }} />

<Story name="Preset Colors" args={{ value: "oklch(62% 0.14 165)", name: "themeColor" }} />

<Story name="Direct Input And Sliders" args={{ value: "oklch(70% 0.18 145)" }} />

<Story name="Invalid Input" args={{ value: "oklch(120% 0.14 250)" }} />

<Story name="Disabled And Required" args={{ value: "oklch(52% 0.2 30)", disabled: true, required: true }} />
