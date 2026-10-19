<script lang="ts">
import { tick } from "svelte";
import * as Message from "@mutsuna/ui/message";
import * as Bubble from "@mutsuna/ui/bubble";
import * as Scroller from "@mutsuna/ui/message-scroller";
import { ChatComposer, ChatHeader, ChatThreadList, ChatMessage, ChatAttachment, type ChatComposerAttachment } from "@mutsuna/ui/chat";
import { ChatMemo } from "@mutsuna/ui/chat-memo";
import { Badge } from "@mutsuna/ui/badge";
import { Button } from "@mutsuna/ui/button";
import { OutlineNav } from "@mutsuna/ui/outline-nav";
let outlineId = $state("a");
let threadId = $state("a");
let memoDraft = $state("Astroで確認する会話メモ");
let memoOpen = $state(false);
let memoSaved = $state("Astroで確認する会話メモ");
let threadStatuses = $state<Record<string, string>>({ a: "下書き", b: "確認待ち" });
let layout = $state<"timeline" | "bubble">("timeline");
let text = $state("初期メッセージ");
let draft = $state("");
let submitOn = $state<"enter" | "mod-enter">("mod-enter");
let files = $state<ChatComposerAttachment[]>([]);
let sent = $state("");
let nextFileId = 0;
let replyActive = $state(false);
let composerRef: HTMLFormElement | null = $state(null);
async function dismissReplyContext() { replyActive = false; await tick(); composerRef?.querySelector<HTMLTextAreaElement>("textarea")?.focus(); }
const gallerySource = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="24"%3E%3Crect width="32" height="24" fill="seagreen"/%3E%3C/svg%3E';
const attachmentImages = [{ src: gallerySource, alt: "Astro image.svg", title: "Astro image.svg", downloadUrl: gallerySource, downloadName: "Astro image.svg" }, { src: gallerySource, alt: "Astro alternate.svg" }];
</script>
<section aria-label="Chat message probe">
  <Button onclick={() => layout = layout === "timeline" ? "bubble" : "timeline"}>Switch chat layout</Button>
  <ChatMessage author="アシスタント" {layout} side="outgoing">
    {#snippet metadata()}{#if layout === "bubble"}<span>既読</span>{/if}<time datetime="2026-10-17T10:00:00+09:00">10:00</time>{/snippet}
    {#snippet actions()}<Button onclick={() => text = "更新されたメッセージ"}>Update chat message</Button>{/snippet}
    {text}
  </ChatMessage>
</section>



<section aria-label="Astro attachment">
  <ChatAttachment previewImages={attachmentImages} name="Astro image.svg" mediaType="SVG" previewUrl={'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="24"%3E%3Crect width="32" height="24" fill="seagreen"/%3E%3C/svg%3E'} downloadUrl={'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="24"%3E%3Crect width="32" height="24" fill="seagreen"/%3E%3C/svg%3E'} />
</section>

<div style="height:180px" data-astro-scroller>
  <Scroller.Provider autoScroll>
    <Scroller.Root>
      <Scroller.Viewport aria-label="Astro chat history">
        <Scroller.Content aria-label="Astro messages" aria-live="off" class="py-3 pl-3 pr-14">
          {#each Array.from({ length: 12 }, (_, index) => index) as index (index)}
            <Scroller.Item messageId={`astro-${index}`}>
              <Message.Root role="article" aria-label={`Astro sender ${index}`}><Message.Content><Message.Header>送信者 {index}</Message.Header><Bubble.Root variant="muted"><Bubble.Content>Astroでメッセージを表示 {index}</Bubble.Content></Bubble.Root><Message.Footer>10:00</Message.Footer></Message.Content></Message.Root>
            </Scroller.Item>
          {/each}
        </Scroller.Content>
      </Scroller.Viewport>
      <Scroller.Button behavior="instant" />
      <Scroller.Outline items={[{ id: "astro-0", label: "会話のはじめ", level: 1 }, { id: "astro-6", label: "途中の質問", level: 2 }, { id: "astro-11", label: "最後の質問", level: 1 }]} ariaLabel="Astro conversation outline" />
    </Scroller.Root>
  </Scroller.Provider>
</div>

<section aria-label="Astro composer" data-astro-composer>
  <Button onclick={() => files = [{ id: "image", name: "preview.svg", previewUrl: gallerySource }, { id: "other", name: "alternate.svg", previewUrl: gallerySource }]}>Load image preview</Button>
  <Button onclick={() => submitOn = submitOn === "enter" ? "mod-enter" : "enter"}>Toggle Enter submission</Button>
  <Button onclick={() => replyActive = true}>Load reply context</Button>
  {#snippet replyContext()}<Message.Quote variant="composer" author="Astro sender" text="返信する元のメッセージ" onDismiss={dismissReplyContext} role="region" aria-label="Astro reply context" />{/snippet}
  <ChatComposer {submitOn} notice="送信前に内容をご確認ください。" bind:ref={composerRef} context={replyActive ? replyContext : undefined} bind:value={draft} attachments={files} onFilesSelect={selected => files = [...files, ...selected.map(file => ({ id: String(nextFileId++), name: file.name, size: file.size }))]} onRemoveAttachment={id => files = files.filter(file => file.id !== id)} onSend={submission => { sent = submission.text + submission.attachments.map(file => file.name).join(","); draft = ""; files = []; }} />
  <output data-composer-result>{sent}</output>
</section>

<section aria-label="Astro outline">
  <OutlineNav items={[{ id: "a", label: "最初の項目" }, { id: "b", label: "次の項目" }]} activeId={outlineId} onNavigate={id => outlineId = id} />
  <output data-outline-result>{outlineId}</output>
</section>


{#snippet threadMetadata(id: string)}{#if threadStatuses[id]}<Badge variant="outline">{threadStatuses[id]}</Badge><span>メモあり</span>{/if}{/snippet}
<section aria-label="Astro thread list">
  <ChatHeader title={threadId === "a" ? "最初の会話" : "次の会話"}>
    {#snippet metadata()}{@render threadMetadata(threadId)}{/snippet}
    {#snippet actions()}<ChatMemo savedValue={memoSaved} bind:value={memoDraft} bind:open={memoOpen} onSave={value => { memoSaved = value; }} />{/snippet}
  </ChatHeader>
  <Button onclick={() => threadStatuses[threadId] = "完了"}>Update conversation metadata</Button>
  <div style="width:240px;max-width:100%">
    <ChatThreadList selectedId={threadId} onSelect={id => threadId = id} items={[
      { id: "a", title: "最初の会話", preview: "長いプレビューが幅からはみ出さないことを確認します。".repeat(10), time: "10:24", unreadCount: 120 },
      { id: "b", title: "次の会話" },
      { id: "c", title: "操作不可の会話", disabled: true },
    ]}>{#snippet metadata(item)}{@render threadMetadata(item.id)}{/snippet}</ChatThreadList>
  </div>
  <output data-memo-saved>{memoSaved}</output>
  <output data-thread-selection>{threadId}</output>
</section>
