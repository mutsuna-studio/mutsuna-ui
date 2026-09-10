<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { OklchColorPicker } from "@mutsuna/ui/oklch-color-picker";

const { Story } = defineMeta({
  title: "Components/Inputs/OKLCH Color Picker (Compatibility)",
  component: OklchColorPicker,
  tags: ["autodocs"],
});
</script>

<Story name="Legacy Export" args={{ value: "oklch(62% 0.14 250)", name: "themeColor" }} />
