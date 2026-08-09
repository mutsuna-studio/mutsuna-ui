<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import BadgeCheckIcon from "@lucide/svelte/icons/badge-check";
import BellIcon from "@lucide/svelte/icons/bell";
import CalendarDaysIcon from "@lucide/svelte/icons/calendar-days";
import CircleHelpIcon from "@lucide/svelte/icons/circle-help";
import CreditCardIcon from "@lucide/svelte/icons/credit-card";
import LogOutIcon from "@lucide/svelte/icons/log-out";
import MapIcon from "@lucide/svelte/icons/map";
import UsersIcon from "@lucide/svelte/icons/users";
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

const locations = [
  { id: "ginza", name: "Mutsuna 銀座店", description: "むつな工房" },
  { id: "shibuya", name: "Mutsuna 渋谷店", description: "むつな工房" },
];
const userPrimaryItems = [
  { id: "account", label: "アカウント", icon: BadgeCheckIcon },
  { id: "billing", label: "利用プラン", icon: CreditCardIcon },
];
const userSecondaryItems = [{ id: "logout", label: "ログアウト", icon: LogOutIcon }];
</script>

<Story name="Default" asChild parameters={{ layout: "fullscreen" }}>
  <AdminShellFrame pageTitle="予約一覧" bind:sidebarOpen>
    {#snippet sidebar()}
      <Sidebar.Root collapsible="icon" hideHeaderSeam>
        <Sidebar.Header>
          <SidebarWorkspaceSwitcher
            workspaces={locations}
            activeWorkspaceId="ginza"
            activeDescription="プロ"
            menuLabel="店舗切替"
            managementAction={{ href: "#location-management", label: "店舗管理へ" }}
          />
        </Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>予約管理</Sidebar.GroupLabel>
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton isActive tooltipContent="予約">
                    <CalendarDaysIcon aria-hidden="true" />
                    <span>予約</span>
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton tooltipContent="マップ">
                    <MapIcon aria-hidden="true" />
                    <span>マップ</span>
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton tooltipContent="顧客">
                    <UsersIcon aria-hidden="true" />
                    <span>顧客</span>
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
              </Sidebar.Menu>
            </Sidebar.GroupContent>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>
          <SidebarUserMenu
            user={{ name: "山田 太郎", email: "taro@example.com" }}
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
      <p class="text-sm text-muted-foreground">店舗切替、主要ナビゲーション、ユーザーメニューを備えた管理画面shell。</p>
      <div class="grid gap-3">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-semibold">本日の予約</h2>
          <Button size="sm">新しい予約</Button>
        </div>
        <div class="divide-y border-y">
          <div class="grid grid-cols-[5rem_1fr_auto] items-center gap-3 py-3 text-sm">
            <span class="font-medium">10:00</span>
            <span>初回相談</span>
            <span class="text-muted-foreground">山田 太郎</span>
          </div>
          <div class="grid grid-cols-[5rem_1fr_auto] items-center gap-3 py-3 text-sm">
            <span class="font-medium">13:30</span>
            <span>定期メンテナンス</span>
            <span class="text-muted-foreground">佐藤 花子</span>
          </div>
        </div>
      </div>
    </section>
  </AdminShellFrame>
</Story>
