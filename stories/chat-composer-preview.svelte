<script lang="ts">
import { ChatComposer, type ChatComposerAttachment, type ChatComposerSubmission } from "@mutsuna/ui/chat-composer";
import * as Message from "@mutsuna/ui/message";
import { Button } from "@mutsuna/ui/button";
import { onDestroy, untrack } from "svelte";
let { initialValue = "", initialAttachments = [], initialReply = false, submitOn = "mod-enter" }: { submitOn?: "enter" | "mod-enter"; initialReply?: boolean; initialValue?: string; initialAttachments?: readonly ChatComposerAttachment[] } = $props();
let value = $state(untrack(() => initialValue));
let attachments = $state<ChatComposerAttachment[]>(untrack(() => [...initialAttachments]));
let sent = $state("");
let replying = $state(untrack(() => initialReply));
let nextId = 0;
const previews = new Set<string>();
function releasePreviews() { for (const url of previews) URL.revokeObjectURL(url); previews.clear(); }
onDestroy(releasePreviews);
function select(files: File[]) {
  attachments = [...attachments, ...files.map(file => {
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    if (previewUrl) previews.add(previewUrl);
    return { id: `file-${nextId++}`, name: file.name, size: file.size, previewUrl };
  })];
}
function remove(id: string) {
  const url = attachments.find(file => file.id === id)?.previewUrl;
  if (url) { URL.revokeObjectURL(url); previews.delete(url); }
  attachments = attachments.filter(file => file.id !== id);
}
function send(submission: ChatComposerSubmission) {
  sent = `${submission.text} ${submission.attachments.map(file => file.name).join(", ")}`.trim();
  value = "";
  attachments = [];
  releasePreviews();
}
</script>
<div class="grid max-w-2xl gap-3">
  {#snippet replyContext()}<Message.Quote variant="composer" author="佐藤 美咲" text="余白を広げた案、よさそうです。この方向で調整してみます。" onDismiss={() => replying = false} />{/snippet}
  <ChatComposer {submitOn} context={replying ? replyContext : undefined} bind:value {attachments} onFilesSelect={select} onRemoveAttachment={remove} onSend={send}>
    {#snippet actions({ close })}
      <Button type="button" variant="ghost" class="h-11 w-full justify-start" onclick={() => { value += "お疲れさまです。"; close(); }}>定型文を挿入</Button>
    {/snippet}
  </ChatComposer>
  <output aria-live="polite" class="text-sm text-muted-foreground">{sent ? `送信内容：${sent}` : ""}</output>
</div>
