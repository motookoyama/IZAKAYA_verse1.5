✅ 明日1日：統合ビルド＆総合テスト 指示書（そのまま貼る用）

0. 目的（最優先）

明日中に「動く完成体」を一度作る。
細部の美しさ・最適化・設計議論は後回し。
今日は「全部つながっている状態」を証明することだけ。
	•	いまの問題：1個ずつ丁寧にやると、セッション分断で“忘却→ループ”が起きて進まない
	•	だから方針：全部一気に組み上げ、最後にまとめて調整する

⸻

1. 成果物（Done条件）

以下が 全部同時に起動し、通電テスト（E2E）が通ること。
	•	IZAKAYA 1.5 Front（既存ポート運用に従う）
	•	BFF（/chat/v1 が正常に応答）
	•	Librarian / DB（/library 系が保存→取得できる）
	•	LLM Gateway（/llm/generate が最低1プロバイダで応答）
	•	QR生成（Soul Seed / Version<=20 等の仕様に従い生成・読取が成立）

✅ 「動く」ことが唯一の評価基準
❌ リファクタ・設計美・仕様議論で止まるのは禁止

⸻

2. 禁止事項（ループ防止）
	•	ブラウザやPingやネットワーク疑いから入るな
	•	“推論で”原因探索するな
	•	直す前に「現状の一括健康診断」を必ず出せ
	•	「どこで止まってるか教えて」禁止（自分で調べて報告）

⸻

3. 実行手順（統合ラン）

Step A：統合起動（単一コマンド優先）
	•	既存の start_all.sh を唯一の起動導線に固定
	•	起動ログを必ず .yggdrasill_logs/ に吐く
	•	起動後、自動ヘルスチェックを実施して結果を出力

最低限のヘルスチェック（起動直後に必ず実行）：
	•	curl -fsS http://localhost:8800/health（BFF）
	•	curl -fsS http://localhost:8801/（Hub UI）
	•	curl -fsS http://localhost:1398/（IZAKAYA）
	•	curl -fsS http://localhost:8800/llm/health || curl -fsS http://localhost:8800/llm/generate（LLM）
	•	curl -fsS http://localhost:8800/library/health || curl -fsS http://localhost:8800/library/list（DB）

結果を「OK/NG」で一行サマリにすること。

⸻

Step B：E2E（通電テスト）を自動化

以下を 1本の scripts/e2e_smoke.sh にまとめて実行できるようにする。

1) /chat/v1
	•	正常応答（200 or 明示的エラー）
	•	タイムアウト（504）とJSONパース（422）が“沈黙せず返る”ことを確認

2) /llm/generate
	•	最低1つ（Ollama推奨）で「応答テキストが返る」こと
	•	失敗時は502でも良いが、必ず理由が出ること

3) /library
	•	「保存→取得→一覧」で内容が保持されること（SQLiteで）

4) QR（SoulSeed）
	•	生成結果が 1KB以内
	•	type/priority/conflict_policy を含む
	•	Version<=20 / ECC-L で出力される
	•	生成文字列をログに残す

⸻

4. 成果の提出形式（これだけ出せ）

明日の最後に出すレポートはこれだけでいい：
	1.	ALL GREEN / NOT GREEN の判定
	2.	NGなら「止まっている箇所はここ」だけ（最大2つ）
	3.	start_all.sh の出力ログ
	4.	e2e_smoke.sh の出力ログ

長文説明は禁止。
ログと判定だけ出せ。

⸻

5. 重要：判断基準
	•	今日は 正しさ ではなく 稼働 を優先
	•	「動いた」後にだけ、仕様やUXの磨き込みに入る
	•	1個ずつ積まず、統合してから崩して直す
