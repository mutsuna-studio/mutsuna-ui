# 入力と選択

[ガイド一覧](../README.md)

- [Searchable Select](#searchable-select)
- [CycleSelect](#cycleselect)
- [Floating Input labels](#floating-input-labels)
- [枠線に重ねるラベル](#枠線に重ねるラベル)
- [Editable Text](#editable-text)
- [Sticky Note](#sticky-note)
- [Slider](#slider)
- [連結コントロールの作成](#連結コントロールの作成)

## Searchable Select

`Select searchable` は入力で候補を絞り込み、上下矢印で無効な候補を飛ばして移動し、Enterで確定します。確定後も入力欄のフォーカスを維持します。Escapeは候補を閉じ、未確定の入力を破棄します。Dialog内では最初のEscapeで候補だけを閉じます。

`freeText` を併用すると、候補を矢印キーで選んでいない場合のEnter、またはコントロール外へのフォーカス移動で任意の文字列を確定します。IME変換中のEnterでは確定しません。候補選択時は通常モードで`option.value`、自由入力モードで`option.label`を保存します。

## CycleSelect

`@mutsuna/ui/cycle-select` exposes `CycleSelect`, `CycleSelectProps`, and `CycleSelectOption`.
The label button advances to the next enabled option; the right button opens the standard Select list.

```svelte
<script lang="ts">
  import { CycleSelect } from "@mutsuna/ui/cycle-select";
  let value = $state("compact");
  const options = [
    { value: "compact", label: "Compact" },
    { value: "detailed", label: "Detailed" },
  ];
</script>

<CycleSelect bind:value {options} ariaLabel="Display" />
```

Options must have unique, nonempty values. Cycling follows array order, skips disabled options,
and wraps to the start. An empty or unknown value advances to the first enabled option.
If no different enabled option exists, only the advance button is disabled; an empty or entirely
disabled list disables the list trigger too. Changing options does not automatically change the value.
Both actions update `bind:value` and call `onValueChange`. `name` enables form submission.
Use `disabled`, `size`, `class`, `placeholder`, `nextLabel`, `listLabel`, `aria-invalid`, and
`aria-describedby` to configure state and accessible labels. Both buttons support keyboard operation;
the list retains Select keyboard navigation and focus handling.

## Floating Input labels

Use `<Input label="Display name" />` for an accessible floating label. The label moves
to a notch in the border on focus and remains there while a value is present. An omitted
`id` is generated automatically. Existing inputs without `label` keep their usual appearance.
Date/time inputs always raise the label to avoid overlapping native input UI. File, hidden,
checkbox, radio, range, color, and button inputs do not support floating labels; use an external
label for those types. `placeholder` is shown only while focused in floating mode.

## 枠線に重ねるラベル

`Input`・`Textarea`に加え、通常／検索付きの`Select.Root`と`InputGroup.Root`に`label`を指定できる。`placeholder`は入力のヒントとして独立し、ラベルには変換しない。SelectとInputGroupでは、選択値・アイコン・追加ボタンと重ならないようラベルを常に枠線上へ表示する。ラベルなしの表示は従来どおり。

```svelte
<Select.Root label="チーム" bind:value>
  <Select.Trigger>{selectedLabel}</Select.Trigger>
  <Select.Content><!-- Select.Item --> </Select.Content>
</Select.Root>
<Select.Root searchable label="チームを検索" {options} bind:value />
<InputGroup.Root label="検索">
  <InputGroup.Addon><!-- 検索アイコン --> </InputGroup.Addon>
  <InputGroup.Input placeholder="名前を入力" />
</InputGroup.Root>
```

通常Selectは`Select.Trigger`にも`label`を指定でき、Rootのラベルより優先する。InputGroup内のInput／TextareaのIDは自動生成し、ラベルのクリックでフォーカスできる。独自IDを指定する場合は`<InputGroup.Root label="検索" labelFor="search-input">`と`<InputGroup.Input id="search-input" />`のように関連付ける。1つのInputGroupに対し、ラベルの対象は1つの入力欄とする。Selectの`aria-invalid`・`aria-describedby`はRootから指定でき、通常SelectはTriggerからも指定できる。

## Editable Text

`bind:value`で値を受け取り、保存処理が必要なときだけ`onCommit`を指定します。値が変わらない確定では通知しません。

```svelte
<script lang="ts">
import { EditableText } from "@mutsuna/ui/editable-text";
import { Button } from "@mutsuna/ui/button";

let name = $state("表示名");
</script>

<EditableText bind:value={name} aria-label="表示名を編集" />

<EditableText bind:value={name} editOn="doubleClick" aria-label="表示名を編集">
  {#snippet trigger({ value, props })}
    <Button {...props} variant="ghost">{value}</Button>
  {/snippet}
</EditableText>
```

- 通常はクリックで編集。`editOn="doubleClick"`ではダブルクリックまたはF2で編集し、Enter／Spaceはボタンのアクションに使えます。
- Enterで確定、Escapeで取消し。`multiline`ではEnterで改行、Cmd/Ctrl+Enterで確定します。IME変換中のEnterでは確定しません。
- キーで編集を終えるとtriggerへフォーカスが戻ります。blurでは既定で確定し、`commitOnBlur={false}`なら取り消します。blur先のフォーカスは移動させません。
- `class`や通常時のCSSで指定した文字サイズ・行高・フォント・余白は、編集開始時に編集欄へ引き継ぎます。編集時だけ変えたい場合は`inputClass`で上書きできます。カスタムtriggerも同様です。
- 編集中に`disabled`になった場合は取り消します。
- `onclick`・`ondblclick`・`onkeydown`は内部処理と連携し、編集開始を止めたい場合は`event.preventDefault()`を使えます。
- カスタムtriggerは`props`をbuttonへそのままspreadしてください。`Button`も利用できます。独自componentの場合はイベント・属性・Svelte attachmentをDOMのbuttonへ転送します。これで`bind:ref`とフォーカス復帰も動きます。
- ダブルクリックモードのマウス単クリックは250ms待ってから`onclick`を呼びます。OSのダブルクリック判定時間とは独立しているため、遅いダブルクリックでは先に単クリックが実行されることがあります。取消不能な操作には別ボタンを使ってください。遅延callback内の`event.currentTarget`は利用できません。

公開型は`EditableTextProps`、`EditableTextTriggerProps`、`EditableTextCommit`、`EditableTextCancel`を提供します。

## Slider

範囲Sliderでは、各つまみの読み上げ名と単位付きの読み上げ値を指定できる。

```svelte
<script lang="ts">
import { Slider } from "@mutsuna/ui/slider";

let priceRange = $state([20, 80]);
</script>

<Slider
  type="multiple"
  bind:value={priceRange}
  min={0}
  max={100}
  step={5}
  aria-label="価格帯"
  thumbLabels={["最低価格", "最高価格"]}
  getThumbValueText={(value) => `${value}万円`}
/>
```

## 連結コントロールの作成

入力やボタンを連結する場合は `@mutsuna/ui/button-group` の `ButtonGroup` を使います。DatePickerやCycleSelectと同じ境界処理が適用され、通常時の二重線とフォーカス時の枠線欠けを防ぎます。独自の子コントロールには `data-slot="button"` などを指定し、四辺の1px枠線を保持してください。角丸、負のマージン、focus時のz-indexを個別に指定する必要はありません。非表示フォーム入力は間に挟んでも構いません。

全体で一つの入力欄を構成する場合は、外枠をまとめて管理する `InputGroup` を使います。

## Sticky Note

`@mutsuna/ui/sticky-note`（ルート入口からも公開）の汎用付箋です。チャットや保存先に依存しません。

```svelte
<script lang="ts">
  import { StickyNote, type StickyNotePosition } from "@mutsuna/ui/sticky-note";
  let value = $state("作業メモ");
  let savedValue = $state("作業メモ");
  let open = $state(false);
  let position = $state<StickyNotePosition | null>(null);
  let triggerPosition = $state<StickyNotePosition | null>({ x: 32, y: 240 });
</script>

<StickyNote bind:value bind:open bind:position bind:triggerPosition
  {savedValue} onSave={value => savedValue = value} />
```

既定の`triggerMode="floating"`では最小化中だけ浮遊ボタンを表示し、開くと本文へ切り替えます。ボタンはドラッグ、矢印キー（Shiftで大きく移動）で配置でき、ドラッグ後の誤クリックでは開きません。`triggerPosition`はボタン、`position`は本文のviewport座標です。12pxの余白を保って画面内へ収め、最小化後も各位置を保持します。位置を外部へ保存するかどうかは利用側で決めます。

`triggerMode="inline"`ではコンポーネントを置いた場所にボタンを表示します。`trigger` snippetへ渡す`props`をbuttonまたはButtonへspreadすれば独自のトリガーを使えます（Svelte attachmentも転送してください）。`triggerMode="none"`はトリガーを出さず、任意の外部ボタンから`bind:open`を操作できます。最小化時はトリガーまたは開いた際の要素へフォーカスを戻します。

`value`・`savedValue`・`saving`・`error`・`onSave`による編集・保存状態、上部のドラッグ、読み取り専用、IME・Escape操作はChatMemoと共通です。`title`は読み上げ名のみで、タイトル行はありません。`StickyNoteProps`・`StickyNotePosition`・`StickyNoteTriggerProps`を公開します。
