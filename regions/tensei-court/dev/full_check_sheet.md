# Full Check Sheet — 転生裁判

## 基本情報
- content_id: tensei-court
- content_type: region
- target_phase: prototype
- generated_at: 2026-05-15T02:21:12.375Z
- generation_mode: deterministic_poc

## 企画の核
転生希望者がAI裁判官に審査されるリージョン

## Human Focus
### human_1: リージョン体験が一言で説明できるか
- importance: high
- reason: 公開時の入口になるため。
- pass_condition: 初見でも何を体験する場所か分かる。
### human_2: キャスト配置に意味があるか
- importance: medium
- reason: V2カード展開につながるため。
- pass_condition: 登場キャラがリージョンの体験やルールに接続している。
### human_3: メインビジュアルと売り文句が一致するか
- importance: medium
- reason: 検品時のズレを早く見つけるため。
- pass_condition: 画像と紹介文から同じ世界観が伝わる。

## AI Focus
### ai_1: 必須フィールドが揃っているか
- check_type: structure
- importance: medium
- reason: UIや後続処理が読める最低条件。
- pass_condition: title, content_type, target_phase, concept_text または narrative_output が存在する。
### ai_2: 判定欄が PASS / REPAIR / HOLD に限定されているか
- check_type: policy
- importance: medium
- reason: 自動破棄を避けるため。
- pass_condition: 却下を使わず、allowed_judgements が3種に固定されている。
### ai_3: リージョン用の構造が確認できるか
- check_type: structure
- importance: medium
- reason: 目録UIに表示するため。
- pass_condition: 概要、ルール、体験導線、タグ、ビジュアル方向のいずれかが構造化されている。

## Minimum Pass Line
リージョン体験が一言で伝わり、次に確認すべき画像・V2カード・売り文句の焦点が分かること。

## Source Summary
```text
転生希望者がAI裁判官に審査されるリージョン。公開前にDev Portal、Manifest、QR、チェックシート、公開トリガーを先行整備する。
```
