<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { AdminShellFrame } from "@mutsuna/ui/admin-shell-frame";

const { Story } = defineMeta({
  title: "Patterns/Admin Shell Frame",
  component: AdminShellFrame,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
import Button from "@mutsuna/ui/button/button.svelte";
import * as Sidebar from "@mutsuna/ui/sidebar";

let sidebarOpen = $state(true);
</script>

<Story name="Default" asChild parameters={{ layout: "fullscreen" }}>
  <AdminShellFrame pageTitle="予約一覧" bind:sidebarOpen>
    {#snippet sidebar()}
      <Sidebar.Root collapsible="icon">
        <Sidebar.Header class="p-3 font-medium">Mutsuna Admin</Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>運営</Sidebar.GroupLabel>
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                <Sidebar.MenuItem><Sidebar.MenuButton isActive>予約一覧</Sidebar.MenuButton></Sidebar.MenuItem>
                <Sidebar.MenuItem><Sidebar.MenuButton>顧客一覧</Sidebar.MenuButton></Sidebar.MenuItem>
              </Sidebar.Menu>
            </Sidebar.GroupContent>
          </Sidebar.Group>
        </Sidebar.Content>
      </Sidebar.Root>
    {/snippet}
    {#snippet headerActions()}
      <Button size="sm" variant="outline">ヘルプ</Button>
    {/snippet}
    <section class="grid gap-4 pt-3">
      <p class="text-sm text-muted-foreground">sidebar、breadcrumb、header actionを差し替えられる管理画面shell。</p>
      <div class="min-h-80 rounded-lg border bg-card p-4">Main content</div>
    </section>
  </AdminShellFrame>
</Story>
