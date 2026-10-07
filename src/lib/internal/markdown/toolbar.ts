import type { Editor } from "@milkdown/kit/core";
import { editorViewCtx } from "@milkdown/kit/core";
import type { Ctx } from "@milkdown/kit/ctx";
import { callCommand } from "@milkdown/kit/utils";
import { toggleList } from "../../markdown/markdown-list-commands.js";
import {
  blockquoteSchema,
  bulletListSchema,
  emphasisSchema,
  headingSchema,
  orderedListSchema,
  strongSchema,
  toggleEmphasisCommand,
  toggleStrongCommand,
  wrapInBlockquoteCommand,
  wrapInHeadingCommand,
} from "@milkdown/kit/preset/commonmark";
import { addColAfterCommand, addRowAfterCommand, insertTableCommand, tableSchema } from "@milkdown/kit/preset/gfm";

export type ToolbarAction =
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

export const allToolbarActions: readonly ToolbarAction[] = [
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
export function executeToolbarAction(currentEditor: Editor, action: ToolbarAction): void {
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
}

export function getToolbarStyles(ctx: Ctx): readonly string[] {
  const state = ctx.get(editorViewCtx)?.state;
  if (state === undefined) {
    return [];
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

  return styles;
}
