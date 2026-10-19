<script lang="ts">
import * as Message from "@mutsuna/ui/message";
import * as Bubble from "@mutsuna/ui/bubble";
import { Button } from "@mutsuna/ui/button";
import * as Menu from "@mutsuna/ui/dropdown-menu";
import { copyChatText } from "./chat-copy-text.js";
let { disabled = false }: { disabled?: boolean } = $props();
let reply = $state(false);
let copied = $state<"idle" | "copied" | "error">("idle");
let reactions = $state<Message.MessageReaction[]>([{ emoji: "👍", label: "いいね", count: 2 }]);
let status = $state("");
function toggle(emoji: string) {
  const existing = reactions.find(item => item.emoji === emoji);
  reactions = existing ? reactions.map(item => item.emoji === emoji ? { ...item, count: item.count + (item.selected ? -1 : 1), selected: !item.selected } : item) : [...reactions, { emoji, label: emoji, count: 1, selected: true }];
}
async function copy() { try { await copyChatText("資料を確認してもらえますか？"); copied = "copied"; } catch { copied = "error"; } }
</script>
<div class="grid max-w-xl gap-4">
  <Message.Root role="article" aria-label="佐藤のメッセージ">
    <Message.Content>
      <Message.Header>佐藤 · 10:00</Message.Header>
      <Bubble.Root variant="outline"><Bubble.Content>資料を確認してもらえますか？</Bubble.Content></Bubble.Root>
      <Message.Reactions items={reactions} onToggle={toggle} {disabled} />
      <Message.Footer>
        <Message.Actions onEdit={() => status = "編集を開始しました"} onReply={() => reply = true} onCopy={copy} onReact={toggle} copyState={copied} {disabled}>
          {#snippet mobileActions({ close })}<Button variant="ghost" class="min-h-12 justify-start" onclick={() => { status = "保存しました"; close(); }}>保存</Button>{/snippet}
          {#snippet actions({ close })}<Menu.Item onclick={() => { status = "保存しました"; close(); }}>保存</Menu.Item>{/snippet}
        </Message.Actions>
      </Message.Footer>
    </Message.Content>
  </Message.Root>
  {#if reply}<Message.Quote author="佐藤" text="資料を確認してもらえますか？" onDismiss={() => reply = false} role="region" aria-label="返信先" />{/if}
  <Message.Quote author="長い名前の送信者" text={"長い引用文でも入力欄や会話の幅からはみ出さないことを確認します。".repeat(5)} onNavigate={() => status = "引用元へ移動しました"} {disabled} />
  <output aria-live="polite">{status}</output>
</div>
