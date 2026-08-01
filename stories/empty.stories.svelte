<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import InboxIcon from "@lucide/svelte/icons/inbox";
import SearchXIcon from "@lucide/svelte/icons/search-x";
import Button from "@mutsuna/ui/button/button.svelte";
import Card from "@mutsuna/ui/card/card.svelte";
import CardContent from "@mutsuna/ui/card/card-content.svelte";
import Empty from "@mutsuna/ui/empty/empty.svelte";
import EmptyContent from "@mutsuna/ui/empty/empty-content.svelte";
import EmptyDescription from "@mutsuna/ui/empty/empty-description.svelte";
import EmptyHeader from "@mutsuna/ui/empty/empty-header.svelte";
import EmptyMedia from "@mutsuna/ui/empty/empty-media.svelte";
import EmptyTitle from "@mutsuna/ui/empty/empty-title.svelte";

const { Story } = defineMeta({
  title: "UI/Empty",
  component: Empty,
  tags: ["autodocs"],
});
</script>

<Story name="Default" asChild>
	<Empty class="max-w-xl">
		<EmptyHeader>
			<EmptyMedia variant="icon">
				<InboxIcon aria-hidden="true" />
			</EmptyMedia>
			<EmptyTitle>利用プランがまだありません</EmptyTitle>
			<EmptyDescription>予約者に提示するメニュー、プラン、コースを追加するとここに表示されます。</EmptyDescription>
		</EmptyHeader>
		<EmptyContent>
			<Button type="button">利用プランを追加</Button>
		</EmptyContent>
	</Empty>
</Story>

<Story name="Inside Card" asChild>
	<Card class="max-w-xl" variant="dashed">
		<CardContent class="py-6">
			<Empty class="min-h-52 border-0 p-0">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<InboxIcon aria-hidden="true" />
					</EmptyMedia>
					<EmptyTitle>会員プランがまだありません</EmptyTitle>
					<EmptyDescription>月額料金や対象店舗を設定した会員向けプランを作成します。</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button type="button">会員プランを追加</Button>
				</EmptyContent>
			</Empty>
		</CardContent>
	</Card>
</Story>

<Story name="No Results" asChild>
	<Empty class="max-w-xl">
		<EmptyHeader>
			<EmptyMedia variant="icon">
				<SearchXIcon aria-hidden="true" />
			</EmptyMedia>
			<EmptyTitle>条件に一致する予約はありません</EmptyTitle>
			<EmptyDescription>検索条件や期間を変更して、もう一度絞り込みを試してください。</EmptyDescription>
		</EmptyHeader>
		<EmptyContent>
			<Button type="button" variant="outline">条件をリセット</Button>
		</EmptyContent>
	</Empty>
</Story>
