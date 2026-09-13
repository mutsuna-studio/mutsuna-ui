export type WheelNavigationOptions = {
  onPrevious?: (steps: number) => void;
  onNext?: (steps: number) => void;
  threshold?: number;
  resetDelay?: number;
  mode?: "gesture" | "continuous";
  disabled?: boolean;
};

export function wheelNavigation(node: HTMLElement, initialOptions: WheelNavigationOptions) {
  let options = initialOptions;
  let gestureActive = false;
  let accumulatedDelta = 0;
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  function resetGestureLater() {
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      gestureActive = false;
      accumulatedDelta = 0;
    }, options.resetDelay ?? 160);
  }

  function handleWheel(event: WheelEvent) {
    if (options.disabled) return;
    const threshold = options.threshold ?? 4;
    const delta = normalizeWheelDelta(event, node);
    if (Math.abs(delta) < threshold && options.mode !== "continuous") return;
    const navigate = delta > 0 ? options.onNext : options.onPrevious;
    if (!navigate) return;
    event.preventDefault();
    resetGestureLater();
    if (options.mode === "continuous") {
      // A mouse wheel commonly reports one physical notch as a single large
      // delta (for example 100 or 120). Treat that as one semantic step while
      // keeping the smaller deltas emitted by trackpads accumulative.
      if (isDiscreteWheelInput(event)) {
        accumulatedDelta = 0;
        navigate(1);
        return;
      }
      if (accumulatedDelta !== 0 && Math.sign(accumulatedDelta) !== Math.sign(delta)) accumulatedDelta = 0;
      accumulatedDelta += delta;
      const steps = Math.floor(Math.abs(accumulatedDelta) / threshold);
      if (steps === 0) return;
      accumulatedDelta -= Math.sign(accumulatedDelta) * steps * threshold;
      navigate(steps);
      return;
    }
    if (gestureActive) return;
    gestureActive = true;
    navigate(1);
  }

  node.addEventListener("wheel", handleWheel, { passive: false });

  return {
    update(nextOptions: WheelNavigationOptions) {
      options = nextOptions;
    },
    destroy() {
      node.removeEventListener("wheel", handleWheel);
      if (resetTimer) clearTimeout(resetTimer);
    },
  };
}

function isDiscreteWheelInput(event: WheelEvent): boolean {
  return event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL || Math.abs(event.deltaY) >= 80;
}

function normalizeWheelDelta(event: WheelEvent, node: HTMLElement): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * Math.max(node.clientHeight, 1);
  return event.deltaY;
}
