<script module lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { WithElementRef } from "../utils.js";
export type MessageReactionOption = { emoji: string; label: string };
export type MessageActionsProps = WithElementRef<Omit<HTMLAttributes<HTMLDivElement>, "children">> & {
  onReply?: () => void;
  onEdit?: () => void;
  editLabel?: string;
  onCopy?: () => void;
  onReact?: (emoji: string) => void;
  reactions?: readonly MessageReactionOption[];
  copyState?: "idle" | "copied" | "error";
  disabled?: boolean;
  /** Enable touch/pen long press on the nearest Message.Root (500ms). */
  longPress?: boolean;
  /** Native buttons or other controls inside the mobile drawer. */
  mobileActions?: Snippet<[{ close: () => void }]>;
  ariaLabel?: string;
  /** Additional DropdownMenu.Item controls owned by the consumer. */
  actions?: Snippet<[{ close: () => void }]>;
};
</script>
<script lang="ts">
import { Copy, Check, Reply, SmilePlus, Ellipsis, Pencil } from "@lucide/svelte";
import { Button } from "../button/index.js";
import * as Menu from "../dropdown-menu/index.js";
import * as Sheet from "../responsive-dialog/index.js";
import * as Popover from "../popover/index.js";
import { cn } from "../utils.js";
let { ref = $bindable(null), onReply, onEdit, editLabel = "編集", onCopy, onReact, reactions = [{ emoji: "👍", label: "いいね" }, { emoji: "❤️", label: "ハート" }, { emoji: "🎉", label: "お祝い" }], copyState = "idle", disabled = false, longPress = true, mobileActions, ariaLabel = "メッセージの操作", actions, class: className, ...restProps }: MessageActionsProps = $props();
let menuOpen = $state(false);
let drawerOpen = $state(false);
let mobile = $state(true);
let afterDrawerClose: (() => void) | undefined;
$effect(() => {
  const query = matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)");
  const update = () => { mobile = !query.matches; menuOpen = false; drawerOpen = false; reactionOpen = false; };
  update(); query.addEventListener("change", update);
  return () => query.removeEventListener("change", update);
});
function choose(action: (() => void) | undefined, restoreElsewhere = false) {
  drawerOpen = false;
  if (restoreElsewhere) afterDrawerClose = action; else action?.();
}
$effect(() => {
  if (!mobile || !longPress || disabled) return;
  const target = ref?.closest<HTMLElement>("[data-slot=message]");
  if (!target) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pointer: number | undefined;
  let x = 0; let y = 0; let held = false;
  const cancel = () => { clearTimeout(timer); timer = undefined; pointer = undefined; window.removeEventListener("pointerdown", secondary); window.removeEventListener("pointerup", cancel); window.removeEventListener("pointercancel", cancel); window.removeEventListener("scroll", cancel, true); };
  const secondary = (event: PointerEvent) => { if (!event.isPrimary) cancel(); };
  const down = (event: PointerEvent) => {
    cancel(); held = false;
    if (!event.isPrimary || !["touch", "pen"].includes(event.pointerType) || (event.target as Element).closest("button,a,input,textarea,select,[contenteditable],[role=button],[role=link],[data-slot=message-actions]")) return;
    pointer = event.pointerId; x = event.clientX; y = event.clientY;
    window.addEventListener("pointerdown", secondary); window.addEventListener("pointerup", cancel); window.addEventListener("pointercancel", cancel); window.addEventListener("scroll", cancel, true);
    timer = setTimeout(() => { timer = undefined; held = true; drawerOpen = true; }, 500);
  };
  const move = (event: PointerEvent) => { if (event.pointerId === pointer && Math.hypot(event.clientX - x, event.clientY - y) > 8) cancel(); };
  const context = (event: MouseEvent) => { if (timer || held) event.preventDefault(); };
  const click = (event: MouseEvent) => { if (held) { event.preventDefault(); event.stopImmediatePropagation(); held = false; } };
  target.addEventListener("pointerdown", down, { passive: true });
  target.addEventListener("pointermove", move, { passive: true });
  target.addEventListener("contextmenu", context);
  target.addEventListener("click", click, true);
  return () => {
    cancel(); target.removeEventListener("pointerdown", down); target.removeEventListener("pointermove", move); target.removeEventListener("contextmenu", context); target.removeEventListener("click", click, true);
    window.removeEventListener("pointerup", cancel); window.removeEventListener("pointercancel", cancel); window.removeEventListener("scroll", cancel, true);
  };
});
let reactionOpen = $state(false);
const copyCommand = $derived(copyState === "error" ? "コピーを再試行" : "コピー");
const copyLabel = $derived(copyState === "copied" ? "コピーしました" : copyState === "error" ? "コピーを再試行" : "コピー");
$effect(() => { if (disabled) { menuOpen = false; reactionOpen = false; drawerOpen = false; afterDrawerClose = undefined; } });
</script>
{#if onReply || onEdit || onCopy || (onReact && reactions.length) || actions || mobileActions}
<div bind:this={ref} {...restProps} data-slot="message-actions" data-open={menuOpen || drawerOpen || reactionOpen || copyState !== "idle"} class={cn("message-actions", className)} role="group" aria-label={ariaLabel}>
  <span class="action-blur" aria-hidden="true"></span>
  <span class="action-outline" aria-hidden="true"></span>
  <div class="direct-actions">
    {#if onReply}<Button variant="ghost" size="icon-sm" icon={Reply} class="message-action" aria-label="リプライ" title="リプライ" {disabled} onclick={onReply} />{/if}
    {#if onReact && reactions.length}
      <Popover.Root bind:open={reactionOpen}>
        <Popover.Trigger>{#snippet child({ props })}<Button {...props} variant="ghost" size="icon-sm" icon={SmilePlus} class="message-action" aria-label="リアクションを追加" title="リアクションを追加" {disabled} />{/snippet}</Popover.Trigger>
        <Popover.Content side="top" align="end" class="w-auto max-w-[calc(100vw-2rem)] p-1" role="dialog" aria-label="リアクションを選択">
          <div class="reaction-options">{#each reactions as option (option.emoji)}<Button variant="ghost" size="icon-sm" class="message-action text-lg" aria-label={option.label} onclick={() => { onReact?.(option.emoji); reactionOpen = false; }}>{option.emoji}</Button>{/each}</div>
        </Popover.Content>
      </Popover.Root>
    {/if}
    {#if onEdit}<Button variant="ghost" size="icon-sm" icon={Pencil} class="message-action" aria-label={editLabel} title={editLabel} {disabled} onclick={onEdit} />{/if}
    {#if onCopy}<Button variant="ghost" size="icon-sm" icon={copyState === "copied" ? Check : Copy} class="message-action" aria-label={copyLabel} title={copyCommand} {disabled} onclick={onCopy} />{/if}
  </div>
  {#if !mobile}
  <Menu.Root bind:open={menuOpen}>
    <Menu.Trigger>{#snippet child({ props })}<Button {...props} variant="ghost" size="icon-sm" icon={Ellipsis} class="message-action" aria-label="その他の操作" title="その他の操作" {disabled} />{/snippet}</Menu.Trigger>
    <Menu.Content align="end" sideOffset={4} class="min-w-44 max-w-[calc(100vw-2rem)]" aria-label={ariaLabel}>
      {#if onReply}<Menu.Item class="min-h-11" onclick={onReply}><Reply />リプライ</Menu.Item>{/if}
      {#if onEdit}<Menu.Item class="min-h-11" aria-label={editLabel} onclick={onEdit}><Pencil />編集</Menu.Item>{/if}
      {#if onCopy}<Menu.Item class="min-h-11" aria-label={copyLabel} onclick={onCopy}>{#if copyState === "copied"}<Check />{:else}<Copy />{/if}{copyCommand}</Menu.Item>{/if}
      {#if onReact && reactions.length}<Menu.Separator />{#each reactions as option (option.emoji)}<Menu.Item class="min-h-11" onclick={() => onReact?.(option.emoji)}><span aria-hidden="true">{option.emoji}</span>{option.label}</Menu.Item>{/each}{/if}
      {#if actions}<Menu.Separator />{@render actions({ close: () => { menuOpen = false; } })}{/if}
    </Menu.Content>
  </Menu.Root>
  {/if}
  <Sheet.Root bind:open={drawerOpen} mode="mobile">
    {#if mobile}<Sheet.Trigger>{#snippet child({ props })}<Button {...props} variant="ghost" size="icon-sm" icon={Ellipsis} class="message-action" aria-label="その他の操作" title="その他の操作" {disabled} />{/snippet}</Sheet.Trigger>{/if}
    <Sheet.Content drawerProps={{ onCloseAutoFocus: event => { const action = afterDrawerClose; afterDrawerClose = undefined; if (action) { event.preventDefault(); action(); } } }}>
      <Sheet.Header><Sheet.Title>{ariaLabel}</Sheet.Title><Sheet.Description class="sr-only">メッセージに対する操作を選択できます。</Sheet.Description></Sheet.Header>
      <Sheet.Body>
        {#if onReact && reactions.length}<div class="drawer-reactions" role="group" aria-label="リアクション">{#each reactions as option (option.emoji)}<Button variant="ghost" class="drawer-reaction" aria-label={option.label} {disabled} onclick={() => choose(() => onReact?.(option.emoji))}><span class="text-2xl" aria-hidden="true">{option.emoji}</span><span>{option.label}</span></Button>{/each}</div>{/if}
        <div class="drawer-commands">
          {#if onReply}<Button variant="ghost" icon={Reply} class="drawer-command" {disabled} onclick={() => choose(onReply, true)}>リプライ</Button>{/if}
          {#if onEdit}<Button variant="ghost" icon={Pencil} class="drawer-command" aria-label={editLabel} {disabled} onclick={() => choose(onEdit, true)}>編集</Button>{/if}
          {#if onCopy}<Button variant="ghost" icon={copyState === "copied" ? Check : Copy} class="drawer-command" aria-label={copyLabel} {disabled} onclick={() => choose(onCopy)}>{copyCommand}</Button>{/if}
          {#if mobileActions}{@render mobileActions({ close: () => { drawerOpen = false; } })}
          {:else if actions}<Menu.Root><Menu.Trigger>{#snippet child({ props })}<Button {...props} variant="ghost" icon={Ellipsis} class="drawer-command" {disabled}>追加の操作</Button>{/snippet}</Menu.Trigger><Menu.Content>{@render actions({ close: () => { drawerOpen = false; } })}</Menu.Content></Menu.Root>{/if}
        </div>
      </Sheet.Body>
      <Sheet.Footer><Sheet.Close>{#snippet child({ props })}<Button {...props} variant="outline" class="min-h-11">閉じる</Button>{/snippet}</Sheet.Close></Sheet.Footer>
    </Sheet.Content>
  </Sheet.Root>
  <span class="copy-feedback" data-state={copyState} role="status">{copyState === "copied" ? "コピーしました" : copyState === "error" ? "コピーできませんでした" : ""}</span>
</div>
{/if}
<style>
  .message-actions { position: relative; display: flex; align-items: center; gap: 2px; border-radius: 10px; color: var(--muted-foreground); }
  .copy-feedback { position: absolute; inset-block-start: 100%; inset-inline-end: 0; z-index: 13; margin-top: 4px; padding: 4px 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--popover); color: var(--popover-foreground); font-size: 11px; white-space: nowrap; pointer-events: none; }
  .copy-feedback:not([data-state="error"]) { width: 1px; height: 1px; padding: 0; margin: 0; border: 0; overflow: hidden; clip-path: inset(50%); }
  .copy-feedback:empty { padding: 0; border: 0; }
  :global([data-slot="message"][data-align="start"]) .copy-feedback { inset-inline-start: 0; inset-inline-end: auto; }
  .copy-feedback[data-state="error"] { color: var(--destructive); }
  .action-blur, .action-outline { display: none; }
  .direct-actions { display: none; align-items: center; }
  .message-actions :global(.message-action), .reaction-options :global(.message-action) { width: 44px; height: 44px; }
  .reaction-options { display: flex; flex-wrap: wrap; }
  .drawer-reactions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
  .drawer-reactions :global(.drawer-reaction) { display: flex; flex-direction: column; height: auto; min-width: 64px; min-height: 64px; gap: 6px; padding: 8px; font-size: 11px; }
  .drawer-commands { display: grid; gap: 4px; }
  .drawer-commands :global(.drawer-command) { min-height: 48px; width: 100%; justify-content: start; gap: 12px; padding-inline: 12px; }
  @media (min-width: 768px) and (hover: hover) and (pointer: fine) {
    .message-actions { position: absolute; inset-block-start: 0; inset-inline-end: 0; z-index: 12; gap: 2px; padding: 3px; border-radius: 12px; background: transparent; border: 1px solid transparent; opacity: 0; pointer-events: none; transition: opacity 120ms; }
    .message-actions::before, .message-actions::after { content: ""; position: absolute; inset: -1px; z-index: -1; border: 1px solid transparent; border-radius: inherit; background: var(--background); box-shadow: 0 1px 4px rgb(0 0 0 / .04); pointer-events: none; }
    .action-blur { display: block; position: absolute; inset: -1px; z-index: -2; border-radius: inherit; pointer-events: none; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); mask-image: linear-gradient(to bottom, #000 65%, transparent 100%); }
    .action-outline { display: block; position: absolute; inset: -1px; z-index: 1; border: 1px solid color-mix(in oklab, var(--foreground) 8%, transparent); border-radius: inherit; pointer-events: none; opacity: 0; transition: opacity 140ms; }
    .message-actions:hover .action-outline, .message-actions:has(:global(:focus-visible)) .action-outline, .message-actions[data-open="true"] .action-outline { opacity: 1; }
    .message-actions::before { background: color-mix(in oklab, var(--background) 92%, transparent); mask-image: linear-gradient(to bottom, #000 35%, transparent 90%); }
    .message-actions::after { opacity: 0; transition: opacity 140ms; }
    .message-actions:hover::after, .message-actions:has(:global(:focus-visible))::after, .message-actions[data-open="true"]::after { opacity: 1; }
    .message-actions :global(.message-action), .reaction-options :global(.message-action) { width: 32px; height: 32px; border-radius: 6px; transition: background-color 140ms, color 140ms; }
    .message-actions :global(.message-action:is(:hover, :focus-visible, [data-state="open"]):not(:disabled)) { background: color-mix(in oklab, var(--primary) 8%, var(--background)); color: var(--foreground); }
    .direct-actions { display: flex; }
    :global([data-slot="message"]:hover) .message-actions, .message-actions:has(:global(:focus-visible)), .message-actions[data-open="true"] { opacity: 1; pointer-events: auto; }
  }
  @media (prefers-reduced-motion: reduce) { .message-actions, .message-actions::after, .action-outline, .message-actions :global(.message-action), .reaction-options :global(.message-action) { transition: none; } }
</style>
