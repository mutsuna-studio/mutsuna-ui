---
"@mutsuna/ui": minor
---

AdminShellFrameの既定構成を、外周の角丸14pxと枠線を1つだけ残し、内部のワークスペースにスクロールを任せる構成へ統一します。本文の既定paddingはnone、gutterはautoになり、外側のスクロール領域を追加しません。表示モードの切り替えは設けません。AdminShellFramePropsを専用入口から公開します。

移行: 直接長い本文を入れていた場合は、子にheight:100%・min-height:0・overflow:autoを持つスクロール領域を設けてください。明示指定したcontentPaddingとcontentGutterは引き続き優先します。
