CODEX 最終命令（固定）｜IZAKAYA Verse “一気貫通” 全搭載実装

方針：長引くとAIの記憶不備が出る。よって 機能を刻まず一挙に実装し、失敗したら この時点のバックアップまで巻き戻して作り直す。
人間に「確認」「テスト」「操作」を要求するな。最後にE2Eを一回で通して「テスト完了」報告のみ行え。

⸻

0. 禁止事項（地獄ループ防止）
	•	health/ping/マニュアル再走の誘導禁止
	•	「まず認証だけ」等の刻み禁止（同一ブランチで全部同時実装）
	•	provider=mock のまま放置禁止（フロントは常にBFFを叩く）
	•	Gate/UIがページごとに分裂したまま禁止
	•	途中段階の完了宣言禁止（E2E全PASSのみ）

⸻

1. 完了条件（E2E 12項目：全PASS以外は未完）
	1.	共通ヘッダ（全ページ）に Login/Logout/Status が存在
	2.	/auth/start 成功（メールOTP送信）
	3.	/auth/verify 成功（token取得）
	4.	リロード後もログイン継続（自動復元）
	5.	/auth/me がユーザーを返す
	6.	Chat送信で /chat/v1 に Authorization が付与される
	7.	/chat/v1 が返信を返す（1往復以上）
	8.	/metacapture/generate 成功（V2カード生成）
	9.	生成カードをChatに投入→会話成立
	10.	/qr/encode が QRプロトコル（Version<=25・リンク禁止）を満たす
	11.	/qr/redeem 成功→残回数更新
	12.	/wallet/ledger に記録が残る（chat/generate/redeem）

⸻

2. 搭載必須モジュール（欠け1つも許さない）

フロント
	•	共通ヘッダ：Login/Logout/Status（ポイント/接続状態）
	•	管理人UI入口（adminロールのみ表示）
	•	Chat：Slot1/2/3、送信、カード投入、ログ保存UI
	•	MetaCapture：生成/検証/保存/履歴
	•	QR：encode/redeem UI
	•	History（現Library→将来Historyへ改名方針を保持）
	•	api.ts：fetch wrapperを一本化し Authorization を常時付与

BFF（単体完結）
	•	Auth：POST /auth/start /auth/verify、GET /auth/me、POST /auth/logout
	•	LLM：POST /chat/v1（唯一のチャット入口）
	•	MetaCapture：POST /metacapture/generate /validate /save、GET /metacapture/history
	•	QR：POST /qr/encode /qr/redeem（Version<=25・リンク禁止を検証して拒否）
	•	Wallet：GET /wallet/balance、POST /wallet/consume /wallet/grant、GET /wallet/ledger
	•	History：GET /history/chat /history/cards /history/qr

⸻

3. 固定仕様（要点のみ）

認証
	•	ユーザー向け：メールOTP（6桁）
	•	tokenは Authorization: Bearer <token> で統一
	•	ログアウトまで有効（refresh/cookie推奨、難しければlocalStorage復元で成立させる）

QRプロトコル（固定）
	•	QR配布用：Version25以下（可能なら20運用だが上限は25）
	•	リンク禁止・自己完結要約のみ
	•	逸脱は encode/redeem でエラー

マネージメント（Mammon Manager接続点）
	•	/chat/v1 と /metacapture/generate の前段で必ず wallet.consume を実行
	•	ledgerに必ず記録
	•	管理人は wallet.grant 可能

⸻

4. ENV（値は後で差し替え：キー名だけ実装対応）

フロント：
	•	VITE_API_BASE, VITE_APP_NAME, VITE_APP_STAGE, VITE_QR_MAX_VERSION

BFF：
	•	APP_ORIGIN
	•	JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_TTL_SEC, JWT_REFRESH_TTL_SEC
	•	OTP_TTL_SEC, OTP_MAX_TRIES, OTP_DIGITS
	•	MAIL_PROVIDER + (SMTP_* または RESEND_API_KEY) + MAIL_FROM
	•	LLM_PROVIDER, LLM_MODEL, LLM_BASE_URL, LLM_API_KEY, LLM_TIMEOUT_MS
	•	QR_SIGN_SECRET, QR_MAX_VERSION, QR_LINK_FORBIDDEN, QR_PAYLOAD_MAX_CHARS
	•	POINTS_ENABLED, COST_CHAT, COST_METACAPTURE_GENERATE, COST_SEARCH, COST_RELOAD
	•	ADMIN_EMAIL_ALLOWLIST, ADMIN_ROLE_NAME
	•	DB_TYPE, DB_PATH または DATABASE_URL

⸻

5. 最終報告フォーマット（これ以外で報告禁止）
	•	✅ E2E 12項目：全PASS一覧
	•	✅ 主要URL（Home/Chat/MetaCapture/Admin）
	•	✅ 必要ENVキー一覧（上記と一致）
	•	✅ デモ手順（ログイン→チャット→生成→QR→引換→ledger）
	•	❌ FAILがあれば「E2E番号」だけを列挙（推論不要）

⸻

【開始せよ】同一ブランチで一気に全搭載を行い、E2E全PASSで完了報告せよ。

IZAKAYA Verse｜ENV確定表（固定）

目的：構築AIが迷わず一気貫通実装できるよう、必要な環境変数を今日この場で確定する。
方針：最小・直結・単一BFF完結。余計な層は禁止。

⸻

0. 変数命名ルール（固定）
	•	すべて 大文字スネークケース
	•	秘密鍵は 必ず環境変数（リポジトリに直書き禁止）
	•	フロントに露出して良いのは 公開URLだけ（VITE_ 系）

⸻

1. フロント（Vite）ENV（固定）

必須
	•	VITE_API_BASE
	•	例：https://izakaya-bff.onrender.com（本番）
	•	例：http://localhost:8800（ローカル）
	•	VITE_APP_NAME
	•	例：IZAKAYA verse
	•	VITE_APP_STAGE
	•	例：dev / prod

任意（UI表示用）
	•	VITE_ENABLE_ADMIN_UI
	•	0 / 1（管理UI表示スイッチ。最終的にはロールで制御）
	•	VITE_QR_MAX_VERSION
	•	固定：25（可能なら20運用だが、仕様上は25を上限）

⸻

2. BFF（サーバ）ENV（固定）

2.1 基本
	•	PORT
	•	Renderが注入する想定（ローカルは 8800 など）
	•	NODE_ENV
	•	development / production
	•	APP_ORIGIN
	•	例：http://localhost:1398（ローカルフロント）
	•	例：https://motookoyama.github.io（Pages）
※CORS許可の基点（厳密にする）

⸻

3. Auth（メールOTP + JWT）ENV（固定）

3.1 JWT（必須）
	•	JWT_ACCESS_SECRET（必須）
	•	JWT_REFRESH_SECRET（必須）
	•	JWT_ACCESS_TTL_SEC（固定推奨：900 = 15分）
	•	JWT_REFRESH_TTL_SEC（固定推奨：2592000 = 30日）

3.2 OTP（必須）
	•	OTP_TTL_SEC（固定推奨：600 = 10分）
	•	OTP_MAX_TRIES（固定推奨：5）
	•	OTP_DIGITS（固定：6）

3.3 メール送信（最初から搭載）

※以下から どれか1つの方式を選んで実装。変数は両対応で定義しておく。

A) SMTP方式（汎用）
	•	SMTP_HOST
	•	SMTP_PORT
	•	SMTP_USER
	•	SMTP_PASS
	•	SMTP_FROM（例：IZAKAYA <no-reply@...>）

B) Resend等のAPI方式（簡単）
	•	MAIL_PROVIDER（固定候補：smtp or resend）
	•	RESEND_API_KEY
	•	MAIL_FROM

実装は「MAIL_PROVIDER」で分岐。どちらもENVは用意する。

⸻

4. LLM接続（本丸）ENV（固定）

方針：BFFは provider を内部で切替できる（Render/Localどちらも）。
フロントは provider=mock を廃止し、常にBFFを叩く。

必須
	•	LLM_PROVIDER
	•	openai / gemini / ollama / mock（※mockはBFF内部テスト用のみ）
	•	LLM_MODEL
	•	例：gpt-4.1-mini 等（実運用のモデル名）
	•	LLM_BASE_URL
	•	OpenAI互換なら https://api.openai.com/v1 等
	•	Ollamaなら http://localhost:11434 等
	•	LLM_API_KEY
	•	外部API用（Ollamaは空でも可）

任意（安全）
	•	LLM_TIMEOUT_MS（固定推奨：60000）

⸻

5. QR（署名付きトークン）ENV（固定）

必須
	•	QR_SIGN_SECRET（必須：HMAC用）
	•	QR_MAX_VERSION（固定：25）
	•	QR_LINK_FORBIDDEN（固定：1）
	•	QR_PAYLOAD_MAX_CHARS（固定推奨：600〜800 ※運用で調整）

⸻

6. Wallet / Points（マネージメント）ENV（固定）

必須
	•	POINTS_ENABLED（固定：1）
	•	POINTS_FREE_DAILY（固定推奨：0〜N ※運用で決める）
	•	COST_CHAT（固定推奨：1）
	•	COST_METACAPTURE_GENERATE（固定推奨：3）
	•	COST_SEARCH（固定推奨：1）
	•	COST_RELOAD（固定推奨：1）

※「Mammon Managerの判断」をコードに反映する接続点。
wallet.consumeが必ずこれを参照する。

⸻

7. 管理人（Admin）ENV（固定）

方針：管理人もユーザー認証と同じJWTで動かす（別系統を作らない）。

必須
	•	ADMIN_EMAIL_ALLOWLIST
	•	例：motookoyama@example.com, ...（CSV）
	•	ADMIN_ROLE_NAME（固定：admin）

（将来）管理人専用キーを併用したい場合のみ：
	•	ADMIN_MASTER_KEY（任意）

⸻

8. ストレージ（最初から搭載：選べるがENVは固定）

A) SQLite（ローカル最速）
	•	DB_TYPE（固定候補：sqlite）
	•	DB_PATH（例：./data/izakaya.sqlite）

B) Postgres（本番向け）
	•	DB_TYPE（固定候補：postgres）
	•	DATABASE_URL（Renderが注入する想定）

⸻

9. これで確定（運用メモ）
	•	フロントは VITE_API_BASE だけで迷子にならない
	•	BFFは Auth/LLM/QR/Wallet をENVで切替可能
	•	途中で「どのキーが必要？」を人間に聞かないための一覧が完成した

（このENV表は“固定”。以後、追加は例外扱い）
:::
:::