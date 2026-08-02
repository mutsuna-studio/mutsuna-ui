<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import { ScrollbarArea } from "@mutsuna/ui/scrollbar";

type StoryArgs = {
  gutter: "stable" | "both-edges";
  state?: "visible" | "fading-out";
};

const { Story } = defineMeta({
  title: "UI/Scrollbar",
  component: ScrollbarArea,
  args: {
    gutter: "stable",
  } satisfies StoryArgs,
  render: template,
  tags: ["autodocs"],
});
</script>

{#snippet template({ gutter, state }: StoryArgs)}
	<ScrollbarArea
		{gutter}
		data-scrollbar-state={state}
		class="h-64 max-w-xl overflow-y-auto rounded-xl border bg-background p-4"
	>
		<div class="grid gap-3">
			{#each Array.from({ length: 16 }, (_, index) => index + 1) as item (item)}
				<div class="rounded-lg border bg-card p-3 text-sm text-card-foreground">スクロール項目 {item}</div>
			{/each}
		</div>
	</ScrollbarArea>
{/snippet}

<Story name="Default" />
<Story name="Visible" args={{ state: "visible" }} />
<Story name="Fading Out" args={{ state: "fading-out" }} />
<Story name="Both Edges" args={{ gutter: "both-edges", state: "visible" }} />
