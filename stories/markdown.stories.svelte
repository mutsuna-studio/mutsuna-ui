<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import type { ComponentProps } from "svelte";
import { MarkdownEditor } from "@mutsuna/ui/markdown";

type MarkdownEditorStoryArgs = ComponentProps<typeof MarkdownEditor>;

const { Story } = defineMeta({
  title: "UI/Markdown Editor",
  component: MarkdownEditor,
  tags: ["autodocs"],
  argTypes: {
    toolbarMode: {
      control: "select",
      options: ["icon", "text"],
    },
    value: {
      control: "text",
    },
    minHeightClass: {
      control: "text",
    },
  },
  args: {
    id: "markdown-editor-story",
    label: "本文",
    value: "## 予約通知\n\n- 予約者名: {{customer.displayName}}\n- 日時: {{booking.startAt}}\n\n必要に応じて**管理者が確認**します。",
    minHeightClass: "min-h-56",
    toolbarMode: "icon",
  } satisfies MarkdownEditorStoryArgs,
});
</script>

<Story name="Icon Toolbar" />

<Story name="Text Toolbar" args={{ id: "markdown-editor-story-text", toolbarMode: "text" }} />

<Story
  name="Active Style Tracking"
  args={{
    id: "markdown-editor-story-active-styles",
    value:
      "## 見出し\n\n## **太字の見出し**\n\n## ***太字・斜体の見出し***\n\n**太字** と *斜体*\n\n1. 番号付き\n2. カーソル移動で選択状態を確認\n\n> 引用",
    toolbarMode: "text",
  }}
/>
