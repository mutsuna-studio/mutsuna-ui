/** 内容更新時だけ高さを補間し、終了後は元のauto/max-heightへ戻す。 */
export function animateContentHeight(element: HTMLElement): () => void {
  if (typeof ResizeObserver === "undefined" || typeof element.animate !== "function") return () => {};
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let animation: Animation | null = null;
  let targetHeight = readHeight();
  let width = element.clientWidth;
  let disposed = false;
  const observed = new Set<HTMLElement>();

  function readHeight(): number {
    return Number.parseFloat(getComputedStyle(element).height) || element.offsetHeight;
  }
  function settle(): void {
    animation?.cancel();
    animation = null;
    targetHeight = readHeight();
    width = element.clientWidth;
  }
  function resize(): void {
    if (disposed) return;
    const currentHeight = readHeight();
    const current = animation;
    const currentTime = current?.currentTime;
    // 固定高さを残さず、アニメーションを一旦外して自然な到達高さを測る。
    current?.cancel();
    const nextHeight = readHeight();
    const nextWidth = element.clientWidth;
    const closing = element.hasAttribute("data-closed") || element.dataset.state === "closed";
    const opening = element.getAnimations().some((item) => "animationName" in item && item.playState === "running");
    if (!element.isConnected || closing || opening || reducedMotion.matches || nextWidth !== width || nextHeight <= 0) {
      animation = null;
      targetHeight = nextHeight;
      width = nextWidth;
      return;
    }
    // 自身の高さ変化で子のResizeObserverが通知されても、同じ到達点なら続行する。
    if (current && Math.abs(nextHeight - targetHeight) < 0.5) {
      current.play();
      if (currentTime != null) current.currentTime = currentTime;
      return;
    }
    animation = null;
    const fromHeight = current ? currentHeight : targetHeight;
    targetHeight = nextHeight;
    if (Math.abs(nextHeight - fromHeight) < 0.5) return;
    const next = element.animate([{ height: `${fromHeight}px` }, { height: `${nextHeight}px` }], {
      duration: 200,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
    });
    animation = next;
    next.onfinish = () => {
      if (animation !== next || disposed) return;
      animation = null;
      resize();
    };
  }

  const observer = new ResizeObserver((entries) => {
    if (animation && entries.every((entry) => entry.target === element)) return;
    resize();
  });
  function observeContent(): void {
    const bodies = element.querySelectorAll<HTMLElement>('[data-slot="dialog-body"], [data-slot="responsive-dialog-body"], [data-slot="drawer-body"]');
    const targets = new Set<HTMLElement>([element]);
    if (bodies.length > 0) {
      for (const body of bodies) {
        for (const child of body.children) if (child instanceof HTMLElement) targets.add(child);
      }
      for (const part of element.querySelectorAll<HTMLElement>('[data-slot$="-header"], [data-slot$="-footer"]')) targets.add(part);
    } else {
      for (const child of element.children) if (child instanceof HTMLElement) targets.add(child);
    }
    for (const part of observed) {
      if (!targets.has(part)) { observer.unobserve(part); observed.delete(part); }
    }
    for (const part of targets) {
      if (!observed.has(part)) { observer.observe(part); observed.add(part); }
    }
  }
  const mutations = new MutationObserver(() => { observeContent(); resize(); });
  mutations.observe(element, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["data-state", "data-open", "data-closed"] });
  observeContent();
  window.addEventListener("resize", settle);
  window.visualViewport?.addEventListener("resize", settle);
  reducedMotion.addEventListener("change", settle);
  return () => {
    disposed = true;
    observer.disconnect();
    mutations.disconnect();
    animation?.cancel();
    window.removeEventListener("resize", settle);
    window.visualViewport?.removeEventListener("resize", settle);
    reducedMotion.removeEventListener("change", settle);
  };
}
