# @mutsuna/ui

## 0.6.0

### Minor Changes

- 91b6577: Loading UI 由来の 23 種類の自動同期 CSS-only loading indicator、手動移植した morphing-infinity、安全に同期候補を抽出して Svelte へ変換する仕組みを追加します。
- 91b6577: Bits UI を基盤とする単一値・範囲選択対応の Slider コンポーネントを追加しました。

### Patch Changes

- 91b6577: トーストのコピー操作をアイコン表示にし、コピーと閉じる操作を右側へまとめました。

## 0.5.0

### Minor Changes

- b7cd54a: `ScrollbarArea` に `gutter="auto"` を追加し、`AdminShellFrame` で外枠のスクロール gutter と padding を無効化できるようにしました。

## 0.4.3

### Patch Changes

- f3ff7c8: Avatar のブレンド描画をコンポーネント内へ隔離し、背後の UI が再合成される問題を防止。

## 0.4.2

### Patch Changes

- a152622: Admin Shell の本文が内容幅へ縮小せず、利用可能な横幅全体を使うよう修正。

## 0.4.1

### Patch Changes

- a1a595d: 時間選択の時・分候補とカレンダーの年・月候補へ、テーマ連動のカスタムスクロールバーを適用。

## 0.4.0

### Minor Changes

- c286224: すべてのトーストでタイトルと表示メッセージをコピーでき、任意の非表示詳細情報もコピー内容へ追加できる API を追加。

## 0.3.1

### Patch Changes

- 1930c0d: Fix the workspace switcher avatar shrinking away when an icon-collapsible sidebar is collapsed.

## 0.3.0

### Minor Changes

- 792dc53: Add reusable sidebar workspace-switcher and user-menu patterns.
