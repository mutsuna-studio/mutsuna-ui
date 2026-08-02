<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Card from "@mutsuna/ui/card/card.svelte";
import CardContent from "@mutsuna/ui/card/card-content.svelte";
import CardHeader from "@mutsuna/ui/card/card-header.svelte";
import Skeleton from "@mutsuna/ui/skeleton/skeleton.svelte";

const { Story } = defineMeta({
  title: "UI/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
});
</script>

<Story name="Text Rows" asChild>
	<div class="grid max-w-xl gap-3">
		<Skeleton class="h-5 w-44" />
		<Skeleton class="h-4 w-full" />
		<Skeleton class="h-4 w-5/6" />
		<Skeleton class="h-4 w-2/3" />
	</div>
</Story>
<Story name="Card Loading" asChild>
	<Card class="max-w-xl">
		<CardHeader>
			<div class="flex items-start justify-between gap-4">
				<div class="grid flex-1 gap-2">
					<Skeleton class="h-5 w-32" />
					<Skeleton class="h-4 w-52" />
				</div>
				<Skeleton class="h-8 w-16 rounded-lg" />
			</div>
		</CardHeader>
		<CardContent class="grid gap-3">
			{#each [0, 1, 2] as row (row)}
				<div class="flex items-center justify-between gap-4 rounded-md border p-3">
					<div class="grid flex-1 gap-2">
						<Skeleton class="h-4 w-36" />
						<Skeleton class="h-3 w-24" />
					</div>
					<Skeleton class="h-6 w-20 rounded-full" />
				</div>
			{/each}
		</CardContent>
	</Card>
</Story>

<Story name="Dashboard Tiles" asChild>
	<div class="grid max-w-3xl gap-3 sm:grid-cols-3">
		{#each [0, 1, 2] as tile (tile)}
			<Card size="sm">
				<CardContent class="grid gap-2 pt-1">
					<Skeleton class="h-3 w-20" />
					<Skeleton class="h-8 w-16" />
					<Skeleton class="h-3 w-28" />
				</CardContent>
			</Card>
		{/each}
	</div>
</Story>
