<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import BadgeCheckIcon from "@lucide/svelte/icons/badge-check";
import BellIcon from "@lucide/svelte/icons/bell";
import CreditCardIcon from "@lucide/svelte/icons/credit-card";
import LogOutIcon from "@lucide/svelte/icons/log-out";
import { SidebarUserMenu, SidebarWorkspaceSwitcher } from "@mutsuna/ui/sidebar-identity";

const { Story } = defineMeta({
  title: "Patterns/Sidebar Identity",
  component: SidebarWorkspaceSwitcher,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
import * as Sidebar from "@mutsuna/ui/sidebar";

let activeWorkspaceId = $state("studio");
let switchingWorkspaceId = $state<string | null>(null);
let lastAction = $state("未操作");

const workspaces = [
  { id: "studio", name: "Mutsuna Studio", description: "プロフェッショナル" },
  { id: "design", name: "Design Workspace", description: "フリー" },
];

const primaryItems = [
  { id: "account", label: "アカウント", icon: BadgeCheckIcon, onSelect: () => (lastAction = "アカウント") },
  { id: "billing", label: "利用プラン", icon: CreditCardIcon, onSelect: () => (lastAction = "利用プラン") },
  { id: "notifications", label: "通知", icon: BellIcon, onSelect: () => (lastAction = "通知") },
];
const secondaryItems = [{ id: "logout", label: "ログアウト", icon: LogOutIcon, onSelect: () => (lastAction = "ログアウト") }];

function selectWorkspace(workspaceId: string): void {
  switchingWorkspaceId = workspaceId;
  window.setTimeout(() => {
    activeWorkspaceId = workspaceId;
    switchingWorkspaceId = null;
    lastAction = `${workspaceId}へ切替`;
  }, 400);
}
</script>

<Story name="Workspace Switcher and User Footer" asChild>
  <Sidebar.Provider class="min-h-[32rem] overflow-hidden rounded-lg border">
    <Sidebar.Root collapsible="icon" class="absolute">
      <Sidebar.Header>
        <SidebarWorkspaceSwitcher
          workspaces={workspaces}
          {activeWorkspaceId}
          activeDescription={workspaces.find((workspace) => workspace.id === activeWorkspaceId)?.description}
          {switchingWorkspaceId}
          managementAction={{ href: "#workspace-settings", label: "ワークスペースを管理" }}
          onSelectWorkspace={selectWorkspace}
        />
      </Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Group>
          <Sidebar.GroupLabel>管理</Sidebar.GroupLabel>
          <Sidebar.GroupContent>
            <Sidebar.Menu>
              <Sidebar.MenuItem><Sidebar.MenuButton isActive>プロジェクト</Sidebar.MenuButton></Sidebar.MenuItem>
              <Sidebar.MenuItem><Sidebar.MenuButton>メンバー</Sidebar.MenuButton></Sidebar.MenuItem>
            </Sidebar.Menu>
          </Sidebar.GroupContent>
        </Sidebar.Group>
      </Sidebar.Content>
      <Sidebar.Footer>
        <SidebarUserMenu
          user={{ name: "山田 太郎", email: "taro@example.com" }}
          {primaryItems}
          {secondaryItems}
        />
      </Sidebar.Footer>
      <Sidebar.Rail />
    </Sidebar.Root>
    <Sidebar.Inset class="min-w-0 p-6 text-sm">
      操作結果: {lastAction}
    </Sidebar.Inset>
  </Sidebar.Provider>
</Story>

<Story name="Loading and Empty" asChild>
  <Sidebar.Provider class="min-h-64 overflow-hidden rounded-lg border">
    <Sidebar.Root class="absolute">
      <Sidebar.Header>
        <SidebarWorkspaceSwitcher activeWorkspaceId={null} isLoading menuLabel="ワークスペースを切り替え" />
      </Sidebar.Header>
    </Sidebar.Root>
    <Sidebar.Inset class="min-w-0 p-6 text-sm">読み込み中と空状態</Sidebar.Inset>
  </Sidebar.Provider>
</Story>
