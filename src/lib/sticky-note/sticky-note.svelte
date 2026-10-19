<script module lang="ts">
import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
export type StickyNotePosition = { x: number; y: number };
/** Spread onto a button forwarding events, attributes and Svelte attachments. */
export type StickyNoteTriggerProps = Pick<HTMLButtonAttributes, "type" | "disabled" | "class" | "aria-label" | "title" | "aria-haspopup" | "aria-expanded" | "aria-controls" | "aria-describedby"> & { onclick: (event: MouseEvent) => void } & Record<string, unknown>;
export type StickyNoteProps = {
  /** Floating minimized button by default; inline also supports a custom trigger. */
  triggerMode?: "floating" | "inline" | "none";
  trigger?: Snippet<[{ props: StickyNoteTriggerProps; hasMemo: boolean }]>;
  position?: StickyNotePosition | null;
  triggerPosition?: StickyNotePosition | null;
  "data-slot"?: string;
  value?: string;
  open?: boolean;
  /** Accessible label; no visible title row is rendered. */
  title?: string;
  triggerLabel?: string;
  placeholder?: string;
  /** Saved-memo indicator; defaults to whether value has text. */
  hasMemo?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  saving?: boolean;
  /** Last successfully persisted value. Omit when persistence status is unknown. */
  savedValue?: string;
  error?: string;
  /** EditableText commit or explicit save notification. Consumer manages persistence and errors. */
  onSave?: (value: string) => void;
  class?: string;
};
</script>
<script lang="ts">
import { createAttachmentKey } from "svelte/attachments";
import { tick, untrack } from "svelte";
import { Portal } from "bits-ui";
import { StickyNote as StickyNoteIcon, Minus, Save, LoaderCircle, Check, RotateCcw } from "@lucide/svelte";
import { Button } from "../button/index.js";
import { EditableText } from "../editable-text/index.js";
import { cn } from "../utils.js";

let {
  value = $bindable(""), open = $bindable(false), title = "メモ",
  triggerLabel = "メモを開く", placeholder = "メモを追加…", hasMemo,
  readOnly = false, disabled = false, saving = false, savedValue, error, onSave, class: className,
  triggerMode = "floating", trigger: triggerSnippet,
  position = $bindable(null), triggerPosition = $bindable(null), "data-slot": dataSlot = "sticky-note"
}: StickyNoteProps = $props();
const id = $props.id();
let trigger = $state<HTMLButtonElement | null>(null);
let card = $state<HTMLDivElement | null>(null);
let opener: HTMLElement | null = null;
let lastAnchor: DOMRect | undefined;
const memoPresent = $derived(hasMemo ?? Boolean(value.trim()));
const triggerAttachment = createAttachmentKey();
let suppressClick = false;
const triggerProps: StickyNoteTriggerProps = $derived({
  [triggerAttachment]: (node: HTMLButtonElement) => { trigger = node; return () => { if (trigger === node) trigger = null; }; },
  type: "button", disabled, class: className, "aria-label": triggerLabel, title: triggerLabel,
  "aria-haspopup": "dialog", "aria-expanded": open,
  "aria-controls": open ? id + "-card" : undefined,
  "aria-describedby": memoPresent ? id + "-presence" : undefined,
  onclick: () => { if (suppressClick) { suppressClick = false; return; } if (!disabled) { if (open) close(); else { lastAnchor = trigger?.getBoundingClientRect(); opener = trigger; open = true; } } },
});
let moving = $state(false);
let editorValue = $state<string | null>(null);
const saved = $derived(savedValue !== undefined && (editorValue ?? value) === savedValue);
const saveLabel = $derived(saving ? "保存中" : error ? "メモの保存を再試行" : saved ? "保存済み" : "メモを保存");
function clamp(x: number, y: number) {
  const bounds = card?.getBoundingClientRect();
  return { x: Math.max(12, Math.min(x, innerWidth - (bounds?.width ?? 256) - 12)), y: Math.max(12, Math.min(y, innerHeight - (bounds?.height ?? 48) - 12)) };
}
$effect(() => {
  if (!card) return;
  if (!position) {
    const anchor = untrack(() => trigger?.getBoundingClientRect() ?? lastAnchor);
    position = clamp((anchor?.right ?? innerWidth - 12) - card.offsetWidth, (anchor?.bottom ?? 12) + 8);
    return;
  }
  const next = clamp(position.x, position.y);
  if (next.x !== position.x || next.y !== position.y) position = next;
});
$effect(() => {
  if (triggerMode !== "floating" || open || !trigger || !triggerPosition) return;
  const bounds = trigger.getBoundingClientRect();
  const next = { x: Math.max(12, Math.min(triggerPosition.x, innerWidth - bounds.width - 12)), y: Math.max(12, Math.min(triggerPosition.y, innerHeight - bounds.height - 12)) };
  if (next.x !== triggerPosition.x || next.y !== triggerPosition.y) triggerPosition = next;
});
function save(event: MouseEvent) {
  if (disabled || saving || readOnly || (saved && !error)) return;
  const editor = card?.querySelector<HTMLTextAreaElement>("textarea[data-slot='editable-text-textarea']");
  const changed = editor !== null && editor !== undefined && editor.value !== value;
  // Blur commits the draft through EditableText; do not notify twice.
  editor?.blur();
  if (!changed) onSave?.(value);
  (event.currentTarget as HTMLButtonElement).focus({ preventScroll: true });
}
function close() {
  const restore = card?.contains(document.activeElement);
  open = false;
  if (restore) void tick().then(() => (trigger ?? opener)?.focus({ preventScroll: true }));
}
$effect(() => {
  if (!open || !card) return;
  const node = card;
  if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) opener = document.activeElement;
  const anchor = trigger?.getBoundingClientRect() ?? lastAnchor;
  const previous = untrack(() => position);
  position = clamp(previous?.x ?? (anchor?.right ?? innerWidth - 12) - node.offsetWidth, previous?.y ?? (anchor?.bottom ?? 12) + 8);
  void tick().then(() => {
    if (!node.isConnected) return;
    (node.querySelector<HTMLButtonElement>('[data-slot="editable-text"]:not(:disabled)') ?? node).focus({ preventScroll: true });
  });
  const resize = () => { const current = untrack(() => position); if (current) position = clamp(current.x, current.y); };
  const observer = new ResizeObserver(resize);
  observer.observe(node);
  window.addEventListener("resize", resize);
  return () => { observer.disconnect(); window.removeEventListener("resize", resize); };
});
function floatingTrigger(node: HTMLDivElement) {
  const captureTarget = node.querySelector("button") ?? node;
  let drag: { id: number; x: number; y: number; left: number; top: number; moved: boolean } | null = null;
  const fit = (x: number, y: number) => ({ x: Math.max(12, Math.min(x, innerWidth - node.offsetWidth - 12)), y: Math.max(12, Math.min(y, innerHeight - node.offsetHeight - 12)) });
  const resize = () => { const bounds = node.getBoundingClientRect(); triggerPosition = fit(bounds.x, bounds.y); };
  resize();
  const down = (event: PointerEvent) => {
    if (disabled || !event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    const bounds = node.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: bounds.x, top: bounds.y, moved: false };
  };
  const move = (event: PointerEvent) => {
    if (drag?.id !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 4) return;
    drag.moved = true; suppressClick = true;
    captureTarget.setPointerCapture(event.pointerId);
    triggerPosition = fit(drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y);
    event.preventDefault();
  };
  const end = (event: PointerEvent) => {
    if (event.type === "lostpointercapture" && event.target !== captureTarget) return;
    if (drag?.id !== event.pointerId) return;
    const tapped = event.type === "pointerup" && event.pointerType === "touch" && !drag.moved;
    drag = null;
    if (captureTarget.hasPointerCapture(event.pointerId)) captureTarget.releasePointerCapture(event.pointerId);
    if (tapped) {
      event.preventDefault(); suppressClick = true;
      lastAnchor = trigger?.getBoundingClientRect(); opener = trigger; open = true;
    }
  };
  const key = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    const step = event.shiftKey ? 24 : 8;
    const offsets: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const offset = offsets[event.key];
    if (offset) { event.preventDefault(); const bounds = node.getBoundingClientRect(); triggerPosition = fit(bounds.x + offset[0], bounds.y + offset[1]); }
    else suppressClick = false;
  };
  node.addEventListener("pointerdown", down); node.addEventListener("pointermove", move); node.addEventListener("pointerup", end); node.addEventListener("pointercancel", end); node.addEventListener("lostpointercapture", end); node.addEventListener("keydown", key); window.addEventListener("resize", resize);
  return { destroy() { if (drag && captureTarget.hasPointerCapture(drag.id)) captureTarget.releasePointerCapture(drag.id); node.removeEventListener("pointerdown", down); node.removeEventListener("pointermove", move); node.removeEventListener("pointerup", end); node.removeEventListener("pointercancel", end); node.removeEventListener("lostpointercapture", end); node.removeEventListener("keydown", key); window.removeEventListener("resize", resize); } };
}
function movable(node: HTMLDivElement) {
  let drag: { pointer: number; x: number; y: number; left: number; top: number } | undefined;
  const down = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || !(event.target as Element).closest("[data-note-grip]")) return;
    const bounds = node.getBoundingClientRect();
    drag = { pointer: event.pointerId, x: event.clientX, y: event.clientY, left: bounds.left, top: bounds.top };
    moving = true;
    node.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  const move = (event: PointerEvent) => {
    if (drag?.pointer !== event.pointerId) return;
    position = clamp(drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y);
  };
  const end = (event: PointerEvent) => {
    if (event.type === "lostpointercapture" && event.target !== node) return;
    if (drag?.pointer !== event.pointerId) return;
    drag = undefined; moving = false;
    if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
  };
  const keydown = (event: KeyboardEvent) => {
    if (event.isComposing || event.keyCode === 229 || event.defaultPrevented) return;
    if ((event.target as Element).closest("textarea[data-slot=editable-text-textarea]")) return;
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.target !== node || event.ctrlKey || event.metaKey || event.altKey) return;
    const step = event.shiftKey ? 24 : 8;
    const delta: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const change = delta[event.key];
    if (change && position) { event.preventDefault(); position = clamp(position.x + change[0], position.y + change[1]); }
  };
  const trackEditor = () => { editorValue = node.querySelector<HTMLTextAreaElement>("textarea[data-slot='editable-text-textarea']")?.value ?? null; };
  const afterFocus = () => { void tick().then(() => { if (node.isConnected) trackEditor(); }); };
  node.addEventListener("input", trackEditor);
  node.addEventListener("focusin", trackEditor);
  node.addEventListener("focusout", afterFocus);
  node.addEventListener("pointerdown", down);
  node.addEventListener("pointermove", move);
  node.addEventListener("pointerup", end);
  node.addEventListener("pointercancel", end);
  node.addEventListener("lostpointercapture", end);
  node.addEventListener("keydown", keydown);
  return { destroy() { editorValue = null; node.removeEventListener("input", trackEditor); node.removeEventListener("focusin", trackEditor); node.removeEventListener("focusout", afterFocus); if (drag && node.hasPointerCapture(drag.pointer)) node.releasePointerCapture(drag.pointer); drag = undefined; moving = false; node.removeEventListener("pointerdown", down); node.removeEventListener("pointermove", move); node.removeEventListener("pointerup", end); node.removeEventListener("pointercancel", end); node.removeEventListener("lostpointercapture", end); node.removeEventListener("keydown", keydown); } };
}
</script>
{#snippet defaultTrigger(floating: boolean)}
  <Button {...triggerProps} variant={floating ? "outline" : "ghost"} icon={StickyNoteIcon} class={cn("memo-trigger min-h-11", floating && "floating-trigger", className)}>
    {#if !floating}<span class="trigger-label">メモ</span>{/if}{#if !floating && memoPresent}<span class="memo-presence" aria-hidden="true"></span>{/if}
  </Button>
{/snippet}
{#if triggerMode === "floating" && !open}
  <Portal><div use:floatingTrigger data-slot="sticky-note-floating-trigger" class="floating-trigger-anchor" style:left={triggerPosition ? triggerPosition.x + "px" : undefined} style:top={triggerPosition ? triggerPosition.y + "px" : undefined} style:right={triggerPosition ? "auto" : undefined} style:bottom={triggerPosition ? "auto" : undefined}>{@render defaultTrigger(true)}</div></Portal>
{:else if triggerMode === "inline"}
  {#if triggerSnippet}{@render triggerSnippet({ props: triggerProps, hasMemo: memoPresent })}{:else}{@render defaultTrigger(false)}{/if}
{/if}
{#if memoPresent}<span id={id + "-presence"} class="sr-only">メモがあります</span>{/if}
{#if open}
  <Portal>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (The non-modal note is focusable for keyboard movement.) -->
    <div bind:this={card} use:movable id={id + "-card"} data-slot={dataSlot + "-card"} data-moving={moving} role="dialog" aria-modal="false" aria-label={title} aria-busy={saving} tabindex="0" class="sticky-note" style:left={(position?.x ?? 0) + "px"} style:top={(position?.y ?? 0) + "px"} style:visibility={position ? "visible" : "hidden"}>
      <span data-note-grip class="note-grip top" aria-hidden="true"></span><span data-note-grip class="note-grip bottom" aria-hidden="true"></span><span data-note-grip class="note-grip left" aria-hidden="true"></span><span data-note-grip class="note-grip right" aria-hidden="true"></span>
      <div class="note-actions">
        <span data-note-grip="header" class="note-header-grip" aria-hidden="true"></span>
        {#if !readOnly}
          <button type="button" class="note-action" aria-label={saveLabel} title={saveLabel} aria-disabled={saved && !error && !saving ? true : undefined} disabled={disabled || saving} onpointerdown={event => event.preventDefault()} onclick={save}>
            {#if saving}<LoaderCircle class="size-3.5 animate-spin" aria-hidden="true" />{:else if error}<RotateCcw class="size-3.5" aria-hidden="true" />{:else if saved}<Check class="size-3.5" aria-hidden="true" />{:else}<Save class="size-3.5" aria-hidden="true" />{/if}
          </button>
          <span role="status" class="sr-only">{saving ? "保存中" : error ? "保存に失敗しました" : saved ? "保存済み" : savedValue !== undefined ? "未保存" : ""}</span>
        {/if}
        <button type="button" class="note-action" aria-label="メモを最小化" title="最小化" onclick={close}><Minus class="size-3.5" aria-hidden="true" /></button>
      </div>
      <div class="note-content">
        {#if readOnly}<p class="note-text">{value || "メモはありません。"}</p>
        {:else}<EditableText bind:value multiline selectOnEdit={false} {placeholder} disabled={disabled || saving} aria-label={title + "の本文"} class="memo-text-trigger w-full! m-0! p-0! whitespace-pre-wrap" inputClass="m-0 w-full px-0 max-h-44 overflow-y-auto" textareaProps={{ "aria-invalid": Boolean(error), "aria-describedby": error ? id + "-error" : undefined }} onCommit={({ value }) => { editorValue = null; onSave?.(value); }} onCancel={() => editorValue = null} />{/if}
        {#if error}<p id={id + "-error"} class="memo-error" role="alert">{error}</p>{/if}
      </div>
    </div>
  </Portal>
{/if}
<style>
  .floating-trigger-anchor { position: fixed; right: 24px; bottom: 24px; z-index: 50; touch-action: none; }
  .floating-trigger-anchor :global(.floating-trigger) { width: 44px; height: 44px; padding: 0; border-radius: 12px; background: color-mix(in oklab, var(--background) 88%, #facc15); box-shadow: 0 3px 14px rgb(0 0 0 / .13); cursor: grab; }
  .floating-trigger-anchor:active :global(.floating-trigger) { cursor: grabbing; }
  .sticky-note { position: fixed; z-index: 50; width: 256px; max-width: calc(100vw - 24px); max-height: min(18rem, calc(100dvh - 24px)); padding: 12px; border: 0; border-radius: 3px; background: color-mix(in oklab, var(--background) 88%, #facc15); color: var(--foreground); box-shadow: 0 3px 14px rgb(0 0 0 / .13); outline: none; overflow: auto; }
  .sticky-note:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
  .note-actions { display: flex; justify-content: flex-end; gap: 2px; margin: -6px -6px 4px; position: relative; z-index: 2; }
  .note-header-grip { flex: 1; align-self: stretch; min-width: 0; touch-action: none; cursor: grab; }
  .note-action { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 3px; background: transparent; color: var(--muted-foreground); cursor: pointer; }
  .note-action:hover:not(:disabled):not([aria-disabled="true"]) { color: var(--foreground); background: color-mix(in oklab, var(--foreground) 7%, transparent); }
  .note-action:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }
  .note-action[aria-disabled="true"] { cursor: default; }
  .note-action:disabled { cursor: default; opacity: .5; }
  .note-content { display: grid; min-width: 0; min-height: 24px; }
  .note-content :global(.memo-text-trigger) { font-size: 14px; line-height: 24px; overflow-wrap: anywhere; }
  .note-content :global(textarea) { max-width: 100%; background: transparent; border: 0; box-shadow: none; }
  .note-text { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 14px; line-height: 24px; }
  .memo-error { margin: 6px 0 0; font-size: 12px; line-height: 1.6; color: var(--destructive); overflow-wrap: anywhere; }
  .memo-presence { width: 5px; height: 5px; flex-shrink: 0; border-radius: 50%; background: var(--primary); }
  .note-grip { position: absolute; z-index: 1; touch-action: none; cursor: grab; }
  [data-moving="true"] .note-grip, [data-moving="true"] .note-header-grip { cursor: grabbing; }
  .note-grip.top, .note-grip.bottom { left: 0; right: 0; height: 12px; }
  .note-grip.top { top: 0; } .note-grip.bottom { bottom: 0; }
  .note-grip.left, .note-grip.right { top: 12px; bottom: 12px; width: 12px; }
  .note-grip.left { left: 0; } .note-grip.right { right: 0; }
  @media (max-width: 767px) { .trigger-label { display: none; } :global(.memo-trigger) { min-width: 44px; } .note-content :global(.memo-text-trigger), .note-text { font-size: 16px; } }
</style>
