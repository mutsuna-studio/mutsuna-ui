# @mutsuna/ui

[![npm](https://img.shields.io/npm/v/%40mutsuna%2Fui)](https://www.npmjs.com/package/@mutsuna/ui)
[![CI](https://github.com/mutsuna-studio/mutsuna-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/mutsuna-studio/mutsuna-ui/actions/workflows/ci.yml)
[![Storybook](https://img.shields.io/badge/Storybook-open-ff4785)](https://mutsuna-studio.github.io/mutsuna-ui/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Mutsuna製品で共通利用するSvelte 5 UI componentとdesign token。

Reusable Svelte 5 UI components and design tokens for Mutsuna products.

- [Storybook component catalog](https://mutsuna-studio.github.io/mutsuna-ui/)
- [npm package](https://www.npmjs.com/package/@mutsuna/ui)
- [Changelog](./CHANGELOG.md)
- [Contributing](./CONTRIBUTING.md)
- [Support](./SUPPORT.md)
- [Security](./SECURITY.md)

## Project status

このpackageはpublicに利用できるが、現在は`1.0.0`未満。後方互換なfixはpatch、新しい公開APIと破壊的変更はminor releaseとして公開する。更新前に[CHANGELOG](./CHANGELOG.md)を確認する。非推奨化と削除猶予は[Support policy](./SUPPORT.md#deprecation-policy)に従う。

## Install

```sh
pnpm add @mutsuna/ui
# or
npm install @mutsuna/ui
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

CSSだけで動くloading indicatorは`Loading`のvariantから選択する。色は`currentColor`でthemeへ追従し、OSの視差効果を減らす設定にも対応する。

```svelte
<script lang="ts">
import { Loading } from "@mutsuna/ui/loading";
</script>

<Loading variant="dots" label="予約情報を読み込み中" />
<Loading variant="bars" size="lg" />
<Loading variant="morphing-infinity" label="回答を生成中" />
```

利用可能なvariant一覧は`loadingVariants`から取得できる。

```ts
import { loadingVariants } from "@mutsuna/ui/loading";
```

Loading UI由来のCSS-only patternは、対応可能な構文だけを同期する。

```sh
pnpm sync:loading-ui
```

同期処理は上流registryとsourceを検査し、Motion依存や未知の構文を自動生成対象から除外する。`morphing-infinity`は追加依存なしのCSSパス補間へ手動移植し、自動同期でも保持する。定期workflowは生成差分を直接releaseせず、review可能なpull requestとして作成する。

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

- Node.js 22.14以降
- Svelte 5.55.2以降
- Tailwind CSS 4
- 開発時はpnpm 11.3

packageには`@sveltejs/package`で生成したJavaScript、Svelte component、型定義を収録する。

`@sveltejs/kit`は`@mutsuna/ui/sveltekit-form`を利用する場合だけ必要。

## Public API

公開APIは`package.json`の`exports`に宣言されたsubpath、公開型、component props、events、snippets、CSS変数、theme contract。未宣言のdeep importはサポートしない。

componentと代表状態は[公開Storybook](https://mutsuna-studio.github.io/mutsuna-ui/)を正本として確認できる。主な分類:

- primitive: button、input、dialog、popover、select、table、tabsなど
- form: field、form、date/time、filter select、form template editorなど
- admin UI: admin layout、admin shell、sidebar、data tableなど
- visual system: theme、theme CSS、scrollbar、color picker
- integration: SvelteKit form action helper

## Storybook

共通UIのcatalogは[GitHub Pages](https://mutsuna-studio.github.io/mutsuna-ui/)で公開している。localではpackage単独で起動する。

```sh
pnpm storybook
```

`http://localhost:6206`で確認可能。storyとStorybook設定はnpm packageへ含めない。

## Development

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm build-storybook
pnpm test:consumer
```

変更のscope、changeset、pull request手順は[CONTRIBUTING.md](./CONTRIBUTING.md)を参照する。

## Local Git hooks

開発用cloneでは、初回に次を実行してrepository管理のGit hooksを有効化する。

```sh
git config --local core.hooksPath .githooks
```

以後、`main`をpullしてPRのmergeを取り込むたびに、対応するlocal branchを自動削除する。削除対象は、GitHub上で`main`へmerge済みのPR headとlocal branchの現在のcommitが完全一致し、他のworktreeで使用されていないbranchだけ。手動確認は次で行える。

```sh
node scripts/cleanup-merged-branches.mjs --dry-run
```

## Scope

汎用primitive、状態表現、form部品、管理画面向けの再利用可能な複合component、design tokenを公開対象とする。特定productのruntime型、永続化、業務actionは各appに置く。

## Community and support

- bugと機能提案: [GitHub Issues](https://github.com/mutsuna-studio/mutsuna-ui/issues/new/choose)
- 貢献方法: [CONTRIBUTING.md](./CONTRIBUTING.md)
- 行動規範: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- サポート範囲: [SUPPORT.md](./SUPPORT.md)
- 脆弱性報告: [SECURITY.md](./SECURITY.md)

## License

[MIT](./LICENSE)。upstreamの著作権表示とライセンスを含む。

## Acknowledgements

This package includes components adapted from
[shadcn-svelte](https://www.shadcn-svelte.com/), licensed under the MIT License.

shadcn-svelte is a Svelte/SvelteKit port of shadcn/ui. Components in this
package have been modified for Japanese applications and the Mutsuna design
system.

This project is not affiliated with or endorsed by shadcn-svelte.

CSS-only loading indicators are adapted from
[Loading UI](https://loading-ui.com/), licensed under the MIT License.

This project is not affiliated with or endorsed by Loading UI.
