<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { RollingText } from "@mutsuna/ui/rolling-text";

const { Story } = defineMeta({
  title: "Components/Data Display/Rolling Text",
  component: RollingText,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
const values = ["HEX", "RGB", "HSL", "OKLCH"];
const longValues = [
  "幅が限られた場所で表示する長いテキスト",
  "省略された状態でも滑らかに切り替わる別のテキスト",
];
let index = $state(0);
let reverseIndex = $state(values.length - 1);
let longIndex = $state(0);
</script>

<Story name="Wheel" asChild>
  <div class="flex flex-col items-start gap-6">
    <button type="button" class="inline-flex min-w-32 items-center justify-between rounded-lg border px-3 py-2 text-sm" onclick={() => index = (index + 1) % values.length}>
      <RollingText value={values[index]!} widthValues={values} aria-live="polite" onPrevious={() => index = (index - 1 + values.length) % values.length} onNext={() => index = (index + 1) % values.length} />
      <span aria-hidden="true">↑↓</span>
    </button>
    <button type="button" class="inline-flex min-w-32 items-center justify-between rounded-lg border px-3 py-2 text-sm" onclick={() => reverseIndex = (reverseIndex - 1 + values.length) % values.length}>
      <RollingText value={values[reverseIndex]!} widthValues={values} direction="down" aria-live="polite" onPrevious={() => reverseIndex = (reverseIndex + 1) % values.length} onNext={() => reverseIndex = (reverseIndex - 1 + values.length) % values.length} />
      <span aria-hidden="true">↓</span>
    </button>
    <div class="grid gap-2">
      <span class="text-xs text-muted-foreground">狭い幅での省略表示</span>
      <button type="button" class="inline-flex w-48 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm" onclick={() => longIndex = (longIndex + 1) % longValues.length}>
        <RollingText value={longValues[longIndex]!} widthValues={longValues} aria-live="polite" class="min-w-0 flex-1" onPrevious={() => longIndex = (longIndex - 1 + longValues.length) % longValues.length} onNext={() => longIndex = (longIndex + 1) % longValues.length} />
        <span class="shrink-0" aria-hidden="true">↑↓</span>
      </button>
    </div>
  </div>
</Story>
