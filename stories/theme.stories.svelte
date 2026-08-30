<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Button from "@mutsuna/ui/button/button.svelte";
import Card from "@mutsuna/ui/card/card.svelte";
import CardContent from "@mutsuna/ui/card/card-content.svelte";
import CardDescription from "@mutsuna/ui/card/card-description.svelte";
import CardHeader from "@mutsuna/ui/card/card-header.svelte";
import CardTitle from "@mutsuna/ui/card/card-title.svelte";
import { createTheme, ThemeProvider, themeTemplates, type Theme } from "@mutsuna/ui/theme";

const midToneCustomTheme = createTheme("custom", "oklch(0.7 0 0)");

type StoryArgs = {
  heading: string;
  theme: Theme;
};

const { Story } = defineMeta({
  title: "UI/Theme",
  component: ThemeProvider,
  args: {
    heading: "オレンジテーマ",
    theme: themeTemplates[0],
  } satisfies StoryArgs,
  render: template,
  tags: ["autodocs"],
});
</script>

{#snippet template({ heading, theme }: StoryArgs)}
	<ThemeProvider {theme}>
		<Card class="max-w-md">
			<CardHeader>
				<CardTitle>{heading}</CardTitle>
				<CardDescription>primary、foreground、sidebar、ringをまとめて切り替える。</CardDescription>
			</CardHeader>
			<CardContent class="flex items-center gap-3">
				<Button>保存</Button>
				<span class="text-foreground decoration-primary text-sm font-medium underline decoration-2 underline-offset-4">リンクテキスト</span>
				<span class="border-primary/30 bg-primary/5 rounded-md border px-3 py-1 text-sm">選択状態</span>
			</CardContent>
		</Card>
	</ThemeProvider>
{/snippet}

<Story name="Orange" />
<Story name="Blue" args={{ heading: "ブルーテーマ", theme: themeTemplates[1] }} />
<Story name="Green" args={{ heading: "グリーンテーマ", theme: themeTemplates[2] }} />
<Story name="Rose" args={{ heading: "ローズテーマ", theme: themeTemplates[3] }} />
<Story name="Neutral" args={{ heading: "ニュートラルテーマ", theme: themeTemplates[4] }} />
<Story name="Custom Mid Tone Contrast" args={{ heading: "中間明度のカスタムテーマ", theme: midToneCustomTheme }} />
