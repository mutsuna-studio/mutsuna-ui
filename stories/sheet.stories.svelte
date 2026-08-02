<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { Button } from "@mutsuna/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@mutsuna/ui/sheet";

const { Story } = defineMeta({
  title: "UI/Sheet",
  component: Sheet,
  tags: ["autodocs"],
});
</script>

<Story name="Default" asChild>
  <Sheet>
    <SheetTrigger>
      {#snippet child({ props })}
        <Button {...props} variant="outline">詳細を開く</Button>
      {/snippet}
    </SheetTrigger>
    <SheetContent>
      <SheetHeader>
        <SheetTitle>予約の詳細</SheetTitle>
        <SheetDescription>予約者と利用時間を確認できます。</SheetDescription>
      </SheetHeader>
      <div class="grid gap-2 px-4 text-sm">
        <p>予約者: 山田 花子</p>
        <p>利用時間: 10:00–11:00</p>
      </div>
      <SheetFooter>
        <Button>保存</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</Story>
