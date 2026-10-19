<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import * as MessageScroller from "@mutsuna/ui/message-scroller";
import TopBarPreview from "./message-scroller-top-bar-preview.svelte";
import OutlinePreview from "./message-scroller-outline-preview.svelte";
import MessageScrollerPreview from "./message-scroller-preview.svelte";
const historySource = [
  '<script lang="ts">',
  '  import * as MessageScroller from "@mutsuna/ui/message-scroller";',
  '</' + 'script>',
  '',
  '<MessageScroller.Provider autoScroll>',
  '  <MessageScroller.Root class="h-80">',
  '    <MessageScroller.Viewport aria-label="会話履歴">',
  '      <MessageScroller.Content class="p-4">',
  '        <MessageScroller.Item messageId="first">最初のメッセージ</MessageScroller.Item>',
  '      </MessageScroller.Content>',
  '    </MessageScroller.Viewport>',
  '    <MessageScroller.Button />',
  '  </MessageScroller.Root>',
  '</MessageScroller.Provider>',
].join("\n");

const { Story } = defineMeta({ title: "Components/Layout/Message Scroller", component: MessageScroller.Provider,
 // Storybook requires identical binding types across subcomponents; these public components have different bindings.
 subcomponents: { Root: MessageScroller.Root, Viewport: MessageScroller.Viewport, Content: MessageScroller.Content, Item: MessageScroller.Item, TopBar: MessageScroller.TopBar, Outline: MessageScroller.Outline, Button: MessageScroller.Button } as unknown as Record<string, typeof MessageScroller.Provider>,
 args: { autoScroll: true, defaultScrollPosition: "end" },
 argTypes: { children: { control: false } },
 parameters: { docs: { description: { component: "履歴の公開APIはProvider・Root・Viewport・Content・Item・TopBarを組み合わせます。最初の表はProviderの設定です。各部品のpropsはタブを切り替えて確認できます。実装例は利用ガイドの『スクロール』を参照してください。" } } },
 tags: ["autodocs"] });
</script>
<Story name="History And Following" parameters={{ docs: { source: { code: historySource, language: "svelte" } } }}>{#snippet template(args)}<MessageScrollerPreview autoScroll={args.autoScroll} defaultScrollPosition={args.defaultScrollPosition} />{/snippet}</Story>

<Story name="Outline Navigation" asChild>
  <div class="grid gap-10">
    <section class="grid gap-3" aria-label="目次の領域を確保"><h2 class="text-base font-semibold">目次の領域を確保する</h2><OutlinePreview labelPrefix="固定配置の" /></section>
    <section class="grid gap-3" aria-label="スクロール中の目次"><h2 class="text-base font-semibold">スクロール中だけ目次を重ねる</h2><OutlinePreview labelPrefix="重ね配置の" reserveSpace={false} /></section>
  </div>
</Story>

<Story name="Custom Top Area" asChild><div class="grid gap-8"><section><h2 class="mb-3 text-sm font-medium">履歴に重ねるフローティング表示</h2><TopBarPreview placement="overlay" labelPrefix="重ね表示の" /></section><section><h2 class="mb-3 text-sm font-medium">高さを確保する配置</h2><TopBarPreview labelPrefix="領域を確保する" /></section></div></Story>
