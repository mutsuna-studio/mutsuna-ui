<script lang="ts">
  import { onMount, untrack } from "svelte";
  import type { EditorState } from "@codemirror/state";
  import EditorToolbar from "./editor-toolbar.svelte";
  import type { CodeDiffProps } from "./types.js";
  import type { createDiff } from "./diff-runtime.js";

  let { original, value = $bindable(""), mode = $bindable("split"), originalLabel = "変更前", modifiedLabel = "変更後",
    language = "text", extensions = [], toolbar = true, copyable = true, actions, readonly = false, disabled = false,
    lineNumbers = true, lineWrapping = false, placeholder = "",
    "aria-label": ariaLabel = "コード差分", "aria-describedby": describedBy, "aria-invalid": invalid = false,
    class: className = "", height = "20rem", onchange }: CodeDiffProps = $props();
  let host: HTMLDivElement;
  let factory = $state.raw<typeof import("./diff-runtime.js")>();
  let editor = $state.raw<ReturnType<typeof createDiff>>();
  let failure = $state(false);
  let previous: EditorState | undefined;

  onMount(() => {
    let disposed = false;
    void import("./diff-runtime.js").then((module) => { if (!disposed) factory = module; })
      .catch(() => { if (!disposed) failure = true; });
    return () => { disposed = true; };
  });
  $effect(() => {
    if (!factory) return;
    const runtime = factory, selectedMode = mode, selectedLanguage = language;
    let disposed = false;
    let current: ReturnType<typeof createDiff> | undefined;
    // Deletion widgets cache their highlighted DOM when constructed. Load grammar first.
    void runtime.loadLanguage(selectedLanguage).then((prepared) => {
      if (disposed) return;
      current = untrack(() => runtime.createDiff(host, original, value, selectedMode,
        (next) => { value = next; onchange?.(next); }, previous, prepared));
      editor = current;
    }).catch(() => { if (!disposed) failure = true; });
    return () => {
      disposed = true;
      if (current) { previous = current.view.state; current.destroy(); }
      editor = undefined;
    };
  });
  $effect(() => {
    editor?.configure({ language, extensions, readonly, disabled, lineNumbers, lineWrapping, placeholder,
      ariaLabel, describedBy, invalid }, `${ariaLabel}: ${originalLabel}`, `${ariaLabel}: ${modifiedLabel}`);
  });
  $effect(() => { editor?.setValues(original, value); });
</script>

<div data-slot="code-diff" class="code-diff {className}" data-mode={mode}
  data-invalid={invalid || undefined} data-disabled={disabled || undefined} style:--diff-height={height}>
  {#if toolbar}<EditorToolbar {language} {value} {disabled} {copyable} {actions} {mode} onmodechange={(next) => mode = next} />{/if}
  <div bind:this={host}></div>
  {#if !editor}
    <div class="fallback"><div class="fallback-pane" role="textbox" aria-label={originalLabel} aria-readonly="true" aria-multiline="true" aria-disabled={disabled} tabindex={disabled ? -1 : 0}>{original}</div><div class="fallback-pane" role="textbox" aria-label={modifiedLabel} aria-readonly="true" aria-multiline="true" aria-disabled={disabled} tabindex={disabled ? -1 : 0}>{value}</div></div>
    {#if failure}<p role="alert">差分エディタを読み込めませんでした。ページを再読み込みしてください。</p>{/if}
  {/if}
</div>

<style>
  .code-diff { min-width: 0; overflow: hidden; border: 1px solid var(--input); border-radius: var(--radius); background: var(--background); color: var(--foreground); }
  .code-diff:focus-within { border-color: var(--ring); }
  .code-diff[data-invalid] { border-color: var(--destructive); background: color-mix(in oklab, var(--destructive) 5%, transparent); }
  .code-diff[data-disabled] { background: var(--muted); }
  .code-diff[data-disabled] :global(.cm-editor) { opacity: .5; }
  .code-diff :global(.cm-mergeView) { height: var(--diff-height); overflow: auto; }
  .code-diff :global(.cm-mergeViewEditors) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); min-height: 100%; }
  .code-diff :global(.cm-mergeViewEditor) { min-width: 0; }
  .code-diff[data-mode="split"] :global(.cm-editor),
  .code-diff[data-mode="split"] :global(.cm-scroller) { min-height: var(--diff-height); }
  .code-diff[data-mode="split"] :global(.cm-gutters) { height: auto; align-self: stretch; }
  .code-diff :global(.cm-mergeViewEditor + .cm-mergeViewEditor) { border-left: 1px solid var(--border); }
  .code-diff[data-mode="unified"] :global(.cm-editor) { height: var(--diff-height); }
  .fallback { display: flex; height: var(--diff-height); overflow: auto; }
  .fallback-pane { flex: 1; min-width: 0; overflow: auto; padding: .75rem; margin: 0; white-space: pre; font-family: monospace; }
</style>
