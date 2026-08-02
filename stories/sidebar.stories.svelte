<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import CalendarDaysIcon from "@lucide/svelte/icons/calendar-days";
import SettingsIcon from "@lucide/svelte/icons/settings";
import UsersIcon from "@lucide/svelte/icons/users";
import * as Sidebar from "@mutsuna/ui/sidebar";

const { Story } = defineMeta({
  title: "UI/Sidebar",
  component: Sidebar.Sidebar,
  tags: ["autodocs"],
});
</script>

<script lang="ts">
let open = $state(true);

const navigation = [
  { label: "プロジェクト", icon: CalendarDaysIcon, active: true },
  { label: "メンバー", icon: UsersIcon, active: false },
  { label: "設定", icon: SettingsIcon, active: false },
];
</script>

<Story name="Navigation" asChild>
	<Sidebar.Provider bind:open class="min-h-[32rem] overflow-hidden rounded-lg border">
		<Sidebar.Root collapsible="icon" class="absolute">
			<Sidebar.Header class="border-b p-4 font-semibold">Mutsuna</Sidebar.Header>
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
			<Sidebar.Footer class="border-t p-3 text-sm">管理者</Sidebar.Footer>
			<Sidebar.Rail />
		</Sidebar.Root>
		<Sidebar.Inset class="min-w-0">
			<header class="flex h-14 items-center gap-3 border-b px-4">
				<Sidebar.Trigger />
				<span class="font-medium">ワークスペース</span>
			</header>
			<div class="p-6 text-sm">サイドバーを開閉して表示を確認</div>
		</Sidebar.Inset>
	</Sidebar.Provider>
</Story>
