<script module lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import type { WithElementRef } from "../utils.js";

export type ResponsiveDialogBodyProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
import ScrollbarArea from "../scrollbar/scrollbar-area.svelte";
import { cn } from "../utils.js";
import { useResponsiveOverlayState } from "../responsive-overlay/context.svelte.js";

let {
  ref = $bindable(null),
  class: className,
  children,
  onscroll,
  ...restProps
}: ResponsiveDialogBodyProps = $props();
const responsive = useResponsiveOverlayState();
</script>

<ScrollbarArea
  bind:ref
  data-slot="responsive-dialog-body"
  class={cn(
    "min-h-0 flex-1 overflow-y-auto",
    responsive.current === "mobile" ? "px-4" : "-mx-4 px-4",
    className,
  )}
  gutter="both-edges"
  {onscroll}
  {...restProps}
>
  {@render children?.()}
</ScrollbarArea>
