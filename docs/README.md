# ドキュメント

[導入と公開API](../README.md) · [Storybook catalog](https://mutsuna-studio.github.io/mutsuna-ui/) · [新しい部品の追加](../CONTRIBUTING.md#公開入口と内部実装)

## 利用ガイド

| 目的 | ガイド |
| --- | --- |
| Input、Select、編集、Slider、連結入力 | [入力と選択](./components/inputs.md) |
| DatePicker、RangeCalendar、日時入力の解析 | [日付と時刻](./components/date-time.md) |
| アイコン、loading、consumer用lint CLI | [ButtonとLoading](./components/button-and-loading.md) |
| ImagePreview、ResponsiveDialog、管理画面、Sidebar | [ダイアログとレイアウト](./components/dialogs-and-layout.md) |
| チャットの導入・公開入口・状態管理・AppShell連携 | [チャットUI](./components/chat.md) |
| 文書の目次・見出し階層・MessageScrollerとの連携 | [目次](./components/outline-nav.md) |
| コード入力と差分表示 | [CodeEditorとCodeDiff](./components/code-editor.md) |
| 予定表示、操作通知、背景、取得状態、先読み | [EventCalendar](./components/event-calendar.md) |
| テーマ、フォント、スクロールバー | [テーマとスクロールバー](./theming.md) |
| 静的テーマとSvelte部品のhydration | [Astroで使う](./astro.md) |
| SvelteKit専用の通知・redirect・pending管理 | [SvelteKit form action](./sveltekit-form.md) |

## 開発と保守

| 目的 | 正本 |
| --- | --- |
| 環境構築、公開入口、内部実装、テストの追加 | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| catalogの分類、story、a11y検証 | [Storybook](./storybook.md) |
| デザイン値の編集と生成 | [Design Tokens](../tokens/README.md) |
| 上流同期とGit hooks | [同期とローカルGit hooks](./maintenance.md) |
| version更新とnpm公開 | [RELEASING.md](../RELEASING.md) |
| サポートと非推奨化 | [SUPPORT.md](../SUPPORT.md) |

共有componentの代表状態と操作デモは、このrepositoryの`stories/*`を正本とする。ガイドは公開contract・利用上の条件・接続例を説明し、製品固有のAPIや永続化は利用側で扱う。
