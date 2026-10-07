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
3. workflowがchangesetからversionとCHANGELOGを更新し、`changeset-release/main`からバージョン更新PRを作成する。GitHubの設定によりActionsからのPR作成が拒否された場合は、生成済みブランチの差分を確認し、権限を持つ利用者が同ブランチからmainへのPRを作成する。バージョンを再生成・手動変更する必要はない。
4. バージョン更新PRのCIを確認してmainへmergeする。
5. 再度実行される`Release` workflowがnpm registryのversionを確認し、npm Trusted Publishingで公開する。`npm-release`環境の承認が必要な場合は、対象runと公開予定versionを確認して承認する。
6. npm registryの公開versionを確認する。Renovateが`mutsuna-reserve`のconsumer更新PRを作成する。

`package.json`のversionを手動で変更しない。長期npm tokenをGitHubへ登録しない。release失敗時はnpm registryの公開状態を確認し、同じversionを再利用しない。
