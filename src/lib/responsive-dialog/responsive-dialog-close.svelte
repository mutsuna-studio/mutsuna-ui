<script module lang="ts">
import type { ComponentProps, Snippet } from "svelte";
import DialogClose from "../dialog/dialog-close.svelte";
import DrawerClose from "../drawer/drawer-close.svelte";
import type { WithoutChildrenOrChild } from "../utils.js";

type DialogCloseProps = ComponentProps<typeof DialogClose>;

export type ResponsiveDialogCloseProps = {
  child?: DialogCloseProps["child"];
  children?: Snippet;
  dialogProps?: WithoutChildrenOrChild<DialogCloseProps>;
  drawerProps?: WithoutChildrenOrChild<ComponentProps<typeof DrawerClose>>;
};
</script>

<script lang="ts">
import { useResponsiveOverlayState } from "../responsive-overlay/context.svelte.js";

let { child, children, dialogProps, drawerProps }: ResponsiveDialogCloseProps = $props();
const responsive = useResponsiveOverlayState();
</script>

{#if responsive.current === "mobile"}
  <DrawerClose {child} {...drawerProps}>
    {@render children?.()}
  </DrawerClose>
{:else}
  <DialogClose {child} {...dialogProps}>
    {@render children?.()}
  </DialogClose>
{/if}
