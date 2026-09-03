import { getContext, setContext } from "svelte";
import { MediaQuery } from "svelte/reactivity";

export type ResponsiveOverlayMode = "auto" | "desktop" | "mobile";
export type ResolvedResponsiveOverlayMode = Exclude<ResponsiveOverlayMode, "auto">;

type Getter<T> = () => T;

type ResponsiveOverlayStateProps = {
  mode: Getter<ResponsiveOverlayMode>;
  mobileQuery: Getter<string>;
  ssrMode: Getter<ResolvedResponsiveOverlayMode>;
};

export class ResponsiveOverlayState {
  readonly #mode: Getter<ResponsiveOverlayMode>;
  readonly #mobileQuery: MediaQuery;
  #renderedMode = $state<ResolvedResponsiveOverlayMode>("desktop");
  #clientSynchronized = false;
  #trigger = $state<HTMLElement | null>(null);
  #content = $state<HTMLElement | null>(null);

  constructor({ mode, mobileQuery, ssrMode }: ResponsiveOverlayStateProps) {
    this.#mode = mode;
    this.#mobileQuery = $derived(new MediaQuery(mobileQuery(), ssrMode() === "mobile"));
    const initialMode = mode();
    this.#renderedMode = initialMode === "auto" ? ssrMode() : initialMode;
  }

  get preferred(): ResolvedResponsiveOverlayMode {
    const mode = this.#mode();

    if (mode !== "auto") {
      return mode;
    }

    return this.#mobileQuery.current ? "mobile" : "desktop";
  }

  get current(): ResolvedResponsiveOverlayMode {
    return this.#renderedMode;
  }

  get clientSynchronized(): boolean {
    return this.#clientSynchronized;
  }

  get trigger(): HTMLElement | null {
    return this.#trigger;
  }

  get content(): HTMLElement | null {
    return this.#content;
  }

  setTrigger(trigger: HTMLElement | null): void {
    this.#trigger = trigger;
  }

  setContent(content: HTMLElement | null): void {
    this.#content = content;
  }

  sync(open: boolean): void {
    const preferred = this.preferred;

    if (!this.#clientSynchronized || !open) {
      this.#renderedMode = preferred;
    }

    this.#clientSynchronized = true;
  }
}

const RESPONSIVE_OVERLAY_CONTEXT_KEY = Symbol.for("@mutsuna/ui/responsive-overlay");

export function setResponsiveOverlayState(props: ResponsiveOverlayStateProps): ResponsiveOverlayState {
  return setContext(RESPONSIVE_OVERLAY_CONTEXT_KEY, new ResponsiveOverlayState(props));
}

export function useResponsiveOverlayState(): ResponsiveOverlayState {
  const state = getContext<ResponsiveOverlayState | undefined>(RESPONSIVE_OVERLAY_CONTEXT_KEY);

  if (!state) {
    throw new Error("Responsive overlay components must be used inside a responsive overlay root.");
  }

  return state;
}
