# Support

## Usage questions and bug reports

`@mutsuna/ui`の利用方法、再現可能なbug、機能提案は[GitHub Issues](https://github.com/mutsuna-studio/mutsuna-ui/issues/new/choose)から報告してください。

報告時はpackage version、public import path、Svelte/Tailwind/Node環境、最小の再現手順を含めてください。返信や修正期限は保証していませんが、maintainerが対応可能な範囲で確認します。

## Supported release

サポート対象はnpmで公開されている最新版です。`1.0.0`未満では、破壊的変更がminor releaseに含まれる場合があります。更新前に[CHANGELOG](./CHANGELOG.md)を確認してください。

## Deprecation policy

公開subpath、型、component props、events、snippets、CSS変数、theme contractを非推奨にする場合は、[CHANGELOG](./CHANGELOG.md)と該当する公開ドキュメントで移行先を案内します。型やAPIで表現できる場合は`@deprecated`も付与します。

原則として、あるminor releaseで非推奨にした公開contractは同じminor release内では削除せず、次のminor release以降で削除できます。`1.0.0`未満では削除がminor changeになるため、consumerはminor更新前にCHANGELOGと非推奨警告を確認してください。

重大な脆弱性、第三者dependencyの終了、または安全な互換維持が不可能な場合は、この猶予を短縮することがあります。その場合も、公開可能な範囲で理由、影響、移行方法をCHANGELOGに記載します。

## Project boundaries

consumer固有のAPI、認証、権限、永続化、deployment、production dataに関する問題は、該当するconsumer projectへ報告してください。

脆弱性の疑いがある場合は公開Issueを作らず、[Security Policy](./SECURITY.md)に従ってください。
