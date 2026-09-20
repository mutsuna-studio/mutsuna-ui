---
"@mutsuna/ui": minor
---

Astroなどで利用できる、標準CSS変数のみの `@mutsuna/ui/tokens.css` とフォントのみの `@mutsuna/ui/fonts.css` を追加しました。既存の `theme.css` は両方を読み込み、従来のTailwind・Svelte部品向けスタイルを維持します。Astro consumerで型チェック・本番ビルド・テーマ切替とSvelte islandの操作を検証します。
