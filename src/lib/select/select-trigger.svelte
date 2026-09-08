<script lang="ts">
import { Select as SelectPrimitive } from "bits-ui";
import { cn, type WithoutChild } from "../utils.js";
import { selectTriggerClass } from "./trigger-style.js";
import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";

let {
  ref = $bindable(null),
  class: className,
  children,
  size = "default",
  ...restProps
}: WithoutChild<SelectPrimitive.TriggerProps> & {
  size?: "sm" | "default";
} = $props();
</script>

<SelectPrimitive.Trigger
	bind:ref
	data-slot="select-trigger"
	data-size={size}
	class={cn(
		selectTriggerClass,
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<ChevronDownIcon class="text-muted-foreground size-4 pointer-events-none" />
</SelectPrimitive.Trigger>
