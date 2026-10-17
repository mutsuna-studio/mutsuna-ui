# 同期とローカルGit hooks

[ガイド一覧](./README.md)

## Loading UIの同期

Loading UI由来のCSS-only patternは、対応可能な構文だけを同期する。

```sh
pnpm sync:loading-ui
```

同期処理は上流registryとsourceを検査し、Motion依存や未知の構文を自動生成対象から除外する。`morphing-infinity`は追加依存なしのCSSパス補間へ手動移植し、自動同期でも保持する。定期workflowは生成差分を直接releaseせず、review可能なpull requestとして作成する。

## shadcn-svelte upstream review

shadcn-svelte由来componentは、npmの最新安定版に対応する公式Git tagとcommit SHAを基準に差分を確認する。

```sh
pnpm sync:shadcn
pnpm review:shadcn -- button
```

`sync:shadcn`は`nova` registryの純正版を`upstream/shadcn-svelte/candidate`へ取得し、前回review済みBASEとの差分、dependency変更、3-way merge previewの状態を生成する。`src/lib`は変更しない。

review結果はcomponentごとに記録する。

```sh
pnpm review:shadcn -- button --decision applied --note "a11y修正を手動で反映"
pnpm review:shadcn -- badge --decision reviewed-no-change --note "見た目だけの変更のため不採用"
pnpm review:shadcn -- --finalize
```

`--apply`はreview済みBASEが存在する場合だけ利用でき、競合のない既存ファイルだけを適用する。追加、削除、競合、公開contract、dependency変更は手動で判断する。`--finalize`は全対象の判断が完了したときだけcandidateを次のBASEへ昇格する。週次workflowはcandidateとreview summaryを含むdraft pull requestまでを作成し、Mutsuna UI本体、release、npm publishは自動化しない。

## Local Git hooks

開発用cloneでは、初回に次を実行してrepository管理のGit hooksを有効化する。

```sh
git config --local core.hooksPath .githooks
```

以後、`main`をpullしてPRのmergeを取り込むたびに、対応するlocal branchを自動削除する。削除対象は、GitHub上で`main`へmerge済みのPR headとlocal branchの現在のcommitが完全一致し、他のworktreeで使用されていないbranchだけ。手動確認は次で行える。

```sh
node scripts/cleanup-merged-branches.mjs --dry-run
```

## Release

version更新とnpm公開の手順は[RELEASING.md](../RELEASING.md)を正本とする。
