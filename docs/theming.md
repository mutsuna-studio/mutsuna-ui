# テーマとスクロールバー

[ガイド一覧](./README.md)

## ThemeProvider

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

## ScrollbarArea

theme colorに追従するscrollbarは`ScrollbarArea`を使う。

```svelte
<script lang="ts">
import { ScrollbarArea } from "@mutsuna/ui/scrollbar";
</script>

<ScrollbarArea class="max-h-80 overflow-y-auto">
  <!-- scrollable content -->
</ScrollbarArea>
```

## Design Tokensの編集

デザイン値の編集先と生成方法は[Design Tokens](../tokens/README.md)を参照してください。
