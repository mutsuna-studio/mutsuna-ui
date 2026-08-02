# Agent Instructions

`@mutsuna/ui`のsource repository。回答は日本語。

## 優先順位

ユーザー指示 → `AGENTS.md` → `RELEASING.md` → `README.md` → sourceとtest。

- 既存の未コミット変更はユーザー作業。明示指示なしに戻さない。
- public npm packageであることを前提に、公開contractと後方互換性を確認する。
- release、npm publish、破壊的変更はユーザー指示または明示されたタスクscopeなしに実行しない。

## Scope

置くもの:

- 汎用primitive。
- theme、design token、scrollbarなど横断的な見た目の仕組み。
- 汎用form部品、toast、dialog、layout primitive。
- 複数productで再利用可能、または再利用を意図した管理画面向け複合component。
- component単体で成立する公開型、test、Storybook story。

置かないもの:

- `mutsuna-reserve`など特定productのConcept、業務ルール、権限、API、永続化。
- 特定routeやapp shellだけで成立するpage composition。
- consumer固有のvalidation、選択肢、保存処理、runtime wiring。
- secret、環境固有設定、本番データ。

単一画面でしか使わないという理由だけで共有対象から除外しない。product固有の業務知識なしで成立し、他productでも同じ意味を持つかで判断する。

## Public contract

- `package.json`の`exports`、subpath、公開型、component props、events、snippets、CSS変数、theme contractを公開APIとして扱う。
- consumerは公開subpathからimportできる状態にする。未宣言deep importを前提にしない。
- source fileの配置変更だけでも、export pathや生成される型定義が変わらないか確認する。
- peer dependencyとruntime dependencyを区別し、consumerへ不要なframework依存を強制しない。
- SvelteKit固有機能は専用subpathへ隔離する。
- accessibility、keyboard操作、focus、disabled、loading、error状態をcomponent contractの一部として扱う。

## Implementation

1. `git status --short --branch`でbranchと既存差分を確認する。
2. 対象component、公開export、近傍test、Storybook storyを読む。
3. component変更と同じ単位で公開型、test、storyを更新する。
4. consumer integrationへ影響する場合、`pnpm pack`したtarballで対象consumerを公開前に検証する。tarball依存やlocal pathをcommitしない。
5. 変更後は検証とdiffを確認する。

## Storybook

- 共有componentのcatalogはこのrepositoryの`stories/*`を正本にする。
- primitiveと複合componentの代表状態、disabled、loading、error、長文、狭いviewportを必要に応じて持たせる。
- product固有のroute、API、権限、永続化をstoryへ持ち込まない。
- storyとStorybook設定はnpm packageへ含めない。
- Storybookのsourceをconsumer repositoryへ複製しない。

## Verification

変更範囲に応じて次を実行する。

```sh
pnpm test
pnpm build-storybook
pnpm test:consumer
git diff --check
```

- `pnpm test`はSvelte check、package build、unit／contract testを含む。
- 公開exportを変更した場合は`pnpm test:consumer`を必須にする。
- Storybookを変更した場合は`pnpm build-storybook`を必須にする。
- consumerへ影響する変更は、consumer側のcheck、test、buildも完了条件に含める。

## Version and release

release手順の正本は`RELEASING.md`。

`1.0.0`未満:

- `patch`: 後方互換なbug fix、見た目の修正、公開contractを変えない改善。
- `minor`: 新しい公開API、重要な機能追加、破壊的変更。破壊的変更はconsumer移行を同じタスクで行う。
- `major`: `1.0.0`として公開contractの安定運用を開始するとき。

- `package.json`のversionを手動変更しない。Release workflowがnpm registryの公開済みversionから次versionを計算する。
- 長期npm tokenを追加しない。Trusted Publisherとprovenanceを維持する。
- publish後はnpm registryの公開versionを確認してからconsumerを更新する。
- release失敗時に同じversionを再利用しない。registry状態を確認して次の操作を決める。

## Consumer integration

- consumerはnpmで公開されたversionを利用する。
- local alias、local path、git dependency、`workspace:`依存をcommitしない。
- consumerのmanifestとlockfileを同じ変更で更新する。
- `^0.x.y`は次のminorを自動採用しない。minor releaseではconsumer manifestを明示更新する。
- consumerは自社管理・Trusted Publisher・provenance付きの`@mutsuna/ui`だけをrelease-age policyからpackage単位で除外できる。推移依存関係と他packageの検査は維持する。

## License

- MIT Licenseを維持する。
- upstreamの著作権表示とライセンス本文を削除しない。
- 新しいasset、font、icon、移植codeを追加するときは再配布条件を確認する。
