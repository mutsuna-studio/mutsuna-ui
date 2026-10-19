<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import Button from "@mutsuna/ui/button/button.svelte";
import Card from "@mutsuna/ui/card/card.svelte";
import CardContent from "@mutsuna/ui/card/card-content.svelte";
import CardDescription from "@mutsuna/ui/card/card-description.svelte";
import CardHeader from "@mutsuna/ui/card/card-header.svelte";
import CardTitle from "@mutsuna/ui/card/card-title.svelte";
import { createTheme, themeToCssVariables, ThemeProvider, themeTemplates, type Theme } from "@mutsuna/ui/theme";

const midToneCustomTheme = createTheme("custom", "oklch(0.7 0 0)");

type StoryArgs = {
  heading: string;
  theme: Theme;
};

const { Story } = defineMeta({
  title: "Foundations/Theme",
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
		<div class="bg-background text-foreground p-6 font-sans">
		<Card class="max-w-md">
			<CardHeader>
				<CardTitle>{heading}</CardTitle>
				<CardDescription>配色・背景・タイポグラフィを確認できます。</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-wrap items-center gap-3">
				<Button>保存</Button>
				<span class="text-foreground decoration-primary text-sm font-medium underline decoration-2 underline-offset-4">リンクテキスト</span>
				<span class="border-primary/30 bg-primary/5 rounded-md border px-3 py-1 text-sm">選択状態</span>
			</CardContent>
		</Card>
      <p class="mt-4 text-xl">Design for the web. 本文のサンプルです。</p>
      <pre class="mt-4 bg-muted p-4 font-mono text-sm">{`const theme = "${theme.source}";`}</pre>
    </div>
	</ThemeProvider>
{/snippet}

<Story name="Preview" asChild parameters={{ controls: { disable: true } }}>
  <div class="bg-background text-foreground grid max-w-md gap-4 rounded-xl border p-6"><h2 class="text-lg font-semibold">テーマの基本表示</h2><p>ツールバーのテーマカラーと表示モードで全体の配色を確認できます。</p><div class="flex gap-2"><Button>保存</Button><Button variant="outline">キャンセル</Button><Button disabled>無効</Button></div><div class="rounded-md bg-sidebar-primary p-3 text-sidebar-primary-foreground">選択中の項目</div></div>
</Story>

<Story name="Custom Mid Tone Contrast" args={{ heading: "中間明度のカスタムテーマ", theme: midToneCustomTheme }} />

<Story name="All Presets" parameters={{ controls: { disable: true } }}>
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {#each themeTemplates as preset (preset.key)}
      <section
        class="rounded-xl border bg-background p-5 text-foreground font-sans"
        style={themeToCssVariables(preset).filter(([, value]) => value !== null).map(([name, value]) => `${name}: ${value}`).join(";")}
      >
        <h2 class="text-base font-semibold">{preset.name}</h2>
        <p class="mt-1 text-sm text-muted-foreground">{preset.description}</p>
        <p class="mt-1 text-xs text-muted-foreground">{preset.key} · {preset.previewHex}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <Button>保存</Button>
          <Button disabled>無効</Button>
          <Button variant="outline">キャンセル</Button>
        </div>
        <div class="mt-4 rounded-md bg-sidebar-primary px-3 py-2 text-sm text-sidebar-primary-foreground">選択中のメニュー</div>
      </section>
    {/each}
  </div>
</Story>
