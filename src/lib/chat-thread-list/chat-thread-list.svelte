<script module lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { WithElementRef } from "../utils.js";

export type ChatThreadListItem = {
  id: string;
  title: string;
  preview?: string;
  time?: string;
  datetime?: string;
  unreadCount?: number;
  avatarId?: string;
  imageUrl?: string | null;
  online?: boolean;
  disabled?: boolean;
};
export type ChatThreadListProps = WithElementRef<Omit<HTMLAttributes<HTMLElement>, "children">> & {
  items: readonly ChatThreadListItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  variant?: "default" | "compact";
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyText?: string;
  ariaLabel?: string;
  /** Optional icon/avatar in place of the seeded avatar. Keep it non-interactive. */
  leading?: Snippet<[ChatThreadListItem]>;
  /** Consumer-owned conversation status, tags or memo indicators. No interactive elements inside the item button. */
  metadata?: Snippet<[ChatThreadListItem]>;
};
</script>

<script lang="ts">
import { CustomerAvatar } from "../avatar/index.js";
import { Button } from "../button/index.js";
import { cn } from "../utils.js";
let {
  ref = $bindable(null), items, selectedId, onSelect, variant = "default",
  disabled = false, loading = false, error, onRetry, emptyText = "会話はまだありません。",
  ariaLabel = "最近の会話", leading, metadata, class: className, ...restProps
}: ChatThreadListProps = $props();
</script>

<nav bind:this={ref} {...restProps} data-slot="chat-thread-list" data-variant={variant} aria-label={ariaLabel} aria-busy={loading} class={cn("thread-list", className)}>
  {#if error}
    <div class="list-error" role="alert"><p>{error}</p>{#if onRetry}<Button variant="ghost" size="sm" disabled={disabled || loading} onclick={onRetry}>再試行</Button>{/if}</div>
  {/if}
  {#if loading}<p class="list-status" role="status">読み込み中…</p>{/if}
  {#each items as item (item.id)}
    <button type="button" data-slot="chat-thread-list-item" class="thread-item" class:selected={item.id === selectedId} aria-current={item.id === selectedId ? "true" : undefined} disabled={disabled || item.disabled} onclick={() => onSelect?.(item.id)}>
      <span class="thread-leading" aria-hidden="true">
        {#if leading}{@render leading(item)}{:else}<CustomerAvatar id={item.avatarId ?? item.id} name={item.title} imageUrl={item.imageUrl} />{/if}
        {#if item.online}<span class="online-dot"></span>{/if}
      </span>
      <span class="thread-copy">
        <span class="thread-top">
          <span class="thread-title" title={item.title}>{item.title}</span>
          {#if metadata}<span data-slot="chat-thread-list-metadata" class="thread-metadata">{@render metadata(item)}</span>{/if}
        </span>
        {#if item.preview}<span class="thread-preview" title={item.preview}>{item.preview}</span>{/if}
      </span>
      {#if item.online}<span class="sr-only">オンライン</span>{/if}
      {#if item.time || (item.unreadCount && item.unreadCount > 0)}
        <span class="thread-trailing">
          {#if item.time}<time class="thread-time" datetime={item.datetime}>{item.time}</time>{/if}
          {#if item.unreadCount && item.unreadCount > 0}<span class="unread-count" aria-label={`未読${item.unreadCount}件`}>{item.unreadCount > 99 ? "99+" : item.unreadCount}</span>{/if}
        </span>
      {/if}
    </button>
  {/each}
  {#if !items.length && !loading && !error}<p class="list-status">{emptyText}</p>{/if}
</nav>

<style>
  .thread-list { display: grid; align-content: start; gap: 2px; min-width: 0; padding: 0 10px; color: var(--foreground); }
  .thread-item { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; column-gap: 10px; width: 100%; min-width: 0; min-height: 44px; padding: 10px 12px; border: 0; border-radius: 10px; background: transparent; color: inherit; font: inherit; text-align: start; cursor: pointer; }
  .thread-item:hover:not(:disabled), .thread-item.selected { background: var(--muted); }
  .thread-item:focus-visible { outline: 2px solid var(--ring); outline-offset: -2px; }
  .thread-item:disabled { opacity: .5; cursor: not-allowed; }
  .thread-leading { position: relative; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--muted-foreground); }
  .thread-copy { display: grid; gap: 2px; min-width: 0; }
  .thread-top { display: flex; align-items: flex-start; gap: 6px; min-width: 0; min-height: 20px; }
  .thread-title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; line-height: 20px; font-weight: 500; }
  .thread-trailing { grid-column: 3; display: flex; flex-direction: column; align-items: flex-end; align-self: stretch; justify-content: space-between; gap: 2px; }
  .thread-time { flex-shrink: 0; font-size: 10px; line-height: 20px; color: var(--muted-foreground); }
  .thread-preview { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; line-height: 18px; color: var(--muted-foreground); }
  .thread-metadata { flex: 0 0 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 2px 4px; min-width: 0; max-width: 60%; font-size: 11px; line-height: 1.5; color: var(--foreground); overflow-wrap: anywhere; }
  .thread-metadata:empty { display: none; }
  .thread-metadata > :global(*) { max-width: 100%; min-width: 0; }
  .online-dot { position: absolute; bottom: -1px; right: -1px; width: 9px; height: 9px; border: 2px solid var(--background); border-radius: 50%; background: #22835b; }
  .unread-count { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: auto; min-width: 18px; height: 18px; padding-inline: 4px; border-radius: 99px; background: var(--primary); color: var(--primary-foreground); font-size: 10px; font-variant-numeric: tabular-nums; }
  .list-status, .list-error { padding: 12px; font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; color: var(--muted-foreground); }
  .list-error { color: var(--destructive); }
  [data-variant="compact"] .thread-item { padding: 8px 12px; border-radius: 6px; }
  [data-variant="compact"] .thread-item.selected { background: color-mix(in oklab, var(--primary) 11%, var(--background)); }
</style>
