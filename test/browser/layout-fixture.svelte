<script lang="ts">
  import { AdminShellFrame } from "@mutsuna/ui/admin-shell-frame";
  import { Button } from "@mutsuna/ui/button";
  import * as Sidebar from "@mutsuna/ui/sidebar";
  import { SidebarWorkspaceSwitcher } from "@mutsuna/ui/sidebar-identity";
  let { padding = "default", gutter = "stable", breadcrumb = false }: {
    padding?: "default" | "none"; gutter?: "stable" | "auto"; breadcrumb?: boolean;
  } = $props();
</script>
<AdminShellFrame pageTitle="コンポーネント一覧" contentPadding={padding} contentGutter={gutter} breadcrumb={breadcrumb ? crumbs : undefined}>
  {#snippet sidebar()}
    <Sidebar.Root collapsible="icon">
      <Sidebar.Header><SidebarWorkspaceSwitcher activeWorkspaceId="ui" workspaces={[{ id: "ui", name: "UIライブラリ" }]} /></Sidebar.Header>
    </Sidebar.Root>
  {/snippet}
  {#snippet headerActions()}<Button aria-label="ヘルプ" size="icon">?</Button>{/snippet}
  {#snippet children()}<div data-test-content style="height:100%;width:100%;overflow:auto"><div style="height:1400px">スクロールする本文</div></div>{/snippet}
</AdminShellFrame>
{#snippet crumbs()}<nav aria-label="パンくず">カタログ</nav>{/snippet}
