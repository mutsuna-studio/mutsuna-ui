<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import type { ComponentProps } from "svelte";
import { MarkdownTextEditor } from "@mutsuna/ui/markdown";

type MarkdownEditorStoryArgs = ComponentProps<typeof MarkdownTextEditor>;

const { Story } = defineMeta({
  title: "UI/Markdown Editor",
  component: MarkdownTextEditor,
  tags: ["autodocs"],
  argTypes: {
    toolbarPreset: {
      control: "select",
      options: ["full", "email"],
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
    value: "## 更新通知\n\n- 担当者: {{user.displayName}}\n- 更新日時: {{item.updatedAt}}\n\n必要に応じて**管理者が確認**します。",
    minHeightClass: "min-h-56",
    toolbarPreset: "full",
  } satisfies MarkdownEditorStoryArgs,
});
</script>

<Story name="Full Toolbar" />

<Story name="Email Toolbar" args={{ id: "markdown-editor-story-email", toolbarPreset: "email" }} />

<Story
  name="Active Style Tracking"
  args={{
    id: "markdown-editor-story-active-styles",
    value:
      "## 見出し\n\n## **太字の見出し**\n\n## ***太字・斜体の見出し***\n\n**太字** と *斜体*\n\n1. 番号付き\n2. カーソル移動で選択状態を確認\n\n> 引用",
    toolbarPreset: "full",
  }}
/>
