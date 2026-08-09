# Contributing to @mutsuna/ui

Issueやpull requestによる貢献を歓迎します。参加する前に[Code of Conduct](./CODE_OF_CONDUCT.md)を確認してください。

## Before opening an issue

- 既存Issueを検索し、重複がないか確認する。
- セキュリティ上の問題は公開Issueへ書かず、[Security Policy](./SECURITY.md)に従って非公開で報告する。
- consumer固有のAPI、権限、永続化、業務ルールは対象consumer repositoryへ報告する。

## Development setup

必要な環境:

- Node.js 22.14以降
- pnpm 11.3

```sh
corepack enable
pnpm install --frozen-lockfile
git config --local core.hooksPath .githooks
```

Storybookは次で起動する。

```sh
pnpm storybook
```

## Repository scope

このrepositoryには、product固有の業務知識を持たず、複数productで再利用できるUI primitive、theme、design token、form部品、管理画面向け複合componentを置く。

特定route、API、権限、永続化、consumer固有validationはconsumer側に置く。迷う場合は実装前にIssueで相談する。

## Making a change

- 公開subpath、型、component props、events、snippets、CSS変数、theme contractを公開APIとして扱う。
- component変更と同じ単位で公開型、test、Storybook storyを更新する。
- accessibility、keyboard操作、focus、disabled、loading、error状態を確認する。
- 未宣言のdeep importやlocal path dependencyを追加しない。

変更範囲に応じて次を実行する。

```sh
pnpm test
pnpm build-storybook
pnpm test:consumer
git diff --check
```

公開exportを変更した場合は`pnpm test:consumer`、Storybookを変更した場合は`pnpm build-storybook`が必須。

## Changesets

公開packageへ影響するpull requestでは次を実行し、changesetを同じpull requestへ含める。

```sh
pnpm changeset
```

- `patch`: 後方互換なbug fixや公開contractを変えない改善
- `minor`: 新しい公開API、重要な機能、`1.0.0`未満の破壊的変更
- changeset不要: docs、Storybook、CI、repository toolingだけの変更

`package.json`のversionは手動変更しない。

## Pull requests

- pull request templateをすべて記入する。
- GitHub Issueがある場合は`#123`、Mutsuna内部Issueがある場合は`MUT-123`を`関連Issue`へ記載する。
- 外部contributorにMUT Issueは不要。小さなdocs修正などIssueが不要な場合は`なし`と記載できる。
- maintainerが内容と検証結果を確認できる大きさへ変更を分割する。

Releaseとnpm publishはmaintainerがprotected workflowから実行する。
