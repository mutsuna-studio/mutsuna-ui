# ダイアログと管理画面レイアウト

[ガイド一覧](../README.md)

- [ResponsiveDialog](#responsivedialog)
- [Dialog.Body の下余白](#dialogbody-の下余白)
- [管理画面向けの複合component](#管理画面向けの複合component)
- [折りたたみサイドバーの一時展開](#折りたたみサイドバーの一時展開)

## ResponsiveDialog

画面幅に応じてデスクトップではDialog、モバイルでは下方向のDrawerを使う場合は`ResponsiveDialog`を利用する。既存の`Dialog`と`Drawer`は自動変換されない。

```svelte
<script lang="ts">
import { Button } from "@mutsuna/ui/button";
import * as ResponsiveDialog from "@mutsuna/ui/responsive-dialog";
</script>

<ResponsiveDialog.Root>
  <ResponsiveDialog.Trigger>
    {#snippet child({ props })}
      <Button {...props}>編集</Button>
    {/snippet}
  </ResponsiveDialog.Trigger>
  <ResponsiveDialog.Content>
    <ResponsiveDialog.Header>
      <ResponsiveDialog.Title>プロフィールを編集</ResponsiveDialog.Title>
      <ResponsiveDialog.Description>内容を変更して保存します。</ResponsiveDialog.Description>
    </ResponsiveDialog.Header>
    <ResponsiveDialog.Body>フォーム内容</ResponsiveDialog.Body>
    <ResponsiveDialog.Footer>
      <ResponsiveDialog.Close>
        {#snippet child({ props })}
          <Button {...props} variant="outline">閉じる</Button>
        {/snippet}
      </ResponsiveDialog.Close>
    </ResponsiveDialog.Footer>
  </ResponsiveDialog.Content>
</ResponsiveDialog.Root>
```

既定のbreakpointは`768px`。`mode="desktop"`または`mode="mobile"`で表示方式を固定できる。SSRでは既定でDialogをfallbackとして描画し、必要に応じて`ssrMode="mobile"`を指定する。表示モード判定の内部基盤はprimitiveに依存せず、将来のAlert Dialogや用途別Popoverとの組み合わせでも再利用できる。

## Dialog.Body の下余白

`Dialog.Body` と `ResponsiveDialog.Body` は、本文末尾に標準で `pb-4`（16px）の余白を設けます。フッターとの間隔のために利用側で下余白を指定する必要はありません。上余白は利用側で指定し、必要に応じて `class="pb-0"` などで下余白を上書きできます。既存の `py-4`・`pb-4` 指定も加算されません。

## 管理画面向けの複合component

管理画面向けの複合componentもsubpath単位で利用可能。

```svelte
<script lang="ts">
import { BusinessHoursFields } from "@mutsuna/ui/business-hours-fields";
import { FormTemplateEditor } from "@mutsuna/ui/form-template-editor";
import { MarkdownTextEditor } from "@mutsuna/ui/markdown";
import { TemplateInsertMenu } from "@mutsuna/ui/template-insert-menu";
import { AdminShellFrame } from "@mutsuna/ui/admin-shell-frame";
import * as Sidebar from "@mutsuna/ui/sidebar";
import { AdminPage, AdminPageHeader, AdminPanel } from "@mutsuna/ui/admin-layout";
</script>
```

`FormTemplateEditor`の表示条件と`TemplateInsertMenu`のpayload/categoryは利用側が型と選択肢を定義する。永続化、業務validation、API変換は利用側の責務。

`AdminShellFrame`は、外周の角丸14pxと枠線を1つだけ持つ作業領域を標準とする。本文の既定はpaddingなし・gutter="auto"で、AppShell自体は本文をスクロールしない。チャット・エディター・通常のページとも、内部のスクロール領域が残りの高さを使う。表示モードの指定やCSSの強制上書きは不要。`AdminShellFrameProps`は`@mutsuna/ui/admin-shell-frame`からimportできる。

```svelte
<AdminShellFrame pageTitle="メッセージ">
  {#snippet sidebar()}<Sidebar.Root collapsible="icon" hideHeaderSeam><!-- ナビゲーション --></Sidebar.Root>{/snippet}
  <div class="h-full min-h-0 overflow-auto"><!-- 内部でスクロールするワークスペース --></div>
</AdminShellFrame>
```

外周の角丸と外枠はAppShell、内部ペインの境界とスクロールは各ワークスペースが担当する。余白・gutterの明示指定は維持し、必要なら`contentPadding="default"`や`contentGutter="stable"`を使える。Sidebarの`variant`は独立した指定で、見本では`hideHeaderSeam`を合わせて境界線の重複を防いでいる。

移行: 直接長い本文を入れていた場合は、子に`height:100%`・`min-height:0`・`overflow:auto`を持つスクロール領域を設ける。`Patterns/App Shell/Default`と`Patterns/Chat Screens/In App Shell`は、同じ標準構成を使う。

`AdminShellFrame`は任意の`footer` snippetを本文のスクロール領域の外側に表示する。フッターのリンク・文言・配置は利用側で定義する。未指定の場合はフッター領域を作らない。

AppShellの`footer`を指定した場合は、デスクトップの`Sidebar.Footer`をフッターの実測高より8px高い領域で中央配置し、アカウント操作を4px上げる。標準の32pxフッターではアバター上端が本文の下端に揃い、操作ボタンの下に4pxの余白が残る。SidebarUserMenuは24pxの角丸四角のCustomerAvatarと名前の1行表示を標準とし、画像未設定時はメールアドレス（空の場合は名前）をseedとするグラデーションを表示する。メールアドレスはメニュー内へ表示する。通常の操作行は32px、モバイル・タッチ操作では44px以上を確保する。メイン側のフッターに最小高は追加しない。

`CustomerAvatar`は`shape="circle"`（既定）と`shape="rounded"`（角丸四角）を選べる。idが同じなら形・サイズに関係なく同じグラデーションになる。画像を渡した場合も本体・画像・fallback・枠線に同じ形を適用する。SidebarUserMenuはroundedを標準とする。

## 折りたたみサイドバーの一時展開

`Sidebar.Root collapsible="icon"` はデスクトップでホバー・キーボードフォーカスすると、メイン領域の幅を変えずに重ねて展開する。ポインターとフォーカスが外れると戻り、Escapeでも閉じられる。ドロップダウンの操作中は展開を維持する。一時展開は `Provider.open`、`onOpenChange`、保存cookieを変更せず、通常のTriggerによる開閉は従来どおりレイアウトへ反映する。

`expandOnHover={false}` で一時展開を無効にできる。`useSidebar().previewOpen` は一時展開の表示状態を表す。モバイルでは従来のSheetを使う。

## ImagePreview

`@mutsuna/ui/image-preview`とルート入口から`ImagePreview`、`ImagePreviewProps`をimportできる。チャット以外の画像にも使える拡大プレビュー。`src`と`alt`を指定し、サムネイルをEnter／Spaceまたはクリックで開く。Escape・閉じるボタンで閉じ、元のトリガーへfocusを戻す。モーダル内にfocusを保ち、画像は縦横比を維持して画面内へ収める。

```svelte
<script lang="ts">
import { ImagePreview } from "@mutsuna/ui/image-preview";
</script>

<ImagePreview src="/landscape.jpg" alt="山と湖の風景" />
```

| Prop | 内容 |
| --- | --- |
| `src`・`alt` | 必須。表示元URLと画像の代替テキスト |
| `title?`・`description?` | 任意の見出し・説明。title省略時はaltを使用し、どちらも空なら「画像プレビュー」。ファイル名は必須ではない |
| `open` | bind可能な開閉状態。既定false |
| `disabled` | トリガー・ダウンロード操作を無効化。閉じる操作は維持する |
| `downloadUrl?`・`downloadName?` | 任意のダウンロードリンクとdownload属性。省略時はダウンロード操作を表示しない |
| `onDownload?` | 認証付き取得などを利用側へ委譲。downloadUrlより優先する |
| `downloading`・`error?` | ダウンロード中のロック・取得エラー表示。通信・保存処理は利用側が管理する |
| `trigger?` | 任意のトリガーsnippet。受け取る`props`を1つのbuttonへ展開し、イベント・アクセシブル名・disabledを維持する |
| `ref`・`class`・HTML属性 | 外側のdivに適用。モーダルはDialogのportalへ描画する |

画像読み込みに失敗した場合は代替表示を出す。既定サムネイルの失敗時は拡大操作を無効にし、モーダル内の失敗はalertで通知する。srcを変えると表示を再試行できる。画像上のホイールでカーソル位置を中心に1〜8倍まで拡大・縮小できる。拡大中はドラッグで移動でき、画像の外側に余白を許容して、画像の任意の点や四隅を表示領域の中央まで移動できる。画像の端や余白のある表示でも、拡大・縮小中はカーソル位置の維持を優先し、ドラッグ開始時に位置を補正し直さない。モバイルではピンチと指での移動に対応する。画像領域にfocusすると、+／−で倍率変更、矢印で移動、0／Homeで全体表示に戻せる。開き直す・srcを変えると全体表示へ戻す。倍率操作のボタン・説明は追加しない。画像URLの取得・object URLの作成と破棄は利用側で行う。

`ChatAttachment`と`ChatComposer`の選択済み画像は、このImagePreviewを使用する。`Components/Overlays/Image Preview/States`で画像のみ、説明・ダウンロード、エラー、処理中、操作不可を比較できる。

ImagePreviewは画像の比率に合わせてダイアログの高さを調整し、余分な空白を抑える。画面の高さから見出し・操作欄を除いた領域に画像全体を収め、内部スクロールを発生させない。長いファイル名は1行、説明・取得エラーは2行に省略し、アクセシブル名と通知には全文を保持する。

### 複数画像

`images?: readonly ImagePreviewImage[]`を渡すと、モーダル内で画像を前後に切り替えられる。`src`・`alt`は開く前のサムネイルを表し、`initialIndex`（既定0）は開くたびに表示する画像のindex。範囲外・小数・非有限値は有効範囲へ補正する。空配列は従来の単一画像表示へ戻る。

```svelte
<ImagePreview src={images[1].src} alt={images[1].alt} {images} initialIndex={1} />
```

`ImagePreviewImage`は`src`・`alt`が必須で、`title`・`description`・`downloadUrl`・`downloadName`・`onDownload`・`downloading`・`error`を任意で持つ。モーダルの見出し・説明・ダウンロード・取得状態は選択中の項目から取得し、サムネイル用の値は継承しない。

2枚以上のときだけ前後ボタンと「2 / 5」の位置表示を出す。先頭・末尾では対応ボタンを無効にし、循環させない。全体表示では左右キー・横スワイプで切り替えられ、拡大中の矢印・ドラッグ・タッチ移動はパンを優先する。ピンチ・キャンセル・縦方向の操作をページ送りにしない。切り替え時は倍率と位置を全体表示へ戻す。画像の読み込みに失敗しても前後の画像へ移動できる。

`ChatAttachment`の`previewImages`・`previewIndex`に同じメッセージの画像一覧と対象indexを渡すと、添付から共通ギャラリーを開ける。`ChatComposer`では選択済みの画像をまとめて切り替えられる。PDFなど画像以外の添付は対象に含めない。

## FloatingActionMenu

`@mutsuna/ui/floating-action-menu`とルート入口から`FloatingActionMenu`・`FloatingActionMenuProps`・`FloatingActionMenuPosition`を公開する。画面の補助操作を置く汎用コンポーネントで、項目・権限・保存・出力処理は利用側が管理する。

```svelte
<script lang="ts">
  import { FloatingActionMenu } from "@mutsuna/ui/floating-action-menu";
  import { StickyNote } from "@mutsuna/ui/sticky-note";
  import { Button } from "@mutsuna/ui/button";
  import * as Menu from "@mutsuna/ui/dropdown-menu";
  import { StickyNote as StickyNoteIcon } from "@lucide/svelte";
  let open = $state(false);
  let memoOpen = $state(false);
  let trigger = $state<HTMLButtonElement | null>(null);
  let pending: (() => void) | undefined;
  function openMemo() { memoOpen = true; }
  function afterClose(event: Event) {
    const action = pending; pending = undefined;
    if (action) { event.preventDefault(); trigger?.focus(); action(); }
  }
</script>

<FloatingActionMenu bind:open bind:ref={trigger} ariaLabel="会話の操作"
  overflow="compact" onCloseAutoFocus={afterClose}>
  {#snippet actions()}
    <Button variant="ghost" size="icon-lg" icon={StickyNoteIcon}
      aria-label="メモ" title="メモ" onclick={openMemo} />
  {/snippet}
  {#snippet children({ close })}
    <Menu.Item onclick={() => { pending = openMemo; close(); }}>メモを開く</Menu.Item>
  {/snippet}
</FloatingActionMenu>
<StickyNote triggerMode="none" bind:open={memoOpen} />
```

`actions`は768px以上で表示するアイコン列、`children({ close })`は狭い画面で開くDropdownMenuの内容。`actions`未指定なら常にメニューボタンを表示する。`overflow="always"`（既定）ではアイコン列と追加メニューを併置し、`overflow="compact"`では広い画面の追加メニューを隠す。狭い画面でも同じ操作を使えるよう、メニュー側へ必要な項目を渡す。

メニューボタンはTooltipで操作名を表示する。`actions`へ渡すアイコンにも既存の`Tooltip`を組み合わせ、ホバー時とキーボードフォーカス時に操作を説明する。

`placement="inline"`でヘッダーやツールバー内に配置できる。ポータル・固定位置・外側の枠や影を省き、通常レイアウト内でアイコン列／メニューボタンを表示する。既定の`"floating"`は従来の浮遊配置を維持する。inlineでは`position`を使わない。

`position`でviewport座標を指定でき、アイコン列の実寸を使って画面内へ収める。`ref`はメニューボタン、`open`はメニューの開閉状態をbindできる。`disabled`はトリガーとアイコン列を無効にする。`class`はトリガーの追加クラス。

付箋は`StickyNote triggerMode="none" bind:open`で組み合わせられる。メニューからダイアログや付箋を開く場合は、選択した処理を一旦保持し、`onCloseAutoFocus`で既定のフォーカス復帰をpreventDefaultしてから、トリガーへfocusして次のUIを開く。直接表示したアイコンから開く場合も、閉じた後に元の操作へフォーカスを戻す。
