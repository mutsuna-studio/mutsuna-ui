<script lang="ts">
import { Drawer as DrawerPrimitive } from "vaul-svelte";

let {
  shouldScaleBackground = false,
  autoFocus = true,
  defaultOpen = false,
  open = $bindable(defaultOpen),
  activeSnapPoint = $bindable(null),
  ...restProps
}: DrawerPrimitive.RootProps = $props();
</script>

<DrawerPrimitive.Root {shouldScaleBackground} {autoFocus} bind:open bind:activeSnapPoint {...restProps} />
