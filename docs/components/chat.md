# チャット

[ガイド一覧](../README.md) · [Storybook](https://mutsuna-studio.github.io/mutsuna-ui/)

## アプリから使い始める

通常は`@mutsuna/ui/chat`から部品と型をまとめてimportする。既存の個別入口も同じ部品を公開しており、混在できる。新しいデータ形式への変換や専用Providerの追加は不要。

```ts
import {
  ChatComposer, ChatMessage, ChatThreadList, ChatHeader,
  MessageActions, MessageQuote, MessageReactions,
  MessageScroller, MessageScrollerProvider, MessageScrollerViewport,
  MessageScrollerContent, MessageScrollerItem, MessageScrollerTopBar,
  MessageScrollerButton, StickyNote, FloatingActionMenu, ChatAttachment, ImagePreview,
  type ChatComposerSubmission, type ChatComposerAttachment,
  type ChatThreadListItem, type ChatMessageProps,
} from "@mutsuna/ui/chat";
```

まずは[動作する最小構成](../examples/chat-basic.svelte)を使う。共通のChatComposerで送信し、ChatMessageの`layout`だけでtimeline / bubbleを切り替える。サンプルはメモリ内で動作し、公開tarballを使ったconsumer buildでも検証する。themeの導入は[セットアップ](../../README.md#install)に従う。

| 作りたいもの | 選ぶ部品 |
| --- | --- |
| 普通のメッセージと長文の回答 | ChatMessage。`layout`で配置、`prose`でHTML本文の組版を指定 |
| 入力・返信・既存メッセージの編集 | ChatComposer。返信・編集の表示は`context`へ渡す |
| メッセージ単位の操作 | MessageActions・MessageQuote・MessageReactions |
| 履歴・最新への移動・上部の固定情報 | MessageScroller系。TopBarへ日付・操作・補足をまとめる |
| 会話一覧 | ChatThreadList。`metadata(item)`へステータスなどを渡す |
| 単独画面のタイトル | ChatHeader。AppShell内では外側のヘッダーを使う |
| 付箋と会話全体の操作 | StickyNoteとFloatingActionMenu。付箋は`bind:open`で外部開閉 |
| 添付と拡大プレビュー | ChatAttachment。画像プレビュー単独ならImagePreview |
| 独自のメッセージ配置 | 個別入口のMessage・Bubbleを組み合わせる |

ChatMessageEditorは本文中で編集フォームを開く場合の選択肢。今回の画面例のように入力欄を再利用する場合はChatComposerを使う。新規の付箋にはStickyNoteを使い、ChatMemoは既存利用向けの会話用ラッパーとして扱う。

### 状態と処理の分担

| UI部品が扱うもの | アプリが管理するもの |
| --- | --- |
| 入力の表示・IME・送信キー・送信可否 | draft、`onSend`内の通信、成功後のdraft消去、`sending`・エラー |
| 添付の選択通知・プレビュー・削除操作 | File検査、アップロード、id・URL・status、object URLの解放 |
| 選択・未読・ステータスの表示 | 会話データ、並び順、権限、遷移、保存 |
| 編集・返信の操作UI | 対象id、編集前のdraft、キャンセル復元、履歴の更新・巻き戻し |
| 付箋の編集・移動・最小化 | 会話idごとの本文、保存済み本文、保存中・失敗、位置の永続化 |
| コピーや出力の操作 | Clipboard・PDF生成などの実処理、成功・失敗のトースト |

`onSend`は通知であり、Promiseの完了や送信成功を部品が推測することはない。アプリで非同期処理の例外を処理し、処理中は`sending`を渡す。保存済みメモは`savedValue`へ成功した値を渡す。

### AdminShellFrameへ入れる

`AdminShellFrame`は`@mutsuna/ui/admin-shell-frame`からimportする。角丸・枠線・本文の既定余白はシェルが管理するので、アプリで内部DOMを対象にCSSを上書きしない。子の画面は`h-full min-h-0 min-w-0`で高さを受け取り、履歴のスクロールをMessageScrollerViewportへ任せる。シェル内の画面全体をさらに`overflow-auto`で囲まない。

- シェルの`pageTitle`・`headerActions`にタイトルとページ操作を渡し、ChatHeaderを重ねない。
- 日付・選択中の質問・会話操作はMessageScrollerTopBarにまとめる。
- `placement="overlay"`のTopBarは高さを占有しないので、公開CSS変数`--message-scroller-top-bar-height`を履歴上端の余白に使う。
- 最小構成の入力欄は通常の配置。Storybook画面例の入力欄を履歴へ重ねる配置やすりガラスは画面側の構成であり、ChatComposer単体の既定には含めない。重ねる場合は入力欄の実測高に合わせて履歴末尾の余白も確保する。

画面全体の組み合わせはStorybookの`Patterns / Chat Screens`、部品ごとのpropsと状態は各コンポーネントのstoryを参照する。storiesのpreviewファイルはサンプル専用で、アプリからimportする公開APIではない。

## 低レベルの組み合わせ

チャットUIは、配置・表面の見た目・履歴スクロール・入力を別々に組み合わせる。shadcn-svelteの[Message](https://www.shadcn-svelte.com/docs/components/message)、[Bubble](https://www.shadcn-svelte.com/docs/components/bubble)、[Message Scroller](https://www.shadcn-svelte.com/docs/components/message-scroller)、[Chat構成例](https://www.shadcn-svelte.com/docs/ai-elements/chat)を基にしている。取得元と移植内容は[upstream/chat](../../upstream/chat/README.md)に記録している。

| 公開入口 | 責務 |
| --- | --- |
| `@mutsuna/ui/message` | Root、Avatar、Content、Header、Footer、Groupでメッセージの配置を構成する |
| `@mutsuna/ui/bubble` | Root、Content、Group、Reactionsで吹き出し・リッチな本文の表面を構成する |
| `@mutsuna/ui/message-scroller` | Provider、Root、TopBar、Viewport、Content、Item、Buttonで履歴の読み位置・上部の配置・スクロールを管理する |
| `@mutsuna/ui/chat-composer` | 本文・添付の選択と削除・送信状態を扱う共通入力欄 |
| `@mutsuna/ui/chat-attachment` | 送信済みファイルの情報・ダウンロードと画像の拡大表示 |
| `@mutsuna/ui/input-group` | 入力欄・補助操作・送信ボタンを1つの枠内に配置する |
| `@mutsuna/ui/chat-message` | 吹き出し・タイムラインの配置を切り替えられる単一メッセージ |

すべての部品は公開indexからimportする。各部品の`class`・HTML属性・`ref`で調整し、内部の子要素の位置やDOM構造を前提にしない。Messageの`align`とBubbleの`variant`は独立して指定できる。

```svelte
<script lang="ts">
  import * as Message from "@mutsuna/ui/message";
  import * as Bubble from "@mutsuna/ui/bubble";
  import * as Scroller from "@mutsuna/ui/message-scroller";
  import * as InputGroup from "@mutsuna/ui/input-group";
  let draft = $state("");
  let messages = $state([{ id: "1", author: "佐藤", text: "資料を確認してもらえますか？", own: false }]);
  let nextId = 2;
  function send(event: SubmitEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    messages = [...messages, { id: String(nextId++), author: "あなた", text: draft.trim(), own: true }];
    draft = "";
  }
</script>

<div class="flex h-[32rem] min-h-0 flex-col">
  <Scroller.Provider autoScroll>
    <Scroller.Root class="min-h-0 flex-1">
      <Scroller.Viewport aria-label="会話履歴">
        <Scroller.Content class="p-4" aria-label="メッセージ" aria-live="off">
          {#each messages as message (message.id)}
            <Scroller.Item messageId={message.id}>
              <Message.Root align={message.own ? "end" : "start"} role="article" aria-label={message.author}>
                <Message.Content>
                  <Message.Header>{message.author}</Message.Header>
                  <Bubble.Root variant={message.own ? "default" : "outline"}>
                    <Bubble.Content class="whitespace-pre-wrap">{message.text}</Bubble.Content>
                  </Bubble.Root>
                </Message.Content>
              </Message.Root>
            </Scroller.Item>
          {/each}
        </Scroller.Content>
      </Scroller.Viewport>
      <Scroller.Button />
    </Scroller.Root>
  </Scroller.Provider>
  <form onsubmit={send} class="shrink-0 p-2">
    <InputGroup.Root class="has-disabled:opacity-100 has-disabled:bg-background dark:has-disabled:bg-background">
      <InputGroup.Textarea aria-label="メッセージ" bind:value={draft} rows={1} />
      <InputGroup.Addon align="inline-end">
        <InputGroup.Button type="submit" disabled={!draft.trim()}>送信</InputGroup.Button>
      </InputGroup.Addon>
    </InputGroup.Root>
  </form>
</div>
```

Messageはレイアウトだけを担当し、既定でarticleやlistitemの意味は付けない。必要に応じて`role`、`aria-label`、外側のリスト構造をconsumerで指定する。本文はSvelteの文字列またはsnippetで渡す。Markdown解析やHTMLサニタイズ、通信、保存は含まない。

## スクロール

Providerの`autoScroll`は既定ではfalse。trueにすると、末尾を追っている間だけ追加・伸長に追従し、読み返すための操作で追従を停止する。Viewportの`preserveScrollOnPrepend`は既定でtrueで、過去の履歴を先頭へ足しても表示中の行を維持する。

Contentの直接の子は日付・状態表示も含めてItemで囲む。履歴を保持する項目には安定した`messageId`を指定する。`scrollAnchor`は新しいターンの先頭を基準に見せたい場合だけ指定する。画面全体を高さで制約し、Viewportにスクロールを任せ、入力欄はRootの外へ置く。

`defaultScrollPosition`は既定で`end`。`start`、`last-anchor`も使える。特定メッセージへの移動は`scrollToMessage`で行う。画面Storyは見た目を比較しやすいよう`start`を明示している。

`useMessageScroller()`はProviderの子コンポーネントから利用し、`scrollToEnd`、`scrollToStart`、`scrollToMessage`で明示的に移動する。送信直後に最新へ戻すなど、ユーザー操作に対応する移動に使う。`useMessageScrollerScrollable()`と`useMessageScrollerVisibility()`で方向別のスクロール可否や表示中の行を取得できる。

Contentの既定は`role="log"`と`aria-relevant="additions"`。読み上げ方はconsumerが判断する。生成中の全文を繰り返し読み上げないよう、例では`aria-live="off"`を指定している。必要な状態通知は別のstatus領域などにまとめる。スクロールボタンは末尾で非アクティブとなり、Tab順から外れる。

スクロール基盤はMITの`@shadcn-svelte/primitives`をruntime dependencyとして利用する。AI SDKやSvelteKitは要求しない。将来のprimitive更新はSSR・読み位置・フォーカス・Astroの検証と同じ単位で行う。

## ChatComposer

表示形式や送信者の種類に依存しない共通入力欄。本文、添付操作、送信は同じ枠内に置き、フォーカス背景も枠全体で共有する。既定はEnterで改行し、Ctrl/Cmd+Enterまたは送信ボタンで送信する。IME入力中のEnterを送信扱いにしない。

短文は本文と操作を1段に配置する。本文が折り返す・改行を含む・添付がある場合は本文を枠の幅いっぱいに広げ、追加・送信ボタンを下の操作列に置く。折り返しは1段配置時の幅で判定するため、切り替えによる往復を防ぐ。幅の変更や本文の削除にも追従する。

1段・2段の切り替えでは、枠の高さと操作要素の位置を180msで補間する。同じ入力要素を保持するためフォーカスや選択位置は維持される。`prefers-reduced-motion: reduce`では即座に切り替える。

| props / callback | 内容 |
| --- | --- |
| `submitOn` | 既定mod-enterはCtrl/Cmd+Enterで送信。enterはEnterで送信しShift+Enterで改行。設定の保存・選択UIはアプリ側で管理 |
| `bind:value` | 本文。送信時に通知するtextは前後をtrimする |
| `attachments` | consumerが保持する`{ id, name, size?, previewUrl?, status?, error? }`の配列 |
| `onFilesSelect(files)` | ファイル選択を通知。指定した場合、プラスボタンのポップオーバーに「ファイルを添付」を表示する |
| `accept`、`multiple` | ネイティブfile inputへ渡す。acceptは選択のヒントで、validationの代わりにはしない |
| `onRemoveAttachment(id)` | 添付の削除を通知。consumerが配列を更新する。削除後は本文へfocusを戻す |
| `onSend({ text, attachments })` | 送信内容のスナップショットを通知。通信や本文・添付の自動消去は行わない |
| `sending`、`disabled` | 本文、添付選択・削除、送信をロック。sending時は送信ボタンにloadingを表示 |
| `actions({ close })` | プラスボタンのポップオーバーへ追加する操作。選択後は `close()` で閉じる。添付なしでも利用可能 |
| `tools` | 絵文字、モデル選択などを下段に足す任意snippet |
| `context` | 返信先・編集中の情報を入力枠の上部へ置く任意snippet |
| `notice` | 任意の注意書き。入力欄の直上に重ね、focus中または本文があるときに表示。高さを確保せず入力位置を維持 |
| `ariaLabel`、`placeholder` | 入力欄の名前とプレースホルダー。既定は「メッセージ」「メッセージを入力」 |

添付の`status`は`ready`（省略時）、`uploading`、`error`。本文が空でもreadyな添付があれば送信できる。uploadingまたはerrorが残る間は送信を無効にする。添付名は省略表示し、一覧が増えた場合は添付領域内でスクロールする。

画像は`previewUrl`を渡すとサムネイル・ファイル名・サイズのカードとして表示する。アップロード中は画像上にローディング表示、失敗時は枠線とエラー文を表示する。画像の読み込みに失敗した場合もファイル名と削除操作を残す。通常ファイルと混在可能。URLはconsumerが管理し、ローカル画像に`URL.createObjectURL(file)`を使う場合は削除・送信後・unmount時に`URL.revokeObjectURL(url)`で解放する。プレビュー表示とアップロード完了は別の状態として扱う。

ファイルの検査・アップロード・永続化・retryはconsumerの責務。選択したFileをcallbackで受け取り、consumer側でidと表示情報を作り、状態を更新する。送信に成功してからvalueとattachmentsを空にするなど、消去のタイミングもconsumerが決める。Fileの内容やobject URLを部品内部へ保存しない。

Storybookの`Chat Composer/Compose And Attach`と画面例で、画像プレビュー・ファイル選択・削除・添付だけの送信を試せる。画像を含む添付一覧は横スクロールにし、スマホでもサムネイルの高さを揃えて表示する。画面例はメモリ内の表示情報とプレビューURLを保持し、実際のアップロードは行わない。

## メッセージの操作・引用・リアクション

`@mutsuna/ui/message`から`Actions`、`Reactions`、`Quote`を組み合わせる。ルート入口では`MessageActions`、`MessageReactions`、`MessageQuote`として利用できる。

| 部品 | 主なprops |
| --- | --- |
| `Actions` | `onReply()`、`onCopy()`、`onReact(emoji)`、`reactions: { emoji, label }[]`、`copyState: idle / copied / error`、`disabled`、`ariaLabel`、`longPress` |
| `Reactions` | `items: { emoji, label, count, selected? }[]`、`onToggle(emoji)`、`disabled` |
| `Quote` | `author`、`text`、`onNavigate()`、`onDismiss()`、`disabled` |

`Actions`は`Message.Root`内に置く。PCのマウス操作ではルートのホバー・操作ボタンのキーボードfocus時に操作バーを表示し、メニューやリアクション選択中も表示を保つ。タッチ環境と狭い画面では「その他の操作」ボタンからドロワーを開く。ボタンは常時表示し、長押しが使えない環境でも操作を見つけられるようにする。キーボードではTabで操作へ移り、Enterで実行、Escapeでメニューを閉じる。`actions({ close })` snippetへ公開`DropdownMenu.Item`を追加し、PCのメニューを拡張できる。スマホでは`mobileActions({ close })`へButtonやフォームなどを追加できる。mobileActionsがない場合、既存actionsはドロワーの「追加の操作」メニューに表示する。

`longPress`は既定でtrue。最も近い`Message.Root`の本文をタッチ・ペンで500ms長押しすると同じドロワーを開く。8pxを超える移動、スクロール、指を離す操作、pointercancel、複数指でキャンセルする。リンク・ボタン・フォーム・編集可能領域では開始しない。`longPress={false}`で無効にできる。マウス操作には適用しない。

返信先、引用のスナップショット、引用元への移動とfocus、リアクションの件数と選択状態、クリップボード処理と結果表示、保存や通信はconsumerが管理する。部品はcallbackを通知し、本文を取得・変更したり自動コピーしたりしない。`onCopy`で非同期処理を行う場合はconsumer内で例外処理し、`copyState`を更新する。`Reactions`は0件以下を表示せず、`onToggle`がない場合は操作不可になる。`Quote`は`onNavigate`がある場合のみ引用をボタンとして表示し、`onDismiss`がある場合は解除ボタンを表示する。

Storybookの`Message/Actions And Replies`で長い引用・操作不可・追加メニューを比較できる。`Chat Screens`では引用返信、引用元への移動、リアクションの追加と解除、コピーを試せる。例の状態はメモリ内だけで保持する。HTTP接続のStorybookではクリップボードAPIが使えない場合に選択ベースのコピーを試し、失敗は表示する。

## 送信済み添付のChatAttachment

`ChatAttachment`を`@mutsuna/ui/chat-attachment`からimportし、Message/Bubbleの本文内に置ける。ChatComposerの送信前プレビューとは独立している。

```svelte
<ChatAttachment name="資料.pdf" mediaType="PDF" size={24000} downloadUrl={fileUrl} />
<ChatAttachment name="写真.jpg" previewUrl={thumbnailUrl} downloadUrl={originalUrl} />
```

| props | 内容 |
| --- | --- |
| `name`、`size?`、`mediaType?` | ファイル名、バイト数、表示用の種類 |
| `previewUrl?` | 画像プレビュー。クリック・Enterで拡大Dialogを開き、Escape・閉じる操作で元のボタンへfocusを戻す |
| `downloadUrl?` | ファイル取得用のURL。ファイル名を`download`属性へ渡すリンクを表示 |
| `onDownload?` | 認証や署名URLの発行などが必要な場合の操作通知。指定時はURLリンクより優先する |
| `downloading`、`disabled`、`error?` | 取得中の操作ロックとloading、操作不可、consumerから渡すエラー表示 |

URLとcallbackが両方ない場合、ダウンロード操作は無効になる。プレビューとダウンロードのURLは別々に渡せる。画像が読み込めなくてもファイル名とダウンロード操作を残す。認証・fetch・保存・retry・例外処理はconsumerの責務で、部品から自動fetchはしない。`onDownload`で非同期処理を始める場合は、consumerが`downloading`と`error`を更新する。object URLの生成と解放もconsumerが管理する。

Storybookの`Chat Attachment/Files And Images`で各状態、`Chat Screens`で履歴内のファイルと画像のダウンロードを確認できる。

## ChatMessage

標準の組み立てには`ChatMessage`を使う。同じ本文・添付・引用・リアクション・操作を維持しながら、`layout="bubble"`で左右に分かれる吹き出し、`layout="timeline"`で左揃えの投稿に切り替える。DM・AIといった送信者の種類や業務ルールには依存しない。

```svelte
<script lang="ts">
  import { ChatMessage } from "@mutsuna/ui/chat-message";
  import * as Message from "@mutsuna/ui/message";
</script>

<ChatMessage layout="bubble" side="outgoing" author="あなた">
  {#snippet metadata()}<span>既読</span><time datetime="2026-10-17T10:21:00+09:00">10:21</time>{/snippet}
  {#snippet actions()}<Message.Actions onCopy={() => copyText(text)} />{/snippet}
  {text}
</ChatMessage>

<ChatMessage layout="timeline" side="incoming" author="アシスタント">
  {#snippet actions()}<Message.Actions onCopy={() => copyText(answer)} />{/snippet}
  {answer}
</ChatMessage>
```

`text`・`answer`と`copyText`は利用側で定義する。クリップボード、送信・再送、通信、日時の整形、既読の判定、リアクションの保存は部品では実行しない。

| props / snippet | 内容 |
| --- | --- |
| `author`、`children` | 必須の送信者名と本文。送信者名を視覚的に省略する場合もarticleのアクセシブル名に使う |
| `layout` | `bubble`は左右の吹き出し、`timeline`は左右とも左揃え |
| `side` | `incoming` / `outgoing`。省略時は従来の`align`から決定し、既定はincoming |
| `bubbleVariant` | 表面色の上書き。既定はbubble受信がoutline、送信がdefault、timelineがghost |
| `showAuthor` | 名前の表示。既定はbubbleの受信とtimelineで表示し、bubbleの送信では省略 |
| `avatar` | bubbleでは名前の横、timelineでは投稿者アイコンに配置する。省略可能 |
| `metadata` | bubbleでは吹き出し横の下端に縦並び、timelineでは名前の横。bubbleでは時刻・短い配信状態を渡す |
| `quote` | 本文の前に置く引用。`Message.Quote`を渡せる |
| `reactions` | 吹き出し下のリアクション。`Message.Reactions`を渡せる |
| `prose` | 既定はfalse。渡されたHTMLの見出し・段落・リスト・引用・コード・表の書式を整える。Markdownの解析は行わない |
| `footerActions` | 本文下に常時表示する操作。長い回答を読み終えた位置にコピーや評価などを置ける。`actions`とは独立 |
| `actions` | 操作。`Message.Actions`でホバー操作バーとタッチ用ドロワーを使える。通常のButtonも渡せる |
| `ref`、HTML属性、`class` | 外側のarticleへ渡す。必要に応じて`tabindex`や`aria-label`を指定する |

`layout`を省略した既存の呼び出しは従来どおり動作する。`align="start" | "end"`、`variant="bubble" | "plain"`、既存snippetの配置は変更しない。`layout`を指定した場合は新しい配置を優先し、色は`bubbleVariant`で指定する。

`Message`と`Bubble`の各primitiveは引き続き公開する。標準の配置で足りない場合は直接組み立てられる。固定質問・目次・履歴・入力欄は独立して組み合わせ、`ChatMessage`へ画面全体の機能を持ち込まない。

`MessageScroller.Item`内のbubble形式では、操作バーの上半分が切れないよう、そのItemのcontent-visibilityをvisibleにする。独自の仮想スクロールやpaint containmentを使う場合は、重ねた操作バーの描画領域を利用側でも確保する。

## 画面構成の例

Storybookの`Patterns/Chat Screens`に画面例を用意している。

どちらの画面も初期履歴に画像添付を含む。AIは質問に添えた画面ラフ、DMは受信した画面ラフと送信した写真を表示し、画像とPDFの混在も確認できる。サンプル画像は独自SVGで、外部への画像リクエストは行わない。

画面例はどちらも`ChatMessage`を使い、layoutとsideで配置を指定する。DMは時刻・既読を吹き出しの横、リアクションと操作を下に置く。スマホの操作ボタンは44pxの操作領域を保つ。配置を再現するための画面固有CSSは不要。

PCの操作バーは吹き出しの上端に高さの半分を重ねる。DMでは受信が左上、送信が右上で、左右の端から12px内側に寄せる。DMでは吹き出しまたは操作バーのホバー時だけ表示し、行の余白では表示しない。送信者名を非表示にする処理は行わず、操作バーと重なる部分では操作バーを手前に描画する。専用の縦余白やレイアウト移動は発生させない。操作バーの背景・影は下端ほど透明にし、枠線は独立した層で通常時は非表示にする。アイコンの不透明度は維持する。操作バーのホバー・キーボードfocus・メニュー展開中は背景を140msで不透明にする。キーボードfocusとメニュー展開中も操作バーを保持する。タイムラインでは操作バーをヘッダー右側に揃え、名前・時刻の領域に操作バーの幅を確保する。本文との間に操作バー用の縦余白は設けず、表示・非表示で本文を移動させない。PCでも部品の幅が24rem以下の場合は、名前の横幅を確保するため操作バーを本文の下へ常時表示する。アバターは32px、名前は14px、時刻は11pxに揃え、本文はPCで14px・スマホで15px、行高1.75とする。スマホでは本文をヘッダーの下で横幅いっぱいに表示し、44pxの操作領域を本文の下に置く。

- `Timeline`: 左揃えの投稿。`ChatMessage layout="timeline"`で表示。
- `Bubble`: 左右の吹き出し。`ChatMessage layout="bubble"`で表示。

Timelineはアシスタントとの会話、Bubbleは通常の会話の例とする。それぞれのストーリー内でlayoutを切り替えても本文・送信者・会話一覧・注意書き・編集動作を変更しない。サンプルの種類をControlsへ公開しない。アシスタントの例はどちらのlayoutでも質問の編集・やり直し、再生成・停止、目次と長文を確認できる。

アシスタントの例では、自分の質問が上端を過ぎると日付と質問を高さ44pxの1つの帯にまとめて固定し、次の質問へ進むと切り替える。質問は1行で省略表示し、ホバー・キーボードfocusで全文を表示する。帯が出ている間は単独の日付ラベルを隠す。

日付・回答中の質問・会話操作はMessageScroller.TopBarへまとめる。Root直下でViewportの前へ置き、チャット画面ではplacement="overlay"で透明な層として履歴へ重ねる。上部の帯は作らず、部品の隙間には背後のメッセージが見える。日付と質問は同じ領域を切り替え、操作領域とは幅を分け合って重ならない。

モバイルでは本文を広く使い、入力文字は16pxにし、共通のChatComposerを使用する。履歴と入力欄の境界、長い履歴、画面の高さが縮んだ状態をブラウザテストで検証する。会話切り替え・送信はメモリ内で動作し、AI応答は固定文。通信・保存・ファイル取得は行わない。

視覚確認用storyは自動操作しない。送信の操作検証は同じrenderを使うtest専用storyへ分離している。

## 会話の目次

`MessageScroller.Outline`へ目次項目を渡すと、現在位置の判定、メッセージへのスクロール、移動後のfocusを任せられる。AI画面例もこの部品を利用している。汎用の`OutlineNav`との使い分け、最小構成とpropsは[目次の利用ガイド](./outline-nav.md)を参照。

DMの既読・時刻は吹き出しの横の下端に配置する。送信側は左に既読と時刻を縦に並べ、受信側は右に時刻を表示する。狭い画面でも表示がはみ出さない幅を確保し、リアクションとタッチ用操作ボタンは吹き出しの下に置く。

PCの操作バーは32pxのボタンを3pxの内余白で包み、外側の角丸12px・ボタンの角丸6pxに揃える。通常時は薄い背景の35%付近から90%にかけて透過し、枠線と影も控えめにする。操作対象だけ淡いアクセント背景と濃いアイコンに切り替える。スマホの操作ボタンは44px、ドロワー内の操作領域も維持する。

透過背景とは別の層に6pxのbackdrop blurを加える。背景色は35%付近から薄める一方、ぼかしは65%まで維持して境界をなじませ、下端で薄れるようにする。アイコン自体はぼかさず、ホバー・キーボード操作・メニュー展開中は不透明な背景へ戻す。backdrop-filterに対応しない環境では従来の透過背景を表示する。

操作バーの枠線は背景色・ぼかしから独立した層に置く。通常時は枠線を表示せず、背景の境目で輪郭が凹んで見える印象を抑える。背景・ぼかし・枠線の位置と角丸を揃え、直接操作中は全周の線を表示する。

タイムラインの代表状態は`Chat Message/States`にまとめている。画像添付・引用・リアクション・回答生成中・長い送信者名・操作不可・送信エラーを比較できる。`Timeline`の履歴は最大56rem、入力欄は最大52.5remに抑え、広い画面でも長文を追いやすくしている。これらの画面幅はstory側のcompositionで、部品自体の幅は利用側で指定できる。

## 長い回答

`ChatMessage prose`は利用側が`children`へ渡すHTMLの見た目を整える。既定では無効で、従来の改行付きプレーンテキストはそのまま表示できる。Markdownの解析や文字列からのHTML挿入は行わない。rendererや生成処理はconsumerで選ぶ。

```svelte
<ChatMessage layout="timeline" author="アシスタント" prose>
  <h2>回答の結論</h2>
  <p>結論を先に示し、その後に理由と手順を続けます。</p>
  <ul><li>確認すること</li><li>次に行うこと</li></ul>
  {#snippet footerActions()}
    <Button variant="ghost" class="min-h-11" onclick={() => copyText(answer)}>回答をコピー</Button>
  {/snippet}
</ChatMessage>
```

`prose`は本文の行幅を最大72chに抑え、見出し・段落・リスト・引用に余白を付ける。コードブロックは`pre > code`で渡すと、改行と空白を保ち、その領域だけ横にスクロールする。幅の広い表は`data-slot="chat-message-scroll"`を付けた要素で囲み、`role="region"`、内容を表す`aria-label`、`tabindex="0"`を指定する。コードブロックにも同様に名前とキーボードfocusを指定すると、横スクロールをキーボードから操作できる。Svelteの`a11y_no_noninteractive_tabindex`には、横スクロールへのキーボードアクセスのためであることを明記した局所的な例外を付ける。表自体のtable semanticsは維持する。

`footerActions`には通常のButtonなどを渡す。常時表示する操作なので`Message.Actions`のホバー用バーとは分けて使う。コピーするテキストと処理、評価の状態、生成の停止などはconsumerが管理する。短い回答で使う必要はなく、既存の`actions`だけを渡す呼び出しも変わらない。

`Chat Message/Long Answer`で約3,000文字の回答、横に長いコードと表、末尾のコピーと評価を確認できる。「続きを生成」を押すと説明が少しずつ追記される。自動で生成を開始するplayは付けていない。`MessageScroller.Provider autoScroll`は末尾で読んでいるときだけ追従し、読み返し中は位置を維持する。「最新のメッセージへ」で戻ると追従を再開する。全文を折りたたむ処理は追加しない。

## 送信済みの質問の編集・回答の再生成

`ChatMessageEditor`と`ChatRegenerateAction`を`@mutsuna/ui/chat-message`またはルート入口からimportできる。編集の開始ボタンには通常のButtonを使い、編集中は質問本文の位置へEditorを置く。回答末尾の`footerActions`にはRegenerateActionを置ける。

```svelte
<ChatMessage author="あなた" layout="timeline" side="outgoing">
  {#if editing}
    <ChatMessageEditor
      bind:value={draft}
      {submitting}
      error={editError}
      description="この質問以降の会話を作り直します。"
      onSubmit={restartFromQuestion}
      onCancel={cancelEdit}
      onStop={abortEdit}
    />
  {:else}
    {question}
  {/if}
</ChatMessage>

<ChatMessage author="アシスタント" layout="timeline">
  {answer}
  {#snippet footerActions()}
    <ChatRegenerateAction
      {generating}
      error={generationError}
      onRegenerate={regenerateAnswer}
      onStop={abortGeneration}
    />
  {/snippet}
</ChatMessage>
```

上記の状態・callbackはconsumerで定義する。編集開始時に元の本文をdraftへコピーし、キャンセル・完了後はconsumerが編集開始ボタンへfocusを戻す。部品から会話の削除・巻き戻し・保存・生成要求は実行しない。後続の会話は確定まで残し、成功時にだけ利用側の方針で更新する。影響範囲は`description`へ渡す。再生成では質問を変えず、元の回答を残して処理する例をStorybookで示している。会話の分岐や以前の回答の切り替えUIは含めない。

| ChatMessageEditor | 内容 |
| --- | --- |
| `value` | bind可能な編集本文。送信時に前後の空白を除いてonSubmitへ渡す。入力値自体は変更しない |
| `onSubmit(value)`・`onCancel()` | 必須。実行と編集の取り消しを利用側へ通知する |
| `submitting`・`disabled` | 処理中は本文をreadonlyにし、送信とキャンセルをロックする。disabledでは全操作を無効にする |
| `onStop?()` | 処理中だけ停止ボタンを表示する。AbortControllerや状態変更は利用側で実施する |
| `description?`・`error?` | 影響説明と入力に関連付けるエラー。失敗時もdraftを保持する。errorはrole=alertで通知する |
| `label` | 入力とformのアクセシブル名。画面上の見出しとしては表示しない |
| `submitLabel`・`submittingLabel`・`cancelLabel`・`stopLabel` | 表示文言の上書き。確定ボタンの既定は「送信」、処理中は「送信中」 |
| `autofocus` | 既定true。編集フォームを開いたときに入力へfocusする。状態比較のstoryではfalseを指定する |

Enterは改行、Ctrl/Cmd+Enterは実行、Escapeはキャンセル。IME変換中のキー操作では実行・キャンセルしない。空白だけの本文は送信しない。処理中は停止ボタンへfocusを移し、停止・失敗後は入力へ戻す。停止操作がない場合はreadonlyの入力にfocusを維持する。処理中に利用者が別の操作へfocusを移した場合は、そのfocusを奪わない。入力・ボタンは狭い画面でも使える幅と44px以上の操作領域を確保する。

| ChatRegenerateAction | 内容 |
| --- | --- |
| `onRegenerate()` | 必須。再生成・エラー後の再試行を利用側へ通知する |
| `generating`・`disabled` | 生成中はloading表示と重複実行のロック、disabledは操作不可 |
| `onStop?()` | 生成中だけ停止ボタンを表示する。キャンセル処理や元の回答の維持は利用側の責務 |
| `error?` | 元の回答の下にエラーを表示し、再試行できる。role=alertで通知する |
| `label`・`generatingLabel`・`retryLabel`・`stopLabel`・`ariaLabel` | 表示文言と操作グループ名の上書き |

再生成中は停止ボタンへ、停止・完了・失敗後は再生成ボタンへfocusを戻す。停止操作がない場合は操作グループへ一時的にfocusを移す。利用者が他の操作へ移った場合は戻さない。両部品のcallbackは非同期の完了や例外を自動処理しない。利用側が例外処理し、submitting/generating/errorを更新する。

`Chat Message/Inline Editing And Regeneration`で質問の編集、キャンセル、やり直し、回答の再生成と停止を試せる。「次の実行でエラーを表示」を選ぶと、元の会話と入力を残したエラーを確認できる。同じstoryの状態一覧で通常・実行中・エラー・操作不可を比較できる。視覚確認用storyに自動で状態を変えるplayは付けない。

PatternsのTimelineには質問の編集と回答のコピー・再生成・停止を組み込んでいる。回答下の独立ボタンは置かず、コピーはMessage.Actions、再生成・停止・再試行は同じ操作メニューへまとめる。質問の「編集」から画面下の入力欄で変更でき、確定前は後続の会話と添付を保持する。成功後はその質問からの回答へ置き換え、目次も更新する。編集後も通常の送信を続けられる。会話の切り替え・新規作成では実行中のプレビュー処理を停止する。Controlsの「編集・再生成を失敗させる」でエラーを確認できる。TimelineのControlsで「長文を表示」を有効にすると、約3,000文字の本文、コード・表のスクロール、操作メニューを確認できる。

Patternsの編集UIはタイムライン・吹き出しで共通とし、画面下のChatComposerへ元の本文を読み込む。入力欄の上には「メッセージを編集中」と「キャンセル」を表示し、元メッセージを薄く強調する。AIで後続の会話を作り直す場合だけ影響説明を添える。編集中は新規添付・返信を表示せず、元メッセージの添付を保持する。新規送信の下書き・選択済み添付・返信先は退避し、キャンセル・完了後に戻す。Enterは改行、Ctrl/Cmd+Enterは送信、Escapeはキャンセル。失敗時は編集内容と元の会話を保持する。`Patterns/Chat Screens/Bubble`では自分のメッセージを編集でき、送信後は対象だけを更新して「編集済み」を表示する。他のメッセージと添付は維持する。アシスタントの例では同じ編集UIから、その質問以降の会話を作り直す。

自分のメッセージの編集操作は`Message.Actions`の`onEdit`へ渡す。`editLabel`は既定「編集」で、アクセシブル名を変更できる。PCでは返信・コピーと同じホバーツールバーとメニュー、モバイルでは操作ドロワーへ表示する。モバイルではドロワーを閉じた後に`onEdit`を呼び、入力欄へのfocusを保持する。Patternsでは編集ボタンを本文下へ単独表示しない。

## Storybookの確認先

- 完成画面：`Patterns/Chat Screens`の`Timeline`と`Bubble`。長文と失敗状態はControlsで切り替える。
- メッセージ単体：`Chat Message/States`で配置と代表状態、`Long Answer`で長文・ストリーミング、`Inline Editing And Regeneration`で単体編集フォーム・再生成と状態一覧を確認する。
- 入力・添付・基本primitive：`Chat Composer`、`Chat Attachment`、`Message`、`Bubble`。
- 履歴スクロール：`Message Scroller`の`History And Following`と`Outline Navigation`。目次の配置違いは同じstoryで比較する。

添付画像と入力欄で選択した画像の拡大表示は共通の`ImagePreview`を使用する。画像のみの表示、任意のファイル名・ダウンロード、キーボード操作は[ImagePreview](./dialogs-and-layout.md#imagepreview)を参照。

画像添付は履歴内にサムネイルのみを表示し、ファイル名・形式・ダウンロード操作は拡大プレビューへ集約する。PDFなど画像以外の添付は情報行とダウンロード操作を維持する。コピー成功はチェックアイコンへ切り替え、画面上に成功テキストを出さず、statusによる読み上げ通知を維持する。

返信先・編集中の情報は`ChatComposer`の`context?: Snippet`へ渡すと、入力欄と同じ枠内の上部へ表示できる。情報がない場合はcontextをundefinedにして領域を省く。返信先には`Message.Quote variant="composer"`を使い、色付きの背景と左線を設けず、返信アイコン・送信者と本文を横並びにした1行・解除操作で構成する。通常のvariant（既定default）は送信後の引用表示として維持する。返信先の解除や編集のキャンセル後に入力へfocusを戻す処理は利用側で行う。

汎用の画面例の注意書きは「送信前に内容をご確認ください。」とし、スマホ・PCとも本文入力欄にfocusがあるか本文があるときだけ入力欄の上に表示する。注意書きの表示切り替えでは入力欄の位置を変えない。返信中は送信者と本文を横並びで省略し、解除操作の44pxの領域を維持する。高さ600px以下ではヘッダーと余白を縮め、履歴の領域を優先する。

`ChatComposer notice="送信前に内容をご確認ください。"`で注意書きを指定できる。未指定の場合は領域も出さない。指定時は領域を確保せず入力欄の直上に重ね、本文があるかtextareaにfocusがある間だけ表示する。背景を透かした面とぼかしで履歴から区別し、文言が折り返されても入力欄を動かさない。入力欄のaria-describedbyから注意書きを参照する。利用側にfocus判定や配置CSSは不要。

チャットのサンプルアバターは既存のCustomerAvatarを使う。サンプルでは同じ送信者名を同じseedに揃え、会話一覧・ヘッダー・本文・自分のアカウントで同じ柄を表示する。実際の利用時は利用側の安定したユーザーIDをidへ渡す。

送信キーはtextareaだけに適用し、ツールのボタン・メニューのEnter操作を奪わない。修飾キーの追加・長押しの連続送信・IME変換中の送信を防ぎ、送信中・入力不可・空の本文・未完了の添付にも送信ボタンと同じ判定を使う。利用側のonkeydownでpreventDefaultした操作は送信しない。


## ChatThreadList

会話一覧は名前とmetadataを上段、最終メッセージを下段にまとめた2段構成。metadataは上段の右端で揃え、名前が長い場合は名前側を省略してラベルの左右の余白を保つ。時刻と未読数は右端で縦に揃え、未読数の有無で時刻の位置を変えない。標準的な2段表示は60px、compactは56pxを目安とし、長いmetadataは切り捨てず折り返して必要な高さを確保する。

`@mutsuna/ui/chat-thread-list`からChatThreadList・ChatThreadListItem・ChatThreadListPropsをimportできる。ルート入口からも公開する。

```svelte
<ChatThreadList
  items={threads}
  selectedId={activeThreadId}
  onSelect={id => openThread(id)}
/>
```

itemsはid・titleを必須とし、preview・time・datetime・unreadCount・avatarId・imageUrl・online・disabledを任意に持つ。配列の順序を維持し、選択はonSelect(id)で通知する。selectedIdの更新・データ取得・並び順・遷移は利用側の責務。

既定のアバターはCustomerAvatarで、avatarId（未指定なら会話id）をseedにする。leading(item) snippetでチャンネルアイコンなどへ置き換えられる。snippet内にボタン・リンクは入れない。variant="compact"は余白と選択色をコンパクトな一覧向けにする。表示する情報はitemsで指定する。

loading・error・onRetry・emptyText・disabledで読み込み・エラーと再試行・空・操作不可を表現する。更新中やエラーでも渡されたitemsは維持する。選択済みはaria-current、項目操作はネイティブbuttonのTab・Enter・Space、未読数は省略前の件数を読み上げる。スクロール領域、新規会話ボタン、サイドバー自体は含まない。


## 会話の補足情報とChatHeader

会話の状態・タグ・メモ有無は参加者の属性ではなく会話そのものの情報として扱う。AI・人との会話で同じ表示部品を使える。状態の値・遷移・保存・メモ本文・権限は利用側で管理する。

ChatThreadListのmetadata(item) snippetへBadgeやテキストを渡すと、名前の横へ補足情報を表示する。item.idを使って利用側のデータを参照でき、ChatThreadListItemに業務固有のフィールドを追加する必要はない。項目はbuttonなので、snippet内にリンク・ボタン・Selectなどの操作要素を入れない。

ChatHeaderは`@mutsuna/ui/chat-header`とルート入口から公開する。titleを必須とし、description（文字列）とheadingLevel（既定2）を指定できる。navigation・leading・metadata・actionsは任意のsnippet。navigationは会話一覧へ戻る操作、leadingは装飾用アイコンやアバター、actionsは会話の操作を表示する。ステータス編集やメモを開くボタンはactionsへ置き、処理は利用側へ通知する。leadingは読み上げから除外するため操作要素を入れない。

```svelte
<ChatThreadList {items} {selectedId} onSelect={selectThread}>
  {#snippet metadata(item)}
    <Badge variant="secondary" class="my-0.5 h-4 rounded-sm border-0 bg-foreground/[0.04] px-1.5 py-0 text-[10px] font-medium leading-4 text-foreground/75">{conversationInfo[item.id].status}</Badge>
  {/snippet}
</ChatThreadList>

<ChatHeader title={selectedThread.title}>
  {#snippet metadata()}
    <Badge variant="outline">{conversationInfo[selectedId].status}</Badge>
  {/snippet}
</ChatHeader>
```

metadata未指定時や空のsnippetでは補足領域の余白を作らない。長い情報は折り返し、スマホでもmetadataを非表示にしない。長いBadgeを渡す場合はBadgeにもwhite-space: normalと可変の高さを指定する。Patterns/Chat Screensの一覧とヘッダーは同じ会話データ・snippetから描画し、選択した会話に追従する。


## ChatMemo

`@mutsuna/ui/chat-memo`とルート入口からChatMemo・ChatMemoPropsを公開する。汎用の[StickyNote](inputs.md#sticky-note)を会話向けのラベル・inlineトリガーで包む互換ラッパーで、本文や保存・移動処理は共通。汎用付箋は`@mutsuna/ui/sticky-note`を使う。ChatHeaderのactionsへ置き、ヘッダーのメモ操作で付箋を開閉する。付箋は画面に固定して残り、会話の操作やスクロールを妨げない。上部の空き領域や外枠をドラッグして移動でき、保存・最小化ボタンは移動の対象にしない。付箋自体へfocusして矢印キーでも動かせる。画面外へ出ないよう位置を制限し、viewportの変更にも追従する。

タイトル行・入力の内枠は設けず、既存のEditableTextで本文を直接編集する。blurまたはCtrl/Cmd+Enterで編集を確定しonSave(value)を通知する。上部右側に小さな保存・最小化アイコンを置く。アイコン左側の空白もドラッグ領域として使える。保存アイコンでも編集中の内容を確定でき、保存失敗時は再試行できる。保存中は回転アイコンと読み上げで状態を示し、保存・編集を停止する。最小化は本文と位置を保持して付箋を閉じる。編集中のEscapeはEditableTextの編集を取り消し、表示中のEscapeは付箋を閉じて起点へfocusを戻す。会話を操作しても付箋は閉じない。

`bind:value`と`bind:open`、保存処理・エラー・権限・会話ごとの管理は利用側の責務。`savedValue`には最後に保存が成功した本文（空文字も可）を渡す。編集中の本文と比較して保存済みのチェックを表示し、変更のない再保存を防ぐ。未指定時は保存の成功を推測せず、保存アイコンを表示する。保存中は回転、失敗時は再試行アイコンを表示する。`saving`は編集停止、`error`はエラー表示、`readOnly`は閲覧専用。`hasMemo`はカスタムtriggerへメモの有無を渡すための値（未指定時はvalueの有無）。標準の起点にはドットを表示しない。titleは読み上げ用の名前のみで、画面にタイトル行は表示しない。

Patternsでは一覧・ヘッダーの「メモあり」を重複表示せず、補助操作のメモアイコンやメニューから付箋を開く。StickyNoteは外部から開閉し、付箋専用の浮遊ボタンや本文の有無を示すドットを重ねない。メモは会話idごとにメモリ内で保持し、編集確定後も付箋を開いたままにする。幅1100px以上では初期位置の横幅を本文と入力欄の横へ確保する。外部への保存・位置の永続化・権限制御は利用側で行う。

## 会話のフローティング操作

Patterns/Chat ScreensではFloatingActionMenuへ利用側の操作を渡す。768px以上ではメモ・ステータス・動画（人との会話のみ）・全文コピー・PDFのアイコンを直接表示し、狭い画面では同じ操作をメニューへまとめる。付箋はStickyNoteの外部開閉を使い、独立した浮遊ボタンを重ねない。

ステータスは会話idごとのサンプル状態を更新し、一覧とヘッダーに同じ値を表示する。全文コピーは表示中の会話をクリップボードへ渡し、結果をトーストで通知する。動画パネルとPDFのファイル名・プレビュー・書き出し確認はUIサンプルで、動画の取得・再生基盤やPDFファイル生成は含めない。各操作・永続化・出力処理はアプリ側で実装する。

チャット画面例の入力欄は履歴上に重ね、入力欄の直上から画面下端まで、チャット領域の横幅全体に透明なすりガラスのぼかしを置く。白い背景・外周の枠線・影は足さず、入力欄の約50px上から、2px・6px・12pxのぼかしをそれぞれ異なる範囲のマスクで重ね、56px幅で徐々に強める。最新へ戻るボタンはすりガラスより手前に、入力欄寄りの位置へ表示する。スマホでは注意書きと重ならないよう右寄りに配置する。履歴末尾の余白と最新へ戻るボタンは入力欄の実際の高さに追従し、複数行・添付・返信中も最後のメッセージをぼかしの開始位置より上までスクロールできる。末尾余白は入力欄の高さに加えてぼかしの張り出し44pxと間隔16pxを含め、末尾でも本文にぼかしがかからない。注意書きのための常時余白は確保しない。

ChatHeaderはタイトルの下にdescriptionとmetadataを横並びでまとめる。長い補足情報は折り返し、狭い画面でもmetadataを維持する。単独表示ではChatHeaderを使い、会話操作はMessageScroller.TopBarのactionsへ置き、FloatingActionMenuをplacement="inline"で使う。フローティングの見た目を保ち、単独のfixed座標を持たせない。AdminAppShellなど外側にヘッダーがある場合はチャット側のChatHeaderを描画せず、画面タイトルとナビゲーションを外側へ任せる。Patterns/Chat Screens/In App Shellでは、このrepositoryのAdminShellFrameを特別なモード指定なしで使い、AppShellの外周の角丸だけを保ってヘッダーや内部装飾が重複しない構成を確認できる。


`MessageScroller.TopBar`（ルート入口では`MessageScrollerTopBar`）は、アプリのページヘッダーとは別に、履歴上端の配置をまとめる汎用部品です。SvelteKitや会話ステータスの定義には依存しません。

```svelte
<script lang="ts">
  import * as MessageScroller from "@mutsuna/ui/message-scroller";
  import { FloatingActionMenu } from "@mutsuna/ui/floating-action-menu";
  import * as Menu from "@mutsuna/ui/dropdown-menu";
</script>

<MessageScroller.Provider>
  <MessageScroller.Root>
    <MessageScroller.TopBar placement="overlay" aria-label="履歴の情報と操作">
      <time datetime="2026-10-19">10月19日（月）</time>
      {#snippet actions()}
        <FloatingActionMenu placement="inline" ariaLabel="会話の操作">
          {#snippet children({ close })}<Menu.Item onclick={close}>操作を選択</Menu.Item>{/snippet}
        </FloatingActionMenu>
      {/snippet}
    </MessageScroller.TopBar>
    <MessageScroller.Viewport aria-label="メッセージ履歴">
      <MessageScroller.Content style="padding-top:calc(var(--message-scroller-top-bar-height, 60px) + 16px)"><!-- MessageScroller.Itemを配置 --></MessageScroller.Content>
    </MessageScroller.Viewport>
  </MessageScroller.Root>
</MessageScroller.Provider>
```

| snippet | 用途 |
| --- | --- |
| `leading` | 戻る・一覧切り替えなど、行の先頭へ置く任意のUI |
| `children` | 日付・選択中の質問など、残り幅を使う中央の内容 |
| `actions` | 同じ行の末尾へ置く操作。狭い幅でのメニュー化は利用側で構成 |
| `context` | 検索条件・補足情報など、必要なときだけ表示する全幅の追加行 |

TopBar自体にはボタンの実行処理・日付判定・スクロール位置からの質問判定を持たせない。通常のHTML属性・class・style・refで外観や識別を補える。placement="flow"（既定）は上部の高さを確保してViewportを残りの高さへ追従させる。placement="overlay"はViewportを縮めず透明な層として重ね、Rootに実測高のCSS変数--message-scroller-top-bar-heightを設定する。必要に応じてContentの初期余白やViewportのscroll-padding-topへ利用できる。overlayを外すとCSS変数も元の値へ戻る。どちらも個別のtop座標やz-indexを足し合わせる必要はない。単独で浮遊させる操作にはFloatingActionMenuの既定配置を引き続き使える。
