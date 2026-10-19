# Storybook

[ガイド一覧](./README.md)

共通UIのcatalogは[GitHub Pages](https://mutsuna-studio.github.io/mutsuna-ui/)で公開している。localではpackage単独で起動する。

```sh
pnpm storybook
```

`http://localhost:6206`で確認可能。storyとStorybook設定はnpm packageへ含めない。

ツールバーの「テーマカラー」と「表示モード」から、全storyのブランドカラーとlight／dark表示を切り替えられる。代表的なcomponentは`States` storyでvariant、size、disabled、loading、error、長文などを一画面で比較する。

最初は`Guides / Getting Started / Overview`から、作りたい画面に合う部品を選べる。完成画面はPatterns、部品単体はComponents、共通の配色などはFoundationsへ進む。sidebarはcomponentの役割で分類し、storyの`title`を分類の正本にする。

| 分類 | 役割 |
| --- | --- |
| `Guides` | 推奨する組み合わせ・部品の使い分け・公開入口への案内 |
| `Foundations` | theme、scrollbar、client境界など横断基盤 |
| `Components/Actions` | buttonなど操作の起点 |
| `Components/Inputs` | 値の入力・選択・編集 |
| `Components/Forms` | label、field、form構成と複合form |
| `Components/Navigation` | breadcrumb、menu、sidebar、tabs |
| `Components/Data Display` | avatar、badge、calendar、card、table |
| `Components/Feedback` | alert、empty、loading、skeleton、toast |
| `Components/Overlays` | dialog、drawer、popover、sheet、tooltip |
| `Components/Layout` | collapsible、separatorなど配置・区切り |
| `Patterns` | 複数componentを組み合わせた再利用可能なUIパターン |

各componentのDocs、Controls、Accessibility panelを同じstoryから生成する。実ブラウザで全storyのrender、a11y、`play`による代表操作を検証するには次を実行する。

```sh
pnpm test:storybook
```

すべてのstoryのa11y違反はCIを失敗させる。`todo`の例外を追加せず、componentまたはstoryの責務に応じて違反を解消する。

## リモートOrcaから見た目を確認する

ユーザーがリモートOrcaへ接続している場合、サーバーで開いたOrcaブラウザタブが手元にも表示されるとは限らない。手元からのUI確認には、利用可能であればTailscale Serve経由のURLを案内する。この方法はWindows上のOrca＋WSL内のStorybookで実際に接続確認済み。

1. Windows側のTailscaleが接続済みであることと、既存のServe設定を確認する。手元の端末も同じtailnetに接続する。
2. Storybookを起動し、Windows側から`http://127.0.0.1:6206/`へ到達できることを確認する。
3. Windows側のTailscale Serveで6206番を転送する。既存の別サービスの設定は上書き・resetしない。
4. tailnet URLからstoryの本文まで描画できることを確認してURLを渡す。サーバー側での表示確認と、ユーザーの手元での接続確認は区別する。

WSL側の起動例。ホスト名はその時点の`tailscale.exe status --json`の`Self.DNSName`を確認し、末尾のドットを除いた値へ置き換える。接続先固有のホスト名やIPをrepository設定へ固定しない。

```sh
STORYBOOK_TAILNET_HOST='your-server.your-tailnet.ts.net'
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS="$STORYBOOK_TAILNET_HOST" pnpm storybook --host 0.0.0.0 --no-open
```

Windows PowerShell側の確認・転送例（WSLではWindows版`tailscale.exe`を利用できる）。

```powershell
tailscale status --json
tailscale serve status --json
(Invoke-WebRequest -UseBasicParsing -Uri http://127.0.0.1:6206/).StatusCode
tailscale serve --bg --http=6206 http://127.0.0.1:6206
```

Serveが表示する`http://<Self.DNSName>:6206/`にStorybookの`?path=/story/...`を付けて案内する。今回確認した構成ではTailscale IPを使うとServeが404を返したため、表示されたDNS名を使う。Storybookのホスト検証には`--host 0.0.0.0`、Vite側には上記の追加許可ホストが必要だった。ホスト検証を無条件に無効化する設定は追加しない。

Tailscale Serveはtailnet向けの転送として使い、インターネット公開用のFunnelは使わない。`--bg`の設定はStorybook終了後も残るため、プレビューが不要になったら次でこの転送だけを停止する。

```powershell
tailscale serve --http=6206 off
```

## カタログの使い分け

- Themeは`Preview`でツールバーの配色を確認し、`All Presets`で一覧比較する。色だけの違いでstoryを分けない。
- `States`はvariant・size・disabled・errorなどの比較。検索、自由入力、外部制御など異なる操作フローだけを独立storyにする。固定の比較表示ではControlsを無効にする。
- チャットの完成例は`Patterns / Chat Screens`へ集約する。独自の入力欄を持つ旧いTheme・Workspace Layoutのチャット例は置かない。
- 通常のメッセージはChatMessage、入力欄はChatComposer、付箋はStickyNoteを使う。Message・Bubbleは低レベルの配置、ChatMemoは会話用の互換ラッパー。本文内の編集は`Chat Message / Inline Editing And Regeneration`で確認する。
- compound componentのDocsは公開部品を登録する。Message ScrollerではProviderと各子部品のpropsを確認できる。Preview専用propsを公開APIとして表示しない。
- タイトルは`Components / 役割 / 部品名`の3階層まで。`Date Picker`・`Code Editor`・`Cycle Select`のように単語を区切り、story名は英語のTitle Caseに揃える。

分類やstory名を変更するとStorybook URLも変わるため、ガイド・テスト・確認記録の参照を同じ変更で更新する。sourceのpreviewファイルはテストからも参照されるため、ナビゲーション整理だけを目的に物理移動しない。

## storyを追加する

共有componentのcatalogはこのrepositoryの`stories/*`を正本にする。代表状態を比較できるstoryにまとめ、別の操作フローがある場合に独立したstoryを追加する。

視覚確認用のstoryには、表示直後の見た目を変更する`play`を付けない。操作検証は同じrenderを使うtest専用storyへ分け、`tags={["!dev", "!autodocs"]}`を指定する。product固有のroute、API、権限、永続化は持ち込まない。

公開入口とテストの追加先は[開発ガイド](../CONTRIBUTING.md#公開入口と内部実装)を参照。
