<script module lang="ts">
import type { ComponentProps } from "svelte";
import DialogTitle from "../dialog/dialog-title.svelte";

export type ResponsiveDialogTitleProps = ComponentProps<typeof DialogTitle>;
</script>

<script lang="ts">
import DrawerTitle from "../drawer/drawer-title.svelte";
import { useResponsiveOverlayState } from "../responsive-overlay/context.svelte.js";

let { ref = $bindable(null), ...restProps }: ResponsiveDialogTitleProps = $props();
const responsive = useResponsiveOverlayState();
</script>

{#if responsive.current === "mobile"}
  <DrawerTitle bind:ref {...restProps} />
{:else}
  <DialogTitle bind:ref {...restProps} />
{/if}
