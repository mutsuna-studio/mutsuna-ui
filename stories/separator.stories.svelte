<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { Separator } from "@mutsuna/ui/separator";

const { Story } = defineMeta({
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs"],
});
</script>

<Story name="Horizontal" asChild>
	<div class="grid max-w-md gap-4">
		<div>
			<p class="font-medium">公開設定</p>
			<p class="text-muted-foreground text-sm">予約ページに表示する内容を管理</p>
		</div>
		<Separator />
		<p class="text-sm">公開中</p>
	</div>
</Story>

<Story name="Vertical" asChild>
	<div class="flex h-6 items-center gap-3 text-sm">
		<span>概要</span>
		<Separator orientation="vertical" />
		<span>設定</span>
		<Separator orientation="vertical" />
		<span>履歴</span>
	</div>
</Story>
