<script lang="ts">
import { ChatMemo } from "@mutsuna/ui/chat-memo";
import { ChatHeader } from "@mutsuna/ui/chat-header";
import { Button } from "@mutsuna/ui/button";
let { initialOpen = false, readOnly = false }: { initialOpen?: boolean; readOnly?: boolean } = $props();
import { onDestroy, untrack } from "svelte";
let open = $state(untrack(() => initialOpen));
let draft = $state("会話の前提や、後で見返したいことを残します。");
let saved = $state(untrack(() => draft));
let saving = $state(false);
let error = $state<string>();
let failNextSave = $state(false);
let timer: ReturnType<typeof setTimeout> | undefined;
function save(value: string) {
  saving = true; error = undefined;
  timer = setTimeout(() => {
    saving = false;
    if (failNextSave) { error = "保存できませんでした。もう一度お試しください。"; failNextSave = false; }
    else saved = value;
  }, 600);
}
onDestroy(() => clearTimeout(timer));
let clicks = $state(0);
</script>
<section aria-label={readOnly ? "閲覧専用の会話とメモの例" : "会話とメモの例"} class="max-w-2xl">
  <ChatHeader title="文章とアイデア">{#snippet actions()}<ChatMemo bind:open bind:value={draft} {readOnly} savedValue={saved} {saving} {error} onSave={save} />{/snippet}</ChatHeader>
  <div class="grid gap-3 p-4"><p class="text-sm">会話の本文を表示する領域です。</p><Button variant="outline" class="w-fit" onclick={() => clicks++}>会話側の操作</Button><output class="text-sm text-muted-foreground">操作回数：{clicks}</output>{#if !readOnly}<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={failNextSave} />次の保存を失敗させる</label>{/if}{#if saved}<output class="text-sm">保存したメモ：{saved}</output>{/if}</div>
</section>
