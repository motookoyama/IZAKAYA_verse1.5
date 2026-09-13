# 第二波4作品 — 配備準備証跡

- 対象ブランチ: `codex/second-wave-release`
- 対象: 精霊家電、ディア・カルマ、AIコロシアム、クロニクル・ソウルの静的な入口・開始テキスト・ノベル
- 非対象: AccessGATE、PayPal、ポイント、V2公式登録、外部AI呼出・APIキー・利用者ログ

## 配布物

- `public/adventures/` の16ファイル
- 合計: `118,836 bytes`
- 台帳: `tools/release/second-wave/inventory.json`
- Pages / Firebase のdry build出力で、16ファイル全てについてバイト数とSHA-256が台帳と一致した。
- `HOLD`、内部シーンID、制作原稿参照は公開物・配備出力から検出されなかった。

## 検証

| 確認 | 結果 |
| --- | --- |
| `npm run test:region-protocol-gate` | PASS: 12 tests |
| `npm run build:pages:dry` | PASS |
| `npm run build:firebase:dry` | PASS |
| 内部素材プリフライト | PASS: 5/5。`sharp` は一時検証環境でのみ利用し、実装元・公開候補の依存定義を変更していない |
| ブラウザ | リージョン一覧→4作品入口→精霊家電、遊び方→4作品入口、AIコロシアム直URL→再読込→リージョン一覧の戻りを確認 |
| 390px | 精霊家電、AIコロシアムで横溢れなし。ブラウザconsole error 0 |
| 開始テキスト | 4作品ともMarkdown本文を返却し、`download` リンクと戻り先を確認 |

Viteは既存V2プレビューSVGについて解決時警告を出す。これは今回追加した4作品ファイルではない。ライブラリは実ブラウザで14件の画像カードを表示し、console error 0を確認した。

## 公開前の残る境界

この証跡は候補commitとオーナー確認のためのもの。GitHubへのpush、GitHub Pages更新、Firebase deploy、SNS投稿、外部AI試遊、課金変更は実行していない。
