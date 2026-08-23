# AGENTS.md

## Yggdrasill 正本への接続

このリポジトリだけを探索して、資産・前提・メソッドが存在しないと判断してはならない。作業前に次を読む。

1. `/Volumes/Yggdrasill/yggdrasill_workspace/COMM.md`
2. `/Volumes/Yggdrasill/yggdrasill_workspace/method.md`
3. IZAKAYA の商業・復帰判断を扱う場合: `/Volumes/Yggdrasill/yggdrasill_workspace/handoff/IZAKAYA Verse 1.6 復帰プラン 20260815.md`

`/Volumes/Yggdrasill/GitHub/IZAKAYA_verse1.6` はこのリポジトリへのシンボリックリンクであり、同じ規約を適用する。

## Required Development Doctrine

Before planning or implementing work in this repository, read:

1. `/Volumes/Yggdrasill/GitHub/IZAKAYA_verse1.5/AFTER_UI_DEVELOPMENT_MANIFEST.md`

This project follows the After UI / After UX approach: establish data structures, state transitions, APIs, functions, persistence, and agent responsibilities before creating UI. Natural-language and voice instructions describe WHAT; agents translate them into verifiable execution. GUI is normally a minimal context/record surface first, and a detachable public skin only when needed.

The After UI doctrine decides development order. `DESIGN.md` and `editor-ux` decide the quality and safety requirements after a UI has been judged necessary. Payment, publication, deployment, deletion, permission changes, and other costly or irreversible actions still require visible scope/impact confirmation.

## Required Region Asset Boundary

Before adding, regenerating, bundling, or publishing region images or V2 cards, read section **5-C. リージョン容量配分** in:

`/Volumes/Yggdrasill/GitHub/IZAKAYA_verse1.5/codex-handoffs/IZAKAYA_VERSE_2_0_RELEASE_GATE_20260821.md`

This is a distribution rule, not a creative restriction.

- World context, region text, and branching ideas may expand. Keep each public context manifest within the stated packaging budget and send only selected context to external AI.
- Do not add base64/data-URI images, source images, or chat logs to new public V2 JSON. Split the V2 text body, thumbnail, and optional original download.
- Lists and first views use lightweight thumbnails. Large key visuals load only after the user enters or selects the relevant region.
- Existing owner-approved assets are grandfathered: do not delete, recompress, replace, or redesign them merely to meet a new budget.
- New region bundles and new card additions must report their measured asset sizes before public deployment. A budget exception requires the owner's visible approval.

## Required Context For UI Work

Before editing any IZAKAYA / Narrative Forge / Preview Server / Region Catalog / MetaCapture UI, read:

1. `/Volumes/Yggdrasill/GitHub/IZAKAYA_verse1.5/AFTER_UI_DEVELOPMENT_MANIFEST.md`
2. `/Volumes/Yggdrasill/GitHub/IZAKAYA_verse1.5/DESIGN.md`
3. `/Users/nohonx/.codex/skills/editor-ux/SKILL.md`
4. `/Volumes/Yggdrasill/GitHub/IZAKAYA_verse1.5/codex-handoffs/REGION_EDITOR_UX_REQUIREMENTS.md` when touching the Region Catalog or Preview Server editor.

The current UI baseline is MetaCapture 2/3 from:

- `/Volumes/Yggdrasill/yggdrasill_workspace/apps/metacapture-2.0-izakaya`
- `/Volumes/Yggdrasill/yggdrasill_workspace/apps/metacapture3`
- `/Volumes/Yggdrasill/yggdrasill_workspace/apps/IZ_Backyard/src/components/MC3Workspace.tsx`

Do not call a UI task complete because buttons exist. Completion requires browser-verified operation: click path, drag/drop path, visible result, save evidence, reload persistence, and screenshot or concrete test report.

## Do Not

- Do not create isolated handoff files that are not referenced from the repo or workspace map.
- Do not make one-off controls for only one region/card/container when the feature is common.
- Do not leave sample/mock data stuck in production editing slots.
- Do not silently swallow DnD, save, publish, or provider errors.
- Do not report completion from source review alone.
