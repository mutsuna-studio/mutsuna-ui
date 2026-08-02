<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import InboxIcon from "@lucide/svelte/icons/inbox";
import PlusIcon from "@lucide/svelte/icons/plus";
import SearchIcon from "@lucide/svelte/icons/search";
import { AdminPage, AdminPageHeader, AdminPanel } from "@mutsuna/ui/admin-layout";
import Badge from "@mutsuna/ui/badge/badge.svelte";
import Button from "@mutsuna/ui/button/button.svelte";
import * as Dialog from "@mutsuna/ui/dialog";
import * as Empty from "@mutsuna/ui/empty";
import * as Field from "@mutsuna/ui/field";
import Input from "@mutsuna/ui/input/input.svelte";
import * as Table from "@mutsuna/ui/table";
import Textarea from "@mutsuna/ui/textarea/textarea.svelte";

const { Story } = defineMeta({
  title: "Patterns/Admin Layout",
  component: AdminPage,
  tags: ["autodocs"],
});

const rows = [
  { id: "R-1042", customer: "青山 美咲", date: "2026/08/03 10:00", status: "確定" },
  { id: "R-1041", customer: "田中 直人", date: "2026/08/03 13:30", status: "承認待ち" },
];
</script>

<Story name="Page Header" asChild>
  <AdminPage maxWidth="5xl">
    <AdminPageHeader description="予約の確認、絞り込み、手動追加を行います。">
      {#snippet meta()}<Badge variant="secondary">本日 8件</Badge>{/snippet}
      {#snippet actions()}<Button size="sm"><PlusIcon />予約を追加</Button>{/snippet}
    </AdminPageHeader>
    <AdminPanel title="運営サマリー" description="重要な状態をページ先頭で確認">
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-md border p-3"><p class="text-xs text-muted-foreground">承認待ち</p><p class="text-2xl font-semibold">3</p></div>
        <div class="rounded-md border p-3"><p class="text-xs text-muted-foreground">本日の予約</p><p class="text-2xl font-semibold">8</p></div>
        <div class="rounded-md border p-3"><p class="text-xs text-muted-foreground">未決済</p><p class="text-2xl font-semibold">1</p></div>
      </div>
    </AdminPanel>
  </AdminPage>
</Story>

<Story name="List Page" asChild>
  <AdminPage maxWidth="5xl">
    <AdminPageHeader description="識別情報、状態、次に取れる操作を一覧で確認します。">
      {#snippet actions()}<Button size="sm"><PlusIcon />作成</Button>{/snippet}
    </AdminPageHeader>
    <AdminPanel title="予約一覧" contentClass="grid gap-4">
      <div class="relative max-w-sm"><SearchIcon class="absolute start-3 top-2.5 size-4 text-muted-foreground" /><Input class="ps-9" placeholder="予約者名で検索" /></div>
      <Table.Root>
        <Table.Header><Table.Row><Table.Head>予約番号</Table.Head><Table.Head>予約者</Table.Head><Table.Head>日時</Table.Head><Table.Head>状態</Table.Head></Table.Row></Table.Header>
        <Table.Body>
          {#each rows as row (row.id)}
            <Table.Row><Table.Cell>{row.id}</Table.Cell><Table.Cell>{row.customer}</Table.Cell><Table.Cell>{row.date}</Table.Cell><Table.Cell><Badge variant="outline">{row.status}</Badge></Table.Cell></Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </AdminPanel>
  </AdminPage>
</Story>

<Story name="Empty List Page" asChild>
  <AdminPage maxWidth="5xl">
    <AdminPageHeader description="作成済みの項目を管理します。">
      {#snippet actions()}<Button size="sm"><PlusIcon />最初の項目を作成</Button>{/snippet}
    </AdminPageHeader>
    <AdminPanel title="項目一覧">
      <Empty.Root class="border-dashed py-12">
        <Empty.Header><Empty.Media variant="icon"><InboxIcon /></Empty.Media><Empty.Title>項目がありません</Empty.Title><Empty.Description>最初の項目を作成すると、ここから編集できます。</Empty.Description></Empty.Header>
        <Empty.Content><Button><PlusIcon />項目を作成</Button></Empty.Content>
      </Empty.Root>
    </AdminPanel>
  </AdminPage>
</Story>

<Story name="Settings Form" asChild>
  <AdminPage maxWidth="3xl">
    <AdminPageHeader description="変更内容と保存結果を同じ画面で確認します。" />
    <AdminPanel title="基本設定" description="公開画面に表示する情報" contentClass="grid gap-4">
      <Field.Field><Field.Label for="sample-name">表示名</Field.Label><Input id="sample-name" value="本店" /><Field.Description>利用者向けページに表示されます。</Field.Description></Field.Field>
      <Field.Field><Field.Label for="sample-description">説明</Field.Label><Textarea id="sample-description" value="駅から徒歩3分の予約スペースです。" /></Field.Field>
      {#snippet footer()}<div class="ms-auto"><Button>保存</Button></div>{/snippet}
    </AdminPanel>
  </AdminPage>
</Story>

<Story name="Dialog Form" asChild>
  <Dialog.Root open>
    <Dialog.Trigger><Button>編集</Button></Dialog.Trigger>
    <Dialog.Content class="max-w-lg">
      <Dialog.Header><Dialog.Title>項目を編集</Dialog.Title><Dialog.Description>判断単位ごとに入力し、最後に保存します。</Dialog.Description></Dialog.Header>
      <Dialog.Body class="grid gap-4 py-4"><Field.Field><Field.Label for="dialog-name">名称</Field.Label><Input id="dialog-name" value="会議室A" /></Field.Field><Field.Field><Field.Label for="dialog-note">補足</Field.Label><Textarea id="dialog-note" /></Field.Field></Dialog.Body>
      <Dialog.Footer><Dialog.Close><Button variant="outline">キャンセル</Button></Dialog.Close><Button>保存</Button></Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
</Story>

<Story name="Chat Layout" asChild>
  <AdminPage class="h-[34rem] grid-cols-[15rem_minmax(0,1fr)] overflow-hidden rounded-lg border p-0 pt-0">
    <aside class="border-e p-3"><p class="mb-3 font-medium">メッセージ</p><div class="rounded-md bg-muted p-3 text-sm"><p class="font-medium">青山 美咲</p><p class="truncate text-muted-foreground">予約時間の変更相談</p></div></aside>
    <section class="flex min-w-0 flex-col"><div class="border-b p-4 font-medium">予約時間の変更相談</div><div class="flex-1 space-y-3 overflow-auto p-4"><p class="max-w-md rounded-lg bg-muted p-3 text-sm">明日の予約を30分後ろにずらせますか？</p><p class="ms-auto max-w-md rounded-lg bg-primary p-3 text-sm text-primary-foreground">10:30開始へ変更できます。</p></div><div class="border-t p-3"><Textarea placeholder="返信を入力" /></div></section>
  </AdminPage>
</Story>
