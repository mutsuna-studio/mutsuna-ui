<script lang="ts">
import { ScrollbarArea } from "@mutsuna/ui/scrollbar";
import { Button } from "@mutsuna/ui/button";
import { Checkbox } from "@mutsuna/ui/checkbox";
import { CycleSelect } from "@mutsuna/ui/cycle-select";

let { mode = "states" }: { mode?: "states" | "gutter" } = $props();
const options = [
  { value: "auto", label: "自動", description: "先に余白を空けません。バーが出たときに本文の幅が変わる環境もあります。" },
  { value: "stable", label: "片側に確保（対応環境のみ）", description: "バーが本文の横に表示される環境では、片側の幅を先に確保し、内容が増えたときの本文の幅の変化を防ぎます。" },
  { value: "both-edges", label: "両側に確保（対応環境のみ）", description: "バーが本文の横に表示される環境では、両側に同じ幅を確保し、本文を中央に保ちます。" },
] as const;
let gutter = $state("stable");
const selected = $derived(options.find(option => option.value === gutter) ?? options[1]);
let longContent = $state(false);
let panel = $state<HTMLDivElement | null>(null);
let visibility = $state("idle");
let left = $state(0);
let right = $state(0);
$effect(() => {
  const element = panel;
  if (!element) return;
  const update = () => {
    visibility = element.dataset.scrollbarState ?? "idle";
    const style = getComputedStyle(element);
    left = Math.max(0, element.clientLeft - parseFloat(style.borderLeftWidth));
    right = Math.max(0, element.offsetWidth - element.clientWidth - element.clientLeft - parseFloat(style.borderRightWidth));
  };
  update();
  const mutation = new MutationObserver(update);
  mutation.observe(element, { attributes: true, attributeFilter: ["class", "data-scrollbar-state"], childList: true, subtree: true });
  const resize = new ResizeObserver(update);
  resize.observe(element);
  return () => { mutation.disconnect(); resize.disconnect(); };
});
function scroll() {
  if (!panel) return;
  const nearEnd = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 4;
  panel.scrollBy({ top: nearEnd ? -140 : 140, behavior: "instant" });
}
</script>

<section class="grid max-w-2xl gap-4" aria-label={mode === "states" ? "スクロールバーの表示タイミング" : "スクロールバーの余白設定"}>
  {#if mode === "states"}
    <div class="grid gap-2"><h2 class="text-base font-semibold">スクロールしたときだけ表示</h2><p class="text-sm text-muted-foreground">枠内をスクロールするとバーが現れ、操作を止めると消えます。本文や余白は変わりません。</p></div>
    <div class="flex flex-wrap items-center gap-3"><Button variant="outline" onclick={scroll}>スクロールして確認</Button><output class="text-sm" aria-live="polite">{visibility === "visible" ? "表示中" : visibility === "fading-out" ? "消えています" : "非表示"}</output></div>
  {:else}
    <div class="grid gap-2"><h2 class="text-base font-semibold">バーのために空ける幅</h2><p class="text-sm text-muted-foreground">バーの太さではなく、本文の横に予約する余白の設定です。実際の余白はブラウザやOSによって異なります。</p></div>
    <CycleSelect bind:value={gutter} {options} ariaLabel="余白の設定" class="w-full max-w-md" />
    <p class="text-sm text-muted-foreground">{selected.description}</p>
    <label class="flex items-center gap-2 text-sm"><Checkbox bind:checked={longContent} />内容を増やしてスクロールを発生させる</label>
  {/if}
  <div class="relative min-w-0">
    <ScrollbarArea bind:ref={panel} role="region" aria-label="スクロールのサンプル" gutter={mode === "gutter" ? selected.value : "stable"} class="h-64 overflow-y-auto rounded-xl border bg-background">
      <div class="grid gap-3 p-4">
        {#each Array.from({ length: mode === "states" || longContent ? 16 : 1 }, (_, index) => index + 1) as item (item)}
          <div class="rounded-lg border bg-card p-3 text-sm text-card-foreground">項目 {item}</div>
        {/each}
      </div>
    </ScrollbarArea>
    {#if mode === "gutter"}
      <div aria-hidden="true" class="pointer-events-none absolute inset-px overflow-hidden rounded-xl">
        <span class="absolute inset-y-0 left-0 bg-primary/20" style:width={`${left}px`}></span>
        <span class="absolute inset-y-0 right-0 bg-primary/20" style:width={`${right}px`}></span>
      </div>
    {/if}
  </div>
  {#if mode === "gutter"}
    <p class="text-sm"><span class="mr-2 inline-block size-3 rounded-sm bg-primary/20" aria-hidden="true"></span>確保された余白（色の帯）：<output> 左 {left}px／右 {right}px</output></p>
    {#if (selected.value !== "auto" || longContent) && left + right === 0}<p class="text-xs text-muted-foreground">この環境ではバーが本文に重なるため、余白は確保されません。</p>{/if}
  {/if}
</section>
