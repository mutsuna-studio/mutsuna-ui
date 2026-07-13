<script lang="ts">
import { Tooltip as TooltipPrimitive } from "bits-ui";
import type { ComponentProps } from "svelte";
import { cn, type WithoutChildrenOrChild } from "../utils.js";
import TooltipPortal from "./tooltip-portal.svelte";

let {
  ref = $bindable(null),
  class: className,
  sideOffset = 6,
  side = "top",
  children,
  portalProps,
  ...restProps
}: TooltipPrimitive.ContentProps & {
  portalProps?: WithoutChildrenOrChild<ComponentProps<typeof TooltipPortal>>;
} = $props();
</script>

<TooltipPortal {...portalProps}>
  <TooltipPrimitive.Content bind:ref data-slot="tooltip-content" {sideOffset} {side} class={cn("data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-[60] inline-flex w-fit max-w-xs items-center rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md", className)} {...restProps}>
    {@render children?.()}
  </TooltipPrimitive.Content>
</TooltipPortal>
