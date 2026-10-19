# 目次

文書や独自スクローラーには`OutlineNav`を、MessageScroller内の会話には`MessageScroller.Outline`を使う。見た目とホバー操作は共通で、現在位置・移動・focusの連携を専用部品に任せられる。

## OutlineNav

`@mutsuna/ui/outline-nav`から`OutlineNav`、`OutlineNavProps`、`OutlineNavItem`を公開する。チャットに依存せず、長い文書の目次にも利用できる。

```svelte
<OutlineNav
  items={[{ id: "intro", label: "はじめに" }, { id: "details", label: "詳しい説明" }]}
  activeId="intro"
  ariaLabel="ページの目次"
  onNavigate={id => navigateToSection(id)}
/>
```

`items`は一意な文字列`id`と`label`の配列。`level`（1〜6、省略時1）で見出し階層を表し、線の長さと一覧の字下げに反映する。線や目次パネルの上にマウスがある間は同じパネルを開いたまま、ホバーした項目が見える位置へ一覧だけをスクロールする。パネルは共通の細いスクロールバーを使い、スクロール中や一覧のホバー中に表示する。一覧はレール全体を基準とした同じ位置に表示し、線を移動してもパネルの位置は変えない。線の間隔は通常12px、タッチ操作では24pxを基準に、利用できる高さに合わせて縮める。各線は独立したボタンで、ホバー・キーボードfocus時に目次全体を表示し、クリック・Enter・Spaceで`onNavigate(id)`を通知する。`open`を任意にbindしてパネルの開閉状態を共有できる。`activeId`で現在位置を示し、`disabled`で操作を止める。空のときは線を表示しない。項目が多い場合は親で高さを制限すると線の間隔が自動的に詰まり、レール自体はスクロールしない。目次パネル内だけがスクロールする。

位置決め、移動先へのスクロール・focus、現在位置の判定はconsumerの責務。MessageScrollerと組み合わせる場合は、次の`MessageScroller.Outline`に任せられる。

## MessageScroller.Outlineで連携する

`@mutsuna/ui/message-scroller`の`Outline`（ルートexportでは`MessageScrollerOutline`）を、同じ`Provider`配下かつ`Root`内に配置する。現在位置・メッセージへの移動・移動後のfocusを自動で扱う。チャットで何を目次に含めるかはconsumerが決める。

```svelte
<script lang="ts">
  import * as MessageScroller from "@mutsuna/ui/message-scroller";
  const items = [
    { id: "intro", label: "考えを整理する", level: 1 as const },
    { id: "example", label: "具体例を添える", level: 2 as const },
  ];
</script>

<div class="h-96">
  <MessageScroller.Provider defaultScrollPosition="start">
    <MessageScroller.Root>
      <MessageScroller.Viewport aria-label="メッセージ履歴">
        <MessageScroller.Content class="gap-6 p-4">
          {#each items as item (item.id)}
            <MessageScroller.Item messageId={item.id}>
              <article><h2>{item.label}</h2><p>メッセージ本文</p></article>
            </MessageScroller.Item>
          {/each}
        </MessageScroller.Content>
      </MessageScroller.Viewport>
      <MessageScroller.Outline {items} ariaLabel="会話の目次" />
    </MessageScroller.Root>
  </MessageScroller.Provider>
</div>
```

- `items`: `OutlineNavItem[]`。`id`を移動先の`Item.messageId`と一致させ、文書順に渡す。数字でないIDも利用でき、目次に含めない回答などの`Item`も間に配置できる。
- `scrollMargin`: `Content`の上paddingに加える移動時の余白。既定16px。
- `behavior`: 既定`instant`。`smooth`も利用でき、動きを減らす設定では`instant`になる。
- `onNavigate(id)`: 移動を開始して対象メッセージへfocusした後の任意通知。通常は指定不要。
- `ref`・`class`・`ariaLabel`・`disabled`などは内側の`OutlineNav`へ渡す。`activeId`は自動判定する。

右端にレールを配置する。実際の本文とレールの余白をResizeObserverで判定し、クリック領域全体ではなく、線の最大幅・端の余白・4pxの安全間隔が収まれば常時表示する。余白が足りない場合は本文幅を維持したままスクロール中だけ表示し、停止から約1秒後にフェードアウトする。レール・目次パネルの操作中やキーボードfocus中は表示を維持する。隠れている間はポインター操作を受け取らず、背後の本文を操作できる。`pr-14`などの余白の手動追加は必須ではない。表示中の先頭メッセージ以前にある目次項目を現在位置として扱い、末尾までスクロールした場合は最後の項目を示す。対象がまだ描画されていない項目への移動は行わず、通知もしない。移動時は`Item`自体へfocusし、元々tabindexがなければ一時的に`-1`を付け、focusが離れた後に戻す。

Storybookの`Message Scroller/Outline Navigation`で最小構成・階層・項目追加・会話リセットを操作できる。`Message Scroller/Outline While Scrolling`では余白を確保しないときの表示を確認できる。`Outline Nav/Long Document`には48項目・3階層の例がある。`Patterns/Chat Screens/AI Workspace`は、質問から`items`を作って`Outline`へ渡す実画面の組み合わせ例。
