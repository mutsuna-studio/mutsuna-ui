# Contributing to @mutsuna/ui

Issueやpull requestによる貢献を歓迎します。参加する前に[Code of Conduct](./CODE_OF_CONDUCT.md)を確認してください。

## Before opening an issue

- 既存Issueを検索し、重複がないか確認する。
- セキュリティ上の問題は公開Issueへ書かず、[Security Policy](./SECURITY.md)に従って非公開で報告する。
- consumer固有のAPI、権限、永続化、業務ルールは対象consumer repositoryへ報告する。

## Development setup

必要な環境:

- Node.js 22.14以降
- pnpm 11.3

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
git config --local core.hooksPath .githooks
```

Storybookは次で起動する。

```sh
pnpm storybook
```

## Repository scope

このrepositoryには、product固有の業務知識を持たず、複数productで再利用できるUI primitive、theme、design token、form部品、管理画面向け複合componentを置く。

特定route、API、権限、永続化、consumer固有validationはconsumer側に置く。迷う場合は実装前にIssueで相談する。

## Making a change

- 公開subpath、型、component props、events、snippets、CSS変数、theme contractを公開APIとして扱う。
- component変更と同じ単位で公開型、test、Storybook storyを更新する。
- accessibility、keyboard操作、focus、disabled、loading、error状態を確認する。
- 未宣言のdeep importやlocal path dependencyを追加しない。

変更範囲に応じて次を実行する。

```sh
pnpm test
pnpm build-storybook
pnpm test:components
pnpm test:storybook
pnpm test:consumer
pnpm test:consumer:astro
git diff --check
```

公開exportを変更した場合は`pnpm test:consumer`、component・公開export・依存・テーマCSSを変更した場合は`pnpm test:consumer:astro`、Storybookを変更した場合は`pnpm build-storybook`と`pnpm test:storybook`が必須。a11y違反は`todo`へ追加せず、componentまたはstoryの責務に応じて解消する。

## 開発ドキュメント

- [Storybook](./docs/storybook.md): 分類、代表状態、test専用storyの追加。
- [Design Tokens](./tokens/README.md): JSONの編集と生成。
- [同期とローカルGit hooks](./docs/maintenance.md): Loading UI・shadcn-svelteの同期とローカルbranchの整理。
- [Release](./RELEASING.md): version更新と公開。

### Design Tokensの編集

テーマの色・角丸・フォントは [`tokens/`](./tokens/README.md) のJSONを正本にしています。新規色はOKLCH、外部由来の色は通常sRGBのDTCG Colorとして記述し、semantic tokenから参照します。変更後に `pnpm tokens:generate` を実行してください。check/buildで生成漏れを検出します。公開Theme APIとCSS変数の使い方は従来どおりです。

### ドキュメントの更新

使い方と公開contractの説明は[ガイド一覧](./docs/README.md)から対応するページを更新する。代表状態や操作デモは`stories/*`へ追加し、sourceをconsumer repositoryへ複製しない。

新しい話題でガイドを作る場合は`docs/README.md`からリンクし、READMEのガイド一覧に必要な入口だけを加える。READMEでは導入と公開APIの案内を保ち、開発手順はこのファイル、release手順は`RELEASING.md`、tokenの編集ルールは`tokens/README.md`を正本とする。移動前の見出しリンクも確認する。

## 公開入口と内部実装

新規追加と内部処理の切り出しでは次の配置に合わせる。既存ファイルの移動は、公開パスの互換性を確認しながら段階的に行う。

| 配置 | 役割 |
| --- | --- |
| `src/lib/<name>/index.ts` | 部品の公開component・関数・型を明示してexportする入口 |
| `src/lib/<name>/*.svelte`・`types.ts`など | その入口で公開する実装と型 |
| `src/lib/internal/<name>/` | 状態管理、計測、内部componentなどの非公開実装。単一部品専用でもここへ置く |
| `src/lib/index.ts` | root importから提供するAPIを各公開入口経由でまとめる |
| `package.json`の`exports` | 利用側がimportできるsubpathを定義する |
| `test/astro-coverage.json` | 公開入口・CSS入口のconsumer検証登録の正本 |

新しい部品を追加するときは、次の順で公開範囲を決める。

1. 公開componentと公開型を`src/lib/<name>/index.ts`へexportする。内部helperは`internal/<name>/`へ分ける。
2. `package.json`に`./<name>`の型・Svelte・default入口を登録し、`test/astro-coverage.json`へ同じ入口を追加する。wildcardは必要な場合だけ追加する。
3. root importでも提供する場合は`src/lib/index.ts`から同じ公開入口を再exportする。
4. catalog、通常テスト・ブラウザテストを追加し、tarballを使うconsumer・Astro検証を実行する。公開APIの追加はminor changesetを付ける。

### 新規componentの登録例

`example-control`を追加する場合、公開入口は次の形にする。

```ts
// src/lib/example-control/index.ts
export { default as ExampleControl, type ExampleControlProps } from "./example-control.svelte";
```

`package.json`の`exports`には次を追加する。通常はこのindexだけで足りるため、wildcardは追加しない。

```json
"./example-control": {
  "types": "./dist/example-control/index.d.ts",
  "svelte": "./dist/example-control/index.js",
  "default": "./dist/example-control/index.js"
}
```

`test/astro-coverage.json`の`modules`へ`./example-control`を追加する。rootでも提供する場合は`src/lib/index.ts`から`./example-control/index.js`経由で再exportする。

`stories/example-control.stories.svelte`は近い部品のstoryを参考に既存カテゴリへ追加し、状態を比較できるstoryにまとめる。操作テストは`test/browser/example-control.test.ts`から公開subpathをimportして追加する。必須propsを持つ部品も共通`render`で描画できる。

上記の検証コマンドで、型・公開境界、ブラウザ操作、catalog、tarballの順に確認する。Astroの登録で自動追加されるのはimport・SSR・client build・hydrationの確認であり、新しい部品自体の操作確認ではない。Astro上の操作・focusも確認する場合は`test/fixtures/astro/svelte/src/components/`と対応するブラウザ検証を追加する。

既存のwildcard exportは補助ファイルにも到達できる。`test/fixtures/legacy-deep-imports.json`は、既に到達できるがindexからは公開されていない互換パスの履歴で、公開入口の検証登録とは役割が異なる。これらの実装を移動するときは、元のパスに同じexportを持つ互換ファイルを残す。例は`calendar/calendar-day-color.ts`と`rolling-text/numeric-input.ts`。

`pnpm test`の境界検証は、公開入口からのinternal再export、未登録のトップレベル実装ディレクトリ、新しいwildcardだけでの公開、既存互換パスの消失を検出する。新しいhelperのために互換一覧を増やさず、内部実装を`internal/`へ置く。利用側からの`@mutsuna/ui/internal/*`はpackage exportで公開しない。

SvelteKit依存の入口は`./sveltekit-form`に限定する。ブラウザ専用APIの利用は、内部へ移動してもSSR時のmodule評価では実行しない。移動後の型定義が参照する内部ファイルも配布物には必要なので、consumer testで型解決と実際のimportを確認する。

## テストの追加先

コンポーネントの振る舞いは、描画後のDOM・アクセシブルな名前・操作結果で検証する。内部変数名、特定の子コンポーネント、ユーティリティクラスの並びを正規表現で固定しない。

| 検証内容 | 追加先・実行方法 |
| --- | --- |
| 純粋な計算、actionのイベント通知・タイマー・破棄 | `test/*.test.mjs`。`pnpm test`でbuild後のコードを検証 |
| props、keyboard、focus、computed style、複数インスタンス | `test/browser/*.test.ts`。`pnpm test:components`でChromium上に描画 |
| 利用例を通した操作フロー・a11y | `stories/*.stories.svelte`のtest専用story。`pnpm test:storybook` |
| npm配布物のimport・SSR・hydration・利用側の操作 | `pnpm test:consumer`・`pnpm test:consumer:astro` |
| ライセンス、依存境界、生成物、catalog metadata | 静的検査を維持。metadataの構文はSvelte parserで読む |

ブラウザテストは公開subpathからimportし、`test/browser/render.ts`の`render`で描画する。ローカル実装への解決はVitest設定で行い、tarballの検証はconsumer testが担当する。propsの変更には`props.svelte.ts`の`reactiveProps`を使える。snippetや親contextが必要な場合だけ、同じディレクトリに小さなSvelte fixtureを置く。

```ts
import { expect, test } from "vitest";
import { userEvent } from "storybook/test";
import { Switch } from "@mutsuna/ui/switch";
import { render } from "./render.js";

test("keyboardで通知を切り替えられる", async () => {
  const view = render(Switch, { "aria-label": "通知" });
  const control = view.getByRole("switch", { name: "通知" });
  control.focus();
  await userEvent.keyboard(" ");
  await expect.poll(() => control.getAttribute("aria-checked")).toBe("true");
});
```

ブラウザの既定動作（スクロールなど）には`vitest/browser`の`userEvent`を使う。更新・transition・overlayの終了は、固定時間のsleepではなく観測する状態を待つ。OSのmotion設定を変えるテストは`finally`で戻し、clipboardなどの外部APIはmockして復元する。描画した部品は共通helperがテスト終了時にunmountする。

```sh
pnpm exec playwright install chromium
pnpm test:components
```

コンポーネントテストはCIでも必須。UIの文字列チェックから移した対象は、入力・Textarea・Switch・Slider・ColorPicker・RollingText・Avatar・Loading・ScrollbarArea・AdminShellFrame・SidebarWorkspaceSwitcher・Drawer・ResponsiveDialog・form/editorの名前・calendarのkeyboard操作・toastのコピーと表示。Storybookのカテゴリ別件数は固定せず、新しい部品を既存カテゴリへ追加できるようにする。

## EventCalendarの内部構造

EventCalendarを拡張するときは、変更する責務に対応したファイルから確認する。

| ファイル | 責務 |
| --- | --- |
| `src/lib/event-calendar/event-calendar.svelte` | 公開props、表示範囲・表示モデルの組み立て、描画、スコープ付きCSS、予定一覧ダイアログ |
| `src/lib/event-calendar/types.ts`・`index.ts` | 公開型と公開入口 |
| `src/lib/event-calendar/layout.ts` | 日付・時間と予定配置の計算 |
| `src/lib/internal/event-calendar/interaction.svelte.ts` | ポインター・タッチ・キーボード操作、選択・変更通知、ドラッグのプレビュー状態 |
| `src/lib/internal/event-calendar/viewport.svelte.ts` | サイズ計測、スクロール同期、日付タイムラインのバッファ、移動アニメーション |

内部コントローラーはインスタンスごとに生成し、getterを通して最新のprops・表示モデルを読む。DOMへのアクセスはマウント後のactionやイベントから開始する。内部ファイルは公開exportへ追加しない。描画とCSSは同じSvelteファイルで管理し、DOM構造やCSSの適用範囲を維持する。

操作や計測の変更は、通常テストに加え、EventCalendarのStorybook操作テストと`pnpm test:consumer:astro`で確認する。Astro fixtureは`test/fixtures/astro/svelte/src/components/EventCalendarProbe.svelte`、ブラウザ検証は`test/event-calendar-browser.mjs`にある。

## Changesets

公開packageへ影響するpull requestでは次を実行し、changesetを同じpull requestへ含める。

```sh
pnpm changeset
```

- `patch`: 後方互換なbug fixや公開contractを変えない改善
- `minor`: 新しい公開API、重要な機能、`1.0.0`未満の破壊的変更
- changeset不要: docs、Storybook、CI、repository toolingだけの変更

`package.json`のversionは手動変更しない。

## Pull requests

- pull request templateをすべて記入する。
- 対応するGitHub Issueがある場合は`#123`を`関連Issue`へ記載する。
- 小さなdocs修正などIssueが不要な場合は`なし`と記載できる。
- maintainerが内容と検証結果を確認できる大きさへ変更を分割する。

Releaseとnpm publishはmaintainerがprotected workflowから実行する。
