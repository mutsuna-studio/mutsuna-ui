<script lang="ts">
import FloatingField from "../internal/floating-field.svelte";
import { getSelectLabel } from "../internal/select/label-context.js";
import { Select as SelectPrimitive } from "bits-ui";
import { cn, type WithoutChild } from "../utils.js";
import { selectTriggerClass } from "./trigger-style.js";
import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";

let { ref = $bindable(null), class: className, children, label, id, size = "default", ...restProps }:
  WithoutChild<SelectPrimitive.TriggerProps> & { size?: "sm" | "default"; label?: string } = $props();
const selectLabel = getSelectLabel();
const generatedId = $props.id();
const outlineLabel = $derived(label ?? selectLabel?.label);
const controlId = $derived(id ?? selectLabel?.id ?? (outlineLabel ? generatedId : undefined));
</script>

{#snippet control()}
<SelectPrimitive.Trigger
  bind:ref
  id={controlId}
  aria-invalid={selectLabel?.invalid}
  aria-describedby={selectLabel?.describedby}
  data-slot="select-trigger"
  data-size={size}
  data-floating-control={outlineLabel ? "" : undefined}
  class={cn(selectTriggerClass, outlineLabel && "w-full data-[size=default]:h-10 data-[size=sm]:h-10", className)}
  {...restProps}
>
  {@render children?.()}
  <ChevronDownIcon class="text-muted-foreground size-4 pointer-events-none" />
</SelectPrimitive.Trigger>
{/snippet}
{#if outlineLabel}
  <FloatingField label={outlineLabel} for={controlId!} raised>{@render control()}</FloatingField>
{:else}
  {@render control()}
{/if}
