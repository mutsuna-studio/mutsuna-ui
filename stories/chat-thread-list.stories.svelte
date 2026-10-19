<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { ChatThreadList } from "@mutsuna/ui/chat-thread-list";
import { Hash } from "@lucide/svelte";
import Preview from "./chat-thread-list-preview.svelte";
const { Story } = defineMeta({
  title: "Components/Data Display/Chat Thread List",
  component: ChatThreadList,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "会話一覧の表示と選択通知。名前と補足情報を上段、最終メッセージを下段にまとめ、時刻・未読数を右端へ揃えます。metadata(item)で会話の状態・タグ・メモ有無などを渡せます。状態の定義・権限・メモの保存は利用側が管理します。順序・取得・遷移は利用側が管理します。CustomerAvatarを標準で使い、leadingでアイコンへ差し替えられます。スクロール領域や新規作成ボタンは含みません。" } } },
});
</script>
<Story name="Select Conversation" asChild><Preview /></Story>
<Story name="States" asChild>
  <div class="grid w-full max-w-sm gap-6">
    <div><p class="mb-2 text-sm font-medium">会話の状態・メモの有無（利用側の情報）</p><Preview showMetadata /></div>
    <div><p class="mb-2 text-sm font-medium">長文・未読・操作不可</p><ChatThreadList ariaLabel="長文と未読の会話一覧" selectedId="long" items={[
      { id: "long", title: "長い会話のタイトルでも幅からはみ出さず省略して表示します", preview: "長い最終メッセージを狭い一覧で確認します。".repeat(6), time: "10:24", unreadCount: 120 },
      { id: "disabled", title: "選択できない会話", preview: "閲覧できない状態", disabled: true },
    ]} /></div>
    <div><p class="mb-2 text-sm font-medium">コンパクトなチャンネル</p><ChatThreadList ariaLabel="チャンネル一覧" variant="compact" items={[{ id: "ideas", title: "文章とアイデア" }, { id: "notes", title: "ミーティングの振り返り" }]} selectedId="ideas">{#snippet leading()}<Hash size={17} />{/snippet}</ChatThreadList></div>
    <div><p class="mb-2 text-sm font-medium">読み込み中</p><ChatThreadList ariaLabel="読み込み中の会話一覧" items={[]} loading /></div>
    <div><p class="mb-2 text-sm font-medium">空の一覧</p><ChatThreadList ariaLabel="空の会話一覧" items={[]} /></div>
    <div><p class="mb-2 text-sm font-medium">エラー</p><ChatThreadList ariaLabel="エラーの会話一覧" items={[]} error="会話を読み込めませんでした。" onRetry={() => {}} /></div>
    <div><p class="mb-2 text-sm font-medium">全体を無効化</p><ChatThreadList ariaLabel="操作不可の会話一覧" disabled items={[{ id: "disabled-list", title: "読み取り専用の会話" }]} /></div>
  </div>
</Story>
