<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import * as Message from "@mutsuna/ui/message";
import * as Bubble from "@mutsuna/ui/bubble";
import { CustomerAvatar } from "@mutsuna/ui/avatar";
import MessageActionsPreview from "./message-actions-preview.svelte";
const { Story } = defineMeta({ title: "Components/Data Display/Message", component: Message.Root, tags: ["autodocs"] });
</script>
<Story name="Composition" asChild>
  <div class="grid w-full max-w-xl gap-6">
    <Message.Root role="article" aria-label="佐藤">
      <Message.Avatar><CustomerAvatar id="佐藤 美咲" name="佐藤 美咲" /></Message.Avatar>
      <Message.Content><Message.Header>佐藤 · 10:00</Message.Header><Bubble.Root variant="outline"><Bubble.Content>資料を確認してもらえますか？</Bubble.Content></Bubble.Root><Message.Footer>送信済み</Message.Footer></Message.Content>
    </Message.Root>
    <Message.Root align="end" role="article" aria-label="あなた"><Message.Content><Bubble.Root><Bubble.Content>確認します。</Bubble.Content></Bubble.Root><Message.Footer>既読 · 10:01</Message.Footer></Message.Content></Message.Root>
    <Message.Root role="article" aria-label="アシスタント"><Message.Content><Message.Header>アシスタント</Message.Header><Bubble.Root variant="ghost"><Bubble.Content>吹き出しなしの回答も、同じ配置部品で組み立てられます。</Bubble.Content></Bubble.Root></Message.Content></Message.Root>
  </div>
</Story>

<Story name="Actions And Replies" asChild><div class="grid gap-8"><MessageActionsPreview /><section><p class="mb-3 text-sm text-muted-foreground">操作不可</p><MessageActionsPreview disabled /></section></div></Story>
