<script lang="ts">
import { onDestroy, tick } from 'svelte';
import { Pencil } from '@lucide/svelte';
import { ChatMessage, ChatMessageEditor, ChatRegenerateAction } from '@mutsuna/ui/chat-message';
import { CustomerAvatar } from '@mutsuna/ui/avatar';
import { Button } from '@mutsuna/ui/button';
import { Checkbox } from '@mutsuna/ui/checkbox';
let question = $state('新しい機能を紹介する文章の構成を考えてください。');
let answer = $state('最初に、読み手が得られる変化を伝えましょう。\n\nその後に利用する場面と、使い始めるための手順を続けると、流れが伝わりやすくなります。');
let followup = $state(true);
let finalAnswer = $state('冒頭は「考えをすっきりまとめて、次の一歩へ。」のように、使った後の変化から始めてみましょう。');
let draft = $state('');
let editing = $state(false);
let submitting = $state(false);
let generating = $state(false);
let editError = $state<string>();
let generationError = $state<string>();
let failNext = $state(false);
let notice = $state('');
let revision = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let editTrigger = $state<HTMLButtonElement | null>(null);
onDestroy(() => clearTimeout(timer));
function restoreEditFocus() { void tick().then(() => editTrigger?.focus({ preventScroll: true })); }
function beginEdit() { draft = question; editError = undefined; notice = ''; editing = true; }
function cancelEdit() { editing = false; editError = undefined; restoreEditFocus(); }
function stop() { clearTimeout(timer); submitting = false; generating = false; notice = '生成を停止しました。元の会話を残しています。'; }
function submit(value: string) {
  submitting = true; editError = undefined; notice = '';
  const fail = failNext; failNext = false;
  timer = setTimeout(() => {
    submitting = false;
    if (fail) { editError = 'やり直せませんでした。編集内容は残っています。もう一度お試しください。'; return; }
    question = value; followup = false; editing = false; generationError = undefined;
    answer = `「${value}」に合わせて、構成を見直しました。\n\n1. 読み手に伝えたい変化\n2. 具体的な利用場面\n3. 最初に行うこと\n\nこの順番で、短い段落に分けて説明しましょう。`;
    notice = '編集した質問から会話を作り直しました。'; restoreEditFocus();
  }, 1000);
}
function regenerate() {
  generating = true; generationError = undefined; notice = '';
  const fail = failNext; failNext = false;
  timer = setTimeout(() => {
    generating = false;
    if (fail) { generationError = '回答を生成できませんでした。元の回答を残しています。'; return; }
    const next = `別の表現でまとめました（再生成 ${++revision}）。\n\n読み手にとっての変化を一文で示し、具体例を一つ添えてみましょう。質問の内容は変わりません。`;
    if (followup) finalAnswer = next; else answer = next;
    notice = '回答を再生成しました。';
  }, 1000);
}
</script>

<div class="revision-preview">
  <label class="simulation-control"><Checkbox bind:checked={failNext} disabled={submitting || generating} />次の実行でエラーを表示</label>
  <div class="revision-conversation" aria-label="質問の編集と再生成の会話">
    <ChatMessage author="あなた" layout="timeline" side="outgoing">
      {#snippet avatar()}<CustomerAvatar id="あなた" name="あなた" />{/snippet}
      {#if editing}
        <ChatMessageEditor bind:value={draft} {submitting} error={editError} label="質問を編集" description={`この質問以降の会話（${followup ? 3 : 1}件）を作り直します。`} onSubmit={submit} onCancel={cancelEdit} onStop={stop} />
      {:else}{question}{/if}
      {#snippet footerActions()}{#if !editing}<Button bind:ref={editTrigger} variant="ghost" size="sm" icon={Pencil} class="min-h-11" disabled={generating} onclick={beginEdit}>質問を編集</Button>{/if}{/snippet}
    </ChatMessage>
    <ChatMessage author="アシスタント" layout="timeline">
      {#snippet avatar()}<CustomerAvatar id="アシスタント" name="アシスタント" />{/snippet}
      {answer}
      {#snippet footerActions()}{#if !followup}<ChatRegenerateAction {generating} error={generationError} disabled={editing} onRegenerate={regenerate} onStop={stop} />{/if}{/snippet}
    </ChatMessage>
    {#if followup}
      <ChatMessage author="あなた" layout="timeline" side="outgoing">
        {#snippet avatar()}<CustomerAvatar id="あなた" name="あなた" />{/snippet}
        冒頭の一文をもう少し具体的にしたいです。
      </ChatMessage>
      <ChatMessage author="アシスタント" layout="timeline">
        {#snippet avatar()}<CustomerAvatar id="アシスタント" name="アシスタント" />{/snippet}
        {finalAnswer}
        {#snippet footerActions()}<ChatRegenerateAction {generating} error={generationError} disabled={editing} onRegenerate={regenerate} onStop={stop} />{/snippet}
      </ChatMessage>
    {/if}
  </div>
  <p role="status" class="revision-notice">{notice}</p>
</div>

<style>
.revision-preview { display: grid; gap: 20px; width: 100%; max-width: 52rem; }
.simulation-control { display: flex; align-items: center; gap: 10px; width: fit-content; min-height: 44px; color: var(--muted-foreground); font-size: 12px; }
.revision-conversation { display: grid; gap: 28px; padding: 24px; border: 1px solid var(--border); border-radius: 12px; }
.revision-notice { color: var(--muted-foreground); font-size: 12px; line-height: 1.7; }
@media (max-width: 767px) { .revision-conversation { padding: 16px; } }
</style>
