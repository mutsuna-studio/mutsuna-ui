<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import BadgeCheckIcon from "@lucide/svelte/icons/badge-check";
import BellIcon from "@lucide/svelte/icons/bell";
import BlocksIcon from "@lucide/svelte/icons/blocks";
import BookOpenIcon from "@lucide/svelte/icons/book-open";
import CircleHelpIcon from "@lucide/svelte/icons/circle-help";
import LogOutIcon from "@lucide/svelte/icons/log-out";
import PaletteIcon from "@lucide/svelte/icons/palette";
import PanelsTopLeftIcon from "@lucide/svelte/icons/panels-top-left";
import { AdminShellFrame } from "@mutsuna/ui/admin-shell-frame";
import { SidebarUserMenu, SidebarWorkspaceSwitcher } from "@mutsuna/ui/sidebar-identity";

const { Story } = defineMeta({
  title: "Patterns/App Shell",
  component: AdminShellFrame,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
import Button from "@mutsuna/ui/button/button.svelte";
import * as Sidebar from "@mutsuna/ui/sidebar";

let sidebarOpen = $state(true);

const libraries = [
  { id: "ui", name: "@mutsuna/ui", description: "UIコンポーネント" },
];
const userPrimaryItems = [
  { id: "profile", label: "プロフィール", icon: BadgeCheckIcon },
  { id: "docs", label: "ドキュメント", icon: BookOpenIcon },
];
const userSecondaryItems = [{ id: "logout", label: "ログアウト", icon: LogOutIcon }];
const components = [
  { name: "Button", category: "入力", status: "公開中" },
  { name: "Input", category: "入力", status: "公開中" },
  { name: "Textarea", category: "入力", status: "公開中" },
  { name: "Select", category: "入力", status: "公開中" },
  { name: "Checkbox", category: "入力", status: "公開中" },
  { name: "Switch", category: "入力", status: "公開中" },
  { name: "Slider", category: "入力", status: "公開中" },
  { name: "Calendar", category: "日時", status: "公開中" },
  { name: "TimePicker", category: "日時", status: "公開中" },
  { name: "Dialog", category: "オーバーレイ", status: "公開中" },
  { name: "Sheet", category: "オーバーレイ", status: "公開中" },
  { name: "Popover", category: "オーバーレイ", status: "公開中" },
  { name: "Tooltip", category: "フィードバック", status: "公開中" },
  { name: "Toast", category: "フィードバック", status: "公開中" },
  { name: "Table", category: "データ表示", status: "公開中" },
  { name: "DataTable", category: "データ表示", status: "公開中" },
  { name: "Sidebar", category: "レイアウト", status: "公開中" },
  { name: "AdminShellFrame", category: "レイアウト", status: "公開中" },
];
</script>

<Story name="Default" asChild parameters={{ layout: "fullscreen" }}>
  <AdminShellFrame pageTitle="コンポーネント一覧" bind:sidebarOpen>
    {#snippet sidebar()}
      <Sidebar.Root collapsible="icon" hideHeaderSeam>
        <Sidebar.Header>
          <SidebarWorkspaceSwitcher
            workspaces={libraries}
            activeWorkspaceId="ui"
            activeDescription="UIパッケージ"
            menuLabel="ライブラリ"
            managementAction={{ href: "#package", label: "パッケージ情報" }}
          />
        </Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>UIライブラリ</Sidebar.GroupLabel>
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton isActive tooltipContent="コンポーネント">
                    <BlocksIcon aria-hidden="true" />
                    <span>コンポーネント</span>
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton tooltipContent="パターン">
                    <PanelsTopLeftIcon aria-hidden="true" />
                    <span>パターン</span>
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton tooltipContent="テーマ">
                    <PaletteIcon aria-hidden="true" />
                    <span>テーマ</span>
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
              </Sidebar.Menu>
            </Sidebar.GroupContent>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>
          <SidebarUserMenu
            user={{ name: "UI Maintainer", email: "ui@example.com" }}
            primaryItems={userPrimaryItems}
            secondaryItems={userSecondaryItems}
          />
        </Sidebar.Footer>
        <Sidebar.Rail hideHeaderSeam />
      </Sidebar.Root>
    {/snippet}
    {#snippet headerActions()}
      <Button size="icon-sm" variant="ghost" aria-label="通知"><BellIcon aria-hidden="true" /></Button>
      <Button size="icon-sm" variant="ghost" aria-label="ヘルプ"><CircleHelpIcon aria-hidden="true" /></Button>
    {/snippet}
    <section class="grid gap-6 pt-3">
      <p class="text-sm text-muted-foreground">@mutsuna/ui の再利用可能なコンポーネントとレイアウトパターンを確認できます。</p>
      <div class="grid gap-3">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-semibold">UIコンポーネント</h2>
          <Button size="sm">Storyを追加</Button>
        </div>
        <div class="divide-y border-y">
          {#each components as component}
            <div class="grid grid-cols-[minmax(7rem,1fr)_7rem_auto] items-center gap-3 py-3 text-sm">
              <span class="min-w-0 truncate font-medium" title={component.name}>{component.name}</span>
              <span class="whitespace-nowrap">{component.category}</span>
              <span class="text-muted-foreground">{component.status}</span>
            </div>
          {/each}
        </div>
      </div>
    </section>
  </AdminShellFrame>
</Story>
