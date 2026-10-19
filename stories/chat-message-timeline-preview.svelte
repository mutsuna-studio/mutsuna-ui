<script lang="ts">
import { ChatMessage } from '@mutsuna/ui/chat-message';
import * as Message from '@mutsuna/ui/message';
import { ChatAttachment } from '@mutsuna/ui/chat-attachment';
import { CustomerAvatar } from '@mutsuna/ui/avatar';
import { Loading } from '@mutsuna/ui/loading';
import { chatSampleScreen } from './chat-sample-images.js';
let liked = $state(false);
</script>

<div class="grid w-full max-w-3xl gap-10">
  <section aria-label="タイムラインの会話" class="grid gap-7">
    <ChatMessage layout="timeline" side="outgoing" author="あなた">
      {#snippet avatar()}<CustomerAvatar id="あなた" name="あなた" />{/snippet}
      {#snippet metadata()}<time datetime="2026-10-17T10:22:00+09:00">10:22</time>{/snippet}
      紹介文の構成を見直しました。画像とあわせて確認をお願いします。
      <ChatAttachment name="チャット画面のラフ.svg" previewUrl={chatSampleScreen} downloadUrl={chatSampleScreen} class="mt-3" />
    </ChatMessage>
    <ChatMessage layout="timeline" author="アシスタント">
      {#snippet avatar()}<CustomerAvatar id="アシスタント" name="アシスタント" />{/snippet}
      {#snippet metadata()}<time datetime="2026-10-17T10:23:00+09:00">10:23</time><span>AI</span>{/snippet}
      {#snippet quote()}<Message.Quote author="あなた" text="紹介文の構成を見直しました。" />{/snippet}
      {#snippet actions()}<Message.Actions onReact={() => liked = !liked} />{/snippet}
      {#snippet reactions()}<Message.Reactions items={[{ emoji: '👍', label: '役に立った', count: liked ? 2 : 1, selected: liked }]} onToggle={() => liked = !liked} />{/snippet}
      {"読み手が知りたい順番に、情報をまとめてみましょう。\n\n1. 何ができるようになるか\n2. どんな場面で役に立つか\n3. 最初に何をすればよいか\n\n短い段落に分けると、長い回答でも流れを追いやすくなります。"}
    </ChatMessage>
    <ChatMessage layout="timeline" author="アシスタント">
      {#snippet avatar()}<CustomerAvatar id="アシスタント" name="アシスタント" />{/snippet}
      <span role="status" class="inline-flex items-center gap-2 text-muted-foreground"><Loading /><span>回答を作成中</span></span>
    </ChatMessage>
  </section>
  <section aria-label="狭いタイムラインと長い送信者名" class="grid w-full max-w-[280px] gap-6">
    <ChatMessage layout="timeline" author="プロジェクトのデザインを担当する長い名前の送信者">
      {#snippet avatar()}<CustomerAvatar id="デザインチーム" name="デザインチーム" />{/snippet}
      {#snippet metadata()}<time datetime="2026-10-17T10:24:00+09:00">10:24</time>{/snippet}
      {#snippet actions()}<Message.Actions onReply={() => {}} onCopy={() => {}} onReact={() => {}} disabled />{/snippet}
      狭い領域でも、名前と操作バーを重ねずに本文を表示します。
    </ChatMessage>
    <ChatMessage layout="timeline" author="あなた" side="outgoing" showAuthor={false}>
      {#snippet metadata()}<span class="text-destructive">送信できませんでした</span>{/snippet}
      アバターや名前を省略した表示にも対応します。
    </ChatMessage>
  </section>
</div>
