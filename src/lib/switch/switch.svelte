<script lang="ts">
import { Switch as SwitchPrimitive } from "bits-ui";
import { cn, type WithoutChildrenOrChild } from "../utils.js";

let {
  ref = $bindable(null),
  class: className,
  checked = $bindable(false),
  size = "default",
  ...restProps
}: WithoutChildrenOrChild<SwitchPrimitive.RootProps> & {
  size?: "sm" | "default";
} = $props();
</script>

<SwitchPrimitive.Root
	bind:ref
	bind:checked
	data-slot="switch"
	data-size={size}
	class={cn(
		"data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 outline-none transition-[background-color] duration-150 ease-out before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-[''] after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring aria-invalid:after:ring-2 aria-invalid:after:ring-inset aria-invalid:after:ring-destructive data-disabled:cursor-not-allowed data-disabled:opacity-50 data-[size=default]:h-5 data-[size=default]:w-9 data-[size=default]:[--switch-thumb-active-scale:0.875] data-[size=sm]:h-4 data-[size=sm]:w-7 data-[size=sm]:before:-inset-x-0.5 data-[size=sm]:before:-inset-y-2 data-[size=sm]:[--switch-thumb-active-scale:0.833333] motion-reduce:transition-none",
		className
	)}
	{...restProps}
>
	<SwitchPrimitive.Thumb
		data-slot="switch-thumb"
		class="bg-background dark:data-unchecked:bg-foreground dark:data-checked:bg-primary-foreground pointer-events-none block rounded-full ring-0 transition-transform duration-150 ease-out group-hover/switch:scale-[var(--switch-thumb-active-scale)] group-focus-visible/switch:scale-[var(--switch-thumb-active-scale)] group-active/switch:scale-[var(--switch-thumb-active-scale)] group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-checked/switch:translate-x-full group-data-unchecked/switch:translate-x-0 rtl:data-[state=checked]:-translate-x-full motion-reduce:transition-none"
	/>
</SwitchPrimitive.Root>
