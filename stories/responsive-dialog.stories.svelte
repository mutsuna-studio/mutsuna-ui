<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { Button } from "@mutsuna/ui/button";
import { Input } from "@mutsuna/ui/input";
import { Label } from "@mutsuna/ui/label";
import * as ResponsiveDialog from "@mutsuna/ui/responsive-dialog";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

const { Story } = defineMeta({
  title: "Components/Overlays/Responsive Dialog",
  component: ResponsiveDialog.Root,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
let transitionMode: "desktop" | "mobile" = $state("desktop");
let transitionValue = $state("初期値");
</script>

<Story
  name="Automatic"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "プロフィールを編集" }));

    const dialog = await within(document.body).findByRole("dialog", { name: "プロフィールを編集" });
    const isMobile = canvasElement.ownerDocument.defaultView?.matchMedia("(max-width: 767px)").matches ?? false;
    await expect(dialog).toHaveAttribute("data-slot", isMobile ? "drawer-content" : "dialog-content");
    await expect(within(dialog).getByDisplayValue("山田 花子")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "キャンセル" }));
    await waitFor(() => expect(within(document.body).queryByRole("dialog", { name: "プロフィールを編集" })).not.toBeInTheDocument());
    await waitFor(() => expect(getComputedStyle(document.body).pointerEvents).not.toBe("none"));
  }}
  asChild
>
  <ResponsiveDialog.Root>
    <ResponsiveDialog.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="outline">プロフィールを編集</Button>
      {/snippet}
    </ResponsiveDialog.Trigger>
    <ResponsiveDialog.Content>
      <ResponsiveDialog.Header>
        <ResponsiveDialog.Title>プロフィールを編集</ResponsiveDialog.Title>
        <ResponsiveDialog.Description>
          768px未満ではスワイプで閉じられるDrawerとして表示します。
        </ResponsiveDialog.Description>
      </ResponsiveDialog.Header>
      <ResponsiveDialog.Body class="grid gap-4 py-4">
        <Label class="grid gap-2">
          名前
          <Input value="山田 花子" />
        </Label>
        <Label class="grid gap-2">
          メールアドレス
          <Input type="email" value="hanako@example.com" />
        </Label>
      </ResponsiveDialog.Body>
      <ResponsiveDialog.Footer>
        <ResponsiveDialog.Close>
          {#snippet child({ props })}
            <Button {...props} type="button" variant="outline">キャンセル</Button>
          {/snippet}
        </ResponsiveDialog.Close>
        <Button type="button">保存</Button>
      </ResponsiveDialog.Footer>
    </ResponsiveDialog.Content>
  </ResponsiveDialog.Root>
</Story>

<Story
  name="Mode Change While Open"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(getComputedStyle(document.body).pointerEvents).not.toBe("none"));
    await userEvent.click(canvas.getByRole("button", { name: "切替テストを開く" }));

    const documentBody = within(document.body);
    const dialog = await documentBody.findByRole("dialog", { name: "表示方式の切替テスト" });
    const input = within(dialog).getByRole("textbox", { name: "入力内容" });
    await fireEvent.input(input, { target: { value: "kept value" } });
    await userEvent.click(within(dialog).getByRole("button", { name: "モバイル方式へ変更" }));

    await expect(dialog).toHaveAttribute("data-slot", "dialog-content");
    await expect(input).toHaveValue("kept value");

    await userEvent.click(within(dialog).getByRole("button", { name: "閉じる" }));
    await waitFor(() =>
      expect(documentBody.queryByRole("dialog", { name: "表示方式の切替テスト" })).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(getComputedStyle(document.body).pointerEvents).not.toBe("none"));
    const switchedTrigger = canvas.getByRole("button", { name: "切替テストを開く" });
    await expect(switchedTrigger).toHaveFocus();
    await userEvent.click(switchedTrigger);

    const drawer = await documentBody.findByRole("dialog", { name: "表示方式の切替テスト" });
    await expect(drawer).toHaveAttribute("data-slot", "drawer-content");
    await userEvent.click(within(drawer).getByRole("button", { name: "閉じる" }));
    await waitFor(() => expect(getComputedStyle(document.body).pointerEvents).not.toBe("none"));
  }}
  asChild
>
  <ResponsiveDialog.Root mode={transitionMode}>
    <ResponsiveDialog.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="outline">切替テストを開く</Button>
      {/snippet}
    </ResponsiveDialog.Trigger>
    <ResponsiveDialog.Content>
      <ResponsiveDialog.Header>
        <ResponsiveDialog.Title>表示方式の切替テスト</ResponsiveDialog.Title>
        <ResponsiveDialog.Description>
          開いている間は同じprimitiveを維持し、閉じた後に表示方式を切り替えます。
        </ResponsiveDialog.Description>
      </ResponsiveDialog.Header>
      <ResponsiveDialog.Body class="grid gap-4 py-4">
        <Label class="grid gap-2">
          入力内容
          <Input bind:value={transitionValue} />
        </Label>
        <Button type="button" variant="outline" onclick={() => (transitionMode = "mobile")}>
          モバイル方式へ変更
        </Button>
      </ResponsiveDialog.Body>
      <ResponsiveDialog.Footer>
        <ResponsiveDialog.Close>
          {#snippet child({ props })}
            <Button {...props} type="button" variant="outline">閉じる</Button>
          {/snippet}
        </ResponsiveDialog.Close>
      </ResponsiveDialog.Footer>
    </ResponsiveDialog.Content>
  </ResponsiveDialog.Root>
</Story>

<Story
  name="Mobile Drawer"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(getComputedStyle(document.body).pointerEvents).not.toBe("none"));
    await userEvent.click(canvas.getByRole("button", { name: "モバイル表示を開く" }));

    const drawer = await within(document.body).findByRole("dialog", { name: "モバイル表示" });
    await expect(drawer).toHaveAttribute("data-slot", "drawer-content");
    await expect(drawer).toHaveAttribute("data-vaul-drawer-direction", "bottom");
    await userEvent.click(within(drawer).getByRole("button", { name: "閉じる" }));
    await waitFor(() => expect(within(document.body).queryByRole("dialog", { name: "モバイル表示" })).not.toBeInTheDocument());
  }}
  asChild
>
  <ResponsiveDialog.Root mode="mobile">
    <ResponsiveDialog.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="outline">モバイル表示を開く</Button>
      {/snippet}
    </ResponsiveDialog.Trigger>
    <ResponsiveDialog.Content>
      <ResponsiveDialog.Header>
        <ResponsiveDialog.Title>モバイル表示</ResponsiveDialog.Title>
        <ResponsiveDialog.Description>
          表示モードを固定し、Drawer側の公開contractを確認するStoryです。
        </ResponsiveDialog.Description>
      </ResponsiveDialog.Header>
      <ResponsiveDialog.Body class="py-4">
        同じ子コンポーネントがモバイルではDrawerのcontext内に描画されます。
      </ResponsiveDialog.Body>
      <ResponsiveDialog.Footer>
        <ResponsiveDialog.Close>
          {#snippet child({ props })}
            <Button {...props} type="button" variant="outline">閉じる</Button>
          {/snippet}
        </ResponsiveDialog.Close>
      </ResponsiveDialog.Footer>
    </ResponsiveDialog.Content>
  </ResponsiveDialog.Root>
</Story>
