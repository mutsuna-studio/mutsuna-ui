<script lang="ts">
 import type { HTMLButtonAttributes } from "svelte/elements";
 export type RenderFixtureProps = HTMLButtonAttributes & { label: string };
 let { label, ...rest }: RenderFixtureProps = $props();
</script>
<button type="button" {...rest}>{label}</button>
