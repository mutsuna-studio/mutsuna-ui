import { type Editor, editorViewCtx } from "@milkdown/kit/core";
import { bulletListSchema, liftListItemCommand, listItemSchema, orderedListSchema } from "@milkdown/kit/preset/commonmark";
import { autoJoin } from "@milkdown/kit/prose/commands";
import type { NodeType, Node as ProseMirrorNode } from "@milkdown/kit/prose/model";
import { wrapInList } from "@milkdown/kit/prose/schema-list";
import type { EditorState } from "@milkdown/kit/prose/state";
import { callCommand } from "@milkdown/kit/utils";

export type ListKind = "bulletList" | "orderedList";

type ActiveList = {
  readonly kind: ListKind;
  readonly node: ProseMirrorNode;
  readonly pos: number;
};

export function toggleList(editor: Editor, kind: ListKind): void {
  const view = editor.ctx.get(editorViewCtx);
  const bulletListType = bulletListSchema.type(editor.ctx);
  const orderedListType = orderedListSchema.type(editor.ctx);
  const activeList = findActiveList(view.state, bulletListType, orderedListType);

  if (activeList?.kind === kind) {
    editor.action(callCommand(liftListItemCommand.key));
    return;
  }
  if (activeList !== null) {
    switchActiveListKind(editor, kind);
    return;
  }

  wrapSelectionInList(editor, kind);
}

function switchActiveListKind(editor: Editor, kind: ListKind): void {
  editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const bulletListType = bulletListSchema.type(ctx);
    const orderedListType = orderedListSchema.type(ctx);
    const activeList = findActiveList(view.state, bulletListType, orderedListType);
    if (activeList === null) {
      return;
    }

    const targetListType = kind === "bulletList" ? bulletListType : orderedListType;
    const listItemType = listItemSchema.type(ctx);
    const command = autoJoin(
      (state, dispatch) => {
        const attrs = kind === "bulletList" ? { spread: activeList.node.attrs.spread } : { order: 1, spread: activeList.node.attrs.spread };
        let transaction = state.tr.setNodeMarkup(activeList.pos, targetListType, attrs);

        let itemNumber = 1;
        activeList.node.forEach((listItem, offset) => {
          if (listItem.type !== listItemType) {
            return;
          }

          transaction = transaction.setNodeMarkup(activeList.pos + 1 + offset, undefined, {
            ...listItem.attrs,
            label: kind === "bulletList" ? "•" : `${itemNumber}.`,
            listType: kind === "bulletList" ? "bullet" : "ordered",
          });
          itemNumber += 1;
        });
        dispatch?.(transaction.scrollIntoView());
        return true;
      },
      [targetListType.name],
    );

    command(view.state, view.dispatch, view);
    view.focus();
  });
}

function findActiveList(state: EditorState, bulletListType: NodeType, orderedListType: NodeType): ActiveList | null {
  const selectionFrom = state.selection.$from;
  for (let depth = selectionFrom.depth; depth > 0; depth -= 1) {
    const node = selectionFrom.node(depth);
    if (node.type === bulletListType || node.type === orderedListType) {
      return {
        kind: node.type === bulletListType ? "bulletList" : "orderedList",
        node,
        pos: selectionFrom.before(depth),
      };
    }
  }

  let activeList: ActiveList | null = null;
  state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
    if (activeList !== null || (node.type !== bulletListType && node.type !== orderedListType)) {
      return activeList === null;
    }

    activeList = {
      kind: node.type === bulletListType ? "bulletList" : "orderedList",
      node,
      pos,
    };
    return false;
  });
  return activeList;
}

function wrapSelectionInList(editor: Editor, kind: ListKind): void {
  editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const targetListType = kind === "bulletList" ? bulletListSchema.type(ctx) : orderedListSchema.type(ctx);
    const command = autoJoin(wrapInList(targetListType), [targetListType.name]);
    command(view.state, view.dispatch, view);
    view.focus();
  });
}
