# CodeEditorとCodeDiff

[ガイド一覧](../README.md)

## Code editor

```svelte
<script lang="ts">
  import { CodeEditor } from '@mutsuna/ui/code-editor';
  let code = $state('console.log("Hello");');
</script>

<CodeEditor bind:value={code} language="javascript" aria-label="JavaScript code" />
```

CodeMirror 6 is loaded on mount; language support is loaded only when selected. Built-in languages: `text` (default), `javascript`, `typescript`, `json`. Use `extensions` for additional CodeMirror language support, completions, decorations, or diagnostics. External value updates preserve the editor instance and map the selection; they do not emit `onchange` or add an undo entry. `onchange` receives edits made in the editor.

`readonly` preserves keyboard focus and selection; `disabled` prevents editing and removes the editor from the tab order. Tab retains normal focus navigation (no keyboard trap). Set `aria-label`, and optionally `aria-describedby` / `aria-invalid`. `height` accepts a CSS length; `lineWrapping` defaults to false and `lineNumbers` to true. The editor uses the shared theme tokens. SSR renders a static code fallback; hydrate the component in Astro with `client:load`.

Code execution, persistence, validation logic, and grading belong to the consuming application. This component never executes input code.

## Code diff

```svelte
<script lang="ts">
  import { CodeDiff } from '@mutsuna/ui/code-editor';
  let modified = $state('const count = 2;');
</script>

<CodeDiff original="const count = 1;" bind:value={modified} language="javascript" mode="split" />
```

`mode="split"` (default) compares two panes; `mode="unified"` displays removed code above the editable replacement. `original` is a fixed baseline, updated only through props. `value` is the editable result; `readonly` locks it while allowing selection. Merge/accept/reject controls are intentionally omitted so the baseline cannot be changed in the UI. `originalLabel` / `modifiedLabel` default to 変更前 / 変更後. The accessible editor names combine `aria-label` with these labels. Standard CodeEditor language, size, error, disabled, wrapping, and extension props also apply; custom extensions attach to the modified side. Switching modes preserves the modified document, selection, and undo history. Use unified mode on narrow screens; the component does not switch modes automatically. The diff runtime is loaded only on mount. In Astro, hydrate with `client:load`.

CodeEditor and CodeDiff include a language label and copy button in their header. `toolbar={false}` hides the header; `copyable={false}` hides only copy. The `actions` snippet adds application buttons. CodeDiff includes split/unified controls; use `bind:mode` to observe changes. Copy uses the current (modified) value and remains available when readonly; disabled prevents built-in controls. Language labels are display-only. `height` applies to the editing area, excluding the header.
