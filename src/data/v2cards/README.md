# V2 Card Bulk Registration

`src/data/v2cards/` に JSON を配置すると、`import.meta.glob` 経由で自動的にライブラリへ登録されます。

- JSON ファイル名（例: `dr-orb.json`）がカード ID になります。
- サムネイル画像は `src/assets/v2cards/` に同じファイル名で配置してください（`dr-orb.png` など）。
- 追加のメタ情報（価格や著者など）は `src/pages/LibraryPage.vue` の `libraryMeta` レコードで上書きできます。

ZIP を解凍してこのフォルダへ置くだけで一括登録できるため、プロモーション用カードの導入時に利用してください。

## 公開用カード画像の軽量標準

公式カードは、プロンプトやQRを含むカードJSONへBase64画像を埋め込まない。`imageUrl` は公開画像へのURLを使い、画像本体は `public/v2card-images/official/` に置く。

- 既定は JPEG・長辺 960px 以下・品質 70。
- 公式8枚の変換は `node tools/v2cards/extract-official-card-images.mjs --write`、確認は `npm run test:v2-card-external-images`。
- 変換は `izakaya_v2.card.imageUrl` 以外のカード内容を変更してはならない。元画像のハッシュと変換後の状態は `tools/v2cards/official-card-image-manifest.json` に残す。
