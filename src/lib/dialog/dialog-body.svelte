<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn, type WithElementRef } from "../utils.js";

let { ref = $bindable(null), class: className, children, ...restProps }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="dialog-body"
  class={cn("-mx-2 flex-1 min-h-0 overflow-y-auto px-2", className)}
  {...restProps}
>
  {@render children?.()}
</div>
