import { ChangeSet, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { MergeView, unifiedMergeView, originalDocChangeEffect, getOriginalDoc } from "@codemirror/merge";
import { createEditorSetup, type Settings, type PreparedLanguage } from "./runtime.js";
export { loadLanguage } from "./runtime.js";
import type { CodeDiffMode } from "./types.js";

const diffTheme = EditorView.theme({
  ".cm-scroller": { fontSize: "13px", lineHeight: "1.75" },
  ".cm-content": { padding: "12px 0" },
  "&.cm-editor .cm-gutters": { backgroundColor: "transparent", borderRight: "none" },
  // Paint the divider in the marker track, so changes replace it without a horizontal offset.
  ".cm-changeGutter": {
    width: "3px", paddingLeft: "1px",
    backgroundImage: "linear-gradient(to right, transparent 1px, var(--border) 1px)",
  },
  ".cm-lineNumbers .cm-gutterElement": { paddingLeft: "8px", paddingRight: "8px" },
  ".cm-changedText, .cm-deletedText": { borderRadius: "2px" },
  "&.cm-merge-a .cm-changedLine, .cm-deletedChunk": { backgroundColor: "color-mix(in oklab, var(--destructive) 7%, transparent)" },
  "&.cm-merge-b .cm-changedLine, .cm-inlineChangedLine": { backgroundColor: "color-mix(in oklab, var(--success) 9%, transparent)" },
  "&.cm-merge-a .cm-changedText, .cm-deletedChunk .cm-deletedText, &.cm-merge-b .cm-deletedText": { background: "color-mix(in oklab, var(--destructive) 20%, transparent)" },
  "&.cm-merge-b .cm-changedText": { background: "color-mix(in oklab, var(--success) 20%, transparent)" },
  "&.cm-merge-a .cm-changedLineGutter, .cm-deletedLineGutter": { background: "var(--destructive)" },
  "&.cm-merge-b .cm-changedLineGutter, .cm-inlineChangedLineGutter": { background: "var(--success)" },
});

export function createDiff(parent: HTMLElement, original: string, value: string, mode: CodeDiffMode,
  onchange: (value: string) => void, previous?: EditorState, prepared?: PreparedLanguage) {
  const after = createEditorSetup(value, onchange, previous, prepared);
  if (mode === "split") {
    const before = createEditorSetup(original, () => {}, undefined, prepared);
    const merge = new MergeView({ parent,
      a: { ...before.config, extensions: [...before.config.extensions, diffTheme, EditorState.readOnly.of(true)] },
      b: { ...after.config, extensions: [...after.config.extensions, diffTheme] },
      gutter: true, highlightChanges: true,
    });
    const a = before.connect(merge.a), b = after.connect(merge.b);
    return {
      view: merge.b,
      configure(options: Settings, originalLabel: string, modifiedLabel: string) {
        a.configure({ ...options, extensions: [], readonly: true, ariaLabel: originalLabel });
        b.configure({ ...options, ariaLabel: modifiedLabel });
      },
      setValues(baseline: string, next: string) { a.setValue(baseline); b.setValue(next); },
      destroy() { a.destroy(false); b.destroy(false); merge.destroy(); },
    };
  }
  const view = new EditorView({ parent, ...after.config, extensions: [
    ...after.config.extensions, diffTheme,
    unifiedMergeView({ original, gutter: true, highlightChanges: true, mergeControls: false }),
  ] });
  const editor = after.connect(view);
  return {
    view,
    configure(options: Settings, _originalLabel: string, modifiedLabel: string) {
      editor.configure({ ...options, ariaLabel: modifiedLabel });
    },
    setValues(baseline: string, next: string) {
      const old = getOriginalDoc(view.state);
      if (old.toString() !== baseline) {
        view.dispatch({ effects: originalDocChangeEffect(view.state, ChangeSet.of({ from: 0, to: old.length, insert: baseline }, old.length)) });
      }
      editor.setValue(next);
    },
    destroy() { editor.destroy(); },
  };
}
