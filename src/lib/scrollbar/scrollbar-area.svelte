<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef } from "../utils.js";
import { scrollbarVisibility } from "./scrollbar.js";
import type { ScrollbarGutter } from "./types.js";

let {
  ref = $bindable(null),
  class: className,
  gutter = "stable",
  tabindex = 0,
  children,
  ...restProps
}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { gutter?: ScrollbarGutter } = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex: scroll containers require keyboard focus when no focusable descendants are present -->
<div
  bind:this={ref}
  class={cn(
    "mutsuna-scrollbar",
    gutter === "auto" && "mutsuna-scrollbar--auto",
    gutter === "both-edges" && "mutsuna-scrollbar--both-edges",
    className,
  )}
  use:scrollbarVisibility
  {tabindex}
  {...restProps}
>
  {@render children?.()}
</div>
