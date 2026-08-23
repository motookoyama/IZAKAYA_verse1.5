# QR転生 / Dev先行 スモークテスト

## 対象
tensei-court / 転生裁判

## テスト日時
2026-05-15T02:21:12.388Z

## テスト環境
- Browser: static HTML / Vite public mirror想定
- Device: Local Codex
- Tester: Codex

## Dev QR
- [x] 開発用QRを生成: /Volumes/Yggdrasill/yggdrasill_workspace/outputs/20260515/qr-tensei/dev-tensei-court/region_portal_qr.png
- [x] devページに到達できる構成
- [x] region_dev_manifest.jsonが存在
- [x] handoff-codex.mdへ移動できるリンクあり
- [x] smoke-test.mdへ移動できるリンクあり

## Public Draft
- [x] publicページに到達できる構成
- [x] enabled:false の場合、準備中表示
- [x] 内部資料が公開側に漏れていない

## Publish Trigger
- [x] publish_trigger.jsonが存在
- [x] status:draft
- [x] publicReady:false
- [x] enabled:false

## Check Sheet
- [x] check_focus.json: /Volumes/Yggdrasill/yggdrasill_workspace/outputs/20260515/checkgen/tensei-court/check_focus.json
- [x] point_check_sheet.md: /Volumes/Yggdrasill/yggdrasill_workspace/outputs/20260515/checkgen/tensei-court/point_check_sheet.md

## Automated Checks
- [x] exists:dev/index.html: 3855 bytes
- [x] exists:dev/region_dev_manifest.json: 2514 bytes
- [x] exists:dev/handoff-codex.md: 485 bytes
- [x] exists:dev/handoff-openclaw.md: 512 bytes
- [x] exists:dev/handoff-narrative-forge.md: 571 bytes
- [x] exists:dev/aura2-notes.md: 728 bytes
- [x] exists:dev/moderator-guide.md: 835 bytes
- [x] exists:dev/qr-dev.png: 250602 bytes
- [x] exists:dev/check_focus.json: 3518 bytes
- [x] exists:dev/point_check_sheet.md: 1371 bytes
- [x] exists:public/publish_trigger.json: 393 bytes
- [x] exists:public/index.html: 2251 bytes
- [x] exists:public/region_manifest.json: 1203 bytes
- [x] exists:public/qr-public.png: 247217 bytes
- [x] exists:public/v2-card-gallery.json: 269 bytes
- [x] exists:public/character-list.json: 245 bytes
- [x] dev_manifest_type: region_dev_manifest
- [x] publish_trigger_draft: {"enabled":false,"publicReady":false,"status":"draft"}
- [x] public_no_dev_handoff_links: public HTML does not expose dev links
- [x] public_mirror_target_ready: /Volumes/Yggdrasill/GitHub/IZAKAYA_verse1.5/public/regions/tensei-court

## 結果
PASS

## 問題点
- なし

## 次アクション
- 実機でDev QRを読み取り、Dev Portal表示を確認する
- publish_trigger.jsonを一時的にenabled:trueへ変更する公開表示テストは、owner承認後に行う

## 追加配信スモーク
- [x] `npm run build` 成功
- [x] `dist/regions/tensei-court/dev/` へコピーされる
- [x] `dist/regions/tensei-court/public/` へコピーされる
- [x] 一時HTTPサーバで `/regions/tensei-court/dev/` が 200
- [x] 一時HTTPサーバで `/regions/tensei-court/dev/region_dev_manifest.json` が 200
- [x] 一時HTTPサーバで `/regions/tensei-court/public/` が 200
- [x] 一時HTTPサーバで `/regions/tensei-court/public/publish_trigger.json` が 200
- [x] 一時HTTPサーバで `/regions/tensei-court/public/qr-public.png` が 200
