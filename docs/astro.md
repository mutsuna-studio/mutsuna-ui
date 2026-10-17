# Astroで使う

[ガイド一覧](./README.md)

## テーマだけを使う

AstroネイティブのHTMLに配色だけを適用する場合は、layoutまたはpageのfrontmatterで読み込みます。`theme/core`はSvelteコンポーネントを読み込まないため、ビルド時にも使えます。

```astro
---
import "@mutsuna/ui/tokens.css";
// フォントも使用する場合だけ追加:
// import "@mutsuna/ui/fonts.css";
import { findThemeTemplate, themeToCssVariables } from "@mutsuna/ui/theme/core";

const themeStyle = themeToCssVariables(findThemeTemplate("github"))
  .filter(([, value]) => value !== null)
  .map(([name, value]) => `${name}: ${value}`)
  .join(";");
---
<html lang="ja" style={themeStyle}>
  <head><meta charset="utf-8" /><title>My site</title></head>
  <body><h1>Mutsuna theme</h1></body>
</html>
<style is:global>
  body {
    background: var(--background);
    color: var(--foreground);
    font-family: var(--theme-font-body, system-ui);
  }
</style>
```

`<html class="dark">`でdark modeになります。上記の`style`を省略すると標準light/darkの値を使います。この構成にはSvelte連携、Tailwind plugin、クライアントJavaScriptは必要ありません。`fonts.css`はfont faceの登録のみで、使用する`font-family`は自分のCSSで指定します。

## Svelte部品を使う

Button・Input・DialogなどのSvelte部品も使う場合は、[Astro公式Svelte連携](https://docs.astro.build/en/guides/integrations-guide/svelte/)とTailwind v4を設定します。

```sh
pnpm add @mutsuna/ui svelte
pnpm add -D @astrojs/svelte @tailwindcss/vite tailwindcss
```

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [svelte()],
  vite: { plugins: [tailwindcss()] },
});
```

Astroのlayout/pageで `import "@mutsuna/ui/theme.css"` を読み込み、操作のある部分を `.svelte` にまとめて `<Controls client:load />` として配置します。イベントcallbackやSvelte snippetはその `.svelte` 内で扱います。静的なテーマ適用は前述の `theme/core` を使えば、hydration前から配色が反映されます。

## リポジトリでの互換性検証

検証用の最小構成は `test/fixtures/astro/`、実行コマンドは `pnpm test:consumer:astro` です。Astro 7.3.3 / `@astrojs/svelte` 9.0.1を使い、一時ディレクトリで `pnpm pack` のtarballをインストールして、Astro/Svelteのcheck、本番build、Chromiumでlight/dark・入力・クリック・Dialogのキーボード操作を検証します。事前に `pnpm exec playwright install chromium` が必要です。consumerへローカルパス依存を残しません。

継続的な互換性確認では `test/astro-coverage.json` と公開exportsを照合し、追加時の未登録・削除後の登録残り・重複を `pnpm test` で検出します。登録した全module入口とCSS入口から一時的なimport検証ページを生成し、SSR・clientのビルドとhydrationを確認します。SvelteKit専用の `sveltekit-form` は理由付きで除外します。wildcard subpathは登録済みの公開indexへ対応付け、新しい部品はそのindexからexportします。

全入口のimport確認と、部品ごとの表示・操作の検証は区別します。Button・Input・Dialogなどの代表的な操作をfixtureとブラウザ検証で確かめ、操作・focus・hydrationに関わる改善では対象のfixtureと検証を追加・更新します。開発時の必須手順は[AGENTS.mdのAstro互換性](../AGENTS.md#astro互換性)に定めています。
