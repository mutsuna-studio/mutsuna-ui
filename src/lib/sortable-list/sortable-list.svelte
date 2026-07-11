<script lang="ts" generics="T">
import { flip } from "svelte/animate";
import { cubicOut } from "svelte/easing";
import { onDestroy, type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { cn } from "../utils.js";
import type { SortableListControls } from "./types.js";

type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  items?: T[];
  getKey: (item: T) => string;
  getLabel?: (item: T) => string;
  isLocked?: (item: T) => boolean;
  itemClass?: string;
  swapThreshold?: number;
  animationDuration?: number;
  onReorder?: (items: T[]) => void;
  children: Snippet<[item: T, index: number, controls: SortableListControls]>;
};

let {
  items = $bindable<T[]>([]),
  getKey,
  getLabel = getKey,
  isLocked = () => false,
  itemClass,
  swapThreshold = 1 / 3,
  animationDuration = 180,
  onReorder,
  children,
  class: className,
  ...restProps
}: Props = $props();

let draggedKey = $state<string | null>(null);
let movedKeys = $state<readonly string[]>([]);
let announcement = $state("");
let dragPreview: HTMLElement | null = null;
let dragImagePlaceholder: HTMLElement | null = null;
let dragPreviewOffsetY = 0;
let dragPreviewOriginTop = 0;
let dragPreviewNextY = 0;
let dragPreviewFrame: number | null = null;
let movedKeysTimer: number | null = null;

let normalizedSwapThreshold = $derived(Math.min(0.9, Math.max(0.1, swapThreshold)));

onDestroy(() => {
  cleanupDragPreview();
  if (movedKeysTimer !== null) window.clearTimeout(movedKeysTimer);
});

function commitItems(nextItems: T[]): void {
  items = nextItems;
  onReorder?.(nextItems);
}

function startDrag(event: DragEvent, item: T): void {
  if (isLocked(item)) return;
  const sourceElement = (event.currentTarget as HTMLElement).closest<HTMLElement>("[data-slot=sortable-list-item]");
  if (sourceElement === null || event.dataTransfer === null) return;

  draggedKey = getKey(item);
  event.dataTransfer.setData("text/plain", draggedKey);
  event.dataTransfer.effectAllowed = "move";

  const sourceBounds = sourceElement.getBoundingClientRect();
  dragPreview?.remove();
  dragPreview = sourceElement.cloneNode(true) as HTMLElement;
  dragPreview.dataset.slot = "sortable-list-drag-preview";
  dragPreview.style.width = `${sourceBounds.width}px`;
  dragPreview.style.left = `${sourceBounds.left}px`;
  dragPreview.style.top = `${sourceBounds.top}px`;
  dragPreviewOffsetY = event.clientY - sourceBounds.top;
  dragPreviewOriginTop = sourceBounds.top;
  dragPreviewNextY = sourceBounds.top;
  document.body.append(dragPreview);

  dragImagePlaceholder?.remove();
  dragImagePlaceholder = document.createElement("div");
  dragImagePlaceholder.dataset.slot = "sortable-list-drag-image-placeholder";
  document.body.append(dragImagePlaceholder);
  event.dataTransfer.setDragImage(dragImagePlaceholder, 0, 0);
}

function moveDragPreview(event: DragEvent): void {
  if (dragPreview === null) return;
  dragPreviewNextY = event.clientY - dragPreviewOffsetY;
  if (dragPreviewFrame !== null) return;

  dragPreviewFrame = window.requestAnimationFrame(() => {
    dragPreviewFrame = null;
    if (dragPreview === null) return;
    const offsetY = dragPreviewNextY - dragPreviewOriginTop;
    dragPreview.style.transform = `translate3d(0, ${offsetY}px, 0) rotate(1deg)`;
  });
}

function cleanupDragPreview(): void {
  if (dragPreviewFrame !== null) window.cancelAnimationFrame(dragPreviewFrame);
  dragPreviewFrame = null;
  dragPreview?.remove();
  dragPreview = null;
  dragImagePlaceholder?.remove();
  dragImagePlaceholder = null;
}

function endDrag(): void {
  draggedKey = null;
  cleanupDragPreview();
}

function stabilizeLockedItems(candidateItems: T[]): T[] {
  const movableItems = candidateItems.filter((item) => !isLocked(item));
  let movableIndex = 0;
  return items.map((item) => (isLocked(item) ? item : (movableItems[movableIndex++] ?? item)));
}

function moveDraggedItem(targetItem: T, pointerY: number, targetElement: HTMLElement): void {
  if (draggedKey === null) return;
  const sourceIndex = items.findIndex((item) => getKey(item) === draggedKey);
  const targetIndex = items.findIndex((item) => getKey(item) === getKey(targetItem));
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;

  const targetBounds = targetElement.getBoundingClientRect();
  const movingDown = sourceIndex < targetIndex;
  const targetSwapThresholdY = movingDown
    ? targetBounds.top + targetBounds.height * normalizedSwapThreshold
    : targetBounds.bottom - targetBounds.height * normalizedSwapThreshold;
  if ((movingDown && pointerY <= targetSwapThresholdY) || (!movingDown && pointerY >= targetSwapThresholdY)) return;

  const reordered = [...items];
  const [sourceItem] = reordered.splice(sourceIndex, 1);
  if (sourceItem === undefined) return;
  const insertIndex = reordered.findIndex((item) => getKey(item) === getKey(targetItem));
  reordered.splice(movingDown ? insertIndex + 1 : insertIndex, 0, sourceItem);
  commitItems(stabilizeLockedItems(reordered));
}

function moveItem(item: T, offset: -1 | 1): void {
  if (isLocked(item)) return;
  const movableItems = items.filter((candidate) => !isLocked(candidate));
  const sourceIndex = movableItems.findIndex((candidate) => getKey(candidate) === getKey(item));
  const targetIndex = sourceIndex + offset;
  if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= movableItems.length) return;

  const targetItem = movableItems[targetIndex];
  [movableItems[sourceIndex], movableItems[targetIndex]] = [movableItems[targetIndex], movableItems[sourceIndex]];
  let movableIndex = 0;
  commitItems(items.map((candidate) => (isLocked(candidate) ? candidate : (movableItems[movableIndex++] ?? candidate))));
  markMoved([getKey(item), getKey(targetItem)]);
  announcement = `「${getLabel(item)}」を${targetIndex + 1}番目に移動しました。`;
}

function markMoved(keys: readonly string[]): void {
  movedKeys = keys;
  if (movedKeysTimer !== null) window.clearTimeout(movedKeysTimer);
  movedKeysTimer = window.setTimeout(() => {
    movedKeys = [];
    movedKeysTimer = null;
  }, 700);
}

function controlsFor(item: T): SortableListControls {
  const locked = isLocked(item);
  const movableItems = items.filter((candidate) => !isLocked(candidate));
  const movableIndex = movableItems.findIndex((candidate) => getKey(candidate) === getKey(item));
  return {
    dragHandleProps: {
      draggable: !locked,
      ondragstart: (event) => startDrag(event, item),
      ondragend: endDrag,
    },
    canMoveUp: !locked && movableIndex > 0,
    canMoveDown: !locked && movableIndex >= 0 && movableIndex < movableItems.length - 1,
    moveUp: () => moveItem(item, -1),
    moveDown: () => moveItem(item, 1),
    locked,
  };
}

function handleWindowDragOver(event: DragEvent): void {
  if (draggedKey === null) return;
  event.preventDefault();
  moveDragPreview(event);
}

function handleItemDrop(event: DragEvent, targetItem: T): void {
  event.preventDefault();
  const sourceKey = draggedKey ?? event.dataTransfer?.getData("text/plain");
  const sourceItem = items.find((item) => getKey(item) === sourceKey);
  if (sourceItem !== undefined && sourceKey !== getKey(targetItem)) {
    announcement = `「${getLabel(sourceItem)}」を「${getLabel(targetItem)}」の位置へ移動しました。`;
  }
  endDrag();
}
</script>

<svelte:window ondragover={handleWindowDragOver} />

<p class="sr-only" aria-live="polite">{announcement}</p>

<div data-slot="sortable-list" class={cn(className)} role="list" {...restProps}>
  {#each items as item, index (getKey(item))}
    {@const key = getKey(item)}
    <div
      data-slot="sortable-list-item"
      data-sortable-key={key}
      class={cn(itemClass, draggedKey === key && "invisible", movedKeys.includes(key) && "sortable-list-item-moved")}
      role="listitem"
      animate:flip={{ duration: animationDuration, easing: cubicOut }}
      ondragover={(event) => {
        event.preventDefault();
        if (draggedKey === null || draggedKey === key) return;
        moveDraggedItem(item, event.clientY, event.currentTarget as HTMLElement);
      }}
      ondrop={(event) => handleItemDrop(event, item)}
    >
      {@render children(item, index, controlsFor(item))}
    </div>
  {/each}
</div>

<style>
  :global([data-slot="sortable-list-drag-preview"]) {
    position: fixed;
    z-index: 100;
    pointer-events: none;
    border-color: var(--primary);
    background: var(--card);
    box-shadow: 0 16px 32px color-mix(in srgb, black 22%, transparent);
    opacity: 0.94;
    transform: translate3d(0, 0, 0) rotate(1deg);
    will-change: transform;
    contain: layout paint;
  }

  :global([data-slot="sortable-list-drag-image-placeholder"]) {
    position: fixed;
    left: -10000px;
    top: -10000px;
    width: 1px;
    height: 1px;
    opacity: 0;
  }

  :global(.sortable-list-item-moved) {
    animation: sortable-list-item-moved 700ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes sortable-list-item-moved {
    0% {
      border-color: var(--primary);
      background: color-mix(in srgb, var(--primary) 14%, transparent);
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--primary) 28%, transparent);
    }
    55% {
      border-color: var(--primary);
      background: color-mix(in srgb, var(--primary) 8%, transparent);
      box-shadow: 0 0 0 6px color-mix(in srgb, var(--primary) 0%, transparent);
    }
    100% {
      border-color: inherit;
      background: transparent;
      box-shadow: none;
    }
  }
</style>
