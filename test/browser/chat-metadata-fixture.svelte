<script lang="ts">
import { ChatHeader } from "@mutsuna/ui/chat-header";
import { ChatThreadList } from "@mutsuna/ui/chat-thread-list";
import { Badge } from "@mutsuna/ui/badge";
import { Button } from "@mutsuna/ui/button";
let { long = false }: { long?: boolean } = $props();
let selectedId = $state("a");
let status = $state("下書き");
let memoOpened = $state(0);
const items = [{ id: "a", title: "最初の会話" }, { id: "b", title: "次の会話" }, { id: "empty", title: "補足なし" }];
</script>
{#snippet information(id: string)}{#if id !== "empty"}<Badge variant="outline" class="h-auto min-h-5 whitespace-normal">{id === "a" ? long ? "とても長い会話ステータスを狭い幅でも折り返して確認します。" : status : "確認待ち"}</Badge><span>メモあり</span>{/if}{/snippet}
<ChatHeader title={items.find(item => item.id === selectedId)!.title} headingLevel={1}>
  {#snippet metadata()}{@render information(selectedId)}{/snippet}
  {#snippet actions()}<Button variant="ghost" onclick={() => memoOpened++}>メモを開く</Button>{/snippet}
</ChatHeader>
<ChatThreadList {items} {selectedId} onSelect={id => selectedId = id}>{#snippet metadata(item)}{@render information(item.id)}{/snippet}</ChatThreadList>
<Button onclick={() => status = "完了"}>会話情報を更新</Button>
<output aria-label="開いたメモの数">{memoOpened}</output>
