import { Compartment, EditorState, Transaction, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, placeholder, drawSelection } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, historyField } from "@codemirror/commands";
import { HighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching } from "@codemirror/language";
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { tags } from "@lezer/highlight";
import type { CodeEditorLanguage } from "./types.js";

export interface Settings {
  language: CodeEditorLanguage; extensions: Extension[]; readonly: boolean; disabled: boolean;
  lineNumbers: boolean; lineWrapping: boolean; placeholder: string;
  ariaLabel: string; describedBy?: string; invalid: boolean;
}
const theme = EditorView.theme({
  "&": { backgroundColor: "transparent", color: "var(--foreground)" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { overflow: "auto", fontFamily: "var(--font-mono, monospace)", fontSize: "14px" },
  ".cm-content": { padding: "8px 0", caretColor: "var(--foreground)" },
  ".cm-gutters": { backgroundColor: "var(--muted)", color: "var(--muted-foreground)", borderRight: "1px solid var(--border)" },
  ".cm-cursor": { borderLeftColor: "var(--foreground)" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground": { backgroundColor: "color-mix(in oklab, var(--primary) 25%, transparent)" },
  ".cm-content::selection, .cm-content ::selection": { color: "var(--foreground)" },
  ".cm-tooltip": { backgroundColor: "var(--popover)", color: "var(--popover-foreground)", border: "1px solid var(--border)" },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": { backgroundColor: "var(--accent)", color: "var(--accent-foreground)" },
});

export interface PreparedLanguage { name: CodeEditorLanguage; extension: Extension; }
export async function loadLanguage(name: CodeEditorLanguage): Promise<PreparedLanguage> {
  try {
    const extension = name === "json" ? (await import("@codemirror/lang-json")).json()
      : name === "text" ? [] : (await import("@codemirror/lang-javascript")).javascript({ typescript: name === "typescript" });
    return { name, extension };
  } catch { return { name, extension: [] }; }
}

export function createEditorSetup(value: string, onchange: (value: string) => void, previous?: EditorState,
  prepared?: PreparedLanguage) {
  const settings = new Compartment();
  const language = new Compartment();
  let currentLanguage: CodeEditorLanguage | undefined = prepared?.name;
  let generation = 0;
  let destroyed = false;
  const previousHistory = previous?.field(historyField);
  const config = { doc: previous?.doc ?? value, selection: previous?.selection, extensions: [
    theme, history(), previousHistory ? historyField.init(() => previousHistory) : [], drawSelection(), indentOnInput(), bracketMatching(), closeBrackets(), autocompletion(),
    syntaxHighlighting(HighlightStyle.define([
      { tag: tags.keyword, color: "var(--primary)", fontWeight: "600" },
      { tag: [tags.string, tags.regexp], color: "var(--foreground)", fontStyle: "italic" },
      { tag: [tags.number, tags.bool, tags.null], color: "var(--primary)" },
      { tag: tags.comment, color: "var(--muted-foreground)", fontStyle: "italic" },
      { tag: [tags.typeName, tags.className], color: "var(--foreground)", fontWeight: "600" },
      { tag: tags.invalid, textDecoration: "underline wavy var(--destructive)" },
    ]), { fallback: true }),
    keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...completionKeymap]),
    settings.of([]), language.of(prepared?.extension ?? []),
    EditorView.updateListener.of((update) => {
      if (update.transactions.some((tr) => tr.docChanged && !tr.annotation(Transaction.remote))) onchange(update.state.doc.toString());
    }),
  ] };
  return { config, connect(view: EditorView) {
  return {
    view,
    destroy(disposeView = true) { destroyed = true; generation++; if (disposeView) view.destroy(); },
    setValue(next: string) {
      const old = view.state.doc.toString();
      if (old === next) return;
      let from = 0;
      while (from < old.length && from < next.length && old[from] === next[from]) from++;
      let end = old.length, nextEnd = next.length;
      while (end > from && nextEnd > from && old[end - 1] === next[nextEnd - 1]) { end--; nextEnd--; }
      view.dispatch({ changes: { from, to: end, insert: next.slice(from, nextEnd) }, annotations: [Transaction.remote.of(true), Transaction.addToHistory.of(false)] });
    },
    configure(options: Settings) {
      view.dispatch({ effects: settings.reconfigure([
        EditorState.readOnly.of(options.readonly || options.disabled), EditorView.editable.of(!options.disabled),
        EditorView.contentAttributes.of({ "aria-label": options.ariaLabel, "aria-readonly": String(options.readonly || options.disabled),
          "aria-disabled": String(options.disabled), "aria-invalid": String(options.invalid),
          ...(options.describedBy ? { "aria-describedby": options.describedBy } : {}) }),
        options.lineNumbers ? lineNumbers() : [], options.lineWrapping ? EditorView.lineWrapping : [],
        placeholder(options.placeholder), options.extensions,
      ]) });
      if (options.language === currentLanguage) return;
      currentLanguage = options.language;
      const ticket = ++generation;
      view.dispatch({ effects: language.reconfigure([]) });
      void loadLanguage(options.language).then(({ extension }) => {
        if (ticket === generation && !destroyed) view.dispatch({ effects: language.reconfigure(extension) });
      });
    },
  };
  } };
}

export function createEditor(parent: HTMLElement, value: string, onchange: (value: string) => void) {
  const setup = createEditorSetup(value, onchange);
  return setup.connect(new EditorView({ parent, ...setup.config }));
}
