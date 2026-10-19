<script lang="ts">
import { ChatMessage, type ChatMessageProps } from '@mutsuna/ui/chat-message';
import * as Message from '@mutsuna/ui/message';
let { layout = 'bubble', side = 'incoming', author = '送信者', text = 'レイアウトを確認する本文', showAuthor, withAvatar = true, withActions = true, withMetadata = true, bubbleVariant, copyState }: {
  layout?: ChatMessageProps['layout']; side?: ChatMessageProps['side']; author?: string; text?: string;
  copyState?: 'idle' | 'copied' | 'error'; showAuthor?: boolean; withAvatar?: boolean; withActions?: boolean; withMetadata?: boolean; bubbleVariant?: ChatMessageProps['bubbleVariant'];
} = $props();
let copied = $state(false);
let selected = $state(false);
</script>
{#snippet avatar()}<span aria-hidden="true">送</span>{/snippet}
{#snippet metadata()}{#if side === 'outgoing' && layout === 'bubble'}<span>既読</span>{/if}<time datetime="2026-10-17T10:21:00+09:00">10:21</time>{/snippet}
{#snippet actions()}<Message.Actions onCopy={() => copied = true} copyState={copyState ?? (copied ? 'copied' : 'idle')} />{/snippet}
<ChatMessage {layout} {side} {author} {showAuthor} {bubbleVariant} avatar={withAvatar ? avatar : undefined} metadata={withMetadata ? metadata : undefined} actions={withActions ? actions : undefined}>
  {#snippet quote()}<Message.Quote author="引用元" text="元の発言" />{/snippet}
  {#snippet reactions()}<Message.Reactions items={[{ emoji: '👍', label: 'いいね', count: selected ? 2 : 1, selected }]} onToggle={() => selected = !selected} />{/snippet}
  {text}
</ChatMessage>
<button type="button">メッセージ外</button>
