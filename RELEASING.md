# Release @mutsuna/ui

## Initial release

1. `pnpm --filter @mutsuna/ui test`
2. `pnpm --filter @mutsuna/ui test:consumer`
3. `npm publish --access public`を`packages/ui`で実行

## Trusted publishing

初回公開後、npm package settingsでtrusted publisherを設定する。

- Organization: `mutsuna-studio`
- Repository: `mutsuna-reserve`
- Workflow: `publish-ui.yml`
- Allowed action: `npm publish`

repositoryはprivateのためprovenance対象外。長期npm tokenはGitHubへ登録しない。

## Subsequent releases

1. `package.json`のversionをSemVerで更新
2. 変更を`develop`へ反映
3. GitHub Actionsの`Publish @mutsuna/ui` workflowを`develop`から実行
4. workflow inputへ同じversionを入力

workflowはpackage test、Storybook build、外部consumer smoke testの通過後にnpmへ公開する。
