<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Button from "@mutsuna/ui/button/button.svelte";
import Input from "@mutsuna/ui/input/input.svelte";
import Label from "@mutsuna/ui/label/label.svelte";
import Popover from "@mutsuna/ui/popover/popover.svelte";
import PopoverClose from "@mutsuna/ui/popover/popover-close.svelte";
import PopoverContent from "@mutsuna/ui/popover/popover-content.svelte";
import PopoverDescription from "@mutsuna/ui/popover/popover-description.svelte";
import PopoverHeader from "@mutsuna/ui/popover/popover-header.svelte";
import PopoverTitle from "@mutsuna/ui/popover/popover-title.svelte";
import PopoverTrigger from "@mutsuna/ui/popover/popover-trigger.svelte";

const { Story } = defineMeta({
  title: "UI/Popover",
  component: Popover,
  tags: ["autodocs"],
});

const popoverSides = ["top", "right", "bottom", "left"] as const;
</script>

<Story name="Default" asChild>
	<Popover>
		<PopoverTrigger>
			{#snippet child({ props })}
				<Button {...props} variant="outline">受付条件</Button>
			{/snippet}
		</PopoverTrigger>
		<PopoverContent align="start">
			<PopoverHeader>
				<PopoverTitle>受付条件</PopoverTitle>
				<PopoverDescription>予約者が選択できる条件を調整します。</PopoverDescription>
			</PopoverHeader>
			<div class="grid gap-3">
				<Label class="grid gap-2">
					最短受付
					<Input value="60分前" />
				</Label>
				<Label class="grid gap-2">
					最長受付
					<Input value="30日前" />
				</Label>
			</div>
			<div class="flex justify-end gap-2">
				<PopoverClose>
					{#snippet child({ props })}
						<Button {...props} type="button" size="sm" variant="outline">閉じる</Button>
					{/snippet}
				</PopoverClose>
				<Button type="button" size="sm">適用</Button>
			</div>
		</PopoverContent>
	</Popover>
</Story>

<Story name="Placement" asChild>
	<div class="flex max-w-xl items-center gap-3">
		{#each popoverSides as side (side)}
			<Popover>
				<PopoverTrigger>
					{#snippet child({ props })}
						<Button {...props} variant="outline">{side}</Button>
					{/snippet}
				</PopoverTrigger>
				<PopoverContent {side}>
					<PopoverHeader>
						<PopoverTitle>{side} popover</PopoverTitle>
						<PopoverDescription>表示位置の確認用です。</PopoverDescription>
					</PopoverHeader>
				</PopoverContent>
			</Popover>
		{/each}
	</div>
</Story>
