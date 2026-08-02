# Release @mutsuna/ui

## 変更PR

公開packageへ影響する変更ではchangesetを同じPRへ追加する。

```sh
pnpm changeset
```

- `patch`: 後方互換なbug fix、見た目の修正、公開contractを変えない改善
- `minor`: 新しい公開API、重要な機能追加、`1.0.0`未満の破壊的変更
- `major`: `1.0.0`として公開contractの安定運用を開始するとき
- changeset不要: docs、Storybook、CIだけの変更

## 自動release

1. changesetを含む変更がmainへmergeされる。
2. `Release` workflowがtest、Storybook build、外部consumer smoke testを実行する。
3. workflowがchangesetからversionとCHANGELOGを更新し、version commitをmainへ追加する。
4. workflowがnpm Trusted Publishingで公開する。
5. Renovateが`mutsuna-reserve`のconsumer更新PRを作成する。

`package.json`のversionを手動で変更しない。長期npm tokenをGitHubへ登録しない。release失敗時はnpm registryの公開状態を確認し、同じversionを再利用しない。
