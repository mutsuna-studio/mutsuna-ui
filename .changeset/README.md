# Changesets

公開packageへ影響するPRではchangesetを追加する。

```sh
pnpm changeset
```

- 後方互換な修正: `patch`
- 新しい公開APIまたは`1.0.0`未満の破壊的変更: `minor`
- docs、Storybook、CIだけの変更: changeset不要

mainへmerge後、Release workflowがversionとCHANGELOGを更新してnpmへ公開する。
