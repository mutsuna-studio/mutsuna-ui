<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import BadgeCheckIcon from "@lucide/svelte/icons/badge-check";
import LogOutIcon from "@lucide/svelte/icons/log-out";
import { SidebarUserMenu, SidebarWorkspaceSwitcher } from "@mutsuna/ui/sidebar-identity";
import CalendarDaysIcon from "@lucide/svelte/icons/calendar-days";
import SettingsIcon from "@lucide/svelte/icons/settings";
import UsersIcon from "@lucide/svelte/icons/users";
import * as Sidebar from "@mutsuna/ui/sidebar";

const { Story } = defineMeta({
  title: "Components/Navigation/Sidebar",
  component: Sidebar.Sidebar,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
let open = $state(false);
let activeWorkspaceId = $state("studio");
let lastAction = $state("未操作");
const workspaces = [
  { id: "studio", name: "Mutsuna Studio", description: "プロフェッショナル" },
  { id: "design", name: "Design Workspace", description: "フリー" },
];
const primaryItems = [{ id: "account", label: "アカウント", icon: BadgeCheckIcon, onSelect: () => lastAction = "アカウントを選択" }];
const secondaryItems = [{ id: "logout", label: "ログアウト", icon: LogOutIcon, onSelect: () => lastAction = "ログアウトを選択" }];

const navigation = [
  { label: "プロジェクト", icon: CalendarDaysIcon, active: true },
  { label: "メンバー", icon: UsersIcon, active: false },
  { label: "設定", icon: SettingsIcon, active: false },
];
</script>

<Story name="Navigation" asChild>
	<Sidebar.Provider bind:open class="relative min-h-[32rem] overflow-hidden rounded-lg border">
		<Sidebar.Root collapsible="icon" class="absolute h-full">
            <Sidebar.Header class="h-14 shrink-0 justify-center border-b py-1">
                <SidebarWorkspaceSwitcher
                    {workspaces}
                    {activeWorkspaceId}
                    activeDescription={workspaces.find(workspace => workspace.id === activeWorkspaceId)?.description}
                    onSelectWorkspace={(id) => { activeWorkspaceId = id; lastAction = `${id}へ切替`; }}
                />
            </Sidebar.Header>
			<Sidebar.Content>
				<Sidebar.Group>
					<Sidebar.GroupLabel>管理</Sidebar.GroupLabel>
					<Sidebar.GroupContent>
						<Sidebar.Menu>
							{#each navigation as item (item.label)}
								<Sidebar.MenuItem>
									<Sidebar.MenuButton isActive={item.active} tooltipContent={item.label}>
										<item.icon />
										<span>{item.label}</span>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							{/each}
						</Sidebar.Menu>
					</Sidebar.GroupContent>
				</Sidebar.Group>
			</Sidebar.Content>
            <Sidebar.Footer class="shrink-0 border-t">
                <SidebarUserMenu user={{ name: "管理者", email: "admin@example.com" }} {primaryItems} {secondaryItems} />
            </Sidebar.Footer>
			<Sidebar.Rail />
		</Sidebar.Root>
		<Sidebar.Inset class="min-w-0">
			<header class="flex h-14 items-center gap-3 border-b px-4">
				<Sidebar.Trigger />
				<span class="font-medium">ワークスペース</span>
			</header>
			<div class="p-6 text-sm">アイコンにホバー、またはTabキーでフォーカスすると重ねて展開します。メイン領域の幅は変わりません。<p class="mt-4" role="status">操作結果: {lastAction}</p></div>
		</Sidebar.Inset>
	</Sidebar.Provider>
</Story>
