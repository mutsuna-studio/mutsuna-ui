<script lang="ts">
import { StickyNote, type StickyNotePosition } from "@mutsuna/ui/sticky-note";
import { Button } from "@mutsuna/ui/button";
import { onDestroy } from "svelte";
let { mode = "floating" }: { mode?: "floating" | "inline" | "none" } = $props();
let open = $state(false);
let value = $state("確認したいことや、後で見返すことを自由に残せます。");
let savedValue = $state("確認したいことや、後で見返すことを自由に残せます。");
let position = $state<StickyNotePosition | null>(null);
let triggerPosition = $state<StickyNotePosition | null>({ x: 36, y: 280 });
let saving = $state(false);
let timer: ReturnType<typeof setTimeout> | undefined;
function save(next: string) { saving = true; timer = setTimeout(() => { savedValue = next; saving = false; }, 500); }
onDestroy(() => clearTimeout(timer));
</script>
<section class="grid max-w-xl gap-5 p-6" aria-label="汎用付箋の例">
  <h2 class="text-lg font-medium">作業中のメモ</h2>
  <p class="text-sm text-muted-foreground">付箋を開いたまま、他の操作を続けられます。</p>
  <div class="flex flex-wrap items-center gap-3">
    {#if mode === "none"}<Button variant="outline" aria-haspopup="dialog" aria-expanded={open} onclick={() => open = !open}>外部のボタンからメモを開く</Button>{/if}
    <StickyNote bind:value bind:open bind:position bind:triggerPosition triggerMode={mode} {savedValue} {saving} onSave={save}>
      {#snippet trigger({ props })}<Button {...props} variant="outline">作業メモ</Button>{/snippet}
    </StickyNote>
    <Button variant="ghost" onclick={() => { triggerPosition = { x: 36, y: 280 }; position = null; }}>配置を戻す</Button>
  </div>
  <textarea aria-label="作業用入力欄" class="rounded-md border bg-background p-3 text-sm" placeholder="付箋とは別の入力欄" rows="3"></textarea>
</section>
