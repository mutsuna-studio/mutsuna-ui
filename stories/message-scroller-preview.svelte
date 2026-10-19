<script lang="ts">
import * as Scroller from "@mutsuna/ui/message-scroller";
import * as Message from "@mutsuna/ui/message";
import * as Bubble from "@mutsuna/ui/bubble";
import { Button } from "@mutsuna/ui/button";
let { anchorNew = false, autoScroll = true, defaultScrollPosition = "end" }: { anchorNew?: boolean; autoScroll?: boolean; defaultScrollPosition?: "start" | "end" | "last-anchor" } = $props();
let rows = $state(Array.from({ length: 20 }, (_, i) => ({ id: `row-${i}`, text: `メッセージ ${i + 1}：履歴を読んでいる間は、新しい内容が増えても読み位置を維持します。` })));
let count = 20;
let earlier = 0;
</script>
<div class="grid max-w-xl gap-3">
  <div class="flex flex-wrap gap-2">
    <Button size="sm" onclick={() => rows = [...rows, { id: `row-${count++}`, text: "追加されたメッセージ" }]}>メッセージを追加</Button>
    <Button size="sm" variant="outline" onclick={() => { rows = rows.map((row, index) => index === rows.length - 1 ? { ...row, text: row.text + "\n回答を生成しています。" } : row); }}>末尾の本文を伸ばす</Button>
    <Button size="sm" variant="outline" onclick={() => rows = [{ id: `earlier-${earlier++}`, text: "前の履歴から読み込んだメッセージ" }, ...rows]}>過去の履歴を追加</Button>
  </div>
  <div class="h-80 rounded-lg border">
    <Scroller.Provider {autoScroll} {defaultScrollPosition}>
      <Scroller.Root>
        <Scroller.Viewport aria-label="スクロール検証の履歴">
          <Scroller.Content class="p-4" aria-label="検証メッセージ" aria-live="off">
            {#each rows as row (row.id)}
              <Scroller.Item class="[content-visibility:visible]" messageId={row.id} scrollAnchor={anchorNew && row.id.startsWith("row-") && Number(row.id.slice(4)) >= 20}>
                <Message.Root role="article" aria-label={row.id}><Message.Content><Bubble.Root variant="muted" class="max-w-full"><Bubble.Content class="whitespace-pre-wrap">{row.text}</Bubble.Content></Bubble.Root></Message.Content></Message.Root>
              </Scroller.Item>
            {/each}
          </Scroller.Content>
        </Scroller.Viewport>
        <Scroller.Button behavior="instant" />
      </Scroller.Root>
    </Scroller.Provider>
  </div>
</div>
