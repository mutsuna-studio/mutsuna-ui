<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import MoreHorizontalIcon from "@lucide/svelte/icons/more-horizontal";
import Button from "@mutsuna/ui/button/button.svelte";
import DropdownMenu from "@mutsuna/ui/dropdown-menu/dropdown-menu.svelte";
import DropdownMenuCheckboxGroup from "@mutsuna/ui/dropdown-menu/dropdown-menu-checkbox-group.svelte";
import DropdownMenuCheckboxItem from "@mutsuna/ui/dropdown-menu/dropdown-menu-checkbox-item.svelte";
import DropdownMenuContent from "@mutsuna/ui/dropdown-menu/dropdown-menu-content.svelte";
import DropdownMenuItem from "@mutsuna/ui/dropdown-menu/dropdown-menu-item.svelte";
import DropdownMenuLabel from "@mutsuna/ui/dropdown-menu/dropdown-menu-label.svelte";
import DropdownMenuRadioGroup from "@mutsuna/ui/dropdown-menu/dropdown-menu-radio-group.svelte";
import DropdownMenuRadioItem from "@mutsuna/ui/dropdown-menu/dropdown-menu-radio-item.svelte";
import DropdownMenuSeparator from "@mutsuna/ui/dropdown-menu/dropdown-menu-separator.svelte";
import DropdownMenuShortcut from "@mutsuna/ui/dropdown-menu/dropdown-menu-shortcut.svelte";
import DropdownMenuSub from "@mutsuna/ui/dropdown-menu/dropdown-menu-sub.svelte";
import DropdownMenuSubContent from "@mutsuna/ui/dropdown-menu/dropdown-menu-sub-content.svelte";
import DropdownMenuSubTrigger from "@mutsuna/ui/dropdown-menu/dropdown-menu-sub-trigger.svelte";
import DropdownMenuTrigger from "@mutsuna/ui/dropdown-menu/dropdown-menu-trigger.svelte";

const { Story } = defineMeta({
  title: "UI/Dropdown Menu",
  component: DropdownMenu,
  tags: ["autodocs"],
});
</script>

<Story name="Default" asChild>
	<DropdownMenu>
		<DropdownMenuTrigger>
			{#snippet child({ props })}
				<Button {...props} variant="outline">操作を選択</Button>
			{/snippet}
		</DropdownMenuTrigger>
		<DropdownMenuContent>
			<DropdownMenuLabel>利用プラン</DropdownMenuLabel>
			<DropdownMenuItem>編集<DropdownMenuShortcut>⌘E</DropdownMenuShortcut></DropdownMenuItem>
			<DropdownMenuItem>複製</DropdownMenuItem>
			<DropdownMenuSeparator />
			<DropdownMenuItem variant="destructive">アーカイブ</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</Story>

<Story name="Checkbox And Radio" asChild>
	<DropdownMenu>
		<DropdownMenuTrigger>
			{#snippet child({ props })}
				<Button {...props} variant="outline">表示設定</Button>
			{/snippet}
		</DropdownMenuTrigger>
		<DropdownMenuContent class="w-48">
			<DropdownMenuLabel>列</DropdownMenuLabel>
			<DropdownMenuCheckboxGroup>
				<DropdownMenuCheckboxItem checked closeOnSelect={false}>料金</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem checked closeOnSelect={false}>ステータス</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem closeOnSelect={false}>作成日</DropdownMenuCheckboxItem>
			</DropdownMenuCheckboxGroup>
			<DropdownMenuSeparator />
			<DropdownMenuLabel>密度</DropdownMenuLabel>
			<DropdownMenuRadioGroup value="comfortable">
				<DropdownMenuRadioItem value="compact" closeOnSelect={false}>コンパクト</DropdownMenuRadioItem>
				<DropdownMenuRadioItem value="comfortable" closeOnSelect={false}>標準</DropdownMenuRadioItem>
			</DropdownMenuRadioGroup>
		</DropdownMenuContent>
	</DropdownMenu>
</Story>

<Story name="Sub Menu" asChild>
	<DropdownMenu>
		<DropdownMenuTrigger>
			{#snippet child({ props })}
				<Button {...props} size="icon" variant="outline" aria-label="メニュー">
					<MoreHorizontalIcon />
				</Button>
			{/snippet}
		</DropdownMenuTrigger>
		<DropdownMenuContent>
			<DropdownMenuItem>詳細を開く</DropdownMenuItem>
			<DropdownMenuSub>
				<DropdownMenuSubTrigger>ステータス変更</DropdownMenuSubTrigger>
				<DropdownMenuSubContent>
					<DropdownMenuItem>公開</DropdownMenuItem>
					<DropdownMenuItem>下書き</DropdownMenuItem>
					<DropdownMenuItem>停止</DropdownMenuItem>
				</DropdownMenuSubContent>
			</DropdownMenuSub>
		</DropdownMenuContent>
	</DropdownMenu>
</Story>
