# @mutsuna/ui

## 0.13.0

### Minor Changes

- b3afc2b: Floating Label Input の枠線をラベル背景で覆わず、ラベル幅に合わせて上辺自体が滑らかに開くアウトラインへ変更します。Textarea も同じ Floating Label へ対応し、Input と Textarea は label を指定した場合に Floating Label を使用します。placeholder はラベルへ変換せず、従来どおり入力ヒントとして表示します。各コンポーネントのフォーカス表現を外側のリングから 1px の境界線とごく薄い内側の色変化へ統一します。Color Picker はホバー・フォーカス中もプレビュー色を保つ 1px の枠線で状態を示し、外側クリックで閉じた際はトリガーへフォーカスを戻しません。値の変化を縦方向のホイールアニメーションで表現する RollingText を追加し、Color Picker の表示形式切替へ適用します。RollingText は候補全体から最大幅を予約でき、切替後のレイアウト移動を防ぎます。文字揃えは親要素から継承せず左寄せを標準とし、中央・右寄せも明示的に選択できます。ホイール入力は移動量を蓄積する連続モードにも対応し、マウスホイールの 1 ノッチは入力値の 1 段として扱います。Color Picker のテキスト領域では表示形式を前後へ切り替えられ、TimePicker は閉じた状態で時刻全体を繰り上げながらスピンでき、開くと時・分を独立したローラーで連続操作できます。TimePicker のポップオーバーは時・分ローラーへ直接入力できるコンパクトな構成とし、全角数字は半角へ正規化して数字以外を除去し、時を 2 桁入力すると分へフォーカスを移します。重複していた TimeSelect を削除し、時間入力の公開 API と Storybook を TimePicker へ統一します。

  旧 OKLCH Color Picker 互換コンポーネントと公開 subpath を削除し、現行 Color Picker の実装と色変換 API を color-picker 配下へ統合します。

  トーストの種別アイコンを高さにかかわらず本文ブロックの左上へ配置します。

- b3afc2b: 共通の date-time-input API を追加し、年月・日付・時刻の一般的な文字列表記、全角文字、Excel シリアル値を解析します。DatePicker と TimePicker も共通解析を使用し、excelDateSystem で 1900 年方式・1904 年方式を指定できます。
- b3afc2b: DatePicker の選択値に等幅数字を適用し、日付変更時の表示の揺れを抑えます。カレンダーアイコンを非表示にできる `showIcon` プロパティを追加します。Calendar の年月選択をカレンダー内の表示切替に変更し、重複する年月表示を整理します。Editable Text の編集時に位置がずれないよう寸法を揃え、枠線をなくして全選択を既定にします。`multiline` による複数行表示・編集と自動リサイズ、最長行に合わせた表示幅、`editOn="doubleClick"` による編集開始に対応します。`trigger` snippet へ既存のアクションコンポーネントを渡し、個別 CSS なしで編集可能なアクションとして利用できます。

  Editable Text の入力欄・表示トリガーの共通設定を整理し、カスタム trigger の単クリック編集でも表示時の寸法を引き継ぐようにします。

  Editable Text の編集終了を一元化し、キーボード操作後のフォーカス復帰、consumer のイベント抑止、IME 確定キー、待機中アクションの取消しに対応します。カスタム trigger にも ref を接続し、設定・trigger・確定・取消しの公開型を追加します。

- b3afc2b: DateTimeRangeFields コンポーネントと Storybook を削除します。互換コンポーネントは提供しません。利用側は DatePicker と TimePicker などを組み合わせて移行してください。@mutsuna/ui/date-time-range-fields の日付ユーティリティは引き続き提供します。

### Patch Changes

- b3afc2b: Calendar の年月選択を TimePicker と共通の RollingText・ホイール操作で表示するスピン UI に統一します。年・月の候補制約と表示形式を維持し、上下キーと矢印ボタンからも操作できます。DatePicker 内の Calendar にも適用されます。

  月のスピンは 12 月と 1 月の境界で年も更新し、指定された年・月の候補範囲で停止します。

  Calendar と TimePicker の数値ローラー入力を共通化し、年月の直接編集・Tab による左右移動・全角数字の半角変換に対応します。数字以外は除去し、年・月の候補制約を維持します。

  DatePicker の年・年月精度でも共通ローラーを使用し、直接編集・Tab 移動・月スピン時の年更新に統一します。範囲外と選択不可の候補を除外し、Enter または選択ボタンで確定します。

  DatePicker の年・年月モードで重複する上部入力を削除し、年ローラーへの YYYYMM 入力を年と月に振り分けます。全角数字も対応し、不正な月や範囲外の年月は確定しません。

- b3afc2b: ButtonGroup の境界線を削除せず重ねる方式に変更し、横・縦並びのフォーカス枠が欠けないように修正。

  CycleSelect の独自の枠線連結を ButtonGroup へ統一。

- b3afc2b: Checkbox の選択時に、チェックマークをペンで描くようなアニメーションを追加します。動きを減らす設定ではアニメーションせず表示します。

## 0.12.0

### Minor Changes

- 1273da3: Add a visual ColorPicker with a saturation/value plane, hue control, direct text entry, keyboard interaction, and cyclic HEX, RGB, HSL, and OKLCH representations. Keep OklchColorPicker as a backwards-compatible export.
- 1273da3: Add ten theme presets (amber, lime, teal, cyan, indigo, violet, fuchsia, slate, Svelte, and Claude-inspired) and refine orange, amber, and cyan with more vivid colors and contrast-aware foregrounds, keeping light text on orange. Expand ThemeTemplateKey and the Storybook preset catalog.

  Extend themes with optional appearance tokens and give Svelte a complete light/dark surface palette, typography, and radius. Bundle OFL-licensed Fontsource fonts and reset extended variables when returning to a color-only preset.

  Add an unofficial Claude-inspired full appearance preset based on the chat app palette, with distinct light/dark surfaces, restrained clay actions, neutral sidebar selection, sans-serif UI text, and serif headings with Japanese sans-serif fallbacks.

  Add GitHub-inspired, Linear-inspired, and Notion-inspired full light/dark presets with surface, typography, border, and sidebar tokens.

- 1273da3: Add the opt-in mutsuna-ui-lint CLI to detect Lucide icons and inline SVG in Button children, and document the icon/loading contract to prevent duplicate loading icons.

## 0.11.0

### Minor Changes

- db930b7: Replace MonthPicker with DatePicker supporting year, month, and day precision, numeric input and current-date shortcuts. BREAKING: migrate month-picker imports to date-picker and set precision="month". Rename showCurrentMonth/currentMonthLabel to showCurrent/currentLabel. Add Today selection to Calendar.

## 0.10.0

### Minor Changes

- 1dbbe74: Add MonthPicker for selecting a year and month with range limits and keyboard support.

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
