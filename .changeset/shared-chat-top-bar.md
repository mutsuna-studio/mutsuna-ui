---
"@mutsuna/ui": minor
---

MessageScroller.TopBar（MessageScrollerTopBar）を追加します。日付・会話の文脈・操作をスクロール領域の上へまとめ、leading・children・actions・contextのsnippetsでカスタマイズできます。上部の高さを履歴と分けて確保し、個別に固定した要素の重なりを防ぎます。

placement="overlay"では透明な層として履歴に重ね、背景の帯を作らずに上部の配置を共有できます。実測の高さを--message-scroller-top-bar-heightで参照でき、初期余白やスクロール位置の調整に利用できます。
