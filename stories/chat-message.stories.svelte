<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { ChatMessage } from "@mutsuna/ui/chat-message";
import { Button } from "@mutsuna/ui/button";
import ChatMessageLayoutPreview from "./chat-message-layout-preview.svelte";
import ChatMessageTimelinePreview from "./chat-message-timeline-preview.svelte";
import ChatLongAnswerPreview from "./chat-long-answer-preview.svelte";
import ChatRevisionPreview from "./chat-revision-preview.svelte";
import ChatRevisionStates from "./chat-revision-states.svelte";
const { Story } = defineMeta({
  title: "Components/Data Display/Chat Message",
  component: ChatMessage,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "メッセージ単体の配置・状態・長文を確認します。画面全体のタイムライン・吹き出しと入力欄での編集はPatterns/Chat Screensを参照してください。Inline Editing And Regenerationは本文内に編集フォームを置く別の操作フローです。通常はPatterns/Chat Screensの共通入力欄を再利用します。" } } },
});
</script>

<Story name="States" asChild>
  <div class="grid w-full max-w-3xl gap-12">
    <section aria-label="レイアウトと基本操作" class="grid gap-4">
      <h2 class="text-base font-semibold">吹き出し・タイムラインの切り替え</h2>
      <ChatMessageLayoutPreview />
    </section>
    <section aria-label="タイムラインの代表状態" class="grid gap-4">
      <h2 class="text-base font-semibold">タイムラインの代表状態</h2>
      <ChatMessageTimelinePreview />
    </section>
    <section aria-label="長文と送信エラー" class="grid w-full max-w-[280px] gap-4">
      <ChatMessage author="長い名前の送信者abcdefghijklmnopqrstuv" layout="bubble" side="outgoing" showAuthor>
        {#snippet metadata()}<span>送信できませんでした</span>{/snippet}
        {#snippet actions()}<Button variant="outline" size="sm">再送</Button><Button variant="ghost" size="sm" disabled>編集中</Button>{/snippet}
        https://example.test/abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789
      </ChatMessage>
    </section>
  </div>
</Story>

<Story name="Long Answer" asChild><ChatLongAnswerPreview /></Story>
<Story name="Inline Editing And Regeneration" asChild>
  <div class="grid w-full max-w-3xl gap-12">
    <section aria-label="編集と再生成の操作" class="grid gap-4">
      <h2 class="text-base font-semibold">編集・再生成を試す</h2>
      <ChatRevisionPreview />
    </section>
    <section aria-label="編集と再生成の状態一覧" class="grid gap-4">
      <h2 class="text-base font-semibold">状態の比較</h2>
      <ChatRevisionStates />
    </section>
  </div>
</Story>
