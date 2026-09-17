# IZAKAYA Verse 第2波 公開登録レポート

- 実施日時: 2026-09-17 14:53 JST
- 公式公開日: 2026-09-18（告知日をもって公式公開扱い）
- 公開判定: GO
- 告知・SNS投稿: 未実施（2026-09-18に別工程）

## 公開先

- 公開トップ: https://motookoyama.github.io/IZAKAYA_verse1.5/
- 4作品入口: https://motookoyama.github.io/IZAKAYA_verse1.5/adventures/
- AccessGATE: https://motookoyama.github.io/IZAKAYA_verse1.5/index.html#/access
- AccessGATE API: https://izakaya2-accessgate-production-878376990978.asia-northeast1.run.app

## 価格と利用権

- 初回パス: 全基本リージョンを24時間無料、一アカウント一回
- Dear Karma（MMO1）: 20P / 30日
- Chronicle Soul（MMO2）: 20P / 30日
- Spirit Appliances: 10P / 30日
- Battle AI Colosseum: 10P / 30日
- 既存のその他リージョン: 10P / 30日
- ポイントパック: 100P / 1,000円（PayPal Live）

## 配備記録

- Web公開コミット: `e5cc61ec9798c555c326dd5e23ab7d54867cfc42`
- GitHub Pages run: `35187232546`（success）
- AccessGATEソースコミット: `aaf7374a9ff31665f4019977e6ad4f9cb54426e2`
- Cloud Run revision: `izakaya2-accessgate-production-00008-daz`（100% traffic）
- 直前revision: `izakaya2-accessgate-production-00007-nbc`（ロールバック候補）

## 確認結果

- GitHub Pages build/deploy: PASS
- 公開トップ、4作品入口、4作品詳細: HTTP 200
- 公開ブラウザでDear Karmaの20P表示と未契約ロック: PASS
- 公開AccessGATEで4作品と既存6リージョンの値札: PASS
- 本番 `/health`: PASS
- 本番 `/pricing`: MMO 20P、default 10P: PASS
- 本番スモーク用アカウントで24Hパス発行: PASS
- 同パスによる4作品の `/passes/verify`: 4/4 PASS
- フロントのリージョン利用権テスト: 13/13 PASS
- V2外部画像参照テスト: 1/1 PASS
- AccessGATEテスト: 15/15 PASS
- Pages/Firebase dry build: PASS

## 境界と留意事項

- 静的GitHub Pages上の通常導線は利用権確認でロックする。配布物URLを直接推測する行為まで防ぐ絶対的DRMではない。
- 4枚の公開用V2カードは配布カードであり、公式住民Catalog登録・共有史確定とは分離する。
- 既存の未関係編集、SNS告知、販売プッシュは今回の公開登録に含めていない。

## ロールバック

- AccessGATE: Cloud Run trafficを `izakaya2-accessgate-production-00007-nbc` に戻す。
- Web: 公開前 `f2cf2e03570e70c5d3fa1a51f67bdc40d22b1593` を基準に公開差分をrevertし、Pagesを再配備する。
