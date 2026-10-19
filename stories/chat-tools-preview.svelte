<script lang="ts">
import FloatingToolButton from "./floating-tool-button.svelte";
import * as Tooltip from "@mutsuna/ui/tooltip";
import { FloatingActionMenu } from "@mutsuna/ui/floating-action-menu";
import { StickyNote, type StickyNotePosition } from "@mutsuna/ui/sticky-note";
import * as Menu from "@mutsuna/ui/dropdown-menu";
import * as Panel from "@mutsuna/ui/responsive-dialog";
import { Button } from "@mutsuna/ui/button";
import { Input } from "@mutsuna/ui/input";
import { Checkbox } from "@mutsuna/ui/checkbox";
import { Toaster } from "@mutsuna/ui/sonner";
import { CustomerAvatar } from "@mutsuna/ui/avatar";
import { toast } from "svelte-sonner";
import { StickyNote as NoteIcon, CircleDot, Film, Copy, FileDown, Play, Pause } from "@lucide/svelte";
import { copyChatText } from "./chat-copy-text.js";
let { placement = "floating", title, assistant = false, status, statuses, onStatusChange, text, getText, memoValue = $bindable(""), memoOpen = $bindable(false), memoSavedValue, onMemoSave }: {
  placement?: "floating" | "inline"; title: string; assistant?: boolean; status: string; statuses: readonly string[]; onStatusChange: (value: string) => void;
  text: string; getText?: () => string; memoValue?: string; memoOpen?: boolean; memoSavedValue?: string; onMemoSave?: (value: string) => void;
} = $props();
const id = $props.id();
let menuOpen = $state(false);
let trigger = $state<HTMLButtonElement | null>(null);
let memoPosition = $state<StickyNotePosition | null>(null);
let videoOpen = $state(false);
let pdfOpen = $state(false);
let playing = $state(false);
let includeDetails = $state(true);
let fileName = $state("");
let pdfText = $state("");
let afterMenu: (() => void) | undefined;
let returnTarget: HTMLElement | null = null;
let statusOpen = $state(false);
function choose(action: () => void) { afterMenu = action; menuOpen = false; }
function menuClosed(event: Event) {
  const action = afterMenu; afterMenu = undefined;
  if (action) { event.preventDefault(); returnTarget = trigger; trigger?.focus({ preventScroll: true }); action(); }
}
function direct(event: MouseEvent, action: () => void) { returnTarget = event.currentTarget as HTMLElement; action(); }
function toggleMemo() {
  const anchor = returnTarget ?? trigger;
  if (!memoPosition && anchor) { const rect = anchor.closest("[data-slot=floating-action-menu]")?.getBoundingClientRect() ?? anchor.getBoundingClientRect(); memoPosition = { x: rect.right - 256, y: rect.bottom + 8 }; }
  memoOpen = !memoOpen;
}
function restoreFocus(event: Event) { event.preventDefault(); (returnTarget?.isConnected && returnTarget.getClientRects().length ? returnTarget : trigger)?.focus({ preventScroll: true }); }
async function copyAll() {
  try { await copyChatText(getText?.() ?? text); toast.success("全文をコピーしました"); }
  catch { toast.error("コピーできませんでした"); }
}
function openPdf() { pdfText = getText?.() ?? text; fileName = title + ".pdf"; pdfOpen = true; }
function requestPdf() { pdfOpen = false; toast.success("PDFの書き出しを選択しました"); }
</script>
{#snippet statusOptions()}
  <Menu.RadioGroup value={status} onValueChange={value => { onStatusChange(value); statusOpen = false; menuOpen = false; }}>
    {#each statuses as value}<Menu.RadioItem {value} class="min-h-10">{value}</Menu.RadioItem>{/each}
  </Menu.RadioGroup>
{/snippet}
<Tooltip.Provider delayDuration={200}>
<FloatingActionMenu bind:open={menuOpen} bind:ref={trigger} ariaLabel="会話の操作" {placement} overflow="compact" onCloseAutoFocus={menuClosed}>
  {#snippet actions()}
    <FloatingToolButton icon={NoteIcon} label={memoOpen ? "メモを最小化" : "メモを開く"} ariaLabel="会話のメモ" expanded={memoOpen} onclick={event => direct(event, toggleMemo)} />
    <Menu.Root bind:open={statusOpen}>
      <Menu.Trigger>{#snippet child({ props })}<FloatingToolButton triggerProps={props} icon={CircleDot} label="ステータスを変更" />{/snippet}</Menu.Trigger>
      <Menu.Content align="end" sideOffset={8} class="min-w-40" aria-label="会話のステータス">{@render statusOptions()}</Menu.Content>
    </Menu.Root>
    {#if !assistant}<FloatingToolButton icon={Film} label="相手の動画" onclick={event => direct(event, () => { playing = false; videoOpen = true; })} />{/if}
    <FloatingToolButton icon={Copy} label="全文をコピー" disabled={!text.trim()} onclick={() => { void copyAll(); }} />
    <FloatingToolButton icon={FileDown} label="PDFに書き出す" disabled={!text.trim()} onclick={event => direct(event, openPdf)} />
  {/snippet}
  {#snippet children()}
    <Menu.Label class="max-w-full truncate px-2 py-2 text-xs text-muted-foreground">{title}</Menu.Label>
    <Menu.Item class="min-h-10" onclick={() => choose(toggleMemo)}><NoteIcon />{memoOpen ? "メモを最小化" : "メモを開く"}</Menu.Item>
    <Menu.Sub>
      <Menu.SubTrigger class="min-h-10"><CircleDot />ステータス<span class="ml-auto text-xs text-muted-foreground">{status}</span></Menu.SubTrigger>
      <Menu.SubContent class="min-w-40" collisionPadding={12}>
        {@render statusOptions()}
      </Menu.SubContent>
    </Menu.Sub>
    <Menu.Separator />
    {#if !assistant}<Menu.Item class="min-h-10" onclick={() => choose(() => { playing = false; videoOpen = true; })}><Film />相手の動画</Menu.Item>{/if}
    <Menu.Item class="min-h-10" disabled={!text.trim()} onclick={() => choose(() => { void copyAll(); })}><Copy />全文をコピー</Menu.Item>
    <Menu.Item class="min-h-10" disabled={!text.trim()} onclick={() => choose(openPdf)}><FileDown />PDFに書き出す</Menu.Item>
  {/snippet}
</FloatingActionMenu>
</Tooltip.Provider>
<StickyNote triggerMode="none" title="会話のメモ" bind:open={memoOpen} bind:value={memoValue} bind:position={memoPosition} savedValue={memoSavedValue} onSave={onMemoSave} />
<Panel.Root bind:open={videoOpen}>
  <Panel.Content class="sm:max-w-lg" dialogProps={{ onCloseAutoFocus: restoreFocus }} drawerProps={{ onCloseAutoFocus: restoreFocus }}>
    <Panel.Header><Panel.Title>相手の動画</Panel.Title><Panel.Description>{title}が共有した動画を確認できます。</Panel.Description></Panel.Header>
    <Panel.Body>
      <div class="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-muted">
        <div class="absolute inset-0 bg-linear-to-br from-foreground/5 to-foreground/15"></div>
        <CustomerAvatar id={title} name={title} size="lg" class="size-28! opacity-60" />
        <Button variant="secondary" icon={playing ? Pause : Play} class="absolute size-14 rounded-full shadow-lg" aria-label={playing ? "動画を一時停止" : "動画を再生"} aria-pressed={playing} onclick={() => playing = !playing} />
      </div>
      <div class="mt-3 flex items-center gap-3 text-xs text-muted-foreground"><span>{playing ? "00:18" : "00:00"}</span><input aria-label="動画の再生位置" type="range" min="0" max="134" value={playing ? 18 : 0} class="min-w-0 flex-1 accent-primary" /><span>02:14</span></div>
      <p class="mt-3 text-sm font-medium">{title}の紹介動画</p>
    </Panel.Body>
    <Panel.Footer><Button variant="outline" onclick={() => videoOpen = false}>閉じる</Button></Panel.Footer>
  </Panel.Content>
</Panel.Root>
<Panel.Root bind:open={pdfOpen}>
  <Panel.Content class="sm:max-w-xl" dialogProps={{ onCloseAutoFocus: restoreFocus }} drawerProps={{ onCloseAutoFocus: restoreFocus }}>
    <Panel.Header><Panel.Title>会話をPDFに書き出す</Panel.Title><Panel.Description>会話全体を、共有・保管しやすい形式にまとめます。</Panel.Description></Panel.Header>
    <Panel.Body class="grid gap-4">
      <div class="grid gap-1.5"><label for={id + "-filename"} class="text-sm font-medium">ファイル名</label><Input id={id + "-filename"} bind:value={fileName} /></div>
      <label class="flex items-center gap-2 text-sm"><Checkbox bind:checked={includeDetails} />ステータスを含める</label>
      <div class="rounded-xl bg-muted/50 p-4"><div class="max-h-60 overflow-auto rounded-md border bg-background p-5 shadow-xs" role="region" aria-label="PDFプレビュー">
        <p class="text-[10px] uppercase tracking-widest text-muted-foreground">Conversation</p><h3 class="mt-2 text-base font-semibold">{title}</h3>
        {#if includeDetails}<p class="mt-1 text-xs text-muted-foreground">ステータス：{status}</p>{/if}
        <div class="mt-4 border-t pt-4 whitespace-pre-wrap text-xs leading-relaxed">{pdfText}</div>
      </div></div>
    </Panel.Body>
    <Panel.Footer><Button variant="outline" onclick={() => pdfOpen = false}>キャンセル</Button><Button icon={FileDown} disabled={!fileName.trim()} onclick={requestPdf}>書き出す</Button></Panel.Footer>
  </Panel.Content>
</Panel.Root>
<Toaster position="bottom-center" />
