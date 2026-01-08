以下は **「IZAKAYA verse1.5 を“最終段階まで一気に持っていく”ための CODEX IDE 用・構築指示プラン（フィニッシュワーク）**です。
※基本原則は「Make/sAtd を共通入口」「smoke が赤なら中止」「成果物は outputs/」に固定しています。

⸻

0) 目的（この作戦で“終わる”定義）
	•	ローカル：start_local.sh（あなたの“UI試行基盤”）で front + bff が安定起動し、UIからチャット疎通が通る
	•	公開：GitHub Pages（verse1.5）で白画面ゼロ、API未接続時でも UI が壊れない（フォールバック表示が出る）
	•	成果物：outputs/YYYYMMDD-verse1.5-finish/ に result.md / result.json / trace.log を残す  ￼

⸻

1) フィニッシュワーク全体フロー（赤ならその日終了）
	1.	SoT固定：schemas/SPEC.sAtd を前提に、仕様の“決め直し”をしない（実装修正のみ）  ￼
	2.	Run：scripts/start_local.sh（あなたの公式基盤）で front/bff 起動
	3.	Smoke：疎通テスト（UI→BFF→LLM まで）
	4.	赤の種類別に最短修正（後述：A/B/Cの3パターンに分岐）
	5.	出力保存：outputs に証跡を残して“正史化”  ￼

⸻

2) “最後に残りやすい地雷”だけ先に潰す（最小限）

2-1. 白画面再発防止（最重要）
	•	vite.config.ts に base: './' が入っていたら削除 or base: '/'
（GitHub Pagesでサブディレクトリ配信が必要な時だけ /repo-name/ を明示）
※これはあなたの既知ルールとして固定（再発防止の最重要知識）

2-2. フロント⇄BFFの「入口の形」ズレを必ず吸収
	•	典型ズレ：フロントが OpenAI形式 /v1/chat/completions を叩くのに、BFFが POST /chat/v1 しか公開していない
	•	解決は“どっちかに寄せる”ではなく「片側で吸収」（最小変更で終わる）
	•	推奨：BFFに /v1/chat/completions の互換ルートを追加し、内部で /chat/v1 へ流す
	•	これでフロント側の改修がほぼゼロになる

2-3. V2カード周りは “正規化ルール”だけ守ればOK
	•	name/first_mes/behavior/links/icon の正規化・必須キー（id,name）だけ崩さない  ￼

⸻

3) CODEX IDE に渡す「一括指令」（コピペ用）

狙い：分割せず“一挙に実装→smoke→outputs保存”までやらせる

# CODEX指令：IZAKAYA verse1.5 フィニッシュワーク（一気通貫）

目的：
- start_local.sh で front + bff を起動し、UIからチャット疎通(smkoke)が通る状態にする
- GitHub Pages で白画面ゼロ（API未接続でもUIが壊れない）
- outputs/YYYYMMDD-verse1.5-finish/ に result.md/result.json/trace.log を残す

厳守：
- 仕様変更（新しいゲートウェイ/複雑な中間層）は禁止。最小差分で直結。
- smoke が赤なら、その原因修正だけして終了（余計な拡張禁止）。
- secrets は .env.local のみ。repoに入れない。

やること（順番固定）：
1) vite.config.ts を点検し base:'./' があれば削除 or base:'/' に修正（白画面再発防止）
2) front→bff のAPI形状ズレを吸収する
   - BFFに POST /v1/chat/completions 互換エンドポイントを追加
   - 受けたOpenAI形式を /chat/v1 の内部ハンドラへ変換して流す
   - 返却もOpenAI形式に最低限整形する（choices[0].message.content）
3) provider=mock のままでも UI が壊れないようフォールバック表示（接続エラー時に「BFF未接続」等のメッセージを出す）
4) smoke手順を scripts/ か Makefile に追加（無ければ scripts/smoke.sh を作る）
   - frontが起動してトップが描画される
   - BFFの /health/ping が200
   - /v1/chat/completions が200（または期待するエラー形状で返る）
5) outputs/YYYYMMDD-verse1.5-finish/ を作成し
   - result.md（何が直り何が確認できたか）
   - result.json（smoke結果と主要設定の要約、秘密は書かない）
   - trace.log（主要ログの要点）
   を保存する

最後に：
- 修正ファイル一覧
- smoke結果（pass/fail）
- 次にやること最大3件
を短くレポートして終了

（この指令は「AI間の役割分担」と「ログを正史化」モデルに準拠しています）

⸻

4) “赤”の種類別：最短フィックスだけやる（3パターン）

A) 白画面（エラー出ない系）
	•	まず vite.config.ts の base を疑う（'./' を消す/'/'）
	•	router / assets のパスが崩れていないか確認（ここだけ）

B) 404/ルート不一致（フロント→BFF）
	•	BFF側に互換ルート：POST /v1/chat/completions を追加して吸収
	•	CORSは最小：http://localhost:5173 を許可（必要なら 5174 等も追加）

C) 500（BFF→LLM）
	•	.env.local の LLM_PROVIDER / OPENAI_API_BASE / OPENAI_API_KEY / OPENAI_MODEL を確認（repoに入れない）  ￼
	•	provider=mock を “未設定扱い”にして、UI側はフォールバック表示で耐える（壊さない）

⸻

5) フィニッシュ時の「保存フォーマット」（正史化）
	•	outputs/YYYYMMDD-verse1.5-finish/
	•	result.md：直した点 / smoke結果 / 既知の制限
	•	result.json：smoke判定、起動ポート、エンドポイント、生存確認（※秘密なし）
	•	trace.log：ログ抜粋・要点
この運用ルール自体が、あなたの“ループ断ち”の武器です。

⸻

必要なら、このプランを **そ# === IZAKAYA Verse 正史ポート ===
IZAKAYA_PORT=1398
VITE_PORT=1398

# === BFF ===
BFF_PORT=4117

# === API 接続 ===
VITE_API_BASE=http://localhost:4117

# === 安全装置 ===
LLM_PROVIDER=mock
ENABLE_OPENAI_COMPAT=true
ENABLE_MOCK_FALLBACK=true

了解です。
**IZAKAYA verse1.5 フィニッシュワーク用「必要と思える ENV 仮設定集」**を
CODEX / ローカル実行 / Render どれでも使える“最小〜実務十分”ラインでまとめます。

※これは 「決め打ちの雛形」 です。
※ 値はすべて 仮。意味・用途・どこで参照されるかを重視しています。
※ .env.local（Git管理外）前提。

⸻

IZAKAYA verse1.5 ENV 仮設定集（最終版たたき）

0. 環境識別（必須・最優先）

NODE_ENV=development
IZAKAYA_ENV=local

	•	NODE_ENV
	•	development | production
	•	IZAKAYA_ENV
	•	verse 固有の環境識別
	•	ログ分岐・UIフォールバック表示の条件に使える

⸻

1. フロントエンド（Vite）

VITE_API_BASE=http://localhost:4117
VITE_APP_NAME=IZAKAYA Verse 1.5
VITE_UI_MODE=normal

用途
	•	VITE_API_BASE
	•	フロント → BFF の唯一の入口
	•	ここがズレると全て死ぬ
	•	VITE_UI_MODE
	•	normal | mock | readonly
	•	BFF未接続時の表示切り替え用（白画面防止）

⸻

2. BFF 基本設定（必須）

BFF_PORT=4117
BFF_LOG_LEVEL=info
BFF_CORS_ORIGIN=http://localhost:5173

用途
	•	BFF_PORT
	•	start_local.sh で front と衝突しない番号
	•	BFF_CORS_ORIGIN
	•	開発時は 1つだけ 許可（ワイルドカード禁止）

⸻

3. LLM プロバイダ切替（最重要ゾーン）

3-1. プロバイダ指定（スイッチ）

LLM_PROVIDER=mock

想定値：
	•	mock（最重要・保険）
	•	openai
	•	gemini
	•	ollama
	•	custom

👉 provider=mock の時は API_KEY が無くても 200 を返す設計にする

⸻

3-2. OpenAI互換（OpenAI / Render / Proxy 用）

OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_API_KEY=sk-xxxxxxxx
OPENAI_MODEL=gpt-4.1-mini

	•	OPENAI_API_BASE
	•	Render / Cloud Run / ローカル proxy でも差し替え可能
	•	OPENAI_MODEL
	•	UIやカード側で指定しない場合のデフォルト

⸻

3-3. Gemini（将来・共存前提）

GEMINI_API_KEY=AIza-xxxxxxxx
GEMINI_MODEL=gemini-1.5-pro

※ 現段階では 未使用でもOK
※ provider 切替時に読むだけ

⸻

3-4. Ollama（ローカルLLM）

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

	•	ローカル完結テスト用
	•	BFF 側で OpenAI 形式にラップする想定

⸻

4. 互換ルート・安全装置（超重要）

ENABLE_OPENAI_COMPAT=true
ENABLE_MOCK_FALLBACK=true

意味
	•	ENABLE_OPENAI_COMPAT
	•	/v1/chat/completions を 必ず生やす
	•	ENABLE_MOCK_FALLBACK
	•	LLM エラー時でも UIを壊さない

👉 verse1.5 を「展示可能」にする生命線

⸻

5. Persona / Soul Core（最低限）

SOUL_CORE_MODE=lite
PERSONA_ENGINE=static

想定値：
	•	SOUL_CORE_MODE
	•	lite | full | off
	•	PERSONA_ENGINE
	•	static | json | rag

※ 1.5 では static + lite で十分

⸻

6. ログ・検証・スモーク用

TRACE_ENABLED=true
SMOKE_TEST_MODE=true

	•	TRACE_ENABLED
	•	outputs/trace.log に要点を書く
	•	SMOKE_TEST_MODE
	•	smoke.sh 実行時に分岐可能

⸻

7. GitHub Pages / 展示用（壊れないための保険）

READONLY_MODE=false

	•	true の場合
	•	APIエラー時は 観覧専用UI に落とす
	•	作品展示として成立させるための最終安全弁

⸻

最小セット（これだけあれば「通電」する）

NODE_ENV=development
IZAKAYA_ENV=local

VITE_API_BASE=http://localhost:4117

BFF_PORT=4117
LLM_PROVIDER=mock

ENABLE_OPENAI_COMPAT=true
ENABLE_MOCK_FALLBACK=true


⸻

判断基準（重要）
	•	ENV が 10個超えたら疑え
	•	「無いと落ちる ENV」だけを必須にする
	•	provider=mock で 必ず UI が喋る（仮）

⸻

次の一手として可能なのは：
	1.	この ENV を .env.sample として確定
	2.	CODEX 用に「ENVが無い時の挙動仕様」を1枚にする
	3.	BFF 側で process.env → config.ts 正規化表を作る




