<script lang="ts">
import * as Scroller from "@mutsuna/ui/message-scroller";
import { Button } from "@mutsuna/ui/button";
import { Input } from "@mutsuna/ui/input";
let { placement = "flow", labelPrefix = "" }: { placement?: "flow" | "overlay"; labelPrefix?: string } = $props();
let filtersOpen = $state(false);
let query = $state("");
</script>
{#snippet filters()}<Input bind:value={query} aria-label="履歴の検索" placeholder="検索内容も利用側で自由に構成" />{/snippet}
<div class="h-96 max-w-2xl rounded-lg border">
  <Scroller.Provider>
    <Scroller.Root>
      <Scroller.TopBar {placement} aria-label={labelPrefix + "カスタム可能な上部領域"} context={filtersOpen ? filters : undefined}>
        {#snippet leading()}<span class="text-xs text-muted-foreground">履歴</span>{/snippet}
        <time datetime="2026-10-19" class="text-sm">10月19日（月）</time>
        {#snippet actions()}<Button variant="outline" aria-expanded={filtersOpen} onclick={() => filtersOpen = !filtersOpen}>検索</Button>{/snippet}
      </Scroller.TopBar>
      <Scroller.Viewport aria-label={labelPrefix + "上部領域の検証用履歴"}>
        <Scroller.Content class="gap-4 p-4" style={placement === "overlay" ? "padding-top:calc(var(--message-scroller-top-bar-height, 60px) + 16px)" : undefined}>
          {#each Array.from({ length: 24 }, (_, index) => index) as index}<Scroller.Item messageId={String(index)} class="[content-visibility:visible]"><p class="rounded-lg bg-muted p-3 text-sm">メッセージ {index + 1}：日付・文脈・操作は同じ上部領域へ配置します。</p></Scroller.Item>{/each}
        </Scroller.Content>
      </Scroller.Viewport>
      <Scroller.Button />
    </Scroller.Root>
  </Scroller.Provider>
</div>
