<script lang="ts">
  import { mergeProps } from "bits-ui";
  import { onDestroy, type Snippet } from "svelte";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import ColumnsIcon from "@lucide/svelte/icons/columns-2";
  import RowsIcon from "@lucide/svelte/icons/rows-2";
  import CheckIcon from "@lucide/svelte/icons/check";
  import { Button } from "../button/index.js";
  import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "../tooltip/index.js";
  import { ButtonGroup } from "../button-group/index.js";
  import type { CodeEditorLanguage, CodeDiffMode } from "./types.js";

  let { language, value, disabled = false, copyable = true, actions, mode, onmodechange }:
    { language: CodeEditorLanguage; value: string; disabled?: boolean; copyable?: boolean;
      actions?: Snippet; mode?: CodeDiffMode; onmodechange?: (mode: CodeDiffMode) => void } = $props();
  const labels = { text: "Plain text", javascript: "JavaScript", typescript: "TypeScript", json: "JSON" };
  let status = $state("");
  let copied = $state(false);
  let copying = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  onDestroy(() => { disposed = true; clearTimeout(timer); });
  async function copy() {
    if (disabled || copying) return;
    copying = true;
    clearTimeout(timer);
    try {
      await navigator.clipboard.writeText(value);
      if (disposed) return;
      copied = true;
      status = "コピーしました";
    } catch {
      if (disposed) return;
      copied = false;
      status = "コピーできませんでした";
    } finally { if (!disposed) copying = false; }
    timer = setTimeout(() => { copied = false; status = ""; }, 2500);
  }
</script>

<TooltipProvider>
<div class="editor-toolbar" data-slot="code-editor-toolbar">
  <span class="language">{labels[language]}</span>
  <div class="actions">
    {#if mode && onmodechange}
      <ButtonGroup aria-label="差分の表示形式">
        {#each [{ value: "split", label: "左右比較", icon: ColumnsIcon }, { value: "unified", label: "統合表示", icon: RowsIcon }] as option}
          <Tooltip>
            <TooltipTrigger>
              {#snippet child({ props })}
                <Button {...mergeProps(props, { onclick: () => onmodechange?.(option.value as CodeDiffMode) })} size="icon-sm" variant="outline" icon={option.icon} aria-label={option.label} class="mode-button" {disabled}
                  aria-pressed={mode === option.value} />
              {/snippet}
            </TooltipTrigger>
            <TooltipContent role="tooltip">{option.label}</TooltipContent>
          </Tooltip>
        {/each}
      </ButtonGroup>
    {/if}
    {@render actions?.()}
    {#if copyable}
      <Tooltip>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button {...mergeProps(props, { onclick: copy })} size="icon-sm" variant="ghost" icon={copied ? CheckIcon : CopyIcon}
              disabled={disabled || copying} aria-label="コードをコピー" />
          {/snippet}
        </TooltipTrigger>
        <TooltipContent role="tooltip">{copied ? "コピーしました" : "コードをコピー"}</TooltipContent>
      </Tooltip>
    {/if}
  </div>
  <span class="status" class:status-hidden={copied || !status} role="status">{status}</span>
</div>
</TooltipProvider>

<style>
  .editor-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; padding: .625rem .75rem; border-bottom: 1px solid var(--border); background: color-mix(in oklab, var(--muted) 45%, var(--background)); }
  .editor-toolbar :global(.mode-button) { color: var(--muted-foreground); background: transparent; font-size: .75rem; }
  .editor-toolbar :global(.mode-button[aria-pressed="true"]) { color: var(--foreground); background: var(--background); border-color: var(--border); box-shadow: 0 1px 2px #0000000d; }
  .editor-toolbar :global(.mode-button:focus-visible) { border-color: var(--ring); }
  .language { color: var(--muted-foreground); font-size: .75rem; }
  .actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: .375rem; margin-left: auto; min-width: 0; }
  .status { color: var(--destructive); font-size: .75rem; width: 100%; }
  .status-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
