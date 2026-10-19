<script module lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { WithElementRef } from "../utils.js";
export type MessageScrollerTopBarProps = WithElementRef<Omit<HTMLAttributes<HTMLDivElement>, "children">> & {
  /** Date, current context or other consumer-owned content. */
  children?: Snippet;
  /** Flow reserves height; overlay floats transparently over the history. */
  placement?: "flow" | "overlay";
  leading?: Snippet;
  actions?: Snippet;
  /** Optional full-width second row, such as filters or additional context. */
  context?: Snippet;
};
</script>
<script lang="ts">
import { cn } from "../utils.js";
let { ref = $bindable(null), children, leading, actions, context, placement = "flow", class: className, ...restProps }: MessageScrollerTopBarProps = $props();
$effect(() => {
  const node = ref;
  if (placement !== "overlay" || !node) return;
  const root = node.closest<HTMLElement>('[data-slot="message-scroller"]');
  if (!root) return;
  const property = "--message-scroller-top-bar-height";
  const previous = root.style.getPropertyValue(property);
  const update = () => root.style.setProperty(property, `${Math.ceil(node.getBoundingClientRect().height)}px`);
  update();
  const observer = new ResizeObserver(update);
  observer.observe(node);
  return () => { observer.disconnect(); if (previous) root.style.setProperty(property, previous); else root.style.removeProperty(property); };
});
</script>
<div bind:this={ref} {...restProps} data-slot="message-scroller-top-bar" data-placement={placement} class={cn("top-bar", className)}>
  <div class="top-row">
    {#if leading}<div data-slot="message-scroller-top-bar-leading" class="top-leading">{@render leading()}</div>{/if}
    <div data-slot="message-scroller-top-bar-content" class="top-content">{@render children?.()}</div>
    {#if actions}<div data-slot="message-scroller-top-bar-actions" class="top-actions">{@render actions()}</div>{/if}
  </div>
  {#if context}<div data-slot="message-scroller-top-bar-context" class="top-context">{@render context()}</div>{/if}
</div>
<style>
  .top-bar { position: relative; z-index: 12; flex: 0 0 auto; min-width: 0; padding: 8px 12px; }
  .top-row { display: flex; align-items: flex-start; gap: 8px; min-width: 0; }
  .top-leading, .top-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 4px; }
  .top-content { display: flex; flex: 1 1 0%; align-items: center; min-width: 0; min-height: 44px; overflow-wrap: anywhere; }
  .top-content > :global(*) { min-width: 0; max-width: 100%; }
  .top-context { min-width: 0; margin-top: 8px; overflow-wrap: anywhere; }
  .top-bar[data-placement="overlay"] { position: absolute; inset: 0 0 auto; pointer-events: none; }
  .top-bar[data-placement="overlay"] .top-leading, .top-bar[data-placement="overlay"] .top-actions { pointer-events: auto; }
  .top-bar[data-placement="overlay"] :global(:is(button, a[href], input, select, textarea, summary, label, [role="button"], [tabindex], [contenteditable="true"])) { pointer-events: auto; }
</style>
