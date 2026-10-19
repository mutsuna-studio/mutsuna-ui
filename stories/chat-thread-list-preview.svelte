<script lang="ts">
import { ChatThreadList, type ChatThreadListItem } from "@mutsuna/ui/chat-thread-list";
import { Badge } from "@mutsuna/ui/badge";
import { StickyNote } from "@lucide/svelte";
let { showMetadata = false }: { showMetadata?: boolean } = $props();
const details: Record<string, { status: string; memo: boolean }> = { misaki: { status: "対応中", memo: true }, hana: { status: "返信待ち", memo: false } };
let selectedId = $state("misaki");
const items: ChatThreadListItem[] = [
  { id: "misaki", title: "佐藤 美咲", avatarId: "佐藤 美咲", preview: "余白を広げた案、よさそうです！", time: "10:24", online: true, unreadCount: 2 },
  { id: "hana", title: "田中 花", avatarId: "田中 花", preview: "ありがとうございます。確認します。", time: "09:40" },
  { id: "ken", title: "鈴木 健", avatarId: "鈴木 健", preview: "今日の共有事項をまとめました。", time: "昨日" },
];
</script>
<div class="w-full max-w-sm rounded-xl border bg-background py-3">
  {#snippet information(item: ChatThreadListItem)}{#if details[item.id]}<Badge variant="secondary" class="my-0.5 h-4 rounded-sm border-0 bg-foreground/[0.04] px-1.5 py-0 text-[10px] font-medium leading-4 text-foreground/75">{details[item.id].status}</Badge>{#if details[item.id].memo}<span class="inline-flex items-center gap-1"><StickyNote size={12} aria-hidden="true" />メモあり</span>{/if}{/if}{/snippet}
  <ChatThreadList {items} {selectedId} metadata={showMetadata ? information : undefined} onSelect={id => selectedId = id} />
</div>
