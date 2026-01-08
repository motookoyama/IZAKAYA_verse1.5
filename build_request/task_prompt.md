このフォルダ内の全ドキュメントを前提条件として読み込め。
A/B/C を比較・認知・統合し、
最終的に「ひとつの完成形」として最後まで構築せよ。

・途中案の説明は禁止
・選択理由の説明は禁止
・統合結果のみを提示せよ
・矛盾は自己判断で解消せよ
・不明点は仮決定して進めよ


現在の対象フォルダ　2025年12月24日

/Users/nohonx/Documents/GitHub/IZAKAYA_verse1.5
/Users/nohonx/Documents/GitHub/IZAKAYA-BFF

参照フォルダ
/Users/nohonx/Documents/GitHub/IZAKAYA-LITE-UI　　動作していたライト版
/Users/nohonx/Documents/GitHub/metacapture-2.0　　　metacapture original

本実装では、既存で稼働中のオンラインBFF（Render）を唯一の実行先として使用する。
ローカルBFF（localhost:8800 等）は使用しない。
すべてのフロント通信は以下を起点とする。

BFF_BASE_URL = https://izakaya-bff.onrender.com



追加で書き込むべきENV（最終セット）

Front（IZAKAYA_verse1.5）
	•	VITE_API_BASE=https://izakaya-bff.onrender.com
	•	VITE_APP_STAGE=prod
	•	VITE_QR_MAX_VERSION=25

BFF（IZAKAYA-BFF）

Core
	•	APP_ORIGIN=https://motookoyama.github.io
	•	CORS_ALLOW_ORIGINS=https://motookoyama.github.io,http://localhost:1398
	•	TRUST_PROXY=1
	•	LOG_LEVEL=info

Auth / JWT / Cookie
	•	JWT_ACCESS_SECRET=...
	•	JWT_REFRESH_SECRET=...
	•	JWT_ACCESS_TTL_SEC=900
	•	JWT_REFRESH_TTL_SEC=2592000
	•	COOKIE_SECURE=1
	•	COOKIE_SAMESITE=lax
	•	COOKIE_DOMAIN=  （空 or ドメイン指定）

OTP
	•	OTP_TTL_SEC=600
	•	OTP_MAX_TRIES=5
	•	OTP_DIGITS=6

Mail（どちらか運用に統一）
	•	MAIL_PROVIDER=smtp もしくは resend
	•	SMTP運用なら：SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS MAIL_FROM
	•	Resend運用なら：RESEND_API_KEY MAIL_FROM

LLM
	•	LLM_PROVIDER=openai（または運用先）
	•	LLM_MODEL=...
	•	LLM_BASE_URL=https://api.openai.com/v1（または運用先）
	•	LLM_API_KEY=...
	•	LLM_TIMEOUT_MS=60000

QR
	•	QR_SIGN_SECRET=...
	•	QR_MAX_VERSION=25
	•	QR_LINK_FORBIDDEN=1
	•	QR_PAYLOAD_MAX_CHARS=800

Wallet / Cost
	•	POINTS_ENABLED=1
	•	COST_CHAT=1
	•	COST_METACAPTURE_GENERATE=3
	•	COST_SEARCH=1
	•	COST_RELOAD=1

Admin
	•	ADMIN_EMAIL_ALLOWLIST=...
	•	ADMIN_ROLE_NAME=admin

DB
	•	DB_TYPE=postgres
	•	DATABASE_URL=...

Rate limit（最低限）
	•	RATE_LIMIT_WINDOW_SEC=60
	•	RATE_LIMIT_MAX=120
