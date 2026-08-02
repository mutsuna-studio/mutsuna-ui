<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef } from "../utils.js";
import ScrollbarArea from "../scrollbar/scrollbar-area.svelte";

let { ref = $bindable(null), class: className, children, onscroll, ...restProps }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<ScrollbarArea
  bind:ref
  data-slot="dialog-body"
  class={cn("-mx-4 flex-1 min-h-0 overflow-y-auto px-4", className)}
  gutter="both-edges"
  {onscroll}
  {...restProps}
>
  {@render children?.()}
</ScrollbarArea>
