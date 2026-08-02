<script lang="ts">
import { Select as SelectRoot, SelectContent, SelectItem, SelectTrigger } from "@mutsuna/ui/select";

type DurationOption = {
  readonly value: string;
  readonly label: string;
};

interface Props {
  name: string;
  value?: string;
  options: readonly DurationOption[];
  placeholder?: string;
  onValueChange?: (value: string) => void;
}

let { name, value = $bindable(""), options, placeholder = "選択", onValueChange }: Props = $props();

const emptySelectValue = "__duration_select_empty__";
let selectedValue = $state(toSelectValue(value));
const selectedLabel = $derived(options.find((option) => option.value === value)?.label ?? (value === "" ? placeholder : `${value}分`));

$effect(() => {
  const nextSelectedValue = toSelectValue(value);
  if (selectedValue !== nextSelectedValue) {
    selectedValue = nextSelectedValue;
  }
});

function toSelectValue(optionValue: string): string {
  return optionValue === "" ? emptySelectValue : optionValue;
}

function fromSelectValue(optionValue: string): string {
  return optionValue === emptySelectValue ? "" : optionValue;
}

function handleValueChange(nextSelectedValue: string): void {
  const nextValue = fromSelectValue(nextSelectedValue);
  value = nextValue;
  onValueChange?.(nextValue);
}
</script>

<SelectRoot type="single" bind:value={selectedValue} onValueChange={handleValueChange}>
  <SelectTrigger class="w-full">
    <span class="truncate">{selectedLabel}</span>
  </SelectTrigger>
  <SelectContent>
    {#each options as option (option.value)}
      <SelectItem value={toSelectValue(option.value)}>{option.label}</SelectItem>
    {/each}
  </SelectContent>
</SelectRoot>
<input type="hidden" {name} {value} />
