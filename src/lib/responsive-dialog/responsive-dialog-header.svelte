<script module lang="ts">
import type { ComponentProps } from "svelte";
import DialogHeader from "../dialog/dialog-header.svelte";

export type ResponsiveDialogHeaderProps = ComponentProps<typeof DialogHeader>;
</script>

<script lang="ts">
import DrawerHeader from "../drawer/drawer-header.svelte";
import { cn } from "../utils.js";
import { useResponsiveOverlayState } from "../responsive-overlay/context.svelte.js";

let { ref = $bindable(null), class: className, children, ...restProps }: ResponsiveDialogHeaderProps = $props();
const responsive = useResponsiveOverlayState();
</script>

{#if responsive.current === "mobile"}
  <DrawerHeader bind:ref class={cn("text-left", className)} {...restProps}>
    {@render children?.()}
  </DrawerHeader>
{:else}
  <DialogHeader bind:ref class={className} {...restProps}>
    {@render children?.()}
  </DialogHeader>
{/if}
