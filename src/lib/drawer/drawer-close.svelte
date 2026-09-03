<script lang="ts">
import { Drawer as DrawerPrimitive } from "vaul-svelte";

let { ref = $bindable(null), type = "button", ...restProps }: DrawerPrimitive.CloseProps = $props();
</script>

<DrawerPrimitive.Close bind:ref data-slot="drawer-close" {type} {...restProps} />
