<script lang="ts">
import { Drawer as DrawerPrimitive } from "vaul-svelte";
import type { ComponentProps } from "svelte";
import { cn, type WithoutChildrenOrChild } from "../utils.js";
import DrawerHandle from "./drawer-handle.svelte";
import DrawerOverlay from "./drawer-overlay.svelte";
import DrawerPortal from "./drawer-portal.svelte";

let {
  ref = $bindable(null),
  class: className,
  portalProps,
  showHandle = true,
  handleProps,
  children,
  ...restProps
}: DrawerPrimitive.ContentProps & {
  portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DrawerPortal>>;
  showHandle?: boolean;
  handleProps?: WithoutChildrenOrChild<ComponentProps<typeof DrawerHandle>>;
} = $props();
</script>

<DrawerPortal {...portalProps}>
  <DrawerOverlay />
  <DrawerPrimitive.Content
    bind:ref
    data-slot="drawer-content"
    class={cn(
      "bg-popover text-popover-foreground group/drawer-content fixed z-50 flex h-auto flex-col overflow-hidden bg-clip-padding text-sm shadow-lg outline-none",
      "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80svh] data-[vaul-drawer-direction=bottom]:rounded-t-xl data-[vaul-drawer-direction=bottom]:border-t",
      "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80svh] data-[vaul-drawer-direction=top]:rounded-b-xl data-[vaul-drawer-direction=top]:border-b",
      "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:h-full data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:rounded-r-xl data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
      "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:h-full data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:rounded-l-xl data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
      className,
    )}
    {...restProps}
  >
    {#if showHandle}
      <DrawerHandle
        {...handleProps}
        class={cn(
          "!absolute !z-10 !m-0 !bg-muted !opacity-100",
          "group-data-[vaul-drawer-direction=bottom]/drawer-content:!top-3 group-data-[vaul-drawer-direction=bottom]/drawer-content:!left-1/2 group-data-[vaul-drawer-direction=bottom]/drawer-content:!h-1 group-data-[vaul-drawer-direction=bottom]/drawer-content:!w-24 group-data-[vaul-drawer-direction=bottom]/drawer-content:!-translate-x-1/2",
          "group-data-[vaul-drawer-direction=top]/drawer-content:!bottom-3 group-data-[vaul-drawer-direction=top]/drawer-content:!left-1/2 group-data-[vaul-drawer-direction=top]/drawer-content:!h-1 group-data-[vaul-drawer-direction=top]/drawer-content:!w-24 group-data-[vaul-drawer-direction=top]/drawer-content:!-translate-x-1/2",
          "group-data-[vaul-drawer-direction=left]/drawer-content:!top-1/2 group-data-[vaul-drawer-direction=left]/drawer-content:!right-3 group-data-[vaul-drawer-direction=left]/drawer-content:!h-24 group-data-[vaul-drawer-direction=left]/drawer-content:!w-1 group-data-[vaul-drawer-direction=left]/drawer-content:!-translate-y-1/2",
          "group-data-[vaul-drawer-direction=right]/drawer-content:!top-1/2 group-data-[vaul-drawer-direction=right]/drawer-content:!left-3 group-data-[vaul-drawer-direction=right]/drawer-content:!h-24 group-data-[vaul-drawer-direction=right]/drawer-content:!w-1 group-data-[vaul-drawer-direction=right]/drawer-content:!-translate-y-1/2",
          handleProps?.class,
        )}
      />
    {/if}
    {@render children?.()}
  </DrawerPrimitive.Content>
</DrawerPortal>
