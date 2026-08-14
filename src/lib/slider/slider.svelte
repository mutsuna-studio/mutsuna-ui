<script lang="ts">
import { Slider as SliderPrimitive } from "bits-ui";
import type { Component } from "svelte";
import { cn, type WithoutChildrenOrChild } from "../utils.js";

export type SliderProps = WithoutChildrenOrChild<SliderPrimitive.RootProps>;

const PrimitiveRoot = SliderPrimitive.Root as Component<Record<string, unknown>>;

let {
  ref = $bindable(null),
  value = $bindable(),
  class: className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  type,
  orientation = "horizontal",
  ...restProps
}: SliderProps = $props();

const thumbIndexes = $derived(
  type === "single" ? [0] : Array.isArray(value) ? value.map((_, index) => index) : []
);
</script>

<PrimitiveRoot
  bind:ref
  bind:value
  {type}
  {orientation}
  data-slot="slider"
  class={cn(
    "group/slider relative flex w-full touch-none select-none items-center data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5 data-[orientation=vertical]:flex-col",
    className
  )}
  {...restProps}
>
  {#snippet children()}
    <span
      data-slot="slider-track"
      class="bg-muted relative h-1.5 w-full grow overflow-hidden rounded-full group-data-[orientation=vertical]/slider:h-full group-data-[orientation=vertical]/slider:w-1.5"
    >
      <SliderPrimitive.Range
        data-slot="slider-range"
        class="bg-primary absolute h-full group-data-[orientation=vertical]/slider:h-auto group-data-[orientation=vertical]/slider:w-full"
      />
    </span>
    {#each thumbIndexes as index (index)}
      <SliderPrimitive.Thumb
        {index}
        aria-label={type === "multiple" && ariaLabel !== undefined ? `${ariaLabel} ${index + 1}` : ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        data-slot="slider-thumb"
        class="border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50"
      />
    {/each}
  {/snippet}
</PrimitiveRoot>
