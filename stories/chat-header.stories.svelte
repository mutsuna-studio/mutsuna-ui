<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { ChatHeader } from "@mutsuna/ui/chat-header";
import { Badge } from "@mutsuna/ui/badge";
import { CustomerAvatar } from "@mutsuna/ui/avatar";
import { Hash, StickyNote } from "@lucide/svelte";
const { Story } = defineMeta({
  title: "Components/Layout/Chat Header",
  component: ChatHeader,
  tags: ["autodocs"],
  parameters: { layout: "padded", docs: { description: { component: "会話タイトルと補足情報の表示。metadataは会話そのものの状態・タグ・メモ有無などを表し、相手が人かAIかに依存しません。状態の定義・更新・保存・権限は利用側の責務です。スマホでもmetadataは省略しません。" } } },
});
</script>
<Story name="States" asChild>
  <div class="grid w-full max-w-3xl gap-6">
    <section aria-label="通常の会話の例"><p class="mb-2 text-sm font-medium">通常の会話</p><ChatHeader title="佐藤 美咲" description="オンライン">
      {#snippet leading()}<CustomerAvatar id="佐藤 美咲" name="佐藤 美咲" />{/snippet}
      {#snippet metadata()}<Badge variant="outline">対応中</Badge><span class="inline-flex items-center gap-1"><StickyNote size={12} aria-hidden="true" />メモあり</span>{/snippet}
    </ChatHeader></section>
    <section aria-label="AIとの会話の例"><p class="mb-2 text-sm font-medium">AIとの会話</p><ChatHeader title="文章とアイデア" description="文章アシスタントとの会話">
      {#snippet leading()}<Hash size={22} />{/snippet}
      {#snippet metadata()}<Badge variant="secondary">下書き</Badge><Badge variant="outline">確認待ち</Badge><span>メモあり</span>{/snippet}
    </ChatHeader></section>
    <section aria-label="補足情報なしの例"><p class="mb-2 text-sm font-medium">補足情報なし</p><ChatHeader title="新しい会話" /></section>
    <section aria-label="狭い幅の例" class="max-w-xs"><p class="mb-2 text-sm font-medium">狭い幅・長い会話情報</p><ChatHeader title={"長い会話タイトル".repeat(8)}>
      {#snippet metadata()}<Badge variant="outline" class="h-auto min-h-5 whitespace-normal">長い会話ステータスも折り返して確認できます</Badge><span>長いメモの補足情報でも一覧と同様に省略せず折り返します。</span>{/snippet}
    </ChatHeader></section>
  </div>
</Story>
