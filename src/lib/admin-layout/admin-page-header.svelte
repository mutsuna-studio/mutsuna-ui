<script lang="ts">
import type { Snippet } from "svelte";
import { cn } from "../utils.js";

interface Props {
  description: string;
  actions?: Snippet;
  meta?: Snippet;
  class?: string;
}

let { description, actions, meta, class: className }: Props = $props();
</script>

<header class={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
  <div class="flex min-w-0 flex-col gap-2">
    {#if meta}
      <div class="flex flex-wrap items-center gap-2">{@render meta()}</div>
    {/if}
    <p class="text-sm leading-6 text-muted-foreground">{description}</p>
  </div>
  {#if actions}
    <div class="flex shrink-0 flex-wrap items-center gap-2">{@render actions()}</div>
  {/if}
</header>
