# @mutsuna/ui

## 0.20.0

### Minor Changes

- cf97459: チャット画面で使う部品・公開型・スクロール用 API を名前付きでまとめた`@mutsuna/ui/chat`入口を追加します。個別入口と既存 API は維持し、アプリ向けの構成例・状態管理・AppShell への組み込み手順を整理します。
- cf97459: 会話一覧を表示する ChatThreadList と公開型を追加しました。アバター・本文プレビュー・時刻・未読・オンライン・選択状態と、読み込み・空・エラー・操作不可を共通化し、並び順・取得・遷移は利用側へ委ねます。
- cf97459: ChatMessage に prose と footerActions を追加しました。利用側が渡した HTML の見出し・段落・リスト・引用・コード・表を長文向けに整え、回答末尾にもコピーなどの操作を常時表示できます。Markdown の解析や HTML の挿入は行いません。
- cf97459: FloatingActionMenu にヘッダーやツールバーへ収める placement="inline"を追加します。既定の浮遊配置は維持します。ChatHeader の補足説明と metadata を同じ段にまとめ、会話情報をコンパクトに表示します。
- cf97459: ChatComposer に context snippet を追加し、返信先や編集中の情報を入力欄と同じ枠内へ表示できるようにしました。MessageQuote に composer variant を追加し、返信アイコンと控えめな文字・解除操作で入力欄に統一した表示を提供します。通常の引用表示は維持します。
- cf97459: ChatComposer に notice prop を追加しました。任意の注意書きを入力欄の上に配置し、フォーカス中または本文があるときに表示します。表示領域を確保して入力欄の位置を維持し、入力欄と注意書きをアクセシブルに関連付けます。
- cf97459: ChatComposer に submitOn を追加しました。既定の mod-enter は Ctrl/Cmd+Enter で送信し、enter は Enter で送信・Shift+Enter で改行します。IME 変換と長押しを除外し、送信ボタンと同じ送信可否を適用します。送信キー設定の保存や選択 UI は利用側で管理します。
- cf97459: ChatThreadList に会話の状態・タグ・メモ有無を表示する metadata snippet を追加し、同じ情報を表示できる ChatHeader を公開しました。AI・人との会話を区別せず、業務上の状態定義・保存・権限は利用側へ委ねます。狭い画面でも補足情報を折り返して表示します。
- cf97459: CustomerAvatar に shape="circle" | "rounded"を追加します。既定の丸型を維持し、角丸四角でも同じ seed のグラデーションを使えます。画像・fallback・枠線の形を揃え、SidebarUserMenu は角丸四角を使用します。
- cf97459: ChatMessageEditor と ChatRegenerateAction を chat-message とルート入口から公開しました。送信済みの本文を編集するフォーム、確定前の影響説明、再生成・停止・再試行の UI を提供します。処理中のロック、キーボード操作と focus、入力を保持するエラー表示に対応し、会話履歴の変更や生成・キャンセル処理は consumer へ委譲します。

  編集 UI は入力枠一つとキャンセル・送信に統一し、AI と DM で共用できます。ラベルはアクセシブル名として維持し、影響説明は必要な場合だけ表示できます。

  Message.Actions に onEdit と editLabel を追加し、編集を返信・コピーと共通のツールバー／メニュー／モバイルドロワーへ統合しました。

- cf97459: FloatingActionMenu を追加。広い画面でのアイコン操作と、狭い画面でのメニューへの集約を選べる汎用の補助操作部品です。項目や実行処理を利用側で構成でき、StickyNote やダイアログへフォーカスを引き継げます。
- cf97459: EditableText で直接編集する付箋型の ChatMemo を追加しました。外枠のドラッグ・キーボード移動・画面内への位置制限に対応し、会話を操作しても開いたまま残ります。保存要求・保存状態・権限は利用側で管理します。
- cf97459: チャットから独立した StickyNote と公開入口を追加。最小化した浮遊ボタンのドラッグ・キーボード配置、任意のトリガー、外部からの開閉、本文とボタンの位置の bind に対応します。ChatMemo は既存の既定値・操作を保つラッパーに整理しました。
- cf97459: ChatMemo に保存成功済みの本文を受け取る savedValue を追加。編集内容との比較で未保存・保存中・保存済み・再試行を表示し、変更のない再保存を防ぎます。上部のドラッグ領域と保存・最小化ボタンの操作分離も検証しました。
- cf97459: MessageScroller.TopBar（MessageScrollerTopBar）を追加します。日付・会話の文脈・操作をスクロール領域の上へまとめ、leading・children・actions・context の snippets でカスタマイズできます。上部の高さを履歴と分けて確保し、個別に固定した要素の重なりを防ぎます。

  placement="overlay"では透明な層として履歴に重ね、背景の帯を作らずに上部の配置を共有できます。実測の高さを--message-scroller-top-bar-height で参照でき、初期余白やスクロール位置の調整に利用できます。

- cf97459: 汎用の ImagePreview と ImagePreviewProps をルート入口と image-preview subpath から公開しました。任意のファイル名・説明・ダウンロード操作に対応し、画像の拡大表示、画面内へのサイズ調整、Escape で閉じる操作とフォーカス復帰を共通化します。ChatAttachment と ChatComposer の選択済み画像にも同じプレビューを使用します。

  画像は見出し・操作欄を除いた残りの高さに収め、縦長画像や低い viewport でも内部スクロールなしで全体を確認できます。

  画像上のホイール・ピンチによる拡大縮小とドラッグ移動、キーボード操作に対応しました。操作ボタンや説明は追加せず、開き直した際は全体表示へ戻します。

  画像の端や余白のある表示でも、拡大・縮小中のカーソル位置を維持するよう補正しました。

  拡大中は画像の外側までパンでき、四隅を含む任意の位置を表示領域の中央へ移動できます。

  ImagePreviewImage 型と images・initialIndex を追加し、複数画像の前後切り替え・件数表示・左右キー・スワイプに対応しました。拡大中はパンを優先し、ページ切り替え時は全体表示へ戻します。ChatAttachment は previewImages・previewIndex でメッセージ内の画像を共有でき、ChatComposer の選択済み画像にもギャラリーを適用します。

- cf97459: AdminShellFrame の既定構成を、外周の角丸 14px と枠線を 1 つだけ残し、内部のワークスペースにスクロールを任せる構成へ統一します。本文の既定 padding は none、gutter は auto になり、外側のスクロール領域を追加しません。表示モードの切り替えは設けません。AdminShellFrameProps を専用入口から公開します。

  移行: 直接長い本文を入れていた場合は、子に height:100%・min-height:0・overflow:auto を持つスクロール領域を設けてください。明示指定した contentPadding と contentGutter は引き続き優先します。

- cf97459: shadcn-svelte を基に Message・Bubble・Message Scroller を追加し、配置・見た目・履歴スクロールを独立して組み合わせられるようにしました。ChatMessage はこれらを組み合わせる簡易ラッパーとして提供します。添付選択・削除・送信状態を扱う ChatComposer を追加しました。アップロード処理や AI SDK への依存は追加せず、AI と人同士の会話の両方で利用できます。

  InputGroupButton が内部の Button へサイズを渡し、アイコン用ボタンに文字用の片側余白が残る問題を修正しました。

  ChatComposer の送信ボタンを、入力枠の角丸に沿う角丸四角形に揃えました。

  ChatComposer は 44px の操作領域を維持しながら送信ボタンの塗りを 36px に抑え、枠線・フォーカス色・本文の余白を調整しました。送信できない状態は控えめな配色で表示します。

  ChatComposer は短文を 1 段に保ち、折り返し・改行・添付がある場合は本文と操作列を上下に分けます。

  ChatComposer の 1 段・2 段切り替えに高さと位置のアニメーションを追加しました。動きを減らす設定ではアニメーションを無効にします。

  ChatComposerAttachment に任意の previewUrl を追加し、画像サムネイル・アップロード状態・読み込み失敗時の代替表示に対応しました。

  ChatAttachment を専用 subpath とルート入口から公開しました。送信済みファイルのダウンロード、画像の拡大表示、取得中・失敗・操作不可の状態を扱い、認証付き取得処理は consumer へ委譲できます。

  Message.Actions・Message.Reactions・Message.Quote を追加しました。PC のホバー操作バーとタッチ向けメニュー、引用返信、絵文字リアクション、コピー結果の表示を組み合わせられます。保存・通信・クリップボード処理は consumer 側で管理します。

  Message.Actions が本文や添付へのクリック後に表示され続ける問題を修正し、キーボード focus の判定を操作ボタンに限定しました。

  Message.Actions はスマホ・タッチ環境ではドロワーで操作を表示します。Message.Root の 500ms 長押しにも対応し、移動・スクロール・キャンセルで解除します。mobileActions snippet でドロワー内の操作を追加できます。

  ChatComposer の追加操作をプラスボタンのポップオーバーへまとめ、添付と consumer 独自の操作を配置できるようにしました。

  項目ごとのホバー表示と移動操作を提供する OutlineNav を追加しました。スクロールや現在位置の判定は consumer 側で管理できます。

  OutlineNav は線ごとのホバーで目次全体を表示し、見出し階層 level と多数の項目に対応します。

  OutlineNav の一覧位置をレール基準で固定し、線の間隔を詰めました。

  OutlineNav のパネルをレール全体で共有し、ホバー中は開いたまま対象項目へ一覧をスクロールするようにしました。

  OutlineNav の目次パネルに共通の細いスクロールバーを適用しました。

  OutlineNav の件数表示を削除し、レールは高さに応じて線の間隔を調整してスクロールしないようにしました。

  MessageScroller.Outline を追加し、OutlineNav の現在位置・メッセージへの移動・フォーカス処理を共通化しました。

  MessageScroller.Outline は実際の余白に応じて、スクロール中だけの表示に自動で切り替わります。本文の幅は維持し、目次の操作中やキーボード focus 中は表示を保ちます。

  目次の常時表示判定を、クリック領域の幅から線の表示に必要な余白へ緩和しました。

  ChatMessage に layout（bubble / timeline）と side（incoming / outgoing）、bubbleVariant、showAuthor、quote・reactions snippet を追加しました。既読・時刻、送信者、操作バーの配置を共通化し、既存の align・variant による表示は維持します。画面例も共通レイアウトへ移行しました。

  ChatMessage の bubble 形式で、ホバー操作バーを左右の端から 12px 内側へ配置しました。

  Message.Actions の背景・枠・影の下半分をグラデーションで透過し、直接操作中は不透明に戻します。ChatMessage は操作中も送信者名を隠さず表示します。

  ChatMessage の送信者名が操作バーの上へ重なる問題を修正しました。名前の非表示処理は追加せず、操作バーを手前に描画します。

  PC の Message.Actions を 32px のボタンと角丸 12px のバーへ整理し、透過グラデーション・枠線・影を弱めました。ホバー・キーボード focus・展開中のボタンには淡いアクセント背景を表示し、スマホの操作領域は維持します。

  Message.Actions の透過背景に弱い backdrop blur を追加しました。下端ほど効果を弱めて背景になじませ、アイコンの鮮明さと操作中の不透明表示を維持します。

  Message.Actions の背景色とぼかしの透過層を分け、吹き出しの境界ではぼかしが弱まらないようにしました。下端だけ効果を薄め、元のくっきりした境界が混ざる見た目を改善します。

  Message.Actions の枠線を独立した層へ分け、背景の境目で輪郭が凹んで見える印象を軽減しました。通常時は下端だけ線を薄め、操作中は全周を表示します。

  Message.Actions は通常時の枠線を上端だけに抑え、左右の輪郭による屈折のような見え方を軽減しました。ホバー・キーボード focus・メニュー展開中は全周の枠線を表示します。

  Message.Actions の通常時の枠線を全周で非表示にし、グラス背景だけで形を見せるようにしました。操作時のみ全周の枠線を背景と同時にフェード表示します。

### Patch Changes

- cf97459: SidebarUserMenu を小さなアバターと名前の 1 行表示へ整理し、メールアドレスはメニュー内へ表示します。AdminShellFrame ではサイドバーを画面下端まで維持したまま、アカウント欄を本文下部のフッターに合わせて配置します。アバターの上端を本文下端に寄せ、操作ボタンの下に小さな余白を残します。

  サイドバーのユーザー表示には共通の CustomerAvatar を使い、画像未設定時はユーザーごとに安定したグラデーションを表示します。

- cf97459: 会話一覧の補足ラベルを右揃えに統一し、長い会話名に押されてラベルの左右の余白が潰れる問題を修正しました。
- cf97459: 入力欄内の返信先を横並びの 1 行にまとめ、操作領域を維持しながら上下の余白を調整しました。
- cf97459: 会話一覧の名前とステータスを同じ段へまとめ、時刻・未読数を右端に揃えました。余白を見直して 1 件あたりの高さを抑え、長い補足情報の折り返しは維持しています。
- cf97459: ChatComposer の注意書きを背景になじむ浮遊表示へ変更し、非表示時にも残っていた入力欄上の余白を解消します。表示や折り返しによって入力欄の位置は変わりません。
- cf97459: 会話メモ上部に控えめな保存・最小化アイコンを追加。保存中の表示とエラー時の再試行に対応し、自動確定時との保存通知の重複を防ぎます。
- cf97459: StickyNote の上部の空き領域からドラッグできるようにし、保存・最小化ボタンや本文の編集操作と分離しました。
- cf97459: ChatMessage のタイムライン表示でアバター・送信者名・時刻と本文の余白・文字サイズを整えました。PC の操作バーをヘッダー右側に配置し、長い名前や本文と重ならない領域を確保しました。狭い領域では操作バーを本文の下へ配置します。モバイルの本文幅とタッチ操作、吹き出し表示は維持します。

  タイムラインのコピー結果通知を右揃えにし、狭い画面で右端からはみ出す問題を修正しました。

- cf97459: チャットの画像添付をサムネイルのみの表示にし、ファイル名・形式・ダウンロードは拡大プレビューへ集約しました。画像以外の添付は情報行を維持します。メッセージのコピー成功はチェックアイコンと読み上げ通知で伝え、画面上の成功テキストを表示しないようにしました。
- cf97459: 付箋の最小化時の浮遊ボタンから本文の有無を示すドットを削除しました。
- cf97459: ScrollbarArea のネイティブスクロールバーが角丸の枠からはみ出さないよう、枠の輪郭に沿って描画をクリップします。キーボード focus の輪郭は内側へ表示し、DOM 構造・ref・スクロール操作は維持します。
- cf97459: EditableText の編集欄が通常時のフォント・行高・余白を引き継ぐように改善。inputClass による編集時の上書きは維持し、利用側で同じスタイルを二重に指定する必要をなくしました。
- cf97459: 会話メモの通常時と編集時の文字サイズ・行高・配置を揃え、編集開始時にカードの高さが変わる問題を修正。

## 0.19.7

### Patch Changes

- 37e8e2a: 共有する内部処理を internal へ集約し、既存の deep import パスを互換用の再 export で維持しました。公開入口と内部ファイルの境界検証を追加しました。
- 37e8e2a: EventCalendar の操作と表示領域の制御を内部コントローラーへ分離し、公開 API と既存の表示・操作を維持したまま保守しやすくしました。

## 0.19.6

### Patch Changes

- 4f62681: Dialog と Drawer で、後から情報が表示されたり詳細項目を折り畳んだりする際の高さの変化を滑らかにします。動きを減らす設定と既存の最大高さ・本文スクロールを維持します。
- 4f62681: 月表示の予定を最大 3 行で打ち切らず、実際の日付セルの高さに収まる行数まで表示します。全件が収まる日は「他 N 件」の領域も予定の表示に使い、はみ出す日だけ残件数を表示します。

## 0.19.5

### Patch Changes

- d2107b6: Dialog.Body と ResponsiveDialog.Body の標準下余白を 16px にし、本文末尾の操作がフッターに接触するのを防ぐ。class による余白の上書きは維持する。

## 0.19.4

### Patch Changes

- 5431e62: カレンダーの横スクロールバーのつまみ幅を表示範囲に合わせ、右端でバーからはみ出さないようにします。

## 0.19.3

### Patch Changes

- d1b7320: 月表示をスマートフォンの画面幅に収め、7 列を横スクロールなしで表示します。日・週・タイムラインの横スクロールバーを本文へ重ね、バー用の余白をなくします。

## 0.19.2

### Patch Changes

- e606800: カレンダーのタッチ操作は通常スクロールを優先し、長押し後のドラッグで範囲を選択します。カレンダー内の空表示・スクロールバーがダイアログより手前に出ないようにします。

  スマートフォンで開いた状態から生成される ResponsiveDialog が、閉じた後にページの操作を止めないよう、初回から適切な表示形式を選びます。

## 0.19.1

### Patch Changes

- 08a64e1: EventCalendar の日・週・予約対象別タイムラインの縦スクロールバーを本文に重ねて表示し、スクロールバー用の空白をなくしました。月表示の不要な縦スクロールバー領域も解消しました。ドラッグ・ホイール・キーボード操作と固定見出しの列位置を維持します。

## 0.19.0

### Minor Changes

- aa7740e: EventCalendar に親領域へ追従する fill レイアウトと、日付操作・利用側フィルター・アクション・表示方法を同じツールバーに配置する snippets を追加しました。

### Patch Changes

- aa7740e: Align the sidebar header content with the admin shell header in expanded and collapsed states, while allowing taller custom header content.

## 0.18.0

### Minor Changes

- 9a94392: 汎用の EventCalendar と公開型を追加する。日・週・月・予約対象別タイムライン・日付別タイムラインに対応し、表示日数・時間軸・予定の色と内容を指定できる。

  作成・詳細の画面は consumer が所有する。onCreate はクリック・範囲ドラッグ完了時にタイトルを含まない作成範囲を通知し、onEventClick は予定の選択を通知する。両通知に focus 復帰用の trigger を渡す。作成中の仮表示は draft で制御する。標準の作成・詳細ダイアログ、右パネル、eventDetails は持たない。月表示の追加予定一覧からも同じ選択通知へ接続できる。

  15 分などの step 単位で作成・移動・開始終了時刻変更を通知し、ドラッグ中の仮表示はカーソルへ連続して追従する。予定の色を維持し、キーボード変更と Escape によるキャンセルに対応する。終日予定は終了日を含まない日付範囲を受け取り、空き枠からの作成と複数日表示に対応する。

  両タイムラインの終日予定は左端の固定列に表示する。予定と仮表示は行の高さに合わせ、タイトル部分だけを保護する段差で重ねる。空の行の最小高さは 48px。スクロールバーは共有テーマを使い、固定ヘッダーを除く本文に配置する。

  表示範囲通知 onVisibleRangeChange、隣接範囲の先読み通知 onPrefetchRange、取得状態 eventsLoading・eventsError・onEventsRetry を追加する。取得・認証・キャッシュ・保存は consumer が管理する。取得中も範囲移動と取得済み予定の選択は継続し、作成・変更は停止する。

  日付タイムラインの縦スクロールバーを非表示にし、描画バッファの更新でつまみが急に移動する違和感を解消する。縦スクロール操作を維持し、時間軸の横スクロールバーは独立した同期領域に表示する。

  日付別・予約対象別タイムラインの時刻ヘッダーは時だけを表示し、分表示を省略する。予定の時刻表示と作成範囲の通知は変更しない。

  日付タイムラインの横スクロールバーを固定の日付列の右側から表示し、時間軸と同じ最大スクロール量を維持する。

  `backgroundRanges` と公開型 `EventCalendarBackgroundRange` を追加する。日時範囲・終日範囲・リソース行ごとの装飾背景を各ビューへ描画し、操作可否は変更しない。

  左右の範囲切り替えボタンに方向を反映したアニメーションを追加する。固定列・曜日行は動かさず、連続操作・表示切り替え時のキャンセルと動きを減らす設定に対応する。

  スワイプによる週・月の範囲切り替え、慣性判定と隣接範囲のアニメーションを削除する。範囲移動は前後ボタン・今日・日付選択へ集約し、週内の横スクロール・固定列・ヘッダーの同期と日付タイムラインの連続縦スクロールを維持する。

  外枠の角丸に合わせて内側の背景・罫線を切り抜き、日・週表示の右端の罫線が外枠と二重になる問題を修正する。

## 0.17.0

### Minor Changes

- 702a7c3: Add an optional footer snippet to AdminShellFrame outside the scrolling content, preserving the existing layout when omitted.

## 0.16.0

### Minor Changes

- aeddf81: Select と InputGroup に明示的な label による枠線ラベルを追加。通常・検索付き Select、アイコンや追加ボタン付き入力、複数行入力に対応し、ラベルのフォーカス関連付けとエラー表示を維持する。既存 Input の枠線描画を共通化し、label なしの挙動を保持する。
- aeddf81: アイコン表示のサイドバーをホバー・キーボードフォーカスで一時展開し、メイン領域の幅を保持する。Escape で閉じられ、保存された開閉状態は変更しない。Root に expandOnHover（既定 true）と context に previewOpen を追加する。

  折りたたみ時のメニューボタン内にアイコン・アバターを収め、アカウントメニューのアバター背景・画像・枠線の角丸を一致させる。

### Patch Changes

- aeddf81: Fix searchable Select keyboard navigation, Escape cancellation, focus retention and per-instance listbox IDs. Separate Select positioning and Markdown toolbar internals, and remove Dialog/Calendar barrel import cycles without changing public exports.

  Guard Markdown editor initialization/teardown and pending updates, track Select element and visual viewport resizing, and share locked-item reorder logic while preserving keyboard focus.

## 0.15.0

### Minor Changes

- 26fd83e: CodeMirror 6 ベースの CodeEditor を追加。値の双方向バインド、言語の遅延読み込み、共通テーマ、読み取り専用・無効・エラー状態と拡張設定に対応。

  CodeDiff を追加し、左右比較・統合表示、変更後の編集と読み取り専用、表示切り替え時の Undo 履歴維持に対応。

  言語名・コピー・差分表示切り替えを共通ヘッダーへ統合し、追加ボタン用 snippet とヘッダーの非表示設定を提供。

- 26fd83e: 日付範囲をマウス・キーボードで選択できる RangeCalendar を追加。日本語表示、範囲の強調、無効日、最小・最大日付に対応。
- 26fd83e: FilterSelect に候補検索付きの複数選択モードを追加。選択済み候補の保持、選択内容の要約、枠内ラベル、パネル内で使うための portal 無効化に対応。

## 0.14.0

### Minor Changes

- 0ebe4eb: Astro などで利用できる、標準 CSS 変数のみの `@mutsuna/ui/tokens.css` とフォントのみの `@mutsuna/ui/fonts.css` を追加しました。既存の `theme.css` は両方を読み込み、従来の Tailwind・Svelte 部品向けスタイルを維持します。Astro consumer で型チェック・本番ビルド・テーマ切替と Svelte island の操作を検証します。

### Patch Changes

- 0ebe4eb: テーマの色・角丸・フォントの正本を DTCG 形式の JSON へ集約し、既存 Theme API と CSS 変数を生成するようにしました。既存 18 テーマと light/dark の表示を維持し、生成漏れと不正な参照を検出します。

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
