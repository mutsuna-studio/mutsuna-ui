<script lang="ts" module>
import type { Snippet } from "svelte";
import type { MarkdownEditorToolbarPreset } from "./markdown-editor.svelte";

export type MarkdownTextEditorProps = {
  readonly id: string;
  readonly label: string;
  readonly headerActions?: Snippet;
  readonly name?: string;
  readonly value?: string;
  readonly minHeightClass?: string;
  readonly normalizeMarkdown?: (value: string) => string;
  readonly toolbarPreset?: MarkdownEditorToolbarPreset;
  readonly onMarkdownChange?: (value: string) => void;
};
</script>

<script lang="ts">
import MarkdownEditor from "./markdown-editor.svelte";

let markdownEditor = $state<{ insertMarkdown(text: string): void } | null>(null);

let {
  id,
  label,
  headerActions,
  name,
  value = "",
  minHeightClass,
  normalizeMarkdown,
  toolbarPreset,
  onMarkdownChange,
}: MarkdownTextEditorProps = $props();

export function insertMarkdown(text: string): void {
  markdownEditor?.insertMarkdown(text);
}
</script>

<MarkdownEditor
  bind:this={markdownEditor}
  {id}
  {label}
  {headerActions}
  {name}
  {value}
  {minHeightClass}
  {normalizeMarkdown}
  {toolbarPreset}
  {onMarkdownChange}
  toolbarMode="text"
/>
