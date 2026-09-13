---
"@mutsuna/ui": patch
---

テーマの色・角丸・フォントの正本をDTCG形式のJSONへ集約し、既存Theme APIとCSS変数を生成するようにしました。既存18テーマとlight/darkの表示を維持し、生成漏れと不正な参照を検出します。
