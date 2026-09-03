<script lang="ts">
import type { ComponentProps } from "svelte";
import { Drawer as DrawerPrimitive } from "vaul-svelte";

type DrawerNestedRootProps = ComponentProps<typeof DrawerPrimitive.NestedRoot>;

let {
  shouldScaleBackground = false,
  autoFocus = true,
  defaultOpen = false,
  open = $bindable(defaultOpen),
  activeSnapPoint = $bindable(null),
  ...restProps
}: DrawerNestedRootProps = $props();
</script>

<DrawerPrimitive.NestedRoot {shouldScaleBackground} {autoFocus} bind:open bind:activeSnapPoint {...restProps} />
