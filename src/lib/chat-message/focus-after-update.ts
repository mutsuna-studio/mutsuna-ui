import { tick } from 'svelte';

/** Only follow an interaction if the user has not moved focus elsewhere. */
export function focusAfterUpdate(previous: Element | null, target: () => HTMLElement | null | undefined) {
  void tick().then(() => {
    if (document.activeElement !== previous && document.activeElement !== document.body) return;
    const element = target();
    if (element?.isConnected) element.focus({ preventScroll: true });
  });
}
