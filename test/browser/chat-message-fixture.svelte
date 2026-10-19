<script lang="ts">
import { ChatMessage, type ChatMessageProps } from "@mutsuna/ui/chat-message";
import { Button } from "@mutsuna/ui/button";
let { align = "start", variant = "bubble", text = "こんにちは\n次の行", author = "送信者" }: {
  align?: ChatMessageProps["align"]; variant?: ChatMessageProps["variant"]; text?: string; author?: string;
} = $props();
let copied = $state(false);
</script>
<ChatMessage {author} {align} {variant}>
  {#snippet avatar()}<span aria-hidden="true">送</span>{/snippet}
  {#snippet metadata()}<time datetime="2026-10-17T10:00:00+09:00">10:00</time>{/snippet}
  {#snippet actions()}
    <Button variant="ghost" size="sm" onclick={() => copied = true}>コピー</Button>
    <Button variant="ghost" size="sm" disabled>再送</Button>
  {/snippet}
  {text}
</ChatMessage>
<output aria-live="polite">{copied ? "コピーしました" : "未操作"}</output>
