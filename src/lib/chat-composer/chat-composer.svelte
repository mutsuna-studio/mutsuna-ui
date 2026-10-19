<script module lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { WithElementRef } from "../utils.js";

export type ChatComposerAttachment = {
  id: string;
  name: string;
  size?: number;
  /** Consumer-owned image preview URL; consumer creates and revokes object URLs. */
  previewUrl?: string;
  status?: "ready" | "uploading" | "error";
  error?: string;
};
export type ChatComposerSubmission = { text: string; attachments: readonly ChatComposerAttachment[] };
export type ChatComposerProps = WithElementRef<Omit<HTMLAttributes<HTMLFormElement>, "children" | "onsubmit">> & {
  value?: string;
  attachments?: readonly ChatComposerAttachment[];
  disabled?: boolean;
  sending?: boolean;
  /** Send with Enter (Shift+Enter inserts a newline) or Ctrl/Cmd+Enter. IME composition never submits. */
  submitOn?: "enter" | "mod-enter";
  placeholder?: string;
  ariaLabel?: string;
  /** Optional notice above the input, visible while the textarea is focused or contains text. Floats above the input without reserving space or moving it. */
  notice?: string;
  accept?: string;
  multiple?: boolean;
  onSend?: (submission: ChatComposerSubmission) => void;
  onFilesSelect?: (files: File[]) => void;
  onRemoveAttachment?: (id: string) => void;
  /** Optional emoji, model, or other consumer-owned controls below the input. */
  tools?: Snippet;
  /** Consumer-owned reply or editing context inside the input surface. */
  context?: Snippet;
  /** Additional controls in the add popover; call close after choosing an action. */
  actions?: Snippet<[{ close: () => void }]>;
};
</script>

<script lang="ts">
import { tick } from "svelte";
import ArrowUp from "@lucide/svelte/icons/arrow-up";
import Plus from "@lucide/svelte/icons/plus";
import Paperclip from "@lucide/svelte/icons/paperclip";
import FileText from "@lucide/svelte/icons/file-text";
import X from "@lucide/svelte/icons/x";
import LoaderCircle from "@lucide/svelte/icons/loader-circle";
import * as Popover from "../popover/index.js";
import * as InputGroup from "../input-group/index.js";
import { Button } from "../button/index.js";
import { cn } from "../utils.js";
import AttachmentImage from "./attachment-image.svelte";
import { scrollbarVisibility } from "../scrollbar/index.js";

let {
  ref = $bindable(null), value = $bindable(""), attachments = [], disabled = false, sending = false,
  submitOn = "mod-enter", onkeydown, placeholder = "メッセージを入力", ariaLabel = "メッセージ", accept, multiple = true,
  onSend, onFilesSelect, onRemoveAttachment, tools, context, actions, notice, class: className, ...restProps
}: ChatComposerProps = $props();
const composerId = $props.id();
const noticeId = `${composerId}-notice`;
let actionsOpen = $state(false);
$effect(() => { if (locked) actionsOpen = false; });
let picker: HTMLInputElement;
let input: HTMLTextAreaElement | null = $state(null);
let measure: HTMLDivElement | null = $state(null);
let multiline = $state(false);
const expanded = $derived(multiline || attachments.length > 0);
let layoutAnimations: Animation[] = [];
let previousLayout: boolean | undefined;
$effect.pre(() => {
  const next = expanded;
  if (previousLayout === undefined) { previousLayout = next; return; }
  if (previousLayout === next) return;
  previousLayout = next;
  const box = ref?.querySelector<HTMLElement>(".composer-box");
  if (!box) return;
  const before = box.getBoundingClientRect();
  const controls = Array.from(box.querySelectorAll<HTMLElement>(".composer-addon, .composer-input"));
  const positions = controls.map(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.left - before.left, y: rect.top - before.top };
  });
  layoutAnimations.forEach(animation => animation.cancel());
  layoutAnimations = [];
  let cancelled = false;
  void tick().then(() => {
    if (cancelled || !box.isConnected || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const after = box.getBoundingClientRect();
    const options = { duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" };
    layoutAnimations = controls.map((element, index) => {
      const rect = element.getBoundingClientRect();
      const x = positions[index].x - (rect.left - after.left);
      const y = positions[index].y - (rect.top - after.top);
      return element.animate([{ transform: `translate(${x}px, ${y}px)` }, { transform: "translate(0, 0)" }], options);
    });
    layoutAnimations.push(box.animate([{ height: `${before.height}px` }, { height: `${after.height}px` }], options));
  });
  return () => { cancelled = true; };
});
$effect(() => {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const stop = () => { if (motion.matches) layoutAnimations.forEach(animation => animation.cancel()); };
  motion.addEventListener("change", stop);
  return () => {
    motion.removeEventListener("change", stop);
    layoutAnimations.forEach(animation => animation.cancel());
  };
});
$effect(() => {
  const element = measure;
  value;
  if (!element) return;
  const update = () => { multiline = element.scrollHeight > 23; };
  update();
  const observer = new ResizeObserver(update);
  observer.observe(element);
  return () => observer.disconnect();
});
const locked = $derived(disabled || sending);
const canSend = $derived(!locked && Boolean(value.trim() || attachments.length) && !attachments.some(file => file.status === "uploading" || file.status === "error"));
function submit(event: SubmitEvent) {
  event.preventDefault();
  if (canSend) onSend?.({ text: value.trim(), attachments: [...attachments] });
}
function keydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLFormElement }) {
  onkeydown?.(event);
  if (event.defaultPrevented || event.target !== input || event.isComposing || event.keyCode === 229 || event.key !== "Enter") return;
  const shouldSubmit = !event.shiftKey && !event.altKey && (submitOn === "enter" ? !event.ctrlKey && !event.metaKey : event.ctrlKey || event.metaKey);
  if (!shouldSubmit) return;
  event.preventDefault();
  if (!event.repeat && canSend) event.currentTarget.requestSubmit();
}
async function selectFiles(event: Event) {
  const target = event.currentTarget as HTMLInputElement;
  const files = Array.from(target.files ?? []);
  target.value = "";
  if (locked || !files.length) return;
  onFilesSelect?.(files);
  await tick();
  input?.focus();
}
async function removeAttachment(id: string) {
  if (locked) return;
  onRemoveAttachment?.(id);
  await tick();
  input?.focus();
}
function formatSize(size: number) {
  if (size === 0) return "0 B";
  return size >= 1_000_000 ? `${(size / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1000))} KB`;
}
</script>

<form bind:this={ref} {...restProps} data-slot="chat-composer" data-expanded={expanded} class={cn("composer", className)} onsubmit={submit} onkeydown={keydown} aria-busy={sending}>
  {#if notice}<p id={noticeId} data-slot="chat-composer-notice" class="composer-notice" data-has-text={value.length > 0}>{notice}</p>{/if}
  <input bind:this={picker} type="file" hidden {accept} {multiple} disabled={locked} onchange={selectFiles} aria-label="添付ファイルを選択" />
  <InputGroup.Root class="composer-box has-disabled:opacity-100 has-disabled:bg-background dark:has-disabled:bg-background" aria-label="メッセージの作成">
    {#if context}<InputGroup.Addon align="block-start" class="composer-context">{@render context()}</InputGroup.Addon>{/if}
    {#if attachments.length}
      <ul class="attachments mutsuna-scrollbar" use:scrollbarVisibility data-images={attachments.some(file => file.previewUrl)} aria-label="選択済みの添付ファイル">
        {#each attachments as file (file.id)}
          <li class="attachment" data-status={file.status ?? "ready"} data-preview={Boolean(file.previewUrl)}>
            {#if file.previewUrl}
              <div class="image-preview">
                <AttachmentImage src={file.previewUrl} alt={file.name} images={attachments.flatMap(item => item.previewUrl ? [{ src: item.previewUrl, alt: item.name }] : [])} initialIndex={attachments.filter(item => item.previewUrl).findIndex(item => item.id === file.id)} />
                {#if file.status === "uploading"}<span class="image-progress" aria-hidden="true"><LoaderCircle size={20} class="animate-spin motion-reduce:animate-none" /></span>{/if}
              </div>
            {:else}
              <span class="file-icon" aria-hidden="true">{#if file.status === "uploading"}<LoaderCircle size={18} class="animate-spin motion-reduce:animate-none" />{:else}<FileText size={18} />{/if}</span>
            {/if}
            <div class="file-info"><span class="file-name" title={file.name}>{file.name}</span><span class="file-detail">{#if file.status === "uploading"}アップロード中{:else if file.status === "error"}アップロード失敗{:else if file.size !== undefined}{formatSize(file.size)}{:else}添付ファイル{/if}</span></div>
            {#if onRemoveAttachment}<Button variant="ghost" size="icon-sm" icon={X} class="remove-file" aria-label={`${file.name}を削除`} disabled={locked} onclick={() => removeAttachment(file.id)} />{/if}
            {#if file.status === "error"}<p class="file-error" role="alert" title={file.error ?? "ファイルを削除するか、もう一度添付してください。"}>{file.error ?? "ファイルを削除するか、もう一度添付してください。"}</p>{/if}
          </li>
        {/each}
      </ul>
    {/if}
    {#if onFilesSelect || actions}
      <InputGroup.Addon align="inline-start" class="composer-addon attach-addon">
        <Popover.Root bind:open={actionsOpen}>
          <Popover.Trigger>
            {#snippet child({ props })}
              <InputGroup.Button {...props} variant="ghost" size="icon-sm" icon={Plus} aria-label="追加" class="composer-action" disabled={locked} />
            {/snippet}
          </Popover.Trigger>
          <Popover.Content side="top" align="start" sideOffset={8} class="w-56 max-w-[calc(100vw-2rem)] gap-1 p-1" role="dialog" aria-label="メッセージに追加">
            {#if onFilesSelect}
              <Button type="button" variant="ghost" icon={Paperclip} class="h-11 w-full justify-start" disabled={locked} onclick={() => { actionsOpen = false; picker.click(); }}>ファイルを添付</Button>
            {/if}
            {#if actions}{@render actions({ close: () => { actionsOpen = false; } })}{/if}
          </Popover.Content>
        </Popover.Root>
      </InputGroup.Addon>
    {/if}
    <div bind:this={measure} class="composer-measure" aria-hidden="true" inert>{value}{"\u200b"}</div>
    <InputGroup.Textarea bind:ref={input} bind:value rows={1} {placeholder} aria-label={ariaLabel} aria-describedby={notice ? noticeId : undefined} disabled={locked} class="composer-input" />
    <InputGroup.Addon align="inline-end" class="composer-addon send-addon">
      <InputGroup.Button type="submit" variant="default" size="icon-sm" icon={ArrowUp} aria-label={sending ? "送信中" : "メッセージを送信"} loading={sending} disabled={!canSend} class="composer-action send-action" />
    </InputGroup.Addon>
    {#if tools}<InputGroup.Addon align="block-end" class="composer-tools">{@render tools()}</InputGroup.Addon>{/if}
  </InputGroup.Root>
</form>

<style>
  .composer { position: relative; display: flex; flex-direction: column; width: 100%; min-width: 0; }
  .composer-notice { position: absolute; z-index: 1; bottom: calc(100% + 4px); left: 12px; width: fit-content; max-width: calc(100% - 24px); margin: 0; padding: 3px 8px; border-radius: 8px; background: color-mix(in oklab, var(--background) 85%, transparent); backdrop-filter: blur(8px); font-size: 11px; line-height: 1.5; color: var(--muted-foreground); overflow-wrap: anywhere; }
  .composer:not(:has(:global(textarea:focus))) .composer-notice[data-has-text="false"] { visibility: hidden; }
  .composer :global(.composer-box) { align-content: start; }
  .composer :global(.composer-box) { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-rows: auto auto auto auto; gap: 0 4px; height: auto; padding: 4px; border-radius: 16px; align-items: end; border-color: color-mix(in oklab, var(--border) 75%, var(--background)); background: var(--background); transition: background-color 150ms, border-color 150ms; }
  .composer :global(.composer-box:focus-within), .composer :global(.composer-box:has([data-slot="input-group-control"]:focus-visible)) { background: color-mix(in oklab, var(--ring) 2%, var(--background)); border-color: color-mix(in oklab, var(--ring) 40%, var(--border)); }
  .composer :global(.composer-box:has(textarea:disabled)) { opacity: .65; }
  .composer :global(.composer-input) { grid-column: 2; grid-row: 3; width: 100%; min-width: 0; min-height: 44px; max-height: 144px; margin: 0; padding: 11px 4px; border: 0; border-radius: 0; resize: none; overflow-y: auto; font-size: 16px; line-height: 22px; background: transparent; }
  .composer :global(.composer-input:focus-visible), .composer :global(.composer-input:disabled) { background: transparent; }
  .composer :global(.composer-input::placeholder) { color: var(--muted-foreground); opacity: 1; }
  .composer :global(.composer-addon) { grid-row: 3; min-width: 44px; min-height: 44px; padding: 0; margin: 0; align-self: end; background: transparent; }
  .composer :global(.attach-addon) { grid-column: 1; }
  .composer :global(.send-addon) { grid-column: 3; }
  .composer :global(.composer-action) { width: 44px; height: 44px; margin: 0; border-radius: 12px; }
  .composer :global(.send-action) { position: relative; isolation: isolate; background: transparent; }
  .composer :global(.send-action::before) { content: ""; position: absolute; z-index: -1; width: 36px; height: 36px; top: 50%; left: 50%; transform: translate(-50%, -50%); border-radius: 8px; background: var(--primary); transition: background-color 150ms; }
  .composer :global(.send-action:hover::before) { background: color-mix(in oklab, var(--primary) 88%, var(--foreground)); }
  .composer :global(.send-action:disabled:not([aria-busy="true"])) { opacity: 1; color: var(--muted-foreground); }
  .composer :global(.send-action:disabled:not([aria-busy="true"])::before) { background: var(--muted); }
  .composer :global(.composer-action:focus-visible) { outline: 2px solid color-mix(in oklab, var(--ring) 65%, transparent); outline-offset: -2px; }
  .composer-measure { grid-column: 2; grid-row: 3; min-width: 0; height: 0; padding: 0 4px; overflow: hidden; visibility: hidden; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 16px; line-height: 22px; }
  .composer[data-expanded="true"] :global(.composer-input) { grid-column: 1 / -1; padding: 11px 12px; }
  .composer[data-expanded="true"] :global(.composer-addon) { grid-row: 4; }
  .composer :global(.composer-tools) { grid-row: 5; grid-column: 1 / -1; margin: 0; padding: 4px 6px 2px; min-width: 0; flex-wrap: wrap; background: transparent; }
  .composer :global(.composer-context) { grid-column: 1 / -1; grid-row: 1; display: block; width: auto; min-width: 0; margin: 0 8px 2px; padding: 0 0 4px; border-bottom: 1px solid var(--border); background: transparent; }
  .attachments { grid-column: 1 / -1; grid-row: 2; display: flex; flex-wrap: wrap; align-items: start; gap: 8px; padding: 6px 6px 10px; list-style: none; margin: 0; min-width: 0; max-height: 180px; overflow-y: auto; overscroll-behavior: contain; }
  .attachment { display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; align-items: center; gap: 6px; width: min(100%, 240px); padding: 8px; border: 1px solid var(--border); border-radius: 10px; background: var(--background); }
  .attachments[data-images="true"] { flex-wrap: nowrap; max-height: none; overflow-x: auto; overflow-y: hidden; }
  .attachments[data-images="true"] .attachment { flex-shrink: 0; }
  .attachment[data-preview="true"] { position: relative; grid-template-columns: minmax(0, 1fr); align-content: start; gap: 0; width: 132px; padding: 0; overflow: hidden; }
  .image-preview { position: relative; width: 100%; height: 88px; background: var(--muted); }
  .image-progress { position: absolute; inset: 0; display: grid; place-items: center; color: white; background: rgb(0 0 0 / .35); }
  .attachment[data-preview="true"] .file-info { padding: 7px 8px; }
  .attachment[data-preview="true"] :global(.remove-file) { position: absolute; top: 2px; right: 2px; width: 32px; height: 32px; background: var(--background); color: var(--foreground); border: 1px solid var(--border); border-radius: 8px; }
  .attachment[data-preview="true"] .file-error { margin: 0 8px 8px; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; overflow: hidden; line-height: 16px; }
  .file-icon { display: flex; align-items: center; justify-content: center; color: var(--muted-foreground); }
  .file-info { min-width: 0; display: grid; gap: 2px; }
  .file-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 500; }
  .file-detail { font-size: 11px; color: var(--muted-foreground); }
  .composer :global(.remove-file) { width: 32px; height: 32px; }
  .attachment[data-status="error"] { border-color: var(--destructive); }
  .file-error { grid-column: 1 / -1; margin: 0; font-size: 12px; color: var(--destructive); overflow-wrap: anywhere; }
  @media (prefers-reduced-motion: reduce) { .composer :global(.composer-box), .composer :global(.send-action::before) { transition: none; } }
</style>
