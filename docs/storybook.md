# Storybook

[ガイド一覧](./README.md)

共通UIのcatalogは[GitHub Pages](https://mutsuna-studio.github.io/mutsuna-ui/)で公開している。localではpackage単独で起動する。

```sh
pnpm storybook
```

`http://localhost:6206`で確認可能。storyとStorybook設定はnpm packageへ含めない。

ツールバーの「テーマカラー」と「表示モード」から、全storyのブランドカラーとlight／dark表示を切り替えられる。代表的なcomponentは`States` storyでvariant、size、disabled、loading、error、長文などを一画面で比較する。

sidebarはcomponentの役割で分類し、storyの`title`を分類の正本にする。

| 分類 | 役割 |
| --- | --- |
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

## storyを追加する

共有componentのcatalogはこのrepositoryの`stories/*`を正本にする。代表状態を比較できるstoryにまとめ、別の操作フローがある場合に独立したstoryを追加する。

視覚確認用のstoryには、表示直後の見た目を変更する`play`を付けない。操作検証は同じrenderを使うtest専用storyへ分け、`tags={["!dev", "!autodocs"]}`を指定する。product固有のroute、API、権限、永続化は持ち込まない。

公開入口とテストの追加先は[開発ガイド](../CONTRIBUTING.md#公開入口と内部実装)を参照。
