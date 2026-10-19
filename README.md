# @mutsuna/ui

[![npm](https://img.shields.io/npm/v/%40mutsuna%2Fui)](https://www.npmjs.com/package/@mutsuna/ui)
[![CI](https://github.com/mutsuna-studio/mutsuna-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/mutsuna-studio/mutsuna-ui/actions/workflows/ci.yml)
[![Storybook](https://img.shields.io/badge/Storybook-open-ff4785)](https://mutsuna-studio.github.io/mutsuna-ui/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Mutsuna製品で共通利用するSvelte 5 UI componentとdesign token。

Reusable Svelte 5 UI components and design tokens for Mutsuna products.

- [Storybook component catalog](https://mutsuna-studio.github.io/mutsuna-ui/)
- [npm package](https://www.npmjs.com/package/@mutsuna/ui)
- [Changelog](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/CHANGELOG.md)
- [Contributing](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/CONTRIBUTING.md)
- [Support](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/SUPPORT.md)
- [Security](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/SECURITY.md)

## Project status

このpackageはpublicに利用できるが、現在は`1.0.0`未満。後方互換なfixはpatch、新しい公開APIと破壊的変更はminor releaseとして公開する。更新前に[CHANGELOG](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/CHANGELOG.md)を確認する。非推奨化と削除猶予は[Support policy](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/SUPPORT.md#deprecation-policy)に従う。

## Requirements

- Node.js 22.14以降
- Svelte 5.55.2以降
- Tailwind CSS 4
- 開発時はpnpm 11.3

packageには`@sveltejs/package`で生成したJavaScript、Svelte component、型定義を収録する。

`@sveltejs/kit`は`@mutsuna/ui/sveltekit-form`を利用する場合だけ必要。

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

CSSの入口は用途に応じて選べます。

| import | 内容・必要な処理 |
| --- | --- |
| `@mutsuna/ui/theme.css` | 従来の全部入り。Tailwind v4の処理、アニメーション、部品の補助CSS、フォント、標準トークン |
| `@mutsuna/ui/tokens.css` | `:root` / `.dark` の標準CSS変数のみ。Tailwind処理・Svelte連携・フォント読み込みなし |
| `@mutsuna/ui/fonts.css` | 従来同梱しているテーマ用フォントの `@font-face` のみ。必要なときに追加 |

`tokens.css`は色・基準角丸を提供します。ユーティリティクラス、reset、全体の文字スタイル、Svelte部品用スタイルは含まないため、既存部品を使う場合は`theme.css`を選んでください。パッケージ全体の依存関係は従来どおりで、この分離はCSSの読み込みとビルドの依存を分けるものです。

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

## Public API

公開APIは`package.json`の`exports`に宣言されたsubpath、公開型、component props、events、snippets、CSS変数、theme contract。未宣言のdeep importはサポートしない。

新しいimportではcomponent単位の公開入口（例: `@mutsuna/ui/button`）を利用する。チャット画面は`@mutsuna/ui/chat`から関連部品と型をまとめてimportできる。既存のwildcard subpathは互換性を維持する。`internal/`は実装用で、公開subpathを提供しない。部品を追加する手順は[公開入口と内部実装](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/CONTRIBUTING.md#公開入口と内部実装)を参照。

componentと代表状態は[公開Storybook](https://mutsuna-studio.github.io/mutsuna-ui/)を正本として確認できる。主な分類:

- primitive: button、input、dialog、drawer、popover、select、table、tabsなど
- responsive overlay: responsive dialog
- form: field、form、date/time、filter select、form template editorなど
- admin UI: admin layout、admin shell、sidebar、data tableなど
- visual system: theme、theme CSS、scrollbar、color picker
- integration: SvelteKit form action helper

## 使い方ガイド

[ガイド一覧](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/docs/README.md)から用途別に探せる。componentの代表状態はStorybookを参照。

| ガイド | 内容 |
| --- | --- |
| <a id="searchable-select"></a><a id="cycleselect"></a><a id="floating-input-labels"></a><a id="editable-text"></a><a id="連結コントロールの作成"></a><a id="枠線に重ねるラベル"></a>[入力と選択](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/docs/components/inputs.md) | Select、CycleSelect、Input、EditableText、Slider、連結入力 |
| <a id="date-picker"></a><a id="datepicker"></a><a id="current-date-shortcuts"></a><a id="日付範囲カレンダー"></a><a id="日時入力の共通解析"></a>[日付と時刻](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/docs/components/date-time.md) | DatePicker、RangeCalendar、今日の操作、日時解析 |
| <a id="buttonのアイコンとローディング"></a><a id="consumerでの自動検出"></a>[ButtonとLoading](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/docs/components/button-and-loading.md) | アイコン、loading、consumer用lint CLI |
| <a id="dialogbody-の下余白"></a><a id="折りたたみサイドバーの一時展開"></a>[ダイアログとレイアウト](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/docs/components/dialogs-and-layout.md) | ResponsiveDialog、管理画面、Sidebar |
| [目次](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/docs/components/outline-nav.md) | OutlineNav・見出し階層・MessageScrollerとの連携 |
| [チャットUI](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/docs/components/chat.md) | `@mutsuna/ui/chat`・導入例・状態管理・AppShell連携 |
| <a id="code-editor"></a><a id="code-diff"></a>[CodeEditorとCodeDiff](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/docs/components/code-editor.md) | コード入力、比較、コピーとツールバー |
| <a id="eventcalendar日週月タイムライン表示"></a>[EventCalendar](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/docs/components/event-calendar.md) | 5種類の表示、操作通知、背景、取得状態、先読み |
| [テーマとスクロールバー](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/docs/theming.md) | ThemeProvider、プリセット、フォント、ScrollbarArea |
| <a id="astroで使う"></a>[Astroで使う](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/docs/astro.md) | 静的テーマ、Svelte連携、hydration |
| [SvelteKit form action](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/docs/sveltekit-form.md) | 通知、redirect、pending管理の専用入口 |

## Storybook

共通UIのcatalogは[GitHub Pages](https://mutsuna-studio.github.io/mutsuna-ui/)で公開している。ツールバーでテーマカラーとlight／darkを切り替え、`States` storyで代表状態を比較できる。

起動方法・分類・storyの追加方法は[Storybookガイド](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/docs/storybook.md)を参照。storyとStorybook設定はnpm packageへ含めない。

## Development

部品の追加は[開発ガイドの公開入口と内部実装](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/CONTRIBUTING.md#公開入口と内部実装)から始める。環境構築、テスト、changeset、PRの手順は[CONTRIBUTING.md](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/CONTRIBUTING.md)を参照。

<a id="design-tokensの編集"></a>
デザイン値の編集は[Design Tokens](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/tokens/README.md)へ。

<a id="shadcn-svelte-upstream-review"></a>
上流componentのreviewと同期は[保守ガイド](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/docs/maintenance.md)へ。公開手順の正本は[RELEASING.md](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/RELEASING.md)。

## Local Git hooks

設定と削除対象の条件は[ローカルGit hooks](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/docs/maintenance.md#local-git-hooks)を参照。

## Scope

汎用primitive、状態表現、form部品、管理画面向けの再利用可能な複合component、design tokenを公開対象とする。特定productのruntime型、永続化、業務actionは各appに置く。

## Community and support

- bugと機能提案: [GitHub Issues](https://github.com/mutsuna-studio/mutsuna-ui/issues/new/choose)
- 貢献方法: [CONTRIBUTING.md](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/CONTRIBUTING.md)
- 行動規範: [CODE_OF_CONDUCT.md](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/CODE_OF_CONDUCT.md)
- サポート範囲: [SUPPORT.md](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/SUPPORT.md)
- 脆弱性報告: [SECURITY.md](https://github.com/mutsuna-studio/mutsuna-ui/blob/main/SECURITY.md)

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
