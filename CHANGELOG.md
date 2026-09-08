# @mutsuna/ui

## 0.9.0

### Minor Changes

- 83e1766: Add CycleSelect with one-click cycling, a separate candidate list trigger, and keyboard support.

  Add opt-in floating labels to Input via the label prop.

## 0.8.1

### Patch Changes

- 9c88352: 1 行のトーストでコピーと閉じるボタンの縦並びが崩れないようにしました。

## 0.8.0

### Minor Changes

- 29e5f90: 上下左右から展開でき、内部スクロールと競合せずスワイプで閉じられる Drawer と、デスクトップでは Dialog、モバイルでは Drawer を表示する ResponsiveDialog を追加します。

## 0.7.1

### Patch Changes

- e143efc: トースト下端に、自動で閉じるまでの残り時間を示すプログレスバーを追加する。右上の閉じる操作とコピー操作を縦に揃え、コピー完了時は本文と残り時間を維持したまま一時的にチェックアイコンへ切り替える。
- dc5fe45: テーマの primary foreground と共有トークンを実コントラスト比から調整し、入力、editor、avatar、calendar、scroll 領域の accessible name、landmark、keyboard 操作を改善する。

## 0.7.0

### Minor Changes

- f8f61a6: Slider のレールを太くし、内側をつまみが移動する見た目、32px の操作領域、見分けやすい未選択レール、選択色の太いラインによるつまみの輪郭、hover・ドラッグ中の操作フィードバック、コンポーネント自身の disabled 表現へ変更しました。範囲 Slider のつまみごとの読み上げ名と単位付き読み上げ値を指定できる props も追加しました。Switch も同じ視覚ルールへ揃え、2px の内側余白、内側フォーカス、32px 以上の操作領域、hover・押下・キーボードフォーカス時に丸のラインが 3px へ太くなる反応を持つようにしました。

### Patch Changes

- c9f17a1: AdminShellFrame の本文パネルを全画面幅で 14px の角丸に揃え、PC の右端と画面下、およびスマートフォンの画面下にヘッダーやサイドバーと同色の 8px の外枠を追加しました。スマートフォンでは左右の外枠と境界線をなくし、本文内に左右 8px の余白を設けています。pageTitle を正式な h1 として出力し、ヘッダー操作の領域を 44px 以上に広げました。

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
