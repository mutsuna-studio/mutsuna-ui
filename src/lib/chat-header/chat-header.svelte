<script module lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { WithElementRef } from "../utils.js";
export type ChatHeaderProps = WithElementRef<Omit<HTMLAttributes<HTMLElement>, "children" | "title">> & {
  title: string;
  description?: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  navigation?: Snippet;
  leading?: Snippet;
  /** Consumer-owned conversation status, tags or memo indicators; independent of participants. */
  metadata?: Snippet;
  actions?: Snippet;
};
</script>
<script lang="ts">
import { cn } from "../utils.js";
let {
  ref = $bindable(null), title, description, headingLevel = 2,
  navigation, leading, metadata, actions, class: className, ...restProps
}: ChatHeaderProps = $props();
</script>
<header bind:this={ref} {...restProps} data-slot="chat-header" class={cn("chat-header", className)}>
  {#if navigation}<div data-slot="chat-header-navigation" class="header-navigation">{@render navigation()}</div>{/if}
  {#if leading}<div data-slot="chat-header-leading" class="header-leading" aria-hidden="true">{@render leading()}</div>{/if}
  <div class="header-content">
    <svelte:element this={"h" + headingLevel} class="header-title" title={title}>{title}</svelte:element>
    {#if description || metadata}<div class="header-details">
      {#if description}<p class="header-description">{description}</p>{/if}
      {#if metadata}<div data-slot="chat-header-metadata" class="header-metadata">{@render metadata()}</div>{/if}
    </div>{/if}
  </div>
  {#if actions}<div data-slot="chat-header-actions" class="header-actions">{@render actions()}</div>{/if}
</header>
<style>
  .chat-header { display: flex; align-items: center; gap: 12px; flex-shrink: 0; min-width: 0; min-height: 72px; padding: 12px 28px; border-bottom: 1px solid var(--border); color: var(--foreground); background: var(--background); }
  .header-navigation, .header-leading, .header-actions { display: flex; flex-shrink: 0; align-items: center; gap: 8px; }
  .header-leading { color: var(--muted-foreground); }
  .header-content { flex: 1; min-width: 0; }
  .header-title { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; font-weight: 650; line-height: 1.5; }
  .header-details { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; margin-top: 3px; min-width: 0; }
  .header-details:not(:has(.header-description)):has(.header-metadata:empty) { display: none; }
  .header-description { margin: 0; font-size: 11px; line-height: 1.5; color: var(--muted-foreground); overflow-wrap: anywhere; }
  .header-metadata { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; min-width: 0; margin-top: 0; font-size: 11px; line-height: 1.5; color: var(--muted-foreground); overflow-wrap: anywhere; }
  .header-metadata:empty { display: none; }
  .header-metadata > :global(*) { max-width: 100%; min-width: 0; }
  @media (max-width: 767px), (max-height: 600px) {
    .chat-header { min-height: 56px; padding: 8px 12px; gap: 8px; }
    .header-description { display: none; }
  }
  @media (max-width: 767px) {
    .chat-header { flex-wrap: wrap; }
    .header-actions { max-width: 100%; flex-wrap: wrap; margin-inline-start: auto; }
  }
</style>
