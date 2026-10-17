# ButtonとLoading

[ガイド一覧](../README.md)

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

## consumerでの自動検出

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

## Loading

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
