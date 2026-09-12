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

画面幅に応じてデスクトップではDialog、モバイルでは下方向のDrawerを使う場合は`ResponsiveDialog`を利用する。既存の`Dialog`と`Drawer`は自動変換されない。

```svelte
<script lang="ts">
import { Button } from "@mutsuna/ui/button";
import * as ResponsiveDialog from "@mutsuna/ui/responsive-dialog";
</script>

<ResponsiveDialog.Root>
  <ResponsiveDialog.Trigger>
    {#snippet child({ props })}
      <Button {...props}>編集</Button>
    {/snippet}
  </ResponsiveDialog.Trigger>
  <ResponsiveDialog.Content>
    <ResponsiveDialog.Header>
      <ResponsiveDialog.Title>プロフィールを編集</ResponsiveDialog.Title>
      <ResponsiveDialog.Description>内容を変更して保存します。</ResponsiveDialog.Description>
    </ResponsiveDialog.Header>
    <ResponsiveDialog.Body>フォーム内容</ResponsiveDialog.Body>
    <ResponsiveDialog.Footer>
      <ResponsiveDialog.Close>
        {#snippet child({ props })}
          <Button {...props} variant="outline">閉じる</Button>
        {/snippet}
      </ResponsiveDialog.Close>
    </ResponsiveDialog.Footer>
  </ResponsiveDialog.Content>
</ResponsiveDialog.Root>
```

既定のbreakpointは`768px`。`mode="desktop"`または`mode="mobile"`で表示方式を固定できる。SSRでは既定でDialogをfallbackとして描画し、必要に応じて`ssrMode="mobile"`を指定する。表示モード判定の内部基盤はprimitiveに依存せず、将来のAlert Dialogや用途別Popoverとの組み合わせでも再利用できる。

theme colorは`ThemeProvider`でCSS変数へ反映する。永続化先は利用側が管理する。

プリセットはオレンジ（標準）、ブルー、グリーン、ローズ、ニュートラル、アンバー、ライム、ティール、シアン、インディゴ、バイオレット、フューシャ、スレート、Svelte、Claude-inspired、GitHub-inspired、Linear-inspired、Notion-inspiredの18種類。`@mutsuna/ui/theme`の`themeTemplates`から一覧を取得し、`findThemeTemplate("teal")`の戻り値を`ThemeProvider`へ渡せる。`Foundations/Theme`の`All Presets`で全色を比較できる。各プリセットはprimaryとsidebarの背景色・文字色、ringを切り替え、light／darkモードと組み合わせて使う。

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

Svelteプリセットは[公式サイト](https://svelte.dev/)の2026年9月時点の配色・フォントを参考に、背景、カード、ポップオーバー、文字、境界線、サイドバー、角丸も適用する。ボタンはロゴ色の`#ff3e00`ではなく、公式UI用アクセント（light: `#d43008`、dark: `#b32d00`）と白文字を使う。UIはFira Sans、見出しはDM Serif Display、本文の`p`はEB Garamond、`font-mono`はFira Monoを使用する。フォントはOFL-1.1のFontsource依存からローカル配信し、日本語など未収録の文字はfallback fontを使う。サイト固有のレイアウトや各コンポーネントの余白・サイズは本パッケージの設計を維持する。

Claude-inspired（key: `claude`）はClaudeチャットアプリの公開CSS（2026年9月のv2トークン）と[公式Chat紹介](https://academy.claude.com/tutorials/navigating-the-claude-desktop-app)を参考にした非公式プリセット。チャット背景・入力面・サイドバーの階調を分け、primaryはクレイ色、サイドバーの選択はニュートラル色にする。UI・説明文はInter、見出しはGeorgia、日本語は「Hiragino Sans」「Yu Gothic」などのゴシック体へfallbackする。専用フォントとロゴは同梱しないため書体の完全一致は保証しない。`Foundations/Theme → Claude Chat`で余白と入力欄を含めて確認できる。チャット画面へのログイン検証は行っておらず、公開配信されるアプリ共通トークンと公式紹介画像を参照している。

追加のアプリ風プリセットはいずれも非公式。GitHub-inspired（`github`）は[Primerの配色](https://primer.style/product/primitives/color/)を基に、緑のprimary、青の選択・focus、system fontを使う。Linear-inspired（`linear`）は[公式UI紹介](https://linear.app/changelog/2024-03-20-new-linear-ui)を参考にした青紫・ニュートラル背景・Interの近似。Notion-inspired（`notion`）は[公式の表示設定と画面例](https://www.notion.com/help/customize-and-style-your-content)を参考に、標準sans-serifの文書面、淡いサイドバー、小さい角丸を再現する。後二者の色値は公式トークンの完全移植ではなく、通常文字のコントラストを確保した近似であり、アプリ固有の操作やレイアウトは複製しない。

`Theme.appearance`は任意の追加CSSトークン（`ThemeAppearance`）。省略した既存テーマも引き続き利用できる。`themeToCssVariables()`は追加トークンも返し、未指定値は`null`となるため、独自の適用処理でも`null`の変数を削除すること。`ThemeProvider`は切り替え時の削除とunmount時の復元を行う。ライト／ダークの配色はCSSの`light-dark()`で切り替わり、従来どおり`.dark`クラスでモードを制御する。

theme colorに追従するscrollbarは`ScrollbarArea`を使う。

```svelte
<script lang="ts">
import { ScrollbarArea } from "@mutsuna/ui/scrollbar";
</script>

<ScrollbarArea class="max-h-80 overflow-y-auto">
  <!-- scrollable content -->
</ScrollbarArea>
```

範囲Sliderでは、各つまみの読み上げ名と単位付きの読み上げ値を指定できる。

```svelte
<script lang="ts">
import { Slider } from "@mutsuna/ui/slider";

let priceRange = $state([20, 80]);
</script>

<Slider
  type="multiple"
  bind:value={priceRange}
  min={0}
  max={100}
  step={5}
  aria-label="価格帯"
  thumbLabels={["最低価格", "最高価格"]}
  getThumbValueText={(value) => `${value}万円`}
/>
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

### shadcn-svelte upstream review

shadcn-svelte由来componentは、npmの最新安定版に対応する公式Git tagとcommit SHAを基準に差分を確認する。

```sh
pnpm sync:shadcn
pnpm review:shadcn -- button
```

`sync:shadcn`は`nova` registryの純正版を`upstream/shadcn-svelte/candidate`へ取得し、前回review済みBASEとの差分、dependency変更、3-way merge previewの状態を生成する。`src/lib`は変更しない。

review結果はcomponentごとに記録する。

```sh
pnpm review:shadcn -- button --decision applied --note "a11y修正を手動で反映"
pnpm review:shadcn -- badge --decision reviewed-no-change --note "見た目だけの変更のため不採用"
pnpm review:shadcn -- --finalize
```

`--apply`はreview済みBASEが存在する場合だけ利用でき、競合のない既存ファイルだけを適用する。追加、削除、競合、公開contract、dependency変更は手動で判断する。`--finalize`は全対象の判断が完了したときだけcandidateを次のBASEへ昇格する。週次workflowはcandidateとreview summaryを含むdraft pull requestまでを作成し、Mutsuna UI本体、release、npm publishは自動化しない。

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

- primitive: button、input、dialog、drawer、popover、select、table、tabsなど
- responsive overlay: responsive dialog
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

ツールバーの「テーマカラー」と「表示モード」から、全storyのブランドカラーとlight／dark表示を切り替えられる。代表的なcomponentは`States` storyでvariant、size、disabled、loading、error、長文などを一画面で比較する。

sidebarはcomponentの役割で分類し、storyの`title`を分類の正本にする。

| 分類 | 役割 |
| --- | --- |
| `Foundations` | theme、scrollbar、client境界など横断基盤 |
| `Components/Actions` | buttonなど操作の起点 |
| `Components/Inputs` | 値の入力・選択・編集 |
| `Components/Forms` | label、field、form構成と複合form |
| `Components/Navigation` | breadcrumb、menu、sidebar、tabs |
| `Components/Data Display` | avatar、badge、calendar、card、table |
| `Components/Feedback` | alert、empty、loading、skeleton、toast |
| `Components/Overlays` | dialog、drawer、popover、sheet、tooltip |
| `Components/Layout` | collapsible、separatorなど配置・区切り |
| `Patterns` | 複数componentを組み合わせた再利用可能なUIパターン |

各componentのDocs、Controls、Accessibility panelを同じstoryから生成する。実ブラウザで全storyのrender、a11y、`play`による代表操作を検証するには次を実行する。

```sh
pnpm test:storybook
```

すべてのstoryのa11y違反はCIを失敗させる。`todo`の例外を追加せず、componentまたはstoryの責務に応じて違反を解消する。

## Development

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm build-storybook
pnpm test:storybook
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

### CycleSelect

`@mutsuna/ui/cycle-select` exposes `CycleSelect`, `CycleSelectProps`, and `CycleSelectOption`.
The label button advances to the next enabled option; the right button opens the standard Select list.

```svelte
<script lang="ts">
  import { CycleSelect } from "@mutsuna/ui/cycle-select";
  let value = $state("compact");
  const options = [
    { value: "compact", label: "Compact" },
    { value: "detailed", label: "Detailed" },
  ];
</script>

<CycleSelect bind:value {options} ariaLabel="Display" />
```

Options must have unique, nonempty values. Cycling follows array order, skips disabled options,
and wraps to the start. An empty or unknown value advances to the first enabled option.
If no different enabled option exists, only the advance button is disabled; an empty or entirely
disabled list disables the list trigger too. Changing options does not automatically change the value.
Both actions update `bind:value` and call `onValueChange`. `name` enables form submission.
Use `disabled`, `size`, `class`, `placeholder`, `nextLabel`, `listLabel`, `aria-invalid`, and
`aria-describedby` to configure state and accessible labels. Both buttons support keyboard operation;
the list retains Select keyboard navigation and focus handling.

### Floating Input labels

Use `<Input label="Display name" />` for an accessible floating label. The label moves
to a notch in the border on focus and remains there while a value is present. An omitted
`id` is generated automatically. Existing inputs without `label` keep their usual appearance.
Date/time inputs always raise the label to avoid overlapping native input UI. File, hidden,
checkbox, radio, range, color, and button inputs do not support floating labels; use an external
label for those types. `placeholder` is shown only while focused in floating mode.

### DatePicker

```svelte
<script lang="ts">
  import { DatePicker } from "@mutsuna/ui/date-picker";
  let value = $state("2026-09");
</script>
<DatePicker precision="month" bind:value ariaLabel="対象年月" />
```

`showWeekday` (default false) appends the Japanese weekday in day mode, such as
`2026年9月9日(水)`. It does not change the stored value and is ignored for year/month.

`precision` is `year`, `month`, or `day` (default). Values and inclusive `min`/`max`
bounds are `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`, respectively. Direct input accepts only
4, 6, or 8 ASCII digits. Enter commits; invalid dates (including nonexistent days),
out-of-range values and `isDateUnavailable(value)` matches show an error. Escape or
clicking outside discards edits. Selection commits immediately. Default bounds span
1900–2100. Changing bounds or precision does not rewrite the value; the caller must
supply a value and bounds matching the new precision. Invalid bounds disable opening.

`showCurrent` (default true) shows 今年/今月/今日 according to precision; `currentLabel`
customizes its label. It uses the device's local date and respects the same constraints.
`name`, `disabled`, `size`, `class`, `id`, `placeholder`, `aria-invalid`, and
`aria-describedby` are supported. `onValueChange` fires only for a changed committed value.

Breaking migration: replace `MonthPicker` from `@mutsuna/ui/month-picker` with
`DatePicker precision="month"` from `@mutsuna/ui/date-picker`. Rename `showCurrentMonth`
to `showCurrent` and `currentMonthLabel` to `currentLabel`. No compatibility exports remain.

### Current date shortcuts

Calendar shows a `今日` action by default. It selects today's local date and moves the
visible month to it, respecting `disabled`, `readonly`, `minValue`, `maxValue`,
`isDateDisabled`, and `isDateUnavailable`. Multiple selection adds today without removing
other dates. Use `showToday={false}` to hide it or `todayLabel` to change its text.

## Buttonのアイコンとローディング

アイコンは`icon`、処理状態は`loading`へ渡してください。`loading`中は通常のアイコンがスピナーに置き換わり、操作が無効になります。ラベルは維持されます。アイコンだけのボタンには`aria-label`を指定してください。

```svelte
<script lang="ts">
  import { Button } from '@mutsuna/ui/button';
  import SaveIcon from '@lucide/svelte/icons/save';
  let saving = $state(false);
</script>

<Button icon={SaveIcon} loading={saving}>保存</Button>
<Button icon={SaveIcon} loading={saving} size="icon" aria-label="保存" />
```

`<Button loading><SaveIcon />保存</Button>`のようなアイコンや独自スピナーの直書きは避けてください。子要素はローディング中も描画されるため、二重表示になります。`iconPosition="end"`の場合も`loading`で通常アイコンが置き換わります。

### consumerでの自動検出

このパッケージに同梱するCLIをconsumerのcheckやCIへ追加できます。ESLintの導入は不要です。

```json
{
  "scripts": {
    "lint:ui": "mutsuna-ui-lint src"
  }
}
```

`pnpm lint:ui`は、公開エントリ`@mutsuna/ui`・`@mutsuna/ui/button`からimportされたButton内のLucideアイコンとインラインSVGを検出し、ファイル・行・列と修正方法を出力して終了コード1を返します。別名import、namespace import、条件分岐やラッパー要素内も対象です。`loading`の有無にかかわらず同じ用法を要求します。自動修正はしません。

引数はファイルまたはディレクトリを複数指定できます。依存・ビルド出力ディレクトリとシンボリックリンクは走査しません。独自ラッパーや再export経由のButton、独自アイコン、別のsnippetから動的に渡す内容は検出対象外です。CLIの導入は任意で、既存の描画やchildren APIは変更しません。


## Editable Text

`bind:value`で値を受け取り、保存処理が必要なときだけ`onCommit`を指定します。値が変わらない確定では通知しません。

```svelte
<script lang="ts">
import { EditableText } from "@mutsuna/ui/editable-text";
import { Button } from "@mutsuna/ui/button";

let name = $state("表示名");
</script>

<EditableText bind:value={name} aria-label="表示名を編集" />

<EditableText bind:value={name} editOn="doubleClick" aria-label="表示名を編集">
  {#snippet trigger({ value, props })}
    <Button {...props} variant="ghost">{value}</Button>
  {/snippet}
</EditableText>
```

- 通常はクリックで編集。`editOn="doubleClick"`ではダブルクリックまたはF2で編集し、Enter／Spaceはボタンのアクションに使えます。
- Enterで確定、Escapeで取消し。`multiline`ではEnterで改行、Cmd/Ctrl+Enterで確定します。IME変換中のEnterでは確定しません。
- キーで編集を終えるとtriggerへフォーカスが戻ります。blurでは既定で確定し、`commitOnBlur={false}`なら取り消します。blur先のフォーカスは移動させません。
- 編集中に`disabled`になった場合は取り消します。
- `onclick`・`ondblclick`・`onkeydown`は内部処理と連携し、編集開始を止めたい場合は`event.preventDefault()`を使えます。
- カスタムtriggerは`props`をbuttonへそのままspreadしてください。`Button`も利用できます。独自componentの場合はイベント・属性・Svelte attachmentをDOMのbuttonへ転送します。これで`bind:ref`とフォーカス復帰も動きます。
- ダブルクリックモードのマウス単クリックは250ms待ってから`onclick`を呼びます。OSのダブルクリック判定時間とは独立しているため、遅いダブルクリックでは先に単クリックが実行されることがあります。取消不能な操作には別ボタンを使ってください。遅延callback内の`event.currentTarget`は利用できません。

公開型は`EditableTextProps`、`EditableTextTriggerProps`、`EditableTextCommit`、`EditableTextCancel`を提供します。
