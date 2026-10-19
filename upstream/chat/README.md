# Chat primitives upstream

2026-10-17取得。shadcn-svelte nova registryのMessage、Bubble、Message Scrollerを基に移植。取得したJSONをこのディレクトリに保存する。MIT Licenseの全文はLICENSE.md、配布物の著作権表示と本文はrepository rootのLICENSEに維持する。

- https://www.shadcn-svelte.com/registry/styles/nova/message.json
- https://www.shadcn-svelte.com/registry/styles/nova/bubble.json
- https://www.shadcn-svelte.com/registry/styles/nova/message-scroller.json

変更: importを公開package内の相対パスへ変更、アイコンをLucideへ解決、スクロールボタンの既定ラベルを日本語化、公開props型を追加、スクロールボタンでreduced motionを尊重。スクロール基盤はMITの@shadcn-svelte/primitives 0.0.1をruntime dependencyとして利用する。既存の定期同期BASEとは別に、このスナップショットを初回導入の比較元とする。
