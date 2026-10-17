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
import { AdminPage, AdminPageHeader, AdminPanel } from "@mutsuna/ui/admin-layout";
</script>
```

`FormTemplateEditor`の表示条件と`TemplateInsertMenu`のpayload/categoryは利用側が型と選択肢を定義する。永続化、業務validation、API変換は利用側の責務。

`AdminShellFrame`は任意の`footer` snippetを本文のスクロール領域の外側に表示する。フッターのリンク・文言・配置は利用側で定義する。未指定の場合は従来のレイアウトを維持する。

## 折りたたみサイドバーの一時展開

`Sidebar.Root collapsible="icon"` はデスクトップでホバー・キーボードフォーカスすると、メイン領域の幅を変えずに重ねて展開する。ポインターとフォーカスが外れると戻り、Escapeでも閉じられる。ドロップダウンの操作中は展開を維持する。一時展開は `Provider.open`、`onOpenChange`、保存cookieを変更せず、通常のTriggerによる開閉は従来どおりレイアウトへ反映する。

`expandOnHover={false}` で一時展開を無効にできる。`useSidebar().previewOpen` は一時展開の表示状態を表す。モバイルでは従来のSheetを使う。
