<script lang="ts">
import type { Snippet } from "svelte";
import { onMount } from "svelte";

let { children, fallback }: { children?: Snippet; fallback?: Snippet } = $props();
let mounted = $state(false);

onMount(() => {
  mounted = true;
});
</script>

{#if mounted}
	{@render children?.()}
{:else if fallback}
	{@render fallback()}
{/if}
