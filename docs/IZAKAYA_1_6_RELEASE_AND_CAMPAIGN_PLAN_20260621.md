# IZAKAYA 1.6 Release and Campaign Plan

Updated: 2026-06-21

## 0. Purpose

This plan fixes the public release rhythm for `IZAKAYA 1.6` and separates three jobs that must not be confused:

1. publish the 1.6 web surface
2. announce the release and monthly campaign
3. operate recurring X posts through OpenClaw / Hermes / Horus-style agents

The owner is entering a moving-paperwork and packing period from 2026-06-22. Therefore, this plan favors a conservative release window with no large new features.

## 1. Release Date

Recommended release calendar:

- 2026-06-21: plan lock and operations check
- 2026-06-22: owner handles moving paperwork; AI side only drafts, smoke tests, and documents
- 2026-06-23 to 2026-06-25: packing period; no risky feature additions
- 2026-06-26: release candidate freeze
- 2026-06-27: owner final visual check
- 2026-06-28: `IZAKAYA 1.6` soft public release
- 2026-07-01: July campaign starts, with MetaTuber as the one-week free access region

Fallback:

- If the owner cannot review on 2026-06-27, move public release to 2026-07-01 and launch the MetaTuber campaign at the same time.

## 2. Homepage History and Campaign Area

The homepage should have a compact history / news area near the title or first viewport.

Purpose:

- show that the project is alive
- announce `IZAKAYA 1.6` as the latest milestone
- show the current one-week free access region
- point users to region pages and help without requiring them to understand the whole system first

Recommended entries:

1. `2026-06-28 | IZAKAYA 1.6 公開`
   First public release of the current region page format, V2 card download flow, and region guide links.
2. `2026-07-01 | メタチューバー 一週間無料アクセス開始`
   Free access applies only to the region access right. Card downloads, new character generation, additional production, and deep progress remain separate.
3. `2026-08 | 転生裁判 一週間無料アクセス予定`
4. `2026-09 | よいどれ 一週間無料アクセス予定`
5. `2026-10 | モビリティ 一週間無料アクセス予定`
6. `2026-11 | アンビエント 一週間無料アクセス予定`

Display rule:

- The latest item should be visually strongest.
- The current free campaign should use a tilted sale-sticker style badge such as `一週間無料!`.
- Do not overload the title area with development history. Keep deeper history on a separate guide or news page.

## 3. X Posting Operation Readiness

Current local findings on 2026-06-21:

- Past concept exists: `Horus 3` is described as the X auto-post engine.
- Existing operations spec exists: `management/X_POST_SEQUENCE_SPEC.md`.
- Hermes includes an `xurl` skill for the official X API CLI.
- X credential notes exist locally under the workspace secrets area.
- The `xurl` command was not initially available in the active Codex shell, but was installed locally on 2026-06-21.
- Retired OpenClaw session evidence shows that an older OC environment had `xurl` available in its command list.
- `XE_INTEGRATION_WINDOW_20260311.md` says approved Xe posts can be pulled by Horus 3, but direct Horus export was still listed as unconnected.
- No local evidence was found yet for a successful throwaway-account public post URL or persisted publish log.
- Therefore, the remaining question is not whether the concept exists, but whether the exact OC/Horus posting route can produce and record one harmless throwaway-account post.

Readiness verdict:

- Draft generation: ready
- Human approval workflow: ready as a document/spec
- Historical OC capability: partially proven, because an older OC runtime saw `xurl`
- Xe -> Horus handoff: partially proven at the approved-payload pull level
- Horus -> public X publish: not proven from current local evidence
- Local Codex shell route: installed, but separate from the owner's prior OC/Horus authentication check
- Fully automatic public posting: not approved for initial 1.6 launch

## 3.1 OC / Horus Throwaway Account Test Evaluation

The owner previously asked OC to test whether regular posting through Horus was possible using a throwaway account.

Current evaluation:

- The system design exists.
- The intended safety model exists.
- The `xurl` route is technically appropriate for current X API operation.
- An older OpenClaw environment appears to have had `xurl` available.
- The owner reports that authentication had already been confirmed on the OC/Horus side.
- The current Codex shell route is not the same thing as that OC/Horus route.
- The local docs confirm a bridge-ready pull endpoint for approved Xe posts.
- The local docs do not confirm that Horus direct export or scheduled public posting was completed.
- No successful throwaway-account post URL was found in the searched local reports, memories, docs, or OpenClaw workspace logs.

Verdict:

`OC + Horus regular X posting` should be treated as `authentication likely handled in the intended OC/Horus path, but public-post execution and logging are not yet proven from the available local evidence`.

Do not rely on it for the first 1.6 announcement until the exact intended OC/Horus route creates one harmless post on a throwaway account and records:

- command used
- account handle
- post URL
- timestamp
- delete/rollback result if needed
- log path

## 4. Required Credential Condition

Required:

- an X developer app with write permission
- local `xurl` installation
- local OAuth authentication for the intended account
- confirmation whether the posting account is `IZAKAYA verse`, `nohonX`, or both

Important:

- Agents must not print secrets.
- Agents must not ask the owner to paste secrets into chat.
- Agents must not perform first public posts without explicit owner approval.
- First launch phase should use `preview -> owner approval -> publish`.

## 5. Account Policy

Recommended account split:

- `IZAKAYA verse` account:
  - official release notices
  - free region campaign notices
  - region page links
  - service updates
- `nohonX` owner account:
  - creator-side commentary
  - personal development notes
  - repost or quote of official announcements

Do not make both accounts post the same text at the same time. Use the official account first, then the owner account as a quote or short comment.

## 6. Daily Posting Rhythm

Initial rhythm after release:

- one official or campaign post per day
- no more than one automatic public post per day until the workflow is proven
- character-flavored posts may be drafted, but should remain preview-only until campaign tone is approved

Suggested first week:

1. Release notice
2. What is a region?
3. MetaTuber free access notice
4. V2 card download explanation
5. How to start from IZ Help
6. Next free rotation schedule
7. Creator note from `nohonX`

## 7. Operations Assignment

OpenClaw:

- execution window and queue holder
- approval wait management
- report and log persistence

Hermes:

- low-cost recurring draft generation
- `xurl`-based posting once local auth is ready
- social media wording variants

Horus-style role:

- editorial judgment
- public timing
- campaign sequence
- stopping unsafe or unapproved posts

Codex:

- release docs
- local implementation
- smoke tests
- preview generation
- final go/no-go summaries

## 8. Go / No-Go Gate

`IZAKAYA 1.6` can be released when all are true:

1. `npm run build` passes.
2. region page smoke test passes for desktop and mobile.
3. homepage shows the current version and free campaign area.
4. IZ Help explains the play flow.
5. MetaTuber free access scope is clear.
6. X post draft exists, even if actual posting is not yet enabled.
7. owner has approved the release text or decided to publish without X automation.

X automation is not required to publish 1.6. It is required only for recurring campaign operation.

## 9. First Release Announcement Draft

Official account draft:

```text
IZAKAYA verse 1.6 を公開しました。

リージョン、V2カード、チャット導線をつなぎ、まずは遊べる入口として整えた公開版です。

7月は「メタチューバー」リージョンを一週間無料アクセス対象として開始します。
※無料対象はリージョンアクセス権のみです。
```

Owner account draft:

```text
IZAKAYA verse 1.6 を公開します。
まずはリージョンを「AIプラットフォームに依存しない世界・シナリオ・キャラクター・視覚設定の展開単位」として見せるところから始めます。
```

## 10. Next Actions

1. Add the homepage history / campaign area.
2. Keep the release scope fixed; no major new feature before 2026-06-28.
3. Install and authenticate `xurl` only after the owner confirms which account should be first.
4. Generate X preview drafts before public posting.
5. After the first successful manual post, hand recurring draft generation to OpenClaw or Hermes.
