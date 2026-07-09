# Narrative Forge Template Asset System v0.1

作成日: 2026-05-30  
位置づけ: Narrative Forge / IZAKAYA Multi-Stage Method の量産体制用テンプレート資産仕様  
状態: 固定方針 v0.1

## 0. 基本思想

Narrative Forge は、単発の生成器ではなく、軽量試作から本格サービスまで段階的に鍛造する制作ラインである。

本仕様では、生成物の規模に応じてテンプレートを分け、各テンプレートに必要な成果物、検証、コスト予測、ナレッジ・サイクルを定義する。

最重要方針:

> ナレッジ・サイクルで得たスキルそのものを、生成 AI に委ねられる形へ落とし込む。

つまり、知識は人間の記憶や一回限りの会話に残さない。  
テンプレート、チェックシート、スキル、mapper、実行前ドライランとして再利用可能な形へ固定する。

## 1. テンプレート階層

### 1.1 Region Simple

用途:

- テスト用リージョン
- ステルス公開用
- 軽量プロトタイプ
- 新規発想の初期検証

主な成果物:

- region JSON
- 短い MD 紹介文
- シンプルな画像 1 枚
- point check sheet
- check focus JSON

V2カード:

- 原則なし
- 必要な場合のみ既存カードを参照

公開判断:

- public より stealth を基本とする
- 生成保存、画像表示、QR導線、チェックシート確認の smoke に向く

ナレッジ・サイクル:

- 原則不要
- 新しいジャンルや不明な導線がある場合のみ 1 回

## 1.2 Region Middle

用途:

- 公開候補リージョン
- SNS 導線つき小型リージョン
- 量産の標準候補

主な成果物:

- 拡張 region JSON
- MD 紹介文
- シナリオ骨子
- 数枚のシーン画像
- タイトルロゴ
- point check sheet
- full check sheet
- check focus JSON

V2カード:

- オリジナルキャラクター 1-3 枚
- キャラクター先行型の場合は、V2カードから region を逆生成してよい
- 目録で承認済みの画像から Mind Sync で imagePrompt / character seed を抽出し、新規キャラクター候補を作ってよい

公開判断:

- public / stealth / HOLD / REPAIR を明示
- 画像、V2カード、紹介文、チャット体験の整合性が取れれば public 候補

ナレッジ・サイクル:

- 推奨
- 画像、V2カード、MD、JSON、QR、SNS文の整合性を確認する

## 1.3 Region Full Set

用途:

- 主力リージョン
- 継続更新するコンテンツ
- キャンペーン展開する公開候補

主な成果物:

- Region Middle の全成果物
- 追加キャラクターカード
- チームカード
- 追加ロケーション
- 更新キャンペーンシナリオ
- QR 転生コード / Region Portal QR
- SNS投稿案
- Xe登録案
- 紹介ページ案

V2カード:

- キャラクターカード群
- チームカード
- 必要なら案内役カード
- Mind Sync Character Forge により、承認済み画像からキャラクター造形・V2カード更新候補・リージョン視覚DNAを作る

公開判断:

- 3本選抜公開の候補
- 画像、チャット、QR、SNS、Xe、紹介ページの最低導線が通ること

ナレッジ・サイクル:

- 必須
- 公開判断、V2会話、QR導線、SNS導線、Xe登録、ページ導線をドライランする

## 1.4 Region Extra

用途:

- 大規模リージョン
- MMO 的構造を持つサービス候補
- 長期運用・更新前提の世界

主な成果物:

- Region Full Set の全成果物
- MMO仕様マップ
- 詳細設定書
- 運営ルール
- Producer AI 設定
- イベント管理案
- 長期更新計画
- 権限・課金・チケット導線案

公開判断:

- いきなり public にしない
- 原則 stealth / closed test / pilot を経由する

ナレッジ・サイクル:

- 複数回必須
- 制作ではなく、小型サービス設計として扱う

## 1.5 IZAKAYA Games

用途:

- レトロゲーム形式の制作
- V2カード連動ゲーム
- IZAKAYA games の量産

主な成果物:

- ゲーム企画書
- ルール
- 操作設計
- 画面遷移
- グラフィック素材リスト
- エフェクト素材リスト
- 実装順序
- V2カード連動手順
- コンテンツ内有効プロトコル
- smoke / playtest レポート

ビジュアル基準:

- SNES 以上の視覚密度を望ましい基準とする
- ただし初期 smoke は軽量プロトタイプでよい

ナレッジ・サイクル:

- 必須
- 操作感、失敗時の気持ちよさ、画面密度、V2連動の役割分担を検証する

## 1.6 Program Production

用途:

- 番組制作
- SNS投稿
- スライドショー
- 動画構成
- キャラクター番組

主な成果物:

- 番組構成脚本
- タイムスケール
- タイムキーパー設定
- 声優キャラクター設定
- グラフィック密度計画
- フル動画版
- スライドショー版
- SNS短尺版

コスト方針:

- フル動画は高コスト
- 標準はスライドショー形式
- SNS版は短尺・低コスト・高速検証を基本とする

ナレッジ・サイクル:

- 推奨
- 台本、画面密度、動画コスト、SNS導線を検証する

## 2. 昇格モデル

テンプレートは固定階層ではなく、昇格可能な制作段階として扱う。

```text
Region Simple
  -> Region Middle
    -> Region Full Set
      -> Region Extra
```

昇格条件:

- Simple -> Middle
  - 企画の一文説明が通る
  - 画像または仮画像がある
  - check focus が成立する

- Middle -> Full Set
  - V2カードまたは主要キャラクターが立つ
  - 画像と紹介文の方向が一致する
  - public / stealth / HOLD の判断ができる

- Full Set -> Extra
  - 継続更新する理由がある
  - マップ、運営、課金、イベント導線が必要になる
  - Producer AI や管理AIの導入価値がある

降格条件:

- 画像が決まらない
- V2カードの人格が弱い
- 公開導線が詰まる
- コストが高すぎる
- 人間の判断点が多すぎる

降格は失敗ではない。HOLD または素材倉庫行きとする。

## 2.5 Mind Sync Character Forge

Mind Sync の「画像 <> プロンプト」フィードバックは、画像修正だけでなく、キャラクター造形の制作ラインとして扱う。

目的:

- 目録で承認済みの画像を制作資産として再利用する
- 画像から造形特徴を抽出し、imagePrompt / character seed / V2カード候補へ戻す
- AIプラットフォームに依存しないキャラクター定義を鍛える
- MetaCapture や新キャラ生成導線へ接続する

禁止:

- 失敗画像や初期破綻画像を起点にしない
- ファイル名やリンクだけで画像を採用しない
- 公式V2カードをAI判断だけで上書きしない

成果物:

- 抽出した造形特徴
- imagePrompt 草案
- character seed 草案
- V2カード更新候補
- リージョン視覚DNA候補
- Before / After または保存証明

## 3. GUI追加方針

Narrative Forge 本体 GUI には、将来的に以下を追加する。

- テンプレート選択
- ワークフロープロセスの追加
- ワークフロー再編集
- 途中追加
- 生成物確認テンプレートへの即時移行
- 構築プラン実装時のコスト予測
- 計算コスト調整
- 必要ナレッジ・サイクル予測
- Simple / Middle / Full / Extra 昇格ボタン
- HOLD / REPAIR / STEALTH / PUBLIC 判定の保存

重要:

- GUI はモックで終わらせない
- 押せるボタンは必ず状態変化か説明を返す
- 保存証明なしに完了扱いしない

## 4. コスト予測

各テンプレートは、実行前に概算コストを表示する。

コスト分類:

- text only
- text + simple image
- multi image
- V2Card generation
- image polish / retouch
- slideshow
- video
- external cloud API
- local GPU
- human review time

表示例:

```json
{
  "template": "region_middle",
  "expected_cost_level": "medium",
  "compute_cost": "text + 3 images + V2Card x2",
  "human_review_cost": "medium",
  "knowledge_cycle": "recommended",
  "public_risk": "moderate"
}
```

## 4.5 点検モジュール分類

点検モジュールとは、コンテンツ本体とは別に持つ、再利用可能な検品・試遊・確認アセットである。

チェックシートだけで確認できる段階を超えた場合、テンプレートごとに専用UIを作り続けるのではなく、点検モジュールを差し替えて使う。

基本思想:

- コンテンツ本体と点検方法を分離する
- 同じ点検モジュールを複数テンプレートへ転用する
- 高度なリージョンやゲームでは、不足する点検モジュールを追加する
- 点検モジュールは疑似アプリケーション化してよい
- ただし、点検モジュールの存在が制作を重くしてはいけない

### Region RP 点検モジュール

対象:

- Region Simple
- Region Middle
- Region Full Set
- Region Extra

目的:

- JSON / MD / 登録画像 / V2カード / Visual Direction を Region Core として読み、RPが止まらず始まるか確認する
- `JSONにありません` や `情報が足りません` でユーザー体験が止まらないか確認する
- 不足情報をAIが自然に補完し、セッション内で保持できるか確認する

### V2Card 点検モジュール

対象:

- Region Middle 以上
- キャラクター先行型リージョン
- V2カードライブラリー更新

目的:

- V2カードJSON、SVGサムネ、画像、first_mes、personaPrompt、会話維持を確認する
- 生成カードを即公式化せず、`generated_pending_review` として登録し、オーナー承認を待つ
- 既存公式カードと同ID・同名の場合は、上書き候補として扱い、無断破壊しない

### Image Direction 点検モジュール

対象:

- 画像を使う全テンプレート
- スライドショー
- ページヒーロー
- V2カード画像
- SNS素材

目的:

- 画像品質ではなく、何を描くべきかを確認する
- Region Core から Visual Direction を抽出し、画像生成モデルへ渡せる形にする
- `Image Generation` ではなく `Image Direction` を資産として保存する

### Page Preview 点検モジュール

対象:

- public / stealth 公開候補
- Region Middle 以上
- サービス再開前の公開サンプル

目的:

- 紹介ページ、売り文句、導入ライン、タグ、QR導線が成立するか確認する
- MD情報からページ表示に必要な1行特徴、遊び方、カテゴリを抽出する
- 生成ページは即公開ではなく、Preview / Catalog 上で承認を待つ

### SNS / Promo 点検モジュール

対象:

- 公開リージョン
- プロモーション開始候補
- QR配布
- Xe登録

目的:

- 投稿文、短文フック、キャラクター投稿、QR導線を確認する
- リージョンの売りがSNS上で一文で伝わるか確認する
- 公開済み・ステルス公開・HOLD の扱いを混同しない

### Game Prototype 点検モジュール

対象:

- IZAKAYA Games
- レトロゲーム素材
- V2カード連動ゲーム

目的:

- 操作、ルール、1プレイの目的、画面フィードバック、失敗時挙動を確認する
- ゲーム用点検モジュールはリージョン用から流用せず、別設計してよい
- ゲームテンプレートは、プレイアブルな疑似アプリケーションとして点検する方が早い場合がある

### High-Level Region 点検モジュール

対象:

- Region Full Set
- Region Extra
- MMO仕様
- Producer AI 搭載リージョン
- キャンペーン更新型リージョン

目的:

- 追加ロケーション、チームカード、キャンペーン、MMO設定、プロデューサーAIを確認する
- レベルが上がって要素が増えた時、その要素に応じて点検モジュールを追加する
- 一つの巨大チェックシートにまとめず、点検モジュールを分割して運用する

### 生成物の扱い

自動生成されたV2カード、画像、ページ、SNS文は、即公式化しない。

推奨状態:

- `generated_pending_review`
- `owner_review`
- `approved`
- `hold`
- `repair`

自動生成物は、自動生成物として登録し、オーナー認可を待つ。

## 5. ナレッジ・サイクル予測

生成前に、必要なナレッジ・サイクルを予測する。

不要:

- Simple
- 既知ジャンルの軽量テスト
- 既存テンプレートの再実行

推奨:

- Middle
- 番組制作
- 画像とV2カードの整合性が重要な場合

必須:

- Full Set
- Games
- Extra
- public push 前
- Xe 登録前
- 課金・QR・チケット導線を含む場合

複数回必須:

- MMO仕様
- Producer AI 搭載
- 長期キャンペーン
- 外部サービス連携

## 6. 生成AIへ委ねる形

ナレッジ・サイクルで得た学習結果は、次の形に落とし込む。

- テンプレート
- チェックシート
- check focus JSON
- 実行前ドライラン
- mapper
- OCas skill
- Codex skill
- OpenClaw handoff
- Preview Server / Catalog UI 検品モジュール

禁止:

- 会話ログだけに残す
- 人間の記憶だけに頼る
- AIの内部記憶にだけ残す
- 毎回同じ説明を人間にさせる

## 7. 受け入れ条件 v0.1

この仕様は、以下を満たしたら v0.1 固定とする。

- テンプレート階層が定義されている
- 各テンプレートの成果物が定義されている
- 昇格条件が定義されている
- コスト予測の考え方がある
- ナレッジ・サイクル予測がある
- 生成AIへ委ねるための出力形がある
- OCas mapper から検索可能である

## 8. 次の実装候補

急がない。量産体制に入る前に、次の順で進める。

1. Template Asset System を mapper と master skill に登録
2. Region Simple の最小テンプレートを作る
3. Region Middle の成果物一覧を JSON schema 化する
4. CheckGen Node と接続する
5. Preview Server / Catalog UI にテンプレート確認欄を足す
6. Games / Program Production は別レーンとして設計する

## 9. 固定メモ

- この仕様は、すぐに全実装するための命令書ではない
- 量産体制に入る前の設計固定である
- 現時点では、公開再開ロードマップと矛盾しない範囲で扱う
- 既存の5リージョン公開ルート、V2カード移行、Narrative Forge 新ID群は混ぜない
- テンプレートは、制作を止めないための道具であり、制作を重くするための制度ではない
