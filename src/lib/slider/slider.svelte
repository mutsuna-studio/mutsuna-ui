<script lang="ts">
import { Slider as SliderPrimitive } from "bits-ui";
import type { Component } from "svelte";
import { cn, type WithoutChildrenOrChild } from "../utils.js";

export type SliderProps = WithoutChildrenOrChild<SliderPrimitive.RootProps> & {
  /** Accessible labels for each thumb, ordered to match the slider values. */
  thumbLabels?: readonly string[];
  /** Formats each thumb value for assistive technologies via aria-valuetext. */
  getThumbValueText?: (value: number, index: number) => string;
};

const PrimitiveRoot = SliderPrimitive.Root as Component<Record<string, unknown>>;

let {
  ref = $bindable(null),
  value = $bindable(),
  class: className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  thumbLabels,
  getThumbValueText,
  type,
  orientation = "horizontal",
  ...restProps
}: SliderProps = $props();

const thumbIndexes = $derived(
  type === "single" ? [0] : Array.isArray(value) ? value.map((_, index) => index) : []
);

function getThumbLabel(index: number) {
  return thumbLabels?.[index] ??
    (type === "multiple" && ariaLabel !== undefined ? `${ariaLabel} ${index + 1}` : ariaLabel);
}

function getThumbAriaValueText(index: number) {
  if (getThumbValueText === undefined) return undefined;
  const thumbValue = Array.isArray(value) ? value[index] : index === 0 ? value : undefined;
  return thumbValue === undefined ? undefined : getThumbValueText(thumbValue, index);
}
</script>

<PrimitiveRoot
  bind:ref
  bind:value
  {type}
  {orientation}
  data-slot="slider"
  class={cn(
    "group/slider relative flex h-8 w-full cursor-grab touch-none select-none items-center data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-8 data-[orientation=vertical]:flex-col",
    className
  )}
  {...restProps}
>
  {#snippet children()}
    <span
      data-slot="slider-track"
      class="bg-input relative h-5 w-full grow overflow-hidden rounded-full group-data-[orientation=vertical]/slider:h-full group-data-[orientation=vertical]/slider:w-5"
    >
      <SliderPrimitive.Range
        data-slot="slider-range"
        class="bg-primary absolute h-full group-data-[orientation=vertical]/slider:h-auto group-data-[orientation=vertical]/slider:w-full"
      />
    </span>
    {#each thumbIndexes as index (index)}
      <SliderPrimitive.Thumb
        {index}
        aria-label={getThumbLabel(index)}
        aria-labelledby={thumbLabels?.[index] === undefined ? ariaLabelledBy : undefined}
        aria-describedby={ariaDescribedBy}
        aria-valuetext={getThumbAriaValueText(index)}
        data-slot="slider-thumb"
        class="bg-primary relative block size-5 shrink-0 cursor-grab rounded-full before:absolute before:-inset-1.5 before:content-[''] after:absolute after:inset-0.5 after:rounded-full after:bg-background after:transition-[inset] after:duration-150 after:ease-out after:content-[''] hover:after:inset-[3px] focus-visible:bg-ring focus-visible:outline-none focus-visible:after:inset-[3px] data-[active]:cursor-grabbing data-[active]:after:inset-[3px] motion-reduce:after:transition-none disabled:pointer-events-none"
      />
    {/each}
  {/snippet}
</PrimitiveRoot>
