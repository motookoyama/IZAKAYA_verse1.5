# PNG2JSON

V2カードPNGに埋め込まれた iTXt JSON（例: `izakaya_v2`）を抽出し、ライブラリ登録用の `.json` に変換するミニツールです。

## 使い方

```bash
npm run png2json -- <input-file-or-dir> [output-dir]
```

- `<input-file-or-dir>`: 単一PNGまたはPNGをまとめたフォルダ
- `[output-dir]`: 省略時は `png2json-output/`

出力された `.json` を `src/data/v2cards/` にコピーし、対応するサムネイルを `src/assets/v2cards/` に置けばライブラリへ一括反映できます。
