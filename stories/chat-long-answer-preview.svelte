<script lang="ts">
import { onDestroy } from 'svelte';
import { Copy, Check, ThumbsUp } from '@lucide/svelte';
import { ChatMessage } from '@mutsuna/ui/chat-message';
import * as Message from '@mutsuna/ui/message';
import * as Scroller from '@mutsuna/ui/message-scroller';
import { CustomerAvatar } from '@mutsuna/ui/avatar';
import { Button } from '@mutsuna/ui/button';
import LongAnswerContent from './chat-long-answer-content.svelte';
import { copyChatText } from './chat-copy-text.js';
let answer = $state<HTMLElement | null>(null);
let copyState = $state<'idle' | 'copied' | 'error'>('idle');
let liked = $state(false);
let additions = $state<string[]>([]);
let streaming = $state(false);
let timer: ReturnType<typeof setInterval> | undefined;
let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
function stop() { clearInterval(timer); streaming = false; }
function generate() {
  if (streaming) return;
  streaming = true;
  let remaining = 8;
  timer = setInterval(() => {
    additions = [...additions, '補足：実際の回答では、読み手の質問に合わせて説明が追加されます。前の段落を読んでいるときはその位置を維持し、末尾で続きを見ているときは追加された内容へ追従します。見出しや表を行き来しても、会話全体を横へ動かす必要はありません。'];
    if (--remaining === 0) stop();
  }, 350);
}
async function copy() {
  try { await copyChatText(answer?.querySelector<HTMLElement>('[data-slot=chat-message-content]')?.innerText ?? ''); copyState = 'copied'; }
  catch { copyState = 'error'; }
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => copyState = 'idle', 2000);
}
onDestroy(() => { clearInterval(timer); clearTimeout(feedbackTimer); });
</script>

<div class="long-answer-demo">
  <div class="generation-controls">
    <Button variant="outline" size="sm" onclick={generate} disabled={streaming}>続きを生成</Button>
    {#if streaming}<Button variant="ghost" size="sm" onclick={stop}>生成を停止</Button>{/if}
    <span role="status" class="text-xs text-muted-foreground">{streaming ? '回答を生成しています' : additions.length ? '生成が完了しました' : '長文の回答を表示しています'}</span>
  </div>
  <div class="answer-history">
    <Scroller.Provider autoScroll defaultScrollPosition="start">
      <Scroller.Root>
        <Scroller.Viewport aria-label="長文回答の履歴">
          <Scroller.Content aria-label="長文の会話" aria-live="off" class="answer-content">
            <Scroller.Item messageId="question">
              <ChatMessage layout="timeline" side="outgoing" author="あなた">
                {#snippet avatar()}<CustomerAvatar id="あなた" name="あなた" />{/snippet}
                長い説明を、読み返しやすい構成にするにはどうすればよいですか？例も交えて教えてください。
              </ChatMessage>
            </Scroller.Item>
            <Scroller.Item messageId="answer" class="[content-visibility:visible]">
              <ChatMessage bind:ref={answer} layout="timeline" author="アシスタント" prose>
                {#snippet avatar()}<CustomerAvatar id="アシスタント" name="アシスタント" />{/snippet}
                {#snippet metadata()}<span>長文の回答例</span>{/snippet}
                {#snippet actions()}<Message.Actions onCopy={copy} {copyState} />{/snippet}
                {#snippet footerActions()}
                  <Button variant="ghost" size="sm" icon={copyState === "copied" ? Check : Copy} class="min-h-11" onclick={copy} aria-label="回答をコピー">{copyState === 'error' ? 'コピーを再試行' : 'コピー'}</Button>
                  <Button variant="ghost" size="sm" icon={ThumbsUp} class="min-h-11" aria-pressed={liked} onclick={() => liked = !liked}>役に立った</Button>
                {/snippet}
                <LongAnswerContent />
                {#each additions as paragraph}<p data-answer-addition>{paragraph}</p>{/each}
              </ChatMessage>
            </Scroller.Item>
          </Scroller.Content>
        </Scroller.Viewport>
        <Scroller.Button behavior="instant" />
      </Scroller.Root>
    </Scroller.Provider>
  </div>
</div>

<style>
.long-answer-demo { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 56rem; }
.generation-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.answer-history { height: min(48rem, 80dvh); min-height: 280px; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.answer-history :global(.answer-content) { padding: 24px 28px 64px; gap: 28px; }
@media (max-width: 767px) { .answer-history :global(.answer-content) { padding: 16px 16px 64px; } }
</style>
