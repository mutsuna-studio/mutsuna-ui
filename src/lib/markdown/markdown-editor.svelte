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
</script>

<script lang="ts">
import { Editor, defaultValueCtx, editorViewCtx, editorViewOptionsCtx, rootCtx, serializerCtx } from "@milkdown/kit/core";
import type { Ctx } from "@milkdown/kit/ctx";
import { history } from "@milkdown/kit/plugin/history";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { gfm } from "@milkdown/kit/preset/gfm";
import "@milkdown/kit/prose/view/style/prosemirror.css";
import { replaceAll } from "@milkdown/kit/utils";
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
import { startEditorLifecycle } from "../internal/markdown/lifecycle.js";
import { allToolbarActions, executeToolbarAction, getToolbarStyles, type ToolbarAction } from "../internal/markdown/toolbar.js";

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
let failed = $state(false);
let lastAppliedValue = $state<string | null>(null);
let activeToolbarStyles = $state<readonly string[]>([]);

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
  const initialValue = value;
  let disposed = false;

  const instance = Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, editorRoot);
      ctx.set(defaultValueCtx, initialValue);
      ctx.set(editorViewOptionsCtx, {
        attributes: {
          "aria-labelledby": `${id}-label`,
        },
      });
      ctx
        .get(listenerCtx)
        .markdownUpdated((listenerContext, serializedMarkdown) => {
          if (disposed || editor === null) return;
          const nextMarkdown = normalizeMarkdown(serializedMarkdown);
          // The listener is debounced. Ignore a queued update from before an external replacement.
          const view = listenerContext.get(editorViewCtx);
          const currentMarkdown = normalizeMarkdown(listenerContext.get(serializerCtx)(view.state.doc));
          if (nextMarkdown !== currentMarkdown) return;
          value = nextMarkdown;
          lastAppliedValue = nextMarkdown;
          syncToolbarStyles(listenerContext);
          onMarkdownChange?.(nextMarkdown);
        });
    })
    .use(commonmark)
    .use(gfm)
    .use(history)
    .use(listener);

  const stopEditor = startEditorLifecycle(instance, () => {
    lastAppliedValue = initialValue;
    editor = instance;
    syncToolbarStyles(instance.ctx);
  }, () => { failed = true; editor = null; });

  let toolbarSyncFrame: number | null = null;
  const scheduleToolbarSync = () => {
    if (disposed || editor === null) return;
    if (toolbarSyncFrame !== null) {
      cancelAnimationFrame(toolbarSyncFrame);
    }
    toolbarSyncFrame = requestAnimationFrame(() => {
      toolbarSyncFrame = null;
      if (!disposed && editor !== null) syncToolbarStyles(instance.ctx);
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
    disposed = true;
    if (toolbarSyncFrame !== null) {
      cancelAnimationFrame(toolbarSyncFrame);
    }
    document.removeEventListener("selectionchange", handleSelectionChange);
    editorRoot.removeEventListener("pointerup", scheduleToolbarSync);
    editorRoot.removeEventListener("keyup", scheduleToolbarSync);
    editor = null;
    stopEditor();
  };
});

$effect(() => {
  if (editor === null || value === lastAppliedValue) {
    return;
  }

  lastAppliedValue = value;
  editor.action(replaceAll(value, true));
  syncToolbarStyles(editor.ctx);
});

function runToolbarAction(action: ToolbarAction): void {
  if (!editor) return;
  executeToolbarAction(editor, action);
  queueMicrotask(() => { if (editor) syncToolbarStyles(editor.ctx); });
}

function syncToolbarStyles(ctx: Ctx): void {
  activeToolbarStyles = getToolbarStyles(ctx);
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
          disabled={editor === null}
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
    {#if failed}<p role="alert" class="px-4 py-3 text-sm text-destructive">エディターを読み込めませんでした。</p>{/if}
    <div {id} bind:this={rootElement} hidden={failed} class="milkdown-markdown-editor {minHeightClass} px-4 py-3 text-sm"></div>
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
