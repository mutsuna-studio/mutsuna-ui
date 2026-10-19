<script lang="ts">
  import {
    ChatComposer, ChatHeader, ChatMessage,
    MessageScroller, MessageScrollerProvider, MessageScrollerViewport,
    MessageScrollerContent, MessageScrollerItem, MessageScrollerButton,
    type ChatComposerSubmission, type ChatMessageProps,
  } from "@mutsuna/ui/chat";

  let layout: ChatMessageProps["layout"] = $state("timeline");
  let draft = $state("");
  let messages = $state([{ id: "welcome", author: "佐藤", text: "こんにちは", own: false }]);
  let nextId = 1;

  function send({ text }: ChatComposerSubmission) {
    // Replace this in the app with its send operation; clear the draft after success.
    messages = [...messages, { id: `local-${nextId++}`, author: "あなた", text, own: true }];
    draft = "";
  }
</script>

<div class="flex h-full min-h-0 min-w-0 flex-col">
  <!-- Omit ChatHeader when AdminShellFrame supplies the page header. -->
  <ChatHeader title="メッセージ" />
  <MessageScrollerProvider autoScroll>
    <MessageScroller class="min-h-0 flex-1">
      <MessageScrollerViewport aria-label="会話履歴">
        <MessageScrollerContent class="space-y-4 p-4" aria-live="off">
          {#each messages as message (message.id)}
            <MessageScrollerItem messageId={message.id}>
              <ChatMessage {layout} author={message.author} side={message.own ? "outgoing" : "incoming"}>
                <p class="whitespace-pre-wrap">{message.text}</p>
              </ChatMessage>
            </MessageScrollerItem>
          {/each}
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton />
    </MessageScroller>
  </MessageScrollerProvider>
  <div class="shrink-0 p-3">
    <ChatComposer bind:value={draft} submitOn="mod-enter" onSend={send} />
  </div>
</div>
