<script lang="ts">
import { tick, type Snippet } from "svelte";
import { useMessageScroller } from "@mutsuna/ui/message-scroller";
import { scrollbarVisibility } from "@mutsuna/ui/scrollbar";
import type { OutlineNavItem } from "@mutsuna/ui/outline-nav";
let { items, fallback }: { items: readonly OutlineNavItem[]; fallback?: Snippet } = $props();
const scroller = useMessageScroller();
let anchor = $state<HTMLDivElement | null>(null);
let current = $state<OutlineNavItem>();
$effect(() => {
  const questions = items;
  const root = anchor?.closest('[data-slot="message-scroller"]');
  const viewport = root?.querySelector<HTMLElement>('[data-slot="message-scroller-viewport"]');
  const content = root?.querySelector<HTMLElement>('[data-slot="message-scroller-content"]');
  if (!root || !viewport || !content) return;
  let frame: number | undefined;
  function measure() {
    const inset = parseFloat(getComputedStyle(root!).getPropertyValue("--chat-top-bar-height")) || 60;
    const edge = viewport!.getBoundingClientRect().top + inset + 8;
    const rows = [...content!.querySelectorAll<HTMLElement>('[data-slot="message-scroller-item"]')];
    const positions = questions.map(question => ({ question, top: rows.find(row => row.dataset.messageId === question.id)?.getBoundingClientRect().top }));
    // Let a newly reached question occupy the reading area instead of covering
    // it with the previous question, including when jumping back to its text.
    const contextBottom = edge + 44;
    const upcoming = positions.some(({ top }) => top !== undefined && top >= edge - 1 && top < contextBottom);
    current = upcoming ? undefined : positions.filter(({ top }) => top !== undefined && top < edge - 1).at(-1)?.question;
  }
  function schedule() {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => { frame = undefined; measure(); });
  }
  schedule();
  viewport.addEventListener("scroll", schedule, { passive: true });
  const resize = new ResizeObserver(schedule);
  resize.observe(viewport);
  resize.observe(content);
  return () => {
    viewport.removeEventListener("scroll", schedule);
    resize.disconnect();
    if (frame !== undefined) cancelAnimationFrame(frame);
  };
});
async function jump() {
  if (!current) return;
  const id = current.id;
  if (!scroller.scrollToMessage(id, { behavior: "instant", align: "start", scrollMargin: (parseFloat(getComputedStyle(anchor!.closest('[data-slot="message-scroller"]')!).getPropertyValue("--chat-top-bar-height")) || 60) + 16 })) return;
  await tick();
  anchor?.closest('[data-slot="message-scroller"]')?.querySelector<HTMLElement>(`[data-outline-message="${id}"]`)?.focus({ preventScroll: true });
}
</script>
<div bind:this={anchor} class="question-context">
  {#if current}
    {@const question = current}
    <aside aria-label="回答中の質問">
      <button type="button" class="context-card" onclick={jump} aria-label="質問の全文へ移動">
        <time class="context-date" datetime="2026-10-17" aria-label="10月17日（土）">10/17</time><span use:scrollbarVisibility class="context-text mutsuna-scrollbar">{question.label}</span><span class="context-arrow" aria-hidden="true">↑</span>
      </button>
    </aside>
  {:else}{@render fallback?.()}{/if}
</div>
<style>
.question-context { width: 100%; min-width: 0; }
.context-card { display: flex; align-items: center; gap: 10px; width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--border); border-radius: 10px; background: color-mix(in oklab, var(--background) 96%, transparent); backdrop-filter: blur(8px); box-shadow: 0 1px 4px color-mix(in oklab, var(--foreground) 5%, transparent); text-align: start; cursor: pointer; pointer-events: auto; }
.context-card:hover, .context-card:focus-visible { height: auto; min-height: 44px; align-items: flex-start; padding-block: 11px; background: var(--background); }
.context-card:hover .context-text, .context-card:focus-visible .context-text { max-height: 50dvh; white-space: pre-wrap; text-overflow: clip; overflow-y: auto; overflow-wrap: anywhere; overscroll-behavior: contain; }
.context-card:hover .context-date, .context-card:focus-visible .context-date { margin-top: 2px; }
.context-card:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
.context-date { flex-shrink: 0; padding-inline-end: 10px; border-inline-end: 1px solid var(--border); color: var(--muted-foreground); font-size: 10px; line-height: 16px; white-space: nowrap; }
.context-text { min-width: 0; flex: 1; color: var(--foreground); font-size: 13px; line-height: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.context-arrow { flex-shrink: 0; color: var(--muted-foreground); font-size: 14px; }
</style>
