<script lang="ts">
import { ChatMessage, type ChatMessageProps } from '@mutsuna/ui/chat-message';
import * as Message from '@mutsuna/ui/message';
import { Button } from '@mutsuna/ui/button';
import { CustomerAvatar } from '@mutsuna/ui/avatar';
let layout = $state<ChatMessageProps['layout']>('bubble');
let copied = $state(false);
let liked = $state(false);
</script>
<div class="grid w-full max-w-2xl gap-6">
  <div role="group" aria-label="レイアウト" class="flex gap-2">
    <Button variant={layout === 'bubble' ? 'default' : 'outline'} aria-pressed={layout === 'bubble'} onclick={() => layout = 'bubble'}>吹き出し</Button>
    <Button variant={layout === 'timeline' ? 'default' : 'outline'} aria-pressed={layout === 'timeline'} onclick={() => layout = 'timeline'}>タイムライン</Button>
  </div>
  <ChatMessage {layout} author="佐藤" side="incoming">
    {#snippet avatar()}<CustomerAvatar id="佐藤 美咲" name="佐藤 美咲" />{/snippet}
    {#snippet metadata()}<time datetime="2026-10-17T10:00:00+09:00">10:00</time>{/snippet}
    {#snippet actions()}<Message.Actions onCopy={() => copied = true} onReact={() => liked = !liked} copyState={copied ? 'copied' : 'idle'} />{/snippet}
    {#snippet reactions()}<Message.Reactions items={[{ emoji: '👍', label: 'いいね', count: liked ? 1 : 0, selected: liked }]} onToggle={() => liked = !liked} />{/snippet}
    同じ本文と操作を保ったまま、レイアウトを切り替えられます。
  </ChatMessage>
  <ChatMessage {layout} side="outgoing" author="あなた">
    {#snippet metadata()}{#if layout === 'bubble'}<span>既読</span>{/if}<time datetime="2026-10-17T10:01:00+09:00">10:01</time>{/snippet}
    送信者とメッセージの配置を個別に指定できます。
  </ChatMessage>
</div>
