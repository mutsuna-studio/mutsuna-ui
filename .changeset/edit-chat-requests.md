---
"@mutsuna/ui": minor
---

ChatMessageEditorとChatRegenerateActionをchat-messageとルート入口から公開しました。送信済みの本文を編集するフォーム、確定前の影響説明、再生成・停止・再試行のUIを提供します。処理中のロック、キーボード操作とfocus、入力を保持するエラー表示に対応し、会話履歴の変更や生成・キャンセル処理はconsumerへ委譲します。

編集UIは入力枠一つとキャンセル・送信に統一し、AIとDMで共用できます。ラベルはアクセシブル名として維持し、影響説明は必要な場合だけ表示できます。

Message.ActionsにonEditとeditLabelを追加し、編集を返信・コピーと共通のツールバー／メニュー／モバイルドロワーへ統合しました。
