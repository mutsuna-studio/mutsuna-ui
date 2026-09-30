import type { Snippet } from "svelte";
import type { Extension } from "@codemirror/state";

export type CodeEditorLanguage = "text" | "javascript" | "typescript" | "json";
export interface CodeEditorProps {
  value?: string;
  language?: CodeEditorLanguage;
  /** Show the integrated language label and controls. */
  toolbar?: boolean;
  /** Show the copy button. Copies the modified value for CodeDiff. */
  copyable?: boolean;
  /** Additional application controls, rendered inside the header. */
  actions?: Snippet;
  extensions?: Extension[];
  readonly?: boolean;
  disabled?: boolean;
  lineNumbers?: boolean;
  lineWrapping?: boolean;
  placeholder?: string;
  /** Accessible name of the editing surface. */
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  class?: string;
  /** CSS height, e.g. 16rem. */
  height?: string;
  onchange?: (value: string) => void;
}

export type CodeDiffMode = "split" | "unified";
export interface CodeDiffProps extends CodeEditorProps {
  /** Fixed baseline. Updates from the parent are supported. */
  original: string;
  mode?: CodeDiffMode;
  originalLabel?: string;
  modifiedLabel?: string;
}
