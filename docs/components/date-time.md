# 日付と時刻

[ガイド一覧](../README.md)

- [DatePicker](#datepicker)
- [Current date shortcuts](#current-date-shortcuts)
- [日付範囲カレンダー](#日付範囲カレンダー)
- [日時入力の共通解析](#日時入力の共通解析)

## DatePicker

```svelte
<script lang="ts">
  import { DatePicker } from "@mutsuna/ui/date-picker";
  let value = $state("2026-09");
</script>
<DatePicker precision="month" bind:value ariaLabel="対象年月" />
```

`showWeekday` (default false) appends the Japanese weekday in day mode, such as
`2026年9月9日(水)`. It does not change the stored value and is ignored for year/month.

`precision` is `year`, `month`, or `day` (default). Values and inclusive `min`/`max`
bounds are `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`, respectively. Direct input accepts only
4, 6, or 8 ASCII digits. Enter commits; invalid dates (including nonexistent days),
out-of-range values and `isDateUnavailable(value)` matches show an error. Escape or
clicking outside discards edits. Selection commits immediately. Default bounds span
1900–2100. Changing bounds or precision does not rewrite the value; the caller must
supply a value and bounds matching the new precision. Invalid bounds disable opening.

`showCurrent` (default true) shows 今年/今月/今日 according to precision; `currentLabel`
customizes its label. It uses the device's local date and respects the same constraints.
`name`, `disabled`, `size`, `class`, `id`, `placeholder`, `aria-invalid`, and
`aria-describedby` are supported. `onValueChange` fires only for a changed committed value.

Breaking migration: replace `MonthPicker` from `@mutsuna/ui/month-picker` with
`DatePicker precision="month"` from `@mutsuna/ui/date-picker`. Rename `showCurrentMonth`
to `showCurrent` and `currentMonthLabel` to `currentLabel`. No compatibility exports remain.

## Current date shortcuts

Calendar shows a `今日` action by default. It selects today's local date and moves the
visible month to it, respecting `disabled`, `readonly`, `minValue`, `maxValue`,
`isDateDisabled`, and `isDateUnavailable`. Multiple selection adds today without removing
other dates. Use `showToday={false}` to hide it or `todayLabel` to change its text.

## 日付範囲カレンダー

`RangeCalendar` は `@mutsuna/ui/range-calendar` から利用できます。
`bind:value` は `{ start: DateValue | undefined, end: DateValue | undefined }` を受け取り、
開始日と終了日を順番に選択します。`placeholder` で表示月を指定でき、
`minValue`、`maxValue`、`isDateDisabled`、`disabled`、`readonly` で選択を制限できます。
`numberOfMonths={2}` で2か月を並べて表示できます。幅が足りない場合は縦に並びます。
`scrollable` を指定すると月切り替えボタンを隠し、上下スクロールで月を順次追加します。
既定は日本語・月曜始まりです。検索パネルへの組み込み例はStorybookの
`Patterns/Data Table` を参照してください。

## 日時入力の共通解析

`@mutsuna/ui/date-time-input` の `parseDateTimeInput(input, precision, options)` は、年・年月・日付・時刻を正規化し、不正・曖昧な入力は `null` を返します。年から始まる `2026-9`、`2026/09`、`2026.9`、`2026年9月`、`202609`、日付の `2026/9/13`・`20260913`、時刻の `9:30`・`9時30分`・`9:30 PM` などと全角表記に対応します。2桁年や年を省略した日付、月日順序が曖昧な表記は推測しません。

数値はExcelシリアル値として解釈します。文字列は通常の年月日・時刻表記を優先し、それに該当しない数字列をシリアル値として解釈します。`excel:1` のような接頭辞で明示もできます。既定は1900年方式で、`{ excelDateSystem: "1904" }` により1904年方式へ切り替えます。1900年方式の架空の2月29日（シリアル60）は日付へ変換しません。小数部は時刻で、秒は分未満を切り捨てます。タイムゾーン変換は行いません。

DatePicker・TimePickerにも `excelDateSystem` を指定できます。年月は年ローラー、時刻は時ローラーへ入力し、Tab・Enterで解釈します。DatePickerの年・年月モードでは重複する上部入力を廃止し、日付モードでは日まで直接入力する欄を維持しています。
