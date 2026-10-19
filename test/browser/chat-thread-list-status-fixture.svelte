<script lang="ts">
import { ChatThreadList } from "@mutsuna/ui/chat-thread-list";
import { Badge } from "@mutsuna/ui/badge";
import { Hash } from "@lucide/svelte";
let { variant = "compact" }: { variant?: "default" | "compact" } = $props();
const statuses: Record<string, string> = { a: "下書き", b: "確認待ち", c: "完了" };
</script>
<ChatThreadList {variant} items={[
  { id: "a", title: "文章とアイデア" },
  { id: "b", title: "ミーティングの振り返りを確認する長い会話名" },
  { id: "c", title: "新しいアイデアのメモ" },
]}>
  {#snippet leading()}<Hash size={17} />{/snippet}
  {#snippet metadata(item)}<Badge variant="secondary" class="my-0.5 h-4 rounded-sm border-0 bg-foreground/[0.04] px-1.5 py-0 text-[10px] font-medium leading-4 text-foreground/75">{statuses[item.id]}</Badge>{/snippet}
</ChatThreadList>
