<script module lang="ts">
import { expect, userEvent, within, waitFor } from "storybook/test";
import MarkdownLifecycle from "../test/fixtures/astro/svelte/src/components/MarkdownLifecycle.svelte";
import { defineMeta } from "@storybook/addon-svelte-csf";
import type { ComponentProps } from "svelte";
import { MarkdownTextEditor } from "@mutsuna/ui/markdown";

type MarkdownEditorStoryArgs = ComponentProps<typeof MarkdownTextEditor>;

const { Story } = defineMeta({
  title: "Components/Inputs/Markdown Editor",
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


<Story name="Toolbar Interaction Test" tags={["!dev", "!autodocs"]} args={{ id: "markdown-toolbar-test", value: "Hello", toolbarPreset: "full" }} play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await waitFor(() => expect(canvasElement.querySelector('[contenteditable="true"]')).not.toBeNull());
  const editor = canvasElement.querySelector<HTMLElement>('[contenteditable="true"]')!;
  await userEvent.click(editor);
  const selection = window.getSelection()!;
  const range = document.createRange();
  range.selectNodeContents(editor.querySelector("p")!);
  selection.removeAllRanges();
  selection.addRange(range);
  await userEvent.click(canvas.getByRole("button", { name: "太字" }));
  await expect(canvas.getByRole("button", { name: "太字" })).toHaveAttribute("aria-pressed", "true");
  await waitFor(() => expect(editor.querySelector("strong")).toHaveTextContent("Hello"));
  await userEvent.click(canvas.getByRole("button", { name: "見出し2" }));
  await waitFor(() => expect(editor.querySelector("h2")).not.toBeNull());
}} />

<Story name="Lifecycle Test" tags={["!dev", "!autodocs"]} asChild play={async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: "Mount and remove markdown" }));
  await waitFor(() => expect(canvasElement.querySelector("#lifecycle-markdown")).toBeNull());
  await userEvent.click(canvas.getByRole("button", { name: "Mount and update markdown" }));
  await waitFor(() => expect(canvasElement.querySelector("#lifecycle-markdown .ProseMirror")).toHaveTextContent("Latest"));
  await userEvent.click(canvas.getByRole("button", { name: "Replace markdown" }));
  await waitFor(() => expect(canvasElement.querySelector("#lifecycle-markdown .ProseMirror")).toHaveTextContent("External"));
  await expect(canvas.getByTestId("markdown-changes")).toHaveTextContent("0");
  await userEvent.click(canvas.getByRole("button", { name: "Remove markdown" }));
  await waitFor(() => expect(canvasElement.querySelector("#lifecycle-markdown")).toBeNull());
}}><MarkdownLifecycle /></Story>
