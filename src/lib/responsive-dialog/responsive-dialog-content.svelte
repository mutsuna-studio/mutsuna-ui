<script module lang="ts">
import type { ComponentProps, Snippet } from "svelte";
import DialogContent from "../dialog/dialog-content.svelte";
import DrawerContent from "../drawer/drawer-content.svelte";
import type { WithoutChildrenOrChild } from "../utils.js";

type DialogContentProps = ComponentProps<typeof DialogContent>;
type DrawerContentProps = ComponentProps<typeof DrawerContent>;
type WithoutRef<T> = T extends { ref?: unknown } ? Omit<T, "ref"> : T;

export type ResponsiveDialogContentProps = {
  ref?: DialogContentProps["ref"];
  class?: DialogContentProps["class"];
  children: Snippet;
  dialogProps?: WithoutChildrenOrChild<WithoutRef<DialogContentProps>>;
  drawerProps?: WithoutChildrenOrChild<WithoutRef<DrawerContentProps>>;
};
</script>

<script lang="ts">
import { cn } from "../utils.js";
import { useResponsiveOverlayState } from "../responsive-overlay/context.svelte.js";

let {
  ref = $bindable(null),
  class: className,
  children,
  dialogProps,
  drawerProps,
}: ResponsiveDialogContentProps = $props();
const responsive = useResponsiveOverlayState();

$effect(() => {
  const content = ref;
  responsive.setContent(content);

  return () => {
    if (responsive.content === content) {
      responsive.setContent(null);
    }
  };
});
</script>

{#if responsive.current === "mobile"}
  <DrawerContent bind:ref {...drawerProps} class={cn(className, drawerProps?.class)}>
    {@render children()}
  </DrawerContent>
{:else}
  <DialogContent bind:ref {...dialogProps} class={cn(className, dialogProps?.class)}>
    {@render children()}
  </DialogContent>
{/if}
