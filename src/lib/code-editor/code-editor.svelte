<script lang="ts">
  import { onMount } from "svelte";
  import EditorToolbar from "./editor-toolbar.svelte";
  import type { CodeEditorProps } from "./types.js";

  let {
    value = $bindable(""), language = "text", extensions = [], toolbar = true, copyable = true, actions, readonly = false,
    disabled = false, lineNumbers = true, lineWrapping = false, placeholder = "",
    "aria-label": ariaLabel = "コード", "aria-describedby": describedBy,
    "aria-invalid": invalid = false, class: className = "", height = "16rem", onchange,
  }: CodeEditorProps = $props();
  let host: HTMLDivElement;
  let failure = $state(false);
  let ready = $state(false);
  let destroy: (() => void) | undefined;
  let configure: (() => void) | undefined;
  let sync: (() => void) | undefined;

  onMount(() => {
    let disposed = false;
    void import("./runtime.js").then(({ createEditor }) => {
      if (disposed) return;
      const editor = createEditor(host, value, (next) => { value = next; onchange?.(next); });
      destroy = editor.destroy;
      configure = () => editor.configure({ language, extensions, readonly, disabled,
        lineNumbers, lineWrapping, placeholder, ariaLabel, describedBy, invalid });
      sync = () => editor.setValue(value);
      configure();
      ready = true;
    }).catch(() => { if (!disposed) failure = true; });
    return () => { disposed = true; destroy?.(); };
  });
  $effect(() => {
    if (ready) {
      // Read reactive settings inside configure so changes preserve the EditorState/history.
      configure?.();
    }
  });
  $effect(() => { if (ready) sync?.(); });
</script>

<div data-slot="code-editor" class="code-editor {className}" data-disabled={disabled || undefined}
  data-invalid={invalid || undefined} style:--editor-height={height}>
  {#if toolbar}<EditorToolbar {language} {value} {disabled} {copyable} {actions} />{/if}
  <div bind:this={host}></div>
  {#if !ready}
    <div class="fallback" role="textbox" aria-label={ariaLabel} aria-readonly="true" aria-multiline="true" aria-disabled={disabled} tabindex={disabled ? -1 : 0}>{value}</div>
    {#if failure}<p role="alert">コードエディタを読み込めませんでした。ページを再読み込みしてください。</p>{/if}
  {/if}
</div>

<style>
  .code-editor { min-width: 0; overflow: hidden; border: 1px solid var(--input); border-radius: var(--radius); background: var(--background); color: var(--foreground); }
  .code-editor:focus-within { border-color: var(--ring); background: color-mix(in oklab, var(--ring) 4%, transparent); }
  .code-editor[data-invalid] { border-color: var(--destructive); background: color-mix(in oklab, var(--destructive) 5%, transparent); }
  .code-editor[data-disabled] { background: var(--muted); }
  .code-editor[data-disabled] :global(.cm-editor) { opacity: .5; }
  .fallback { height: var(--editor-height); margin: 0; padding: .75rem; overflow: auto; white-space: pre; font-family: monospace; }
  .code-editor :global(.cm-editor) { height: var(--editor-height); }
</style>
