import type { Action } from "svelte/action";

export type ScrollbarVisibilityOptions = {
  readonly fadeDurationMs?: number;
  readonly hideDelayMs?: number;
};

const defaultFadeDurationMs = 220;
const defaultHideDelayMs = 700;

export const scrollbarVisibility: Action<HTMLElement, ScrollbarVisibilityOptions | undefined> = (node, initialOptions) => {
  let fadeDurationMs = initialOptions?.fadeDurationMs ?? defaultFadeDurationMs;
  let hideDelayMs = initialOptions?.hideDelayMs ?? defaultHideDelayMs;
  let hideTimeout: ReturnType<typeof setTimeout> | undefined;
  let fadeOutTimeout: ReturnType<typeof setTimeout> | undefined;

  const clearTimeouts = () => {
    if (hideTimeout !== undefined) {
      globalThis.clearTimeout(hideTimeout);
      hideTimeout = undefined;
    }
    if (fadeOutTimeout !== undefined) {
      globalThis.clearTimeout(fadeOutTimeout);
      fadeOutTimeout = undefined;
    }
  };

  const handleScroll = () => {
    clearTimeouts();
    node.dataset.scrollbarState = "visible";
    hideTimeout = globalThis.setTimeout(() => {
      hideTimeout = undefined;
      node.dataset.scrollbarState = "fading-out";
      fadeOutTimeout = globalThis.setTimeout(() => {
        delete node.dataset.scrollbarState;
        fadeOutTimeout = undefined;
      }, fadeDurationMs);
    }, hideDelayMs);
  };

  node.addEventListener("scroll", handleScroll);

  return {
    update(options) {
      fadeDurationMs = options?.fadeDurationMs ?? defaultFadeDurationMs;
      hideDelayMs = options?.hideDelayMs ?? defaultHideDelayMs;
    },
    destroy() {
      clearTimeouts();
      delete node.dataset.scrollbarState;
      node.removeEventListener("scroll", handleScroll);
    },
  };
};
