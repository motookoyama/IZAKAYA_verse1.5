# V2カード紐付け — 公式台帳

> 更新日: 2026-05-14

## 方針

登録された実在V2カード8枚を公式とする。

旧名参照、未作成カード、`null` のキャラクター枠は制作過程の残骸として公式台帳から除外する。

## 公式V2カード

保存先:

`/Volumes/Yggdrasill/GitHub/IZAKAYA_verse1.5/src/data/v2cards/`

| # | キャラクター / 対象 | V2カードJSON | 状態 |
|---|---|---|---|
| 1 | エグゼ・マキナ | `エグゼ・マキナ.json` | 公式 |
| 2 | ココロエ・ヨウマ | `ココロエ・ヨウマ.json` | 公式 |
| 3 | ダガミ・テンカイ | `ダガミ・テンカイ.json` | 公式 |
| 4 | ハワタリ・ザン | `ハワタリ・ザン.json` | 公式 |
| 5 | ハワワ | `ハワワ.json` | 公式 |
| 6 | ミヤコ・スイム | `ミヤコ・スイム.json` | 公式 |
| 7 | ヨリドコロ・ユイカ | `ヨリドコロ・ユイカ.json` | 公式 |
| 8 | 株式会社オシマシ | `株式会社オシマシ.json` | 公式 |

## Catalog / Preview Server 台帳

マニフェスト:

`/Volumes/Yggdrasill/GitHub/IZAKAYA_verse1.5/tools/narrative-forge/regions/v2cards/v2card_manifest.json`

現在は `region_000_metatuber_region` に公式8枚を登録する。

## 除外した旧参照

以下は現行の公式V2カード保存先に実在しないため、公式台帳から除外した。

- `エグゼ-マキナ.json`
- `断鎖の銀閃-ザン-(zan-no-ha).json`
- `泡沫の奏者「ハワワ-リュミエール」.json`
- `mammon-manager.json`
- `miss-madi.json`
- 未作成カードを示す `null` 枠

## 追加時の正規手順

1. V2カードJSONを `/Volumes/Yggdrasill/GitHub/IZAKAYA_verse1.5/src/data/v2cards/` に置く。
2. Catalog UIのJSON取込、または `POST /api/v2card-upload` で登録する。
3. `v2card_manifest.json` に表示対象として登録されることを確認する。
4. Preview ServerでSVGサムネイル、JSON表示、V2カード会話を確認する。

## Mapper Note

- 【更新箇所】: V2カード公式台帳
- 【変更内容】: 実在8枚を公式とし、旧参照・未作成枠を除外。
- 【申し送り】: 後続AIは旧制作メモではなく、本台帳と `src/data/v2cards/` の実在ファイルを正とすること。
- 【署名】: Codex / 2026-05-14T08:00+09:00 / V2カード台帳整理
