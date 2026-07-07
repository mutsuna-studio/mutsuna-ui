<script lang="ts" module>
export type MarkdownEditorToolbarMode = "icon" | "text";

export type MarkdownEditorProps = {
  readonly id: string;
  readonly label: string;
  readonly name?: string;
  value?: string;
  readonly minHeightClass?: string;
  readonly toolbarMode?: MarkdownEditorToolbarMode;
  readonly onMarkdownChange?: (value: string) => void;
};

type ToolbarAction =
  | {
      readonly iconLabel: string;
      readonly textLabel: string;
      readonly title: string;
      readonly kind: "heading";
      readonly level: 2 | 3;
    }
  | {
      readonly iconLabel: string;
      readonly textLabel: string;
      readonly title: string;
      readonly kind: "strong" | "emphasis" | "bulletList" | "orderedList" | "blockquote";
    };
</script>

<script lang="ts">
import { Editor, defaultValueCtx, rootCtx } from "@milkdown/kit/core";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import {
  commonmark,
  toggleEmphasisCommand,
  toggleStrongCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInHeadingCommand,
  wrapInOrderedListCommand,
} from "@milkdown/kit/preset/commonmark";
import "@milkdown/kit/prose/view/style/prosemirror.css";
import { callCommand, replaceAll } from "@milkdown/kit/utils";
import BoldIcon from "@lucide/svelte/icons/bold";
import Heading2Icon from "@lucide/svelte/icons/heading-2";
import Heading3Icon from "@lucide/svelte/icons/heading-3";
import ItalicIcon from "@lucide/svelte/icons/italic";
import ListIcon from "@lucide/svelte/icons/list";
import ListOrderedIcon from "@lucide/svelte/icons/list-ordered";
import QuoteIcon from "@lucide/svelte/icons/quote";
import { onMount } from "svelte";
import { Button } from "../button/index.js";

let {
  id,
  label,
  name,
  value = $bindable(""),
  minHeightClass = "min-h-56",
  toolbarMode = "icon",
  onMarkdownChange,
}: MarkdownEditorProps = $props();

let rootElement = $state<HTMLDivElement | null>(null);
let editor = $state<Editor | null>(null);
let editorMarkdown = $state<string | null>(null);
let lastAppliedValue = $state<string | null>(null);
let applyingExternalValue = false;
const markdown = $derived(editorMarkdown ?? value);

const toolbarActions: readonly ToolbarAction[] = [
  { iconLabel: "H2", textLabel: "H2", title: "見出し2", kind: "heading", level: 2 },
  { iconLabel: "H3", textLabel: "H3", title: "見出し3", kind: "heading", level: 3 },
  { iconLabel: "B", textLabel: "B", title: "太字", kind: "strong" },
  { iconLabel: "I", textLabel: "I", title: "斜体", kind: "emphasis" },
  { iconLabel: "List", textLabel: "•", title: "箇条書き", kind: "bulletList" },
  { iconLabel: "Ordered list", textLabel: "1.", title: "番号付きリスト", kind: "orderedList" },
  { iconLabel: "Quote", textLabel: "❝", title: "引用", kind: "blockquote" },
];

onMount(() => {
  if (rootElement === null) {
    return;
  }

  const instance = Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, rootElement);
      ctx.set(defaultValueCtx, markdown);
      ctx.get(listenerCtx).markdownUpdated((_ctx, nextMarkdown) => {
        editorMarkdown = nextMarkdown;
        value = nextMarkdown;
        lastAppliedValue = nextMarkdown;
        if (!applyingExternalValue) {
          onMarkdownChange?.(nextMarkdown);
        }
      });
    })
    .use(commonmark)
    .use(listener);

  void instance.create().then(() => {
    editor = instance;
  });

  return () => {
    editor = null;
    void instance.destroy();
  };
});

$effect(() => {
  if (editor === null || value === lastAppliedValue) {
    return;
  }

  applyingExternalValue = true;
  editorMarkdown = value;
  lastAppliedValue = value;
  editor.action(replaceAll(value, true));
  queueMicrotask(() => {
    applyingExternalValue = false;
  });
});

function runToolbarAction(action: ToolbarAction): void {
  if (editor === null) {
    return;
  }

  if (action.kind === "heading") {
    editor.action(callCommand(wrapInHeadingCommand.key, action.level));
    return;
  }

  if (action.kind === "strong") {
    editor.action(callCommand(toggleStrongCommand.key));
    return;
  }

  if (action.kind === "emphasis") {
    editor.action(callCommand(toggleEmphasisCommand.key));
    return;
  }

  if (action.kind === "bulletList") {
    editor.action(callCommand(wrapInBulletListCommand.key));
    return;
  }

  if (action.kind === "orderedList") {
    editor.action(callCommand(wrapInOrderedListCommand.key));
    return;
  }

  editor.action(callCommand(wrapInBlockquoteCommand.key));
}
</script>

<div class="grid gap-2">
  {#if name !== undefined}
    <input type="hidden" {name} {value} />
  {/if}
  <p id={`${id}-label`} class="text-sm font-medium">{label}</p>
  <div class="overflow-hidden rounded-lg border border-input bg-background">
    <div class="flex flex-wrap gap-1 border-b bg-muted/40 p-2">
      {#each toolbarActions as action (action.title)}
        <Button
          type="button"
          variant="ghost"
          size={toolbarMode === "icon" ? "icon-sm" : "sm"}
          title={action.title}
          aria-label={action.title}
          onclick={() => runToolbarAction(action)}
        >
          {#if toolbarMode === "icon"}
            {#if action.kind === "heading" && action.level === 2}
              <Heading2Icon aria-hidden="true" />
            {:else if action.kind === "heading" && action.level === 3}
              <Heading3Icon aria-hidden="true" />
            {:else if action.kind === "strong"}
              <BoldIcon aria-hidden="true" />
            {:else if action.kind === "emphasis"}
              <ItalicIcon aria-hidden="true" />
            {:else if action.kind === "bulletList"}
              <ListIcon aria-hidden="true" />
            {:else if action.kind === "orderedList"}
              <ListOrderedIcon aria-hidden="true" />
            {:else}
              <QuoteIcon aria-hidden="true" />
            {/if}
          {:else}
            {action.textLabel}
          {/if}
        </Button>
      {/each}
    </div>
    <div {id} bind:this={rootElement} class="milkdown-markdown-editor {minHeightClass} px-4 py-3 text-sm" aria-labelledby={`${id}-label`}></div>
  </div>
</div>

<style>
  :global(.milkdown-markdown-editor .ProseMirror) {
    min-height: 12rem;
    outline: none;
  }

  :global(.milkdown-markdown-editor .ProseMirror > * + *) {
    margin-top: 0.75rem;
  }

  :global(.milkdown-markdown-editor .ProseMirror h2) {
    font-size: 1.1rem;
    font-weight: 700;
  }

  :global(.milkdown-markdown-editor .ProseMirror h3) {
    font-size: 1rem;
    font-weight: 700;
  }

  :global(.milkdown-markdown-editor .ProseMirror ul),
  :global(.milkdown-markdown-editor .ProseMirror ol) {
    padding-left: 1.25rem;
  }

  :global(.milkdown-markdown-editor .ProseMirror ul) {
    list-style: disc;
  }

  :global(.milkdown-markdown-editor .ProseMirror ol) {
    list-style: decimal;
  }

  :global(.milkdown-markdown-editor .ProseMirror blockquote) {
    border-left: 3px solid var(--border);
    padding-left: 0.75rem;
    color: var(--muted-foreground);
  }
</style>
