<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef } from "../utils.js";
import { scrollbarVisibility } from "./scrollbar.js";
import type { ScrollbarGutter } from "./types.js";

let {
  ref = $bindable(null),
  class: className,
  gutter = "stable",
  children,
  ...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { gutter?: ScrollbarGutter } = $props();
</script>

<div
  bind:this={ref}
  class={cn(
    "mutsuna-scrollbar",
    gutter === "auto" && "mutsuna-scrollbar--auto",
    gutter === "both-edges" && "mutsuna-scrollbar--both-edges",
    className,
  )}
  use:scrollbarVisibility
  {...restProps}
>
  {@render children?.()}
</div>
