<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import ClaudeChatPreview from "./claude-chat-preview.svelte";
import Button from "@mutsuna/ui/button/button.svelte";
import Card from "@mutsuna/ui/card/card.svelte";
import CardContent from "@mutsuna/ui/card/card-content.svelte";
import CardDescription from "@mutsuna/ui/card/card-description.svelte";
import CardHeader from "@mutsuna/ui/card/card-header.svelte";
import CardTitle from "@mutsuna/ui/card/card-title.svelte";
import { createTheme, findThemeTemplate, themeToCssVariables, ThemeProvider, themeTemplates, type Theme } from "@mutsuna/ui/theme";

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

<Story name="Orange" />
<Story name="Blue" args={{ heading: "ブルーテーマ", theme: themeTemplates[1] }} />
<Story name="Green" args={{ heading: "グリーンテーマ", theme: themeTemplates[2] }} />
<Story name="Rose" args={{ heading: "ローズテーマ", theme: themeTemplates[3] }} />
<Story name="Neutral" args={{ heading: "ニュートラルテーマ", theme: themeTemplates[4] }} />
<Story name="Custom Mid Tone Contrast" args={{ heading: "中間明度のカスタムテーマ", theme: midToneCustomTheme }} />

<Story name="Amber" args={{ heading: "アンバーテーマ", theme: findThemeTemplate("amber")! }} />
<Story name="Lime" args={{ heading: "ライムテーマ", theme: findThemeTemplate("lime")! }} />
<Story name="Teal" args={{ heading: "ティールテーマ", theme: findThemeTemplate("teal")! }} />
<Story name="Cyan" args={{ heading: "シアンテーマ", theme: findThemeTemplate("cyan")! }} />
<Story name="Indigo" args={{ heading: "インディゴテーマ", theme: findThemeTemplate("indigo")! }} />
<Story name="Violet" args={{ heading: "バイオレットテーマ", theme: findThemeTemplate("violet")! }} />
<Story name="Fuchsia" args={{ heading: "フューシャテーマ", theme: findThemeTemplate("fuchsia")! }} />
<Story name="Slate" args={{ heading: "スレートテーマ", theme: findThemeTemplate("slate")! }} />

<Story name="Svelte" args={{ heading: "Svelteテーマ", theme: findThemeTemplate("svelte")! }} />

<Story name="Claude Inspired" args={{ heading: "Claude-inspired テーマ", theme: findThemeTemplate("claude")! }} />
<Story name="Claude Chat" parameters={{ layout: "fullscreen", docs: { description: { story: "チャット画面の余白・入力欄・色面積を確認するローカルプレビュー。入力内容は外部送信されません。専用フォントとロゴは複製していません。" } } }}>
  <ClaudeChatPreview theme={findThemeTemplate("claude")!} />
</Story>

<Story name="GitHub inspired" args={{ heading: "GitHub-inspired テーマ", theme: findThemeTemplate("github")! }} />
<Story name="Linear inspired" args={{ heading: "Linear-inspired テーマ", theme: findThemeTemplate("linear")! }} />
<Story name="Notion inspired" args={{ heading: "Notion-inspired テーマ", theme: findThemeTemplate("notion")! }} />

<Story name="All Presets">
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
