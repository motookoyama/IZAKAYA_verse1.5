# V2 Card Bulk Registration

`src/data/v2cards/` に JSON を配置すると、`import.meta.glob` 経由で自動的にライブラリへ登録されます。

- JSON ファイル名（例: `dr-orb.json`）がカード ID になります。
- サムネイル画像は `src/assets/v2cards/` に同じファイル名で配置してください（`dr-orb.png` など）。
- 追加のメタ情報（価格や著者など）は `src/pages/LibraryPage.vue` の `libraryMeta` レコードで上書きできます。

ZIP を解凍してこのフォルダへ置くだけで一括登録できるため、プロモーション用カードの導入時に利用してください。
