<script module lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import type { WithElementRef } from "../utils.js";
export type MessageReaction = { emoji: string; label: string; count: number; selected?: boolean };
export type MessageReactionsProps = WithElementRef<Omit<HTMLAttributes<HTMLDivElement>, "children">> & {
  items: readonly MessageReaction[];
  onToggle?: (emoji: string) => void;
  disabled?: boolean;
};
</script>
<script lang="ts">
import { cn } from "../utils.js";
let { ref = $bindable(null), items, onToggle, disabled = false, class: className, ...restProps }: MessageReactionsProps = $props();
</script>
{#if items.some(item => item.count > 0)}
  <div bind:this={ref} {...restProps} data-slot="message-reactions" class={cn("reactions", className)} role="group" aria-label="リアクション">
    {#each items.filter(item => item.count > 0) as item (item.emoji)}
      <button type="button" class="reaction" aria-label={`${item.label} ${item.count}件`} aria-pressed={Boolean(item.selected)} disabled={disabled || !onToggle} onclick={() => onToggle?.(item.emoji)}><span aria-hidden="true">{item.emoji}</span><span>{item.count}</span></button>
    {/each}
  </div>
{/if}
<style>
  .reactions { display: flex; flex-wrap: wrap; gap: 4px; }
  .reaction { display: inline-flex; min-height: 44px; min-width: 44px; align-items: center; justify-content: center; gap: 5px; padding: 4px 10px; border: 1px solid var(--border); border-radius: 999px; background: var(--background); font-size: 12px; cursor: pointer; }
  .reaction[aria-pressed="true"] { border-color: color-mix(in oklab, var(--primary) 50%, var(--border)); background: color-mix(in oklab, var(--primary) 8%, var(--background)); }
  .reaction:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
  .reaction:disabled { cursor: default; opacity: .65; }
  @media (hover: hover) and (pointer: fine) { .reaction { min-height: 32px; } }
</style>
