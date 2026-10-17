---
"@mutsuna/ui": patch
---

共有する内部処理をinternalへ集約し、既存のdeep importパスを互換用の再exportで維持しました。公開入口と内部ファイルの境界検証を追加しました。
