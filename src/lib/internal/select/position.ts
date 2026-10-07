export function getListPosition(triggerElement: HTMLElement, contentSide: "top" | "bottom", contentAlign: "start" | "end") {
  if (!triggerElement || typeof window === "undefined") {
    return;
  }

  const rect = triggerElement.getBoundingClientRect();
  const dialogContent = triggerElement.closest<HTMLElement>('[role="dialog"], [role="alertdialog"], dialog, [data-slot="dialog-content"]');
  const target = dialogContent ?? "body";
  const viewportPadding = 8;
  const sideOffset = 4;
  const viewport = window.visualViewport;
  const viewportLeft = viewport?.offsetLeft ?? 0;
  const viewportTop = viewport?.offsetTop ?? 0;
  const viewportRight = viewportLeft + (viewport?.width ?? window.innerWidth);
  const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
  const listWidth = Math.min(Math.max(rect.width, 144), Math.max(0, viewportRight - viewportLeft - 2 * viewportPadding));
  const bottomSpace = viewportBottom - rect.bottom - viewportPadding - sideOffset;
  const topSpace = rect.top - viewportTop - viewportPadding - sideOffset;
  const shouldOpenTop = contentSide === "top" || (contentSide === "bottom" && bottomSpace < 144 && topSpace > bottomSpace);
  const preferredLeft = contentAlign === "end" ? rect.right - listWidth : rect.left;
  const left = Math.max(viewportLeft + viewportPadding, Math.min(preferredLeft, viewportRight - listWidth - viewportPadding));
  const preferredTop = shouldOpenTop ? rect.top - sideOffset : rect.bottom + sideOffset;
  const top = Math.max(viewportTop + viewportPadding, Math.min(preferredTop, viewportBottom - viewportPadding));
  const availableHeight = Math.max(0, Math.min(256, shouldOpenTop
    ? top - viewportTop - viewportPadding
    : viewportBottom - viewportPadding - top));

  if (dialogContent instanceof HTMLElement) {
    const containerRect = dialogContent.getBoundingClientRect();
    const relativeLeft = left - containerRect.left + dialogContent.scrollLeft - dialogContent.clientLeft;
    const relativeTop = top - containerRect.top + dialogContent.scrollTop - dialogContent.clientTop;
    const transform = shouldOpenTop ? "transform:translateY(-100%);" : "";
    const style = `position:absolute;left:${relativeLeft}px;top:${relativeTop}px;${transform}width:${listWidth}px;max-height:${availableHeight}px;`;
    return { target, style };
  }

  const transform = shouldOpenTop ? "transform:translateY(-100%);" : "";
  const style = `position:fixed;left:${left}px;top:${top}px;${transform}width:${listWidth}px;max-height:${availableHeight}px;`;
  return { target, style };
}

/** Observe layout and mobile visual viewport changes only while the list is open. */
export function observeListPosition(trigger: HTMLElement, update: () => void): () => void {
  let frame: number | undefined;
  const schedule = () => {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => { frame = undefined; update(); });
  };
  const observer = new ResizeObserver(schedule);
  for (let element: HTMLElement | null = trigger; element; element = element.parentElement) observer.observe(element);
  const viewport = window.visualViewport;
  window.addEventListener("resize", schedule);
  document.addEventListener("scroll", schedule, true);
  viewport?.addEventListener("resize", schedule);
  viewport?.addEventListener("scroll", schedule);
  schedule();
  return () => {
    observer.disconnect();
    if (frame !== undefined) cancelAnimationFrame(frame);
    window.removeEventListener("resize", schedule);
    document.removeEventListener("scroll", schedule, true);
    viewport?.removeEventListener("resize", schedule);
    viewport?.removeEventListener("scroll", schedule);
  };
}
