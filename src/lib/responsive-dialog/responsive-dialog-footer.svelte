<script module lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import type { WithElementRef } from "../utils.js";

export type ResponsiveDialogFooterProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
import DialogFooter from "../dialog/dialog-footer.svelte";
import DrawerFooter from "../drawer/drawer-footer.svelte";
import { useResponsiveOverlayState } from "../responsive-overlay/context.svelte.js";

let { ref = $bindable(null), class: className, children, ...restProps }: ResponsiveDialogFooterProps = $props();
const responsive = useResponsiveOverlayState();
</script>

{#if responsive.current === "mobile"}
  <DrawerFooter bind:ref class={className} {...restProps}>
    {@render children?.()}
  </DrawerFooter>
{:else}
  <DialogFooter bind:ref class={className} {...restProps}>
    {@render children?.()}
  </DialogFooter>
{/if}
