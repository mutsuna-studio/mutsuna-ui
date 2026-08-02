# @mutsuna/ui

Mutsuna製品で共通利用するSvelte 5 UI componentとdesign token。

## Install

```sh
pnpm add @mutsuna/ui
```

利用側のglobal stylesheetでthemeを読み込む。

```css
@import "@mutsuna/ui/theme.css";
```

componentはroot exportまたはcomponent単位のsubpathからimportする。

```svelte
<script lang="ts">
import { Button } from "@mutsuna/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@mutsuna/ui/card";
</script>

<Card>
  <CardHeader>
    <CardTitle>設定</CardTitle>
  </CardHeader>
  <CardContent>
    <Button>保存</Button>
  </CardContent>
</Card>
```

theme colorは`ThemeProvider`でCSS変数へ反映する。永続化先は利用側が管理する。

```svelte
<script lang="ts">
import { Button } from "@mutsuna/ui/button";
import { ThemeProvider, createTheme } from "@mutsuna/ui/theme";

const theme = createTheme("custom", "oklch(0.546 0.175 252.58)");
</script>

<ThemeProvider {theme}>
  <Button>保存</Button>
</ThemeProvider>
```

theme colorに追従するscrollbarは`ScrollbarArea`を使う。

```svelte
<script lang="ts">
import { ScrollbarArea } from "@mutsuna/ui/scrollbar";
</script>

<ScrollbarArea class="max-h-80 overflow-y-auto">
  <!-- scrollable content -->
</ScrollbarArea>
```

管理画面向けの複合componentもsubpath単位で利用可能。

```svelte
<script lang="ts">
import { BusinessHoursFields } from "@mutsuna/ui/business-hours-fields";
import { DateTimeRangeFields } from "@mutsuna/ui/date-time-range-fields";
import { FormTemplateEditor } from "@mutsuna/ui/form-template-editor";
import { MarkdownTextEditor } from "@mutsuna/ui/markdown";
import { TemplateInsertMenu } from "@mutsuna/ui/template-insert-menu";
import { AdminShellFrame } from "@mutsuna/ui/admin-shell-frame";
import { AdminPage, AdminPageHeader, AdminPanel } from "@mutsuna/ui/admin-layout";
</script>
```

`FormTemplateEditor`の表示条件と`TemplateInsertMenu`のpayload/categoryは利用側が型と選択肢を定義する。永続化、業務validation、API変換は利用側の責務。

SvelteKit form actionの通知、redirect、pending管理は専用subpathから利用する。

```ts
import { createFormActionToastEnhancer } from "@mutsuna/ui/sveltekit-form";
```

`@mutsuna/ui/sveltekit-form`を利用するprojectだけ`@sveltejs/kit`が必要。

## Requirements

- Svelte 5
- Tailwind CSS 4

packageには`@sveltejs/package`で生成したJavaScript、Svelte component、型定義を収録する。

## Storybook

共通UIのcatalogはpackage単独で起動する。

```sh
pnpm dev:ui:storybook
```

`http://localhost:6206`で確認可能。storyとStorybook設定はnpm packageへ含めない。

## Scope

汎用primitive、状態表現、form部品、管理画面向けの再利用可能な複合component、design tokenを公開対象とする。特定productのruntime型、永続化、業務actionは各appに置く。

## Acknowledgements

This package includes components adapted from
[shadcn-svelte](https://www.shadcn-svelte.com/), licensed under the MIT License.

shadcn-svelte is a Svelte/SvelteKit port of shadcn/ui. Components in this
package have been modified for Japanese applications and the Mutsuna design
system.

This project is not affiliated with or endorsed by shadcn-svelte.
