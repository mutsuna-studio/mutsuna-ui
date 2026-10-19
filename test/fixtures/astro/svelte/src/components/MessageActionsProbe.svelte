<script lang="ts">
import { tick } from "svelte";
import * as Message from "@mutsuna/ui/message";
import { ChatMessage } from "@mutsuna/ui/chat-message";
let editing = $state(false);
let editInput: HTMLInputElement;
async function edit() { editing = true; await tick(); editInput?.focus(); }
let actionReply = $state(false);
let actionReacted = $state(false);
let actionCopied = $state(false);
let layout = $state<'bubble' | 'timeline'>('bubble');
</script>
<section aria-label="Astro message actions">
  <button type="button" onclick={() => layout = layout === 'bubble' ? 'timeline' : 'bubble'}>Switch action layout</button>
  <ChatMessage {layout} author="Astro sender">
    {#snippet avatar()}<span aria-hidden="true">A</span>{/snippet}
    {#snippet metadata()}<time datetime="2026-10-17T10:00:00+09:00">10:00</time>{/snippet}
    {#snippet reactions()}<Message.Reactions items={[{ emoji: "👍", label: "いいね", count: actionReacted ? 1 : 0, selected: actionReacted }]} onToggle={() => actionReacted = !actionReacted} />{/snippet}
    {#snippet actions()}<Message.Actions onEdit={edit} onReply={() => actionReply = true} onCopy={() => actionCopied = true} onReact={() => actionReacted = !actionReacted} copyState={actionCopied ? "copied" : "idle"} />{/snippet}
    {#snippet quote()}{#if actionReply}<Message.Quote author="Astro sender" text="元のメッセージ" onDismiss={() => actionReply = false} />{/if}{/snippet}
    <p>アクションを確認するメッセージ</p>
  </ChatMessage>
  {#if editing}<input bind:this={editInput} aria-label="Edit Astro message" />{/if}
</section>
