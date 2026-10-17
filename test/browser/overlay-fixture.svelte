<script lang="ts">
  import * as Drawer from "@mutsuna/ui/drawer";
  import * as ResponsiveDialog from "@mutsuna/ui/responsive-dialog";
  let { kind = "drawer", initialOpen = false, showHandle = true }: {
    kind?: "drawer" | "responsive"; initialOpen?: boolean; showHandle?: boolean;
  } = $props();
</script>
{#if kind === "drawer"}
  <Drawer.Root defaultOpen={initialOpen}>
    <Drawer.Trigger>開く</Drawer.Trigger>
    <Drawer.Content {showHandle}>
      <Drawer.Title>親の画面</Drawer.Title>
      <Drawer.Description>親の説明</Drawer.Description>
      <Drawer.Close>閉じる</Drawer.Close>
      <Drawer.NestedRoot>
        <Drawer.Trigger>子を開く</Drawer.Trigger>
        <Drawer.Content>
          <Drawer.Title>子の画面</Drawer.Title>
          <Drawer.Description>子の説明</Drawer.Description>
          <Drawer.Close>子を閉じる</Drawer.Close>
        </Drawer.Content>
      </Drawer.NestedRoot>
    </Drawer.Content>
  </Drawer.Root>
{:else}
  <ResponsiveDialog.Root>
    <ResponsiveDialog.Trigger>開く</ResponsiveDialog.Trigger>
    <ResponsiveDialog.Content>
      <ResponsiveDialog.Title>応答する画面</ResponsiveDialog.Title>
      <ResponsiveDialog.Description>画面幅で表示方式を選ぶ</ResponsiveDialog.Description>
      <ResponsiveDialog.Close>閉じる</ResponsiveDialog.Close>
    </ResponsiveDialog.Content>
  </ResponsiveDialog.Root>
{/if}
