<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { SortableList } from "@mutsuna/ui/sortable-list";

const { Story } = defineMeta({
  title: "UI/Sortable List",
  component: SortableList,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
import { Button } from "@mutsuna/ui/button";
import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
import GripVerticalIcon from "@lucide/svelte/icons/grip-vertical";

type DemoItem = { id: string; label: string; locked?: boolean };

let items = $state<DemoItem[]>([
  { id: "general", label: "一般的なお問い合わせ" },
  { id: "reservation", label: "予約について" },
  { id: "service", label: "サービスについて" },
  { id: "other", label: "その他", locked: true },
]);
</script>

<Story name="Default" asChild>
  <div class="max-w-xl rounded-xl border p-4">
    <SortableList
      bind:items
      getKey={(item) => item.id}
      getLabel={(item) => item.label}
      isLocked={(item) => item.locked === true}
      class="grid gap-3"
      itemClass="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-3"
    >
      {#snippet children(item, _index, controls)}
        {#if controls.locked}
          <div class="flex h-8 w-16 items-center text-muted-foreground"><GripVerticalIcon class="size-4" /></div>
        {:else}
          <div class="flex items-center gap-1">
            <button
              class="cursor-grab rounded-md p-2 text-muted-foreground hover:bg-muted active:cursor-grabbing"
              type="button"
              aria-label={`${item.label}をドラッグして並べ替え`}
              {...controls.dragHandleProps}
            ><GripVerticalIcon class="size-4" /></button>
            <div class="flex flex-col">
              <Button variant="ghost" size="icon-sm" aria-label="上へ移動" onclick={controls.moveUp} disabled={!controls.canMoveUp}><ChevronUpIcon /></Button>
              <Button variant="ghost" size="icon-sm" aria-label="下へ移動" onclick={controls.moveDown} disabled={!controls.canMoveDown}><ChevronDownIcon /></Button>
            </div>
          </div>
        {/if}
        <span class="truncate font-medium">{item.label}</span>
        <span class="text-sm text-muted-foreground">{controls.locked ? "固定" : "移動可"}</span>
      {/snippet}
    </SortableList>
  </div>
</Story>
