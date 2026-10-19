/** Client-only interaction for the fitted image surface. Keeps scrolling outside the viewer unchanged. */
export function imagePreviewGestures(node: HTMLDivElement, initial: { src: string; open: boolean; page?: number; onNavigate?: (direction: -1 | 1) => void }) {
  let source = initial;
  let scale = 1;
  let x = 0;
  let y = 0;
  let anchorLimitX = 0;
  let anchorLimitY = 0;
  const pointers = new Map<number, { x: number; y: number }>();
  let swipeStart: { x: number; y: number } | undefined;
  let hadPinch = false;
  let pinch: { distance: number; x: number; y: number } | undefined;
  const image = () => node.querySelector<HTMLImageElement>(".viewer-image");
  function render() {
    const img = image();
    if (!img) return;
    const ratio = img.naturalWidth / img.naturalHeight || 1;
    const width = Math.min(node.clientWidth, node.clientHeight * ratio);
    const height = Math.min(node.clientHeight, node.clientWidth / ratio);
    const limitX = scale === 1 ? 0 : Math.max(anchorLimitX, width * scale / 2);
    const limitY = scale === 1 ? 0 : Math.max(anchorLimitY, height * scale / 2);
    x = Math.max(-limitX, Math.min(limitX, x));
    y = Math.max(-limitY, Math.min(limitY, y));
    img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    node.dataset.zoomed = String(scale > 1);
    node.dataset.dragging = String(pointers.size > 0 && scale > 1);
  }
  function reset() { scale = 1; x = 0; y = 0; anchorLimitX = 0; anchorLimitY = 0; pointers.clear(); pinch = undefined; swipeStart = undefined; hadPinch = false; render(); }
  function zoom(next: number, clientX: number, clientY: number) {
    const rect = node.getBoundingClientRect();
    const px = clientX - rect.left - rect.width / 2;
    const py = clientY - rect.top - rect.height / 2;
    const bounded = Math.max(1, Math.min(8, next));
    x = px - (px - x) * bounded / scale;
    y = py - (py - y) * bounded / scale;
    scale = bounded;
    if (scale === 1) { x = 0; y = 0; }
    // Keep the point under the cursor fixed, including letterboxed image edges.
    // Subsequent panning may return toward the center without snapping this anchor.
    anchorLimitX = Math.abs(x);
    anchorLimitY = Math.abs(y);
    render();
  }
  function wheel(event: WheelEvent) {
    if (!image() || !event.deltaY) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? node.clientHeight : 1;
    zoom(scale * Math.exp(-event.deltaY * unit * 0.002), event.clientX, event.clientY);
  }
  function readPinch() {
    const [a, b] = [...pointers.values()];
    return b ? { distance: Math.hypot(b.x - a.x, b.y - a.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : undefined;
  }
  function down(event: PointerEvent) {
    if (event.button !== 0 || (!image() && !source.onNavigate)) return;
    if (event.pointerType === "mouse" && scale === 1) return;
    event.preventDefault();
    node.focus({ preventScroll: true });
    if (!pointers.size) { swipeStart = event.pointerType === "touch" && scale === 1 ? { x: event.clientX, y: event.clientY } : undefined; hadPinch = false; }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    node.setPointerCapture(event.pointerId);
    pinch = readPinch();
    if (pinch) hadPinch = true;
    render();
  }
  function move(event: PointerEvent) {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const next = readPinch();
    if (next && pinch) {
      x += next.x - pinch.x; y += next.y - pinch.y;
      if (pinch.distance > 0) zoom(scale * next.distance / pinch.distance, next.x, next.y);
    } else if (scale > 1) {
      x += event.clientX - previous.x; y += event.clientY - previous.y;
    }
    pinch = next;
    render();
  }
  function up(event: PointerEvent) {
    const start = swipeStart;
    const canSwipe = pointers.has(event.pointerId) && pointers.size === 1 && !hadPinch && scale === 1 && event.type === "pointerup" && start;
    pointers.delete(event.pointerId); pinch = readPinch();
    if (!pointers.size) swipeStart = undefined;
    render();
    if (canSwipe && start) {
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.5) source.onNavigate?.(dx < 0 ? 1 : -1);
    }
  }
  function keydown(event: KeyboardEvent) {
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey || !image()) return;
    const rect = node.getBoundingClientRect();
    if (["+", "=", "-", "_"].includes(event.key)) {
      event.preventDefault(); zoom(scale * (["+", "="].includes(event.key) ? 1.25 : 0.8), rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else if (["0", "Home"].includes(event.key)) { event.preventDefault(); reset(); }
    else if (scale > 1 && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      x += event.key === "ArrowLeft" ? 40 : event.key === "ArrowRight" ? -40 : 0;
      y += event.key === "ArrowUp" ? 40 : event.key === "ArrowDown" ? -40 : 0;
      render();
    }
  }
  node.addEventListener("wheel", wheel, { passive: false });
  node.addEventListener("pointerdown", down);
  node.addEventListener("pointermove", move);
  node.addEventListener("pointerup", up);
  node.addEventListener("pointercancel", up);
  node.addEventListener("lostpointercapture", up);
  node.addEventListener("keydown", keydown);
  node.addEventListener("load", render, true);
  window.addEventListener("blur", reset);
  const observer = new ResizeObserver(render);
  observer.observe(node);
  render();
  return {
    update(next: typeof initial) { if (next.src !== source.src || next.open !== source.open || next.page !== source.page) reset(); source = next; },
    destroy() {
      observer.disconnect();
      node.removeEventListener("wheel", wheel);
      node.removeEventListener("pointerdown", down);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", up);
      node.removeEventListener("pointercancel", up);
      node.removeEventListener("lostpointercapture", up);
      node.removeEventListener("keydown", keydown);
      node.removeEventListener("load", render, true);
      window.removeEventListener("blur", reset);
    },
  };
}
