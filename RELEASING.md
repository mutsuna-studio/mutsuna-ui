# Release @mutsuna/ui

GitHubの`Release` workflowを実行し、SemVer incrementを選択する。

- `patch`
- `minor`
- `major`

workflowはnpm registryの公開済みversionを基準に次versionを算出する。その後、test、Storybook build、外部consumer smoke testを実行し、npm Trusted Publishingで公開する。

`package.json`のversionを手動で変更しない。長期npm tokenをGitHubへ登録しない。
