<script lang="ts" module>
import type { Snippet } from "svelte";

export type MarkdownEditorToolbarMode = "icon" | "text";
export type MarkdownEditorToolbarPreset = "full" | "email";

export type MarkdownEditorProps = {
  readonly id: string;
  readonly label: string;
  readonly headerActions?: Snippet;
  readonly name?: string;
  value?: string;
  readonly minHeightClass?: string;
  readonly normalizeMarkdown?: (value: string) => string;
  readonly toolbarMode?: MarkdownEditorToolbarMode;
  readonly toolbarPreset?: MarkdownEditorToolbarPreset;
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
      readonly kind: "strong" | "emphasis" | "bulletList" | "orderedList" | "blockquote" | "table" | "addTableRow" | "addTableColumn";
    };
</script>

<script lang="ts">
import { Editor, defaultValueCtx, editorViewCtx, rootCtx } from "@milkdown/kit/core";
import type { Ctx } from "@milkdown/kit/ctx";
import { history } from "@milkdown/kit/plugin/history";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import {
  blockquoteSchema,
  bulletListSchema,
  commonmark,
  emphasisSchema,
  headingSchema,
  orderedListSchema,
  strongSchema,
  toggleEmphasisCommand,
  toggleStrongCommand,
  wrapInBlockquoteCommand,
  wrapInHeadingCommand,
} from "@milkdown/kit/preset/commonmark";
import { addColAfterCommand, addRowAfterCommand, gfm, insertTableCommand, tableSchema } from "@milkdown/kit/preset/gfm";
import "@milkdown/kit/prose/view/style/prosemirror.css";
import { callCommand, replaceAll } from "@milkdown/kit/utils";
import BoldIcon from "@lucide/svelte/icons/bold";
import Heading2Icon from "@lucide/svelte/icons/heading-2";
import Heading3Icon from "@lucide/svelte/icons/heading-3";
import ItalicIcon from "@lucide/svelte/icons/italic";
import ListIcon from "@lucide/svelte/icons/list";
import ListOrderedIcon from "@lucide/svelte/icons/list-ordered";
import QuoteIcon from "@lucide/svelte/icons/quote";
import PlusIcon from "@lucide/svelte/icons/plus";
import Table2Icon from "@lucide/svelte/icons/table-2";
import { onMount } from "svelte";
import { Button } from "../button/index.js";
import { toggleList } from "./markdown-list-commands.js";

let {
  id,
  label,
  headerActions,
  name,
  value = $bindable(""),
  minHeightClass = "min-h-56",
  normalizeMarkdown = (nextValue) => nextValue,
  toolbarMode = "icon",
  toolbarPreset = "full",
  onMarkdownChange,
}: MarkdownEditorProps = $props();

let rootElement = $state<HTMLDivElement | null>(null);
let editor = $state<Editor | null>(null);
let editorMarkdown = $state<string | null>(null);
let lastAppliedValue = $state<string | null>(null);
let activeToolbarStyles = $state<readonly string[]>([]);
let applyingExternalValue = false;
const markdown = $derived(editorMarkdown ?? value);

const allToolbarActions: readonly ToolbarAction[] = [
  { iconLabel: "H2", textLabel: "H2", title: "見出し2", kind: "heading", level: 2 },
  { iconLabel: "H3", textLabel: "H3", title: "見出し3", kind: "heading", level: 3 },
  { iconLabel: "B", textLabel: "B", title: "太字", kind: "strong" },
  { iconLabel: "I", textLabel: "I", title: "斜体", kind: "emphasis" },
  { iconLabel: "List", textLabel: "•", title: "箇条書き", kind: "bulletList" },
  { iconLabel: "Ordered list", textLabel: "1.", title: "番号付きリスト", kind: "orderedList" },
  { iconLabel: "Quote", textLabel: "❝", title: "引用", kind: "blockquote" },
  { iconLabel: "Table", textLabel: "表", title: "表を挿入", kind: "table" },
  { iconLabel: "Add table row", textLabel: "行を追加", title: "選択中の行の下に行を追加", kind: "addTableRow" },
  { iconLabel: "Add table column", textLabel: "列を追加", title: "選択中の列の右に列を追加", kind: "addTableColumn" },
];
const toolbarActions = $derived(
  toolbarPreset === "email"
    ? allToolbarActions.filter((action) => action.kind !== "table" && action.kind !== "addTableRow" && action.kind !== "addTableColumn")
    : allToolbarActions,
);

onMount(() => {
  if (rootElement === null) {
    return;
  }
  const editorRoot = rootElement;

  const instance = Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, editorRoot);
      ctx.set(defaultValueCtx, markdown);
      ctx
        .get(listenerCtx)
        .markdownUpdated((listenerContext, serializedMarkdown) => {
          const nextMarkdown = normalizeMarkdown(serializedMarkdown);
          editorMarkdown = nextMarkdown;
          value = nextMarkdown;
          lastAppliedValue = nextMarkdown;
          syncToolbarStyles(listenerContext);
          if (!applyingExternalValue) {
            onMarkdownChange?.(nextMarkdown);
          }
        });
    })
    .use(commonmark)
    .use(gfm)
    .use(history)
    .use(listener);

  void instance.create().then(() => {
    editor = instance;
    syncToolbarStyles(instance.ctx);
  });

  let toolbarSyncFrame: number | null = null;
  const scheduleToolbarSync = () => {
    if (toolbarSyncFrame !== null) {
      cancelAnimationFrame(toolbarSyncFrame);
    }
    toolbarSyncFrame = requestAnimationFrame(() => {
      toolbarSyncFrame = null;
      syncToolbarStyles(instance.ctx);
    });
  };
  const handleSelectionChange = () => {
    const selection = document.getSelection();
    const anchorNode = selection?.anchorNode;
    if (anchorNode !== null && anchorNode !== undefined && editorRoot.contains(anchorNode)) {
      scheduleToolbarSync();
    }
  };
  document.addEventListener("selectionchange", handleSelectionChange);
  editorRoot.addEventListener("pointerup", scheduleToolbarSync);
  editorRoot.addEventListener("keyup", scheduleToolbarSync);

  return () => {
    if (toolbarSyncFrame !== null) {
      cancelAnimationFrame(toolbarSyncFrame);
    }
    document.removeEventListener("selectionchange", handleSelectionChange);
    editorRoot.removeEventListener("pointerup", scheduleToolbarSync);
    editorRoot.removeEventListener("keyup", scheduleToolbarSync);
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
  const currentEditor = editor;
  if (currentEditor === null) {
    return;
  }

  if (action.kind === "heading") {
    currentEditor.action(callCommand(wrapInHeadingCommand.key, action.level));
  } else if (action.kind === "strong") {
    currentEditor.action(callCommand(toggleStrongCommand.key));
  } else if (action.kind === "emphasis") {
    currentEditor.action(callCommand(toggleEmphasisCommand.key));
  } else if (action.kind === "bulletList" || action.kind === "orderedList") {
    toggleList(currentEditor, action.kind);
  } else if (action.kind === "table") {
    currentEditor.action(callCommand(insertTableCommand.key, { row: 3, col: 3 }));
  } else if (action.kind === "addTableRow") {
    currentEditor.action(callCommand(addRowAfterCommand.key));
  } else if (action.kind === "addTableColumn") {
    currentEditor.action(callCommand(addColAfterCommand.key));
  } else {
    currentEditor.action(callCommand(wrapInBlockquoteCommand.key));
  }

  queueMicrotask(() => syncToolbarStyles(currentEditor.ctx));
}

function syncToolbarStyles(ctx: Ctx): void {
  const state = ctx.get(editorViewCtx)?.state;
  if (state === undefined) {
    return;
  }
  const styles: string[] = [];
  const marks = state.storedMarks ?? state.selection.$from.marks();
  const hasMark = (markType: ReturnType<typeof strongSchema.type>) =>
    state.selection.empty ? marks.some((mark) => mark.type === markType) : state.doc.rangeHasMark(state.selection.from, state.selection.to, markType);

  if (hasMark(strongSchema.type(ctx))) styles.push("strong");
  if (hasMark(emphasisSchema.type(ctx))) styles.push("emphasis");

  for (let depth = state.selection.$from.depth; depth > 0; depth -= 1) {
    const node = state.selection.$from.node(depth);
    if (node.type === headingSchema.type(ctx)) styles.push(`heading:${node.attrs.level}`);
    if (node.type === bulletListSchema.type(ctx)) styles.push("bulletList");
    if (node.type === orderedListSchema.type(ctx)) styles.push("orderedList");
    if (node.type === blockquoteSchema.type(ctx)) styles.push("blockquote");
    if (node.type === tableSchema.type(ctx)) styles.push("table");
  }

  activeToolbarStyles = styles;
}

function isToolbarActionActive(action: ToolbarAction): boolean {
  if (action.kind === "heading") {
    return activeToolbarStyles.includes(`heading:${action.level}`);
  }
  return activeToolbarStyles.includes(action.kind);
}

export function insertMarkdown(text: string): void {
  if (editor === null) return;

  const view = editor.ctx.get(editorViewCtx);
  const { from, to } = view.state.selection;
  view.dispatch(view.state.tr.insertText(text, from, to));
  view.focus();
}
</script>

<div class="grid gap-2">
  {#if name !== undefined}
    <input type="hidden" {name} {value} />
  {/if}
  <div class="flex flex-wrap items-center justify-between gap-2">
    <p id={`${id}-label`} class="text-sm font-medium">{label}</p>
    {@render headerActions?.()}
  </div>
  <div class="overflow-hidden rounded-lg border border-input bg-background">
    <div class="flex flex-wrap gap-1 border-b bg-muted/40 p-2">
      {#each toolbarActions as action (action.title)}
        <Button
          type="button"
          variant={isToolbarActionActive(action) ? "secondary" : "ghost"}
          size={toolbarMode === "icon" ? "icon-sm" : "sm"}
          class={isToolbarActionActive(action) ? "ring-1 ring-border shadow-xs" : undefined}
          title={action.title}
          aria-label={action.title}
          aria-pressed={isToolbarActionActive(action)}
          onmousedown={(event) => event.preventDefault()}
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
            {:else if action.kind === "table"}
              <Table2Icon aria-hidden="true" />
            {:else if action.kind === "addTableRow"}
              <PlusIcon aria-hidden="true" />
            {:else if action.kind === "addTableColumn"}
              <PlusIcon aria-hidden="true" />
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
    font-synthesis: weight style;
    outline: none;
  }

  :global(.milkdown-markdown-editor .ProseMirror > * + *) {
    margin-top: 0.75rem;
  }

  :global(.milkdown-markdown-editor .ProseMirror h2) {
    font-size: 1.1rem;
    font-weight: 600;
  }

  :global(.milkdown-markdown-editor .ProseMirror h3) {
    font-size: 1rem;
    font-weight: 600;
  }

  :global(.milkdown-markdown-editor .ProseMirror strong) {
    font-weight: 800;
  }

  :global(.milkdown-markdown-editor .ProseMirror em) {
    font-style: oblique;
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

  :global(.milkdown-markdown-editor .ProseMirror table) {
    width: 100%;
    border-collapse: collapse;
  }

  :global(.milkdown-markdown-editor .ProseMirror th),
  :global(.milkdown-markdown-editor .ProseMirror td) {
    min-width: 6rem;
    border: 1px solid var(--border);
    padding: 0.5rem;
    text-align: left;
    vertical-align: top;
  }

  :global(.milkdown-markdown-editor .ProseMirror th) {
    background: var(--muted);
    font-weight: 700;
  }
</style>
