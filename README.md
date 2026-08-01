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

## Requirements

- Svelte 5
- Tailwind CSS 4

packageには`@sveltejs/package`で生成したJavaScript、Svelte component、型定義を収録する。

## Scope

汎用primitive、状態表現、form部品、design tokenのみを公開対象とする。予約・組織・店舗など特定productの業務語彙を持つcomponentは各appに置く。
