<script lang="ts">
import { Drawer as DrawerPrimitive } from "vaul-svelte";
import { cn } from "../utils.js";

let { ref = $bindable(null), class: className, ...restProps }: DrawerPrimitive.HandleProps = $props();
</script>

<DrawerPrimitive.Handle
  bind:ref
  data-slot="drawer-handle"
  class={cn("rounded-full bg-muted", className)}
  {...restProps}
/>
