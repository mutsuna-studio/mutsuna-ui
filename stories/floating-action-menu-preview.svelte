<script lang="ts">
import FloatingToolButton from "./floating-tool-button.svelte";
import * as Tooltip from "@mutsuna/ui/tooltip";
import { FloatingActionMenu, type FloatingActionMenuPosition } from "@mutsuna/ui/floating-action-menu";
import { StickyNote } from "@mutsuna/ui/sticky-note";
import * as Menu from "@mutsuna/ui/dropdown-menu";
import { Button } from "@mutsuna/ui/button";
import { Copy, StickyNote as NoteIcon, FileDown } from "@lucide/svelte";
let { disabled = false, position, placement = "floating" }: { disabled?: boolean; position?: FloatingActionMenuPosition | null; placement?: "floating" | "inline" } = $props();
let open = $state(false);
let trigger = $state<HTMLButtonElement | null>(null);
let memoOpen = $state(false);
let afterClose: (() => void) | undefined;
let selection = $state("");
function openMemo() { afterClose = () => { memoOpen = true; }; open = false; }
function closed(event: Event) { const action = afterClose; afterClose = undefined; if (action) { event.preventDefault(); trigger?.focus(); action(); } }
</script>
<section class="grid max-w-xl gap-4 p-6" aria-label="フローティング操作の例">
  <h2 class="text-lg font-medium">画面の補助操作</h2>
  <p class="text-sm text-muted-foreground">{placement === "inline" ? "下の操作列から選択できます。" : "右上のメニューから操作を選択できます。"}項目は利用側で自由に組み合わせられます。</p>
  <input aria-label="作業用入力欄" class="rounded-md border bg-background p-2 text-sm" placeholder="メニューを閉じて作業を続ける" />
  <output aria-label="選択した操作" class="text-sm text-muted-foreground">{selection}</output>
<Tooltip.Provider delayDuration={200}>
<FloatingActionMenu bind:open bind:ref={trigger} {disabled} {position} {placement} onCloseAutoFocus={closed}>
  {#snippet actions()}
    <FloatingToolButton icon={NoteIcon} label="メモを開く" onclick={() => memoOpen = true} />
    <FloatingToolButton icon={Copy} label="全文をコピー" onclick={() => selection = "全文コピー"} />
    <FloatingToolButton icon={FileDown} label="PDFに書き出す" onclick={() => selection = "PDF書き出し"} />
  {/snippet}
  {#snippet children({ close })}
    <Menu.Label>作業の操作</Menu.Label>
    <Menu.Item class="min-h-10" onclick={openMemo}><NoteIcon />メモを開く</Menu.Item>
    <Menu.Item class="min-h-10" onclick={() => { selection = "全文コピー"; close(); }}><Copy />全文をコピー</Menu.Item>
    <Menu.Item class="min-h-10" onclick={() => { selection = "PDF書き出し"; close(); }}><FileDown />PDFに書き出す</Menu.Item>
    <Menu.Separator /><Menu.Item disabled>利用できない操作</Menu.Item>
  {/snippet}
</FloatingActionMenu>
</Tooltip.Provider>
</section>
<StickyNote triggerMode="none" title="作業メモ" value="作業中の付箋です。" bind:open={memoOpen} />
