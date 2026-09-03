<script module lang="ts">
import type { ComponentProps, Snippet } from "svelte";
import DialogTrigger from "../dialog/dialog-trigger.svelte";
import DrawerTrigger from "../drawer/drawer-trigger.svelte";
import type { WithoutChildrenOrChild } from "../utils.js";

type DialogTriggerProps = ComponentProps<typeof DialogTrigger>;

export type ResponsiveDialogTriggerProps = {
  ref?: DialogTriggerProps["ref"];
  child?: DialogTriggerProps["child"];
  children?: Snippet;
  dialogProps?: WithoutChildrenOrChild<DialogTriggerProps>;
  drawerProps?: WithoutChildrenOrChild<ComponentProps<typeof DrawerTrigger>>;
};
</script>

<script lang="ts">
import { useResponsiveOverlayState } from "../responsive-overlay/context.svelte.js";

let { ref = $bindable(null), child, children, dialogProps, drawerProps }: ResponsiveDialogTriggerProps = $props();
const responsive = useResponsiveOverlayState();

$effect(() => {
  const trigger = ref;
  responsive.setTrigger(trigger);

  return () => {
    if (responsive.trigger === trigger) {
      responsive.setTrigger(null);
    }
  };
});
</script>

{#if responsive.current === "mobile"}
  <DrawerTrigger bind:ref {child} {...drawerProps}>
    {@render children?.()}
  </DrawerTrigger>
{:else}
  <DialogTrigger bind:ref {child} {...dialogProps}>
    {@render children?.()}
  </DialogTrigger>
{/if}
