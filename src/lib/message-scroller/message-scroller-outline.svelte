<script module lang="ts">
import type { OutlineNavProps } from "../outline-nav/index.js";
import type { MessageScrollerScrollOptions } from "@shadcn-svelte/primitives/message-scroller";
export type MessageScrollerOutlineProps = Omit<OutlineNavProps, "activeId" | "onNavigate" | "open"> & {
  /** Additional offset after the content block-start padding. */
  scrollMargin?: number;
  behavior?: MessageScrollerScrollOptions["behavior"];
  /** Called after starting navigation and focusing a rendered message. */
  onNavigate?: (id: string) => void;
};
</script>
<script lang="ts">
import { tick, onDestroy } from "svelte";
import { prefersReducedMotion } from "svelte/motion";
import { useMessageScroller, useMessageScrollerVisibility, useMessageScrollerScrollable } from "@shadcn-svelte/primitives/message-scroller";
import { OutlineNav } from "../outline-nav/index.js";
import { cn } from "../utils.js";
let { ref = $bindable(null), items, scrollMargin = 16, behavior = "instant", onNavigate, class: className, ...restProps }: MessageScrollerOutlineProps = $props();
const scroller = useMessageScroller();
const visibility = useMessageScrollerVisibility();
const scrollable = useMessageScrollerScrollable();
let panelOpen = $state(false);
let constrained = $state(true);
let scrolling = $state(false);
let hovered = $state(false);
let focused = $state(false);
const visible = $derived(!constrained || scrolling || hovered || focused || panelOpen);
$effect(() => {
  const root = ref?.closest('[data-slot="message-scroller"]');
  const viewport = root?.querySelector<HTMLElement>('[data-slot="message-scroller-viewport"]');
  const content = root?.querySelector<HTMLElement>('[data-slot="message-scroller-content"]');
  if (!root || !viewport || !content) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let frame: number | undefined;
  function measure() {
    const viewportBounds = viewport!.getBoundingClientRect();
    const elements = rows();
    const rtl = getComputedStyle(root!).direction === "rtl";
    const gap = elements.length ? Math.min(...elements.map(row => {
      const bounds = row.getBoundingClientRect();
      return rtl ? bounds.left - viewportBounds.left : viewportBounds.right - bounds.right;
    })) : 0;
    // The transparent hit area can overlap the gutter; only the visible line
    // (20px at its longest), end padding and 4px clearance need empty space.
    const mark = ref?.querySelector<HTMLElement>(".outline-mark");
    const endPadding = mark ? parseFloat(getComputedStyle(mark).paddingInlineEnd) : 12;
    const requiredGap = Math.min(ref?.getBoundingClientRect().width ?? 44, endPadding + 20 + 4);
    constrained = gap < requiredGap;
  }
  function scheduleMeasure() {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => { frame = undefined; measure(); });
  }
  function onScroll() {
    scrolling = true;
    clearTimeout(timer);
    timer = setTimeout(() => { scrolling = false; }, 1000);
  }
  measure();
  const resize = new ResizeObserver(scheduleMeasure);
  resize.observe(root);
  resize.observe(viewport);
  resize.observe(content);
  const mutations = new MutationObserver(scheduleMeasure);
  mutations.observe(content, { childList: true, attributes: true, attributeFilter: ["class", "style"] });
  viewport.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    resize.disconnect();
    mutations.disconnect();
    viewport.removeEventListener("scroll", onScroll);
    clearTimeout(timer);
    if (frame !== undefined) cancelAnimationFrame(frame);
  };
});
let restoreFocus = () => {};
let mounted = true;
onDestroy(() => { mounted = false; restoreFocus(); });
function rows() {
  const root = ref?.closest('[data-slot="message-scroller"]');
  return root ? [...root.querySelectorAll<HTMLElement>('[data-slot="message-scroller-item"]')].filter(row => row.closest('[data-slot="message-scroller"]') === root) : [];
}
const activeId = $derived.by(() => {
  const elements = rows();
  const positions = new Map(elements.map((row, index) => [row.dataset.messageId, index]));
  const headings = items.filter(item => positions.has(item.id));
  if (scrollable.start && !scrollable.end) return headings.at(-1)?.id;
  const firstVisible = visibility.visibleMessageIds.find(id => positions.has(id));
  const position = firstVisible === undefined ? -1 : positions.get(firstVisible)!;
  return headings.filter(item => positions.get(item.id)! <= position).at(-1)?.id ?? headings[0]?.id;
});
async function navigate(id: string) {
  const row = rows().find(element => element.dataset.messageId === id);
  if (!row || !scroller.scrollToMessage(id, { align: "start", behavior: prefersReducedMotion.current ? "instant" : behavior, scrollMargin })) return;
  await tick();
  if (!mounted || !row.isConnected) return;
  restoreFocus();
  const addedTabindex = !row.hasAttribute("tabindex");
  if (addedTabindex) row.setAttribute("tabindex", "-1");
  const cleanup = () => {
    row.removeEventListener("blur", cleanup);
    if (addedTabindex && row.getAttribute("tabindex") === "-1") row.removeAttribute("tabindex");
  };
  restoreFocus = cleanup;
  row.addEventListener("blur", cleanup, { once: true });
  row.focus({ preventScroll: true });
  onNavigate?.(id);
}
</script>
<div role="presentation" data-slot="message-scroller-outline" class="outline-position" data-mode={constrained ? "scroll" : "always"} data-visible={visible} onpointerenter={() => hovered = true} onpointerleave={() => hovered = false} onfocusin={() => focused = true} onfocusout={() => focused = false}>
  <OutlineNav bind:ref bind:open={panelOpen} {items} {activeId} {...restProps} class={cn("pointer-events-auto", className)} onNavigate={navigate} />
</div>
<style>
.outline-position { position: absolute; inset-inline-end: 0; top: 50%; transform: translateY(-50%); height: calc(100% - 48px); display: flex; align-items: center; z-index: 5; pointer-events: none; opacity: 1; transition: opacity 180ms; }
.outline-position[data-visible="false"] { opacity: 0; }
.outline-position[data-visible="false"] :global([data-slot="outline-nav"]) { pointer-events: none; }
@media (prefers-reduced-motion: reduce) { .outline-position { transition: none; } }
</style>
