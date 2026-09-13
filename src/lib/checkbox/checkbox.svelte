<script lang="ts">
import { Checkbox as CheckboxPrimitive } from "bits-ui";
import { cn, type WithoutChildrenOrChild } from "../utils.js";
import MinusIcon from "@lucide/svelte/icons/minus";

let {
  ref = $bindable(null),
  checked = $bindable(false),
  indeterminate = $bindable(false),
  class: className,
  ...restProps
}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props();
</script>

<CheckboxPrimitive.Root
	bind:ref
	data-slot="checkbox"
	class={cn(
		"border-input dark:bg-input/30 data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary data-checked:border-primary aria-invalid:aria-checked:border-primary aria-invalid:border-destructive focus-visible:border-ring cursor-pointer flex size-4 items-center justify-center rounded-[4px] border transition-colors group-has-disabled/field:opacity-50 peer relative shrink-0 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50",
		className
	)}
	bind:checked
	bind:indeterminate
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div
			data-slot="checkbox-indicator"
			class="[&>svg]:size-3.5 grid place-content-center text-current transition-none"
		>
			{#if checked}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path class="check-stroke" d="m4 12 5 5L20 6" pathLength="1" />
				</svg>
			{:else if indeterminate}
				<MinusIcon  />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>

<style>
	.check-stroke {
		stroke-dasharray: 1;
		stroke-dashoffset: 0;
		animation: draw-check 240ms ease-out both;
	}

	@keyframes draw-check {
		from { stroke-dashoffset: 1; }
		to { stroke-dashoffset: 0; }
	}

	@media (prefers-reduced-motion: reduce) {
		.check-stroke { animation: none; }
	}
</style>
