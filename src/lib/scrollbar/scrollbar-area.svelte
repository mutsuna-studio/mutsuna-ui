<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef } from "../utils.js";
import { scrollbarVisibility } from "./scrollbar.js";

let {
  ref = $bindable(null),
  class: className,
  gutter = "stable",
  children,
  ...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { gutter?: "stable" | "both-edges" } = $props();
</script>

<div
  bind:this={ref}
  class={cn("mutsuna-scrollbar", gutter === "both-edges" && "mutsuna-scrollbar--both-edges", className)}
  use:scrollbarVisibility
  {...restProps}
>
  {@render children?.()}
</div>
