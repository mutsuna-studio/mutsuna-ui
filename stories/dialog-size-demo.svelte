<script lang="ts">
import { onDestroy } from "svelte";
import { Button } from "@mutsuna/ui/button";
import { Input } from "@mutsuna/ui/input";
import * as Dialog from "@mutsuna/ui/responsive-dialog";
let open = $state(false);
let loading = $state(false);
let loaded = $state(false);
let name = $state("サンプル項目");
let timer: ReturnType<typeof setTimeout> | undefined;
function loadDetails() {
  loading = true;
  timer = setTimeout(() => { loading = false; loaded = true; }, 500);
}
onDestroy(() => clearTimeout(timer));
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    {#snippet child({ props })}<Button {...props}>内容が変わるダイアログを開く</Button>{/snippet}
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header><Dialog.Title>内容の更新</Dialog.Title></Dialog.Header>
    <Dialog.Body class="py-4">
      <div class="grid gap-4">
        <p>後から情報を追加すると、ダイアログの高さが滑らかに変わります。</p>
        <Input label="名称" bind:value={name} />
        {#if loaded}
          <Input label="担当者" value="サンプル担当者" />
          <Input label="補足情報" value="入力した内容を保持したまま高さが変わります。" />
        {/if}
        <Button variant="outline" disabled={loading} onclick={() => { if (loaded) loaded = false; else loadDetails(); }}>{loading ? "読み込み中…" : loaded ? "補足情報を閉じる" : "補足情報を読み込む"}</Button>
      </div>
    </Dialog.Body>
    <Dialog.Footer>
      <Dialog.Close>{#snippet child({ props })}<Button {...props} variant="outline">閉じる</Button>{/snippet}</Dialog.Close>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
