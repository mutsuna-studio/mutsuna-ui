# Mutsuna Design Tokens

テーマのデザイン値の正本はこのディレクトリのJSONです。DTCG 2025.10の `$type`・`$value`・aliasを使い、Webの文字列表現と分離します。

## 編集先と生成先

| 編集先 | 内容 |
| --- | --- |
| `core/color.json` | 色空間・成分・alphaを持つ実値 |
| `core/dimension.json` | テーマの基準角丸（数値と単位） |
| `core/font.json` | フォントファミリーの配列 |
| `semantic/light.json`・`dark.json` | 標準CSSの役割名からcoreへの参照 |
| `semantic/contrast.json` | 動的テーマの文字色候補への参照 |
| `themes/*.json` | 18テーマのprimary、light/dark、previewへの参照 |
| `catalog.json` | テーマの順序・表示名・説明・既定テーマのキー |

```sh
pnpm tokens:generate
pnpm tokens:check
pnpm test
pnpm test:consumer
pnpm exec playwright install chromium
pnpm test:tokens:browser
```

生成物は `src/lib/theme/tokens.generated.ts` と `src/lib/theme.css` の `BEGIN GENERATED TOKENS` 区間です。生成物もGitへ含めますが、直接編集しません。check/buildは生成漏れを検出して失敗します。テーマのアルゴリズムは `theme.ts`、CSSへの対応付け・`light-dark()`・フォントの引用符は `scripts/design-tokens.mjs` が担当します。

## 色のルール

- 正本はDTCG Colorオブジェクト。Mutsunaが新規設計する色のauthoring color spaceは `oklch`。
- 外部由来の色は元の色空間を保持する。HEXは `srgb` の成分へ展開し、元のHEXを6桁のfallbackとして残す。既存HSLはsRGBの表現なので、量子化せずsRGB成分へ展開する。
- `hex` は任意のsRGB fallback・表示用。生成処理は `components` と `alpha` を使い、HEXで上書きしない。alphaはHEXに埋め込まない。
- `display-p3` は意図的に広色域を設計するときに使用できる。現在のテーマには導入しない。
- HSL/RGB文字列は入力・表示・出力の形式として扱い、新規の正本にしない。
- semanticとthemeには実色を書かず、型付きaliasを書く。同じ色が複数の役割に使われても、参照先は共有できる。値が同じという理由だけで、将来も同時に変更すべきとは限らないため、独立して変更する際はcore tokenを分ける。

```json
{
  "primary": {
    "$type": "color",
    "$value": "{color.orange.seed}"
  }
}
```

既存テーマの `primary` は、公開 `Theme.primary` がOKLCH文字列であるため、既存のOKLCH seedを保持しています。外部テーマの実際の描画色は `light` / `dark` のsRGB tokenです。両者は以前から別の値であり、今回の移行で再計算しません。

## 適用範囲と互換性

今回の移行範囲はテーマ色・light/dark・テーマの角丸とフォントです。標準CSSの既定色とThemeProviderのorange presetは従来どおり異なり、それぞれのsemantic参照で明示しています。公開subpath、Themeの型、CSS変数名、カスタムテーマの計算、コントラスト判定を維持します。

coreの名前は既存値の移行元を表します。未設計の500/600/700階調を推測して追加しません。フォント名は移植可能なデータですが、`system-ui`などのWeb固有fallbackはネイティブ出力時にプラットフォーム用の対応付けが必要です。フォントファイルの追加・ライセンス変更はありません。外部テーマの出典・非公式の位置付けはルートREADMEを参照してください。

Control Size、Spacing、Icon Size、Border Width、Opacity、Shadow、Typographyのサイズ・行高、Motionは次の移行対象です。既存コンポーネントごとの意味と差を確認してから昇格させます。操作、ARIA、focus、wheel、floating labelの状態遷移はTypeScript/Svelteに残します。SwiftUI/Composeの生成とJSONのnpm公開APIは将来の別工程です。

ジェネレーターはこのリポジトリ向けの保守的なサブセットです。color（数値3成分のOKLCH/sRGB/Display P3）、dimension（px/rem）、fontFamily、トークン全体のaliasに対応します。DTCG全仕様への対応を宣言するものではありません。未知の型・色空間、範囲外、参照切れ、循環参照、型違いをエラーにします。`none`、複合token、`$extends`、Resolverのmode定義は未対応です。light/darkはDTCG文書を分け、独自のWeb adapterで組み合わせています。

仕様: [DTCG Color 2025.10](https://www.designtokens.org/tr/2025.10/color/)・[DTCG Format 2025.10](https://www.designtokens.org/tr/2025.10/format/)。DTCG Community Group Reportであり、W3C勧告とは区別します。
