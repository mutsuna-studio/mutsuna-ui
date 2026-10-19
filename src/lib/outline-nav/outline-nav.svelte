<script module lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import type { WithElementRef } from "../utils.js";
export type OutlineNavItem = { id: string; label: string; level?: 1 | 2 | 3 | 4 | 5 | 6 };
export type OutlineNavProps = WithElementRef<Omit<HTMLAttributes<HTMLElement>, "children">> & {
  items: readonly OutlineNavItem[];
  activeId?: string;
  /** Optional binding for the shared preview panel. */
  open?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onNavigate?: (id: string) => void;
};
</script>
<script lang="ts">
import { tick, onDestroy } from "svelte";
import { scrollbarVisibility } from "../scrollbar/index.js";
import * as Popover from "../popover/index.js";
import { cn } from "../utils.js";
let { ref = $bindable(null), items, activeId, open = $bindable(false), disabled = false, ariaLabel = "目次", onNavigate, class: className, ...restProps }: OutlineNavProps = $props();
let previewId = $state<string | null>(null);
let panel = $state<HTMLDivElement | null>(null);
const panelId = $props.id();
let closeTimer: ReturnType<typeof setTimeout> | undefined;
function keepOpen() { clearTimeout(closeTimer); }
function preview(id: string) {
  if (disabled) return;
  keepOpen();
  previewId = id;
  open = true;
}
function scheduleClose() {
  keepOpen();
  closeTimer = setTimeout(() => { open = false; }, 180);
}
function focusOut(event: FocusEvent) {
  const next = event.relatedTarget;
  if (next instanceof Node && (ref?.contains(next) || panel?.contains(next))) return;
  scheduleClose();
}
onDestroy(keepOpen);
$effect(() => { if (disabled || !items.length) open = false; });
function reveal(node: HTMLElement, selected: boolean) {
  let alive = true;
  async function sync(selected: boolean) {
    await tick();
    if (!alive || !selected) return;
    const list = node.closest("ol");
    if (!list) return;
    list.scrollTop += node.getBoundingClientRect().top - list.getBoundingClientRect().top - list.clientHeight / 2 + node.offsetHeight / 2;
  }
  void sync(selected);
  return { update: sync, destroy() { alive = false; } };
}
function navigate(id: string) {
  if (disabled) return;
  keepOpen();
  open = false;
  onNavigate?.(id);
}
</script>
<Popover.Root bind:open>
  <nav bind:this={ref} {...restProps} aria-label={ariaLabel} data-slot="outline-nav" class={cn("outline-nav", className)} style:--outline-count={items.length} onpointerenter={event => { if (event.pointerType === "mouse" && items.length) preview(previewId ?? activeId ?? items[0].id); }} onpointerleave={event => { if (event.pointerType === "mouse") scheduleClose(); }} onfocusout={focusOut}>
    <ol class="outline-lines">
      {#each items as item, index (item.id)}
        <li>
          <button type="button" class="outline-mark" data-level={item.level ?? 1} disabled={disabled} aria-label={`${index + 1}：${item.label}`} aria-haspopup="dialog" aria-controls={open ? panelId : undefined} aria-expanded={open} aria-current={activeId === item.id ? "location" : undefined} onpointerenter={event => { if (event.pointerType === "mouse") preview(item.id); }} onfocus={() => preview(item.id)} onkeydown={event => { if (event.key === "Escape") { keepOpen(); open = false; } }} onclick={() => navigate(item.id)}><span></span></button>
        </li>
      {/each}
    </ol>
  </nav>
  <Popover.Content bind:ref={panel} id={panelId} customAnchor={ref} side="left" align="center" sideOffset={6} role="dialog" aria-label={ariaLabel} trapFocus={false} onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => event.preventDefault()} onpointerenter={keepOpen} onpointerleave={event => { if (event.pointerType === "mouse") scheduleClose(); }} onfocusin={keepOpen} onfocusout={focusOut} class="w-72 max-w-[calc(100vw-4rem)] gap-2 p-2">
    <div class="flex items-center justify-between px-3 pt-2 pb-1"><h2 class="text-xs font-medium text-muted-foreground">{ariaLabel}</h2></div>
    <ol use:scrollbarVisibility class="outline-panel-list mutsuna-scrollbar grid max-h-[min(24rem,60dvh)] gap-1 overflow-y-auto overscroll-contain">
      {#each items as entry, entryIndex (entry.id)}
        <li aria-level={entry.level ?? 1}><button type="button" class="outline-entry" use:reveal={entry.id === previewId} class:previewed={entry.id === previewId} data-level={entry.level ?? 1} style:padding-inline-start={`${12 + ((entry.level ?? 1) - 1) * 12}px`} aria-current={activeId === entry.id ? "location" : undefined} onclick={() => navigate(entry.id)}><span class="entry-number">{entryIndex + 1}</span><span class="preview-label">{entry.label}</span></button></li>
      {/each}
    </ol>
  </Popover.Content>
</Popover.Root>
<style>
.outline-nav { --outline-step: 12px; display: flex; flex-direction: column; align-items: center; width: 44px; height: calc(var(--outline-count) * var(--outline-step)); max-height: 100%; }
.outline-lines { display: flex; flex-direction: column; flex: 1; width: 44px; list-style: none; margin: 0; padding: 0; min-height: 0; overflow: hidden; }
.outline-lines > li { flex: 1; min-height: 0; }
.outline-mark { display: flex; align-items: center; justify-content: end; width: 44px; height: 100%; padding: 0 12px; cursor: pointer; background: transparent; }
.outline-mark span { width: 10px; height: 2px; border-radius: 2px; background: var(--muted-foreground); opacity: .3; transition: width 150ms, opacity 150ms; }
.outline-mark[data-level="1"] span { width: 16px; }
.outline-mark[data-level="2"] span { width: 12px; }
.outline-mark[aria-current] span, .outline-mark:hover span, .outline-mark:focus-visible span { width: 20px; background: var(--foreground); opacity: .8; }
.outline-mark:hover { background: transparent; }
.outline-mark:focus-visible, .outline-entry:focus-visible { outline: 2px solid var(--ring); outline-offset: -2px; }
.outline-mark:disabled { opacity: .4; cursor: default; }
.outline-panel-list:hover { scrollbar-color: color-mix(in oklch, var(--primary) 72%, transparent) transparent; }
.outline-panel-list:hover::-webkit-scrollbar-thumb { background-color: color-mix(in oklch, var(--primary) 72%, transparent); animation: none; }
.outline-entry { display: flex; align-items: baseline; width: 100%; gap: 12px; padding: 10px 12px; border-radius: 8px; text-align: start; cursor: pointer; color: var(--muted-foreground); }
.outline-entry:hover, .outline-entry.previewed, .outline-entry[aria-current] { color: var(--foreground); }
.outline-entry[data-level="1"] { font-weight: 500; }
.outline-entry.previewed .entry-number { opacity: 1; }
.entry-number { flex-shrink: 0; opacity: .5; font-size: 10px; font-variant-numeric: tabular-nums; }
.preview-label { font-size: 12px; line-height: 1.7; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
@media (pointer: coarse) { .outline-nav { --outline-step: 24px; } }
@media (prefers-reduced-motion: reduce) { .outline-mark span { transition: none; } }
</style>
