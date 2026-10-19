<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { ChatMemo } from "@mutsuna/ui/chat-memo";
import Preview from "./chat-memo-preview.svelte";
const { Story } = defineMeta({
  title: "Components/Inputs/Chat Memo",
  component: ChatMemo,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "StickyNoteに会話用のラベルとinline起点を加えた互換ラッパーです。新規の実装ではStickyNoteを使用してください。保存・移動・最小化の挙動は共通で、本文・保存状態・権限は利用側が管理します。" } } },
});
</script>
<Story name="States" asChild parameters={{ controls: { disable: true } }}><div class="grid gap-8"><section><h2 class="mb-2 text-sm font-medium">編集可能</h2><Preview /></section><section><h2 class="mb-2 text-sm font-medium">閲覧専用</h2><Preview readOnly /></section></div></Story>
