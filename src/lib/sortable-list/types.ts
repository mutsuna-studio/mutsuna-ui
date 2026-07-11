export type SortableListDragHandleProps = {
  draggable: boolean;
  ondragstart: (event: DragEvent) => void;
  ondragend: () => void;
};

export type SortableListControls = {
  dragHandleProps: SortableListDragHandleProps;
  canMoveUp: boolean;
  canMoveDown: boolean;
  moveUp: () => void;
  moveDown: () => void;
  locked: boolean;
};
