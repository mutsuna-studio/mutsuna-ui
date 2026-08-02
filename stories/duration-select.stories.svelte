<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import DurationSelect from "@mutsuna/ui/duration-select/duration-select.svelte";

const { Story } = defineMeta({
  title: "UI/Duration Select",
  component: DurationSelect,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
const options = [
  { value: "30", label: "30分" },
  { value: "60", label: "1時間" },
  { value: "90", label: "1時間30分" },
];

let duration = $state("60");
</script>

<Story name="Default" asChild>
  <div class="grid max-w-xs gap-2">
    <DurationSelect name="duration" bind:value={duration} {options} />
    <p class="text-sm text-muted-foreground">選択値: {duration}分</p>
  </div>
</Story>
