<script module lang="ts">
import type { ComponentProps } from "svelte";
import DialogDescription from "../dialog/dialog-description.svelte";

export type ResponsiveDialogDescriptionProps = ComponentProps<typeof DialogDescription>;
</script>

<script lang="ts">
import DrawerDescription from "../drawer/drawer-description.svelte";
import { useResponsiveOverlayState } from "../responsive-overlay/context.svelte.js";

let { ref = $bindable(null), ...restProps }: ResponsiveDialogDescriptionProps = $props();
const responsive = useResponsiveOverlayState();
</script>

{#if responsive.current === "mobile"}
  <DrawerDescription bind:ref {...restProps} />
{:else}
  <DialogDescription bind:ref {...restProps} />
{/if}
