<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import TimeSelect from "@mutsuna/ui/time-select/time-select.svelte";

const { Story } = defineMeta({
  title: "UI/Time Select",
  component: TimeSelect,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
let value = $state("09:30");
</script>

<Story name="Default" asChild>
  <div class="grid max-w-xs gap-2">
    <TimeSelect bind:value />
    <p class="text-sm text-muted-foreground">選択時刻: {value}</p>
  </div>
</Story>

<Story name="Disabled" asChild>
  <TimeSelect value="18:00" disabled />
</Story>
