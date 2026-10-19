<script lang="ts">
import { untrack } from "svelte";
import * as Scroller from "@mutsuna/ui/message-scroller";
import type { OutlineNavItem } from "@mutsuna/ui/outline-nav";
import { Button } from "@mutsuna/ui/button";
let { labelPrefix = "", reserveSpace = true, initialItems = [{ id: "topic-z", label: "伝えたいことを整理する", level: 1 }, { id: "topic-a", label: "読み手にとっての変化を考える", level: 2 }, { id: "topic-k", label: "具体的な使い方を添える", level: 2 }] }: { labelPrefix?: string; initialItems?: readonly OutlineNavItem[]; reserveSpace?: boolean } = $props();
let items = $state<OutlineNavItem[]>([...untrack(() => initialItems)]);
let selected = $state("");
let count = 0;
</script>
<div class="grid max-w-2xl gap-3">
  <div class="flex flex-wrap gap-2"><Button size="sm" onclick={() => items = [...items, { id: `added-${count++}`, label: "次のアクションを考える", level: 1 }]}>項目を追加</Button><Button size="sm" variant="outline" onclick={() => { items = []; selected = ""; }}>新しい会話</Button></div>
  <div class="h-96 rounded-xl border border-border">
    <Scroller.Provider autoScroll defaultScrollPosition="start">
      <Scroller.Root>
        <Scroller.Viewport aria-label={`${labelPrefix}目次付きの履歴`}>
          <Scroller.Content class={reserveSpace ? "gap-5 py-5 pl-5 pr-14" : "gap-5 p-5"} aria-label="目次連携のメッセージ" aria-live="off">
            {#each items as item (item.id)}
              <Scroller.Item messageId={item.id} class="[content-visibility:visible]"><article class="rounded-lg bg-muted p-4"><h3 class="text-sm font-medium">{item.label}</h3><p class="mt-3 text-sm leading-7">読み手が知りたいことから順番に並べます。使った後の変化を具体的に示し、最初の一歩へつなげましょう。</p></article></Scroller.Item>
              <Scroller.Item messageId={`reply-${item.id}`} class="[content-visibility:visible]"><article class="p-4 text-sm leading-7"><p>まず、いちばん伝えたいことを短い一文にまとめます。</p><p class="mt-3">次に、具体的な使い方を一つ添えて、読み手が迷わず始められる説明に整えます。</p></article></Scroller.Item>
            {/each}
            {#if !items.length}<Scroller.Item messageId="empty"><p class="p-4 text-sm text-muted-foreground">会話を始めましょう。</p></Scroller.Item>{/if}
          </Scroller.Content>
        </Scroller.Viewport>
        <Scroller.Outline {items} ariaLabel={`${labelPrefix}会話の目次`} onNavigate={id => selected = id} />
      </Scroller.Root>
    </Scroller.Provider>
  </div>
  <output aria-live="polite" class="text-xs text-muted-foreground">{selected ? `移動先：${selected}` : reserveSpace ? "線からメッセージへ移動できます。" : "履歴をスクロールすると目次が表示されます。"}</output>
</div>
