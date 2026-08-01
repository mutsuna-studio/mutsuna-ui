<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import InfoIcon from "@lucide/svelte/icons/info";
import Button from "@mutsuna/ui/button/button.svelte";
import Tooltip from "@mutsuna/ui/tooltip/tooltip.svelte";
import TooltipContent from "@mutsuna/ui/tooltip/tooltip-content.svelte";
import TooltipProvider from "@mutsuna/ui/tooltip/tooltip-provider.svelte";
import TooltipTrigger from "@mutsuna/ui/tooltip/tooltip-trigger.svelte";

const { Story } = defineMeta({
  title: "UI/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
});

const tooltipSides = ["top", "right", "bottom", "left"] as const;
</script>

<Story name="Default" asChild>
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button {...props} size="icon" variant="outline" aria-label="説明">
						<InfoIcon />
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent sideOffset={6}>予約者に表示される公開説明です。</TooltipContent>
		</Tooltip>
	</TooltipProvider>
</Story>

<Story name="Sides" asChild>
	<TooltipProvider>
		<div class="flex max-w-xl items-center gap-3">
			{#each tooltipSides as side (side)}
				<Tooltip>
					<TooltipTrigger>
						{#snippet child({ props })}
							<Button {...props} variant="outline">{side}</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent side={side} sideOffset={6}>{side} に表示</TooltipContent>
				</Tooltip>
			{/each}
		</div>
	</TooltipProvider>
</Story>

<Story name="Disabled Control" asChild>
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<span {...props} class="inline-flex">
						<Button type="button" disabled>保存</Button>
					</span>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent sideOffset={6}>必須項目を入力すると保存できます。</TooltipContent>
		</Tooltip>
	</TooltipProvider>
</Story>
