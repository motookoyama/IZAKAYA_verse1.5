# Narrative Forge向け作業指示

## 目的
転生裁判 の制作ワークフローを復元する。

## ノード構成案
Seed -> World -> Character -> CheckGen -> QR Portal -> AURA2 Review -> Smoke Test -> Handoff

## 入力
- ../draft/world.md
- ../draft/story-outline.md
- ../draft/characters/judge-001.md
- ./check_focus.json
- ../public/region_manifest.json

## 出力
公開判断用のチェックシート、QR転生導線、公開ページドラフト。

## 現状
Phase A静的パッケージとして生成済み。Forge UI連携は今後のPhase C。
