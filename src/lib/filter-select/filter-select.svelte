<script lang="ts" module>
export interface FilterSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
</script>

<script lang="ts">
import ListFilterIcon from "@lucide/svelte/icons/list-filter";
import Button from "@mutsuna/ui/button/button.svelte";
import {
  DropdownMenu,
  DropdownMenuCheckboxGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@mutsuna/ui/dropdown-menu";
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@mutsuna/ui/select";
import { cn } from "../utils.js";

interface Props {
  type?: "single" | "multiple";
  value?: string;
  values?: string[];
  options: readonly FilterSelectOption[];
  ariaLabel: string;
  size?: "sm" | "default";
  class?: string;
  disabled?: boolean;
  fallbackLabel?: string;
  placeholderLabel?: string;
  clearLabel?: string;
  selectedCountSuffix?: string;
}

let {
  type = "multiple",
  value = $bindable(""),
  values = $bindable([]),
  options,
  ariaLabel,
  size = "sm",
  class: className = "w-full sm:w-40",
  disabled = false,
  fallbackLabel = "選択してください",
  placeholderLabel = "フィルター",
  clearLabel = "選択を解除",
  selectedCountSuffix = "件選択",
}: Props = $props();

const selectedLabel = $derived(options.find((option) => option.value === value)?.label ?? fallbackLabel);
const selectedOptions = $derived(options.filter((option) => values.includes(option.value)));
const isMultipleEmpty = $derived(values.length === 0);
const isSingleEmpty = $derived(value === "");
const multipleLabel = $derived.by(() => {
  if (selectedOptions.length === 0) {
    return placeholderLabel;
  }

  if (selectedOptions.length === 1) {
    return selectedOptions[0]?.label ?? fallbackLabel;
  }

  return `${selectedOptions.length}${selectedCountSuffix}`;
});
</script>

{#if type === "multiple"}
  <DropdownMenu>
    <DropdownMenuTrigger disabled={disabled}>
      {#snippet child({ props })}
        <Button
          {...props}
          type="button"
          variant="outline"
          {size}
          class={cn(className, isMultipleEmpty && "border-dashed text-muted-foreground")}
          aria-label={ariaLabel}
          disabled={disabled}
        >
          <ListFilterIcon aria-hidden="true" />
          <span class="truncate">{multipleLabel}</span>
        </Button>
      {/snippet}
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-48">
      {#if !isMultipleEmpty}
        <DropdownMenuItem onclick={() => (values = [])}>
          {clearLabel}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
      {/if}
      <DropdownMenuCheckboxGroup bind:value={values}>
        {#each options as option (option.value)}
          <DropdownMenuCheckboxItem
            value={option.value}
            disabled={option.disabled}
            closeOnSelect={false}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        {/each}
      </DropdownMenuCheckboxGroup>
    </DropdownMenuContent>
  </DropdownMenu>
{:else}
  <SelectRoot type="single" bind:value {disabled}>
    <SelectTrigger
      {size}
      class={cn(className, isSingleEmpty && "border-dashed text-muted-foreground")}
      aria-label={ariaLabel}
    >
      <ListFilterIcon aria-hidden="true" />
      <span class="truncate">{selectedLabel}</span>
    </SelectTrigger>
    <SelectContent>
      {#each options as option (option.value)}
        <SelectItem value={option.value} disabled={option.disabled}>{option.label}</SelectItem>
      {/each}
    </SelectContent>
  </SelectRoot>
{/if}
