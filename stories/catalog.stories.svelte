<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
const { Story } = defineMeta({ title: "Guides/Getting Started", tags: ["!autodocs"] });
const groups = [
  { title: "画面全体を組み立てる", items: [
    { title: "App Shell", id: "patterns-app-shell--docs", description: "共通ナビゲーション・ヘッダー・フッターを持つ画面の外枠。" },
    { title: "Chat Screens", id: "patterns-chat-screens--docs", description: "タイムライン・吹き出し・AppShellへの組み込み。チャット画面の推奨構成。" },
    { title: "Workspace Layout", id: "patterns-workspace-layout--docs", description: "一覧・設定・フォームなど、ページ内の構成。" },
  ] },
  { title: "チャットの部品を選ぶ", items: [
    { title: "Chat Message", id: "components-data-display-chat-message--docs", description: "通常はこの部品から。表示形式と本文・アバター・操作を構成する。" },
    { title: "Chat Composer", id: "components-inputs-chat-composer--docs", description: "送信・返信・編集で共用する入力欄。" },
    { title: "Chat Thread List", id: "components-data-display-chat-thread-list--docs", description: "会話の選択と未読・ステータスの表示。" },
    { title: "Chat Header", id: "components-layout-chat-header--docs", description: "単独画面の見出し。AppShellのヘッダーがある場合は重ねない。" },
    { title: "Message Scroller", id: "components-layout-message-scroller--docs", description: "履歴のスクロール・上部の情報・最新への移動。" },
    { title: "Sticky Note", id: "components-inputs-sticky-note--docs", description: "新規の付箋にはこちらを使用。Chat Memoは会話用の互換ラッパー。" },
    { title: "Floating Action Menu", id: "components-navigation-floating-action-menu--docs", description: "会話全体の補助操作をまとめる。" },
    { title: "Chat Attachment / Image Preview", id: "components-data-display-chat-attachment--docs", description: "添付の表示。画像の拡大だけならImage Previewを使用。" },
    { title: "Message / Bubble", id: "components-data-display-message--docs", description: "独自の配置を組み立てるための低レベル部品。" },
  ] },
  { title: "見た目と状態を確認する", items: [
    { title: "Theme", id: "foundations-theme--docs", description: "ツールバーでテーマカラー・ライト／ダークを変更。All Presetsで全配色を比較。" },
    { title: "Avatar", id: "components-data-display-avatar--docs", description: "人物表示はCustomerAvatarを基本に。色はidで安定し、丸型・角丸四角を選べる。" },
    { title: "Select", id: "components-inputs-select--docs", description: "Statesで通常・小サイズ・操作不可・エラーを比較。検索・自由入力は別の操作例。" },
  ] },
];
</script>

<Story name="Overview" asChild parameters={{ layout: "fullscreen", controls: { disable: true }, options: { showPanel: false } }}>
  <article class="mx-auto grid max-w-4xl gap-8 p-4 sm:p-8">
    <header class="grid gap-3"><h1 class="text-2xl font-semibold">Mutsuna UIの使い方</h1><p class="text-muted-foreground">画面の完成例はPatterns、公開部品はComponents、共通の見た目はFoundationsから確認できます。</p></header>
    {#each groups as group}
      <section class="grid gap-3"><h2 class="text-lg font-semibold">{group.title}</h2><div class="grid gap-3 sm:grid-cols-2">
        {#each group.items as item}
          <a href={`./?path=/docs/${item.id}`} target="_top" class="grid content-start gap-2 rounded-lg border p-4 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"><h3 class="font-medium">{item.title}</h3><p class="text-sm text-muted-foreground">{item.description}</p></a>
        {/each}
      </div></section>
    {/each}
    <section class="grid gap-3 rounded-lg border p-4"><h2 class="text-lg font-semibold">アプリから使うとき</h2><p class="text-sm">公開入口からimportします。stories内のPreviewは表示例とテストのためのコードで、公開コンポーネントではありません。</p><pre class="overflow-x-auto rounded-md bg-muted p-3 text-sm"><code>{'import { ChatMessage, ChatComposer, StickyNote } from "@mutsuna/ui/chat";\nimport { AdminShellFrame } from "@mutsuna/ui/admin-shell-frame";'}</code></pre><p class="text-sm">通信・権限・保存・PDF生成などの実処理はアプリで管理します。画面例のControlsには長文・失敗などの検証設定を含みます。</p><a class="text-sm underline underline-offset-4" href="https://github.com/mutsuna-studio/mutsuna-ui/blob/main/docs/components/chat.md">チャットの導入ガイドと実装例</a></section>
  </article>
</Story>
