<script module lang="ts">
export interface CycleSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CycleSelectProps {
  options: readonly CycleSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  ariaLabel: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  size?: "sm" | "default";
  class?: string;
  placeholder?: string;
  nextLabel?: string;
  listLabel?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}
</script>

<script lang="ts">
import { ButtonGroup } from "../button-group/index.js";
import { selectTriggerClass } from "../select/trigger-style.js";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../select/index.js";
import { cn } from "../utils.js";

let {
  options, value = $bindable(""), onValueChange, ariaLabel, id, name,
  disabled = false, size = "default", class: className,
  placeholder = "選択してください", nextLabel = "次の候補", listLabel = "候補一覧",
  "aria-invalid": invalid, "aria-describedby": describedBy,
}: CycleSelectProps = $props();

let anchor = $state<HTMLDivElement | null>(null);

const selected = $derived(options.find((option) => option.value === value));
const next = $derived.by(() => {
  const currentIndex = options.findIndex((option) => option.value === value);
  for (let offset = 1; offset <= options.length; offset++) {
    const option = options[(currentIndex + offset) % options.length];
    if (option && !option.disabled && option.value !== value) return option;
  }
  return undefined;
});

function advance() {
  if (disabled || !next) return;
  value = next.value;
  onValueChange?.(value);
}
</script>

<ButtonGroup bind:ref={anchor} aria-label={ariaLabel} data-slot="cycle-select" class={cn("inline-flex min-w-0", className)}>
  <button
    {id}
    type="button"
    data-slot="button"
    data-size={size}
    disabled={disabled || !next}
    aria-label={`${ariaLabel}: ${selected?.label ?? placeholder} — ${nextLabel}${next ? `: ${next.label}` : ""}`}
    data-invalid={invalid || undefined}
    aria-describedby={describedBy}
    title={next ? `${nextLabel}: ${next.label}` : undefined}
    onclick={advance}
    class={cn(
      selectTriggerClass,
      "min-w-0 flex-1 justify-start data-[invalid]:border-destructive",
      !selected && "text-muted-foreground",
    )}
  >
    <span class="truncate">{selected?.label ?? placeholder}</span>
  </button>
  <Select type="single" bind:value {name} {disabled} {onValueChange}>
    <SelectTrigger
      {size}
      disabled={disabled || !options.some((option) => !option.disabled)}
      aria-label={`${ariaLabel}: ${listLabel}`}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      class="shrink-0 px-2"
    />
    <SelectContent customAnchor={anchor} align="start" class="w-(--bits-select-anchor-width) min-w-0" aria-label={`${ariaLabel}: ${listLabel}`}>
      {#each options as option (option.value)}
        <SelectItem value={option.value} disabled={option.disabled}>{option.label}</SelectItem>
      {/each}
    </SelectContent>
  </Select>
  <span class="sr-only" role="status">{selected?.label ?? placeholder}</span>
</ButtonGroup>
