<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
import { Button } from "@mutsuna/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@mutsuna/ui/collapsible";

const { Story } = defineMeta({
  title: "UI/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
});
</script>

<Story name="Default" asChild>
	<Collapsible class="grid max-w-md gap-2" open>
		<CollapsibleTrigger>
			{#snippet child({ props })}
				<Button {...props} variant="outline" class="w-full justify-between">
					詳細設定
					<ChevronDownIcon aria-hidden="true" />
				</Button>
			{/snippet}
		</CollapsibleTrigger>
		<CollapsibleContent class="text-muted-foreground rounded-md border p-4 text-sm">
			予約受付に関する追加条件を表示します。
		</CollapsibleContent>
	</Collapsible>
</Story>
