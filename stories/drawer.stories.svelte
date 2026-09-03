<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { Button } from "@mutsuna/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@mutsuna/ui/drawer";
import { expect, fireEvent, userEvent, within } from "storybook/test";

const drawerSides = ["top", "right", "bottom", "left"] as const;

const { Story } = defineMeta({
  title: "Components/Overlays/Drawer",
  component: Drawer,
  tags: ["autodocs"],
});

</script>

<Story
  name="Default"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "詳細を開く" }));

    const drawer = await within(document.body).findByRole("dialog", { name: "項目の詳細" });
    await expect(drawer).toHaveAttribute("data-vaul-drawer-direction", "bottom");
    await expect(within(drawer).getByText("下方向へスワイプして閉じられます。")).toBeInTheDocument();
  }}
  asChild
>
  <Drawer>
    <DrawerTrigger>
      {#snippet child({ props })}
        <Button {...props} variant="outline">詳細を開く</Button>
      {/snippet}
    </DrawerTrigger>
    <DrawerContent>
      <div class="mx-auto flex w-full max-w-md flex-col">
        <DrawerHeader>
          <DrawerTitle>項目の詳細</DrawerTitle>
          <DrawerDescription>下方向へスワイプして閉じられます。</DrawerDescription>
        </DrawerHeader>
        <div class="grid gap-2 px-4 text-sm">
          <p>担当者: 山田 花子</p>
          <p>利用時間: 10:00–11:00</p>
        </div>
        <DrawerFooter>
          <Button>保存</Button>
          <DrawerClose>
            {#snippet child({ props })}
              <Button {...props} type="button" variant="outline">閉じる</Button>
            {/snippet}
          </DrawerClose>
        </DrawerFooter>
      </div>
    </DrawerContent>
  </Drawer>
</Story>

<Story name="Sides" asChild>
  <div class="flex flex-wrap gap-2">
    {#each drawerSides as direction (direction)}
      <Drawer {direction}>
        <DrawerTrigger>
          {#snippet child({ props })}
            <Button {...props} variant="outline">{direction}</Button>
          {/snippet}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{direction} drawer</DrawerTitle>
            <DrawerDescription>{direction}側から展開するパネルです。</DrawerDescription>
          </DrawerHeader>
          <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-8 text-sm">
            <p>パネル全体を外側へスワイプすると閉じられます。</p>
          </div>
          <DrawerFooter>
            <DrawerClose>
              {#snippet child({ props })}
                <Button {...props} type="button" variant="outline">閉じる</Button>
              {/snippet}
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    {/each}
  </div>
</Story>

<Story
  name="Scrollable Content"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "長い内容を開く" }));

    const drawer = await within(document.body).findByRole("dialog", { name: "スクロール可能な内容" });
    const scrollRegion = within(drawer).getByTestId("drawer-scroll-region");
    scrollRegion.scrollTop = 160;
    await fireEvent.scroll(scrollRegion);
    await expect(drawer).toHaveAttribute("data-state", "open");
    await expect(scrollRegion.scrollTop).toBe(160);
    await expect(within(drawer).getByTestId("drawer-no-drag-region")).toHaveAttribute("data-vaul-no-drag");
  }}
  asChild
>
  <Drawer scrollLockTimeout={0}>
    <DrawerTrigger>
      {#snippet child({ props })}
        <Button {...props} variant="outline">長い内容を開く</Button>
      {/snippet}
    </DrawerTrigger>
    <DrawerContent>
      <div class="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
        <DrawerHeader class="shrink-0">
          <DrawerTitle>スクロール可能な内容</DrawerTitle>
          <DrawerDescription>内容をスクロールしている間はDrawerのドラッグを開始しません。</DrawerDescription>
        </DrawerHeader>
        <div
          data-testid="drawer-scroll-region"
          id="drawer-scroll-region"
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 text-sm"
        >
          <a href="#drawer-scroll-end" class="mb-4 inline-flex underline underline-offset-4">最後のセクションへ移動</a>
          {#each Array.from({ length: 20 }) as _, index (index)}
            <p class="mb-4 leading-6">
              セクション {index + 1} — パネル内の長い内容を確認するためのサンプルテキストです。
            </p>
          {/each}
          <div
            data-vaul-no-drag
            data-testid="drawer-no-drag-region"
            class="overflow-x-auto whitespace-nowrap rounded-lg border p-3"
          >
            <a href="#drawer-scroll-region" class="underline underline-offset-4">
              この領域はdata-vaul-no-dragにより独自のスクロール操作を優先します。
            </a>
          </div>
          <div id="drawer-scroll-end">内容の終端です。</div>
        </div>
        <DrawerFooter class="shrink-0">
          <DrawerClose>
            {#snippet child({ props })}
              <Button {...props} type="button" variant="outline">閉じる</Button>
            {/snippet}
          </DrawerClose>
        </DrawerFooter>
      </div>
    </DrawerContent>
  </Drawer>
</Story>
