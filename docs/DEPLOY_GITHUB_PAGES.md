# GitHub Pages 配信メモ（Vite / IZAKAYA ルール）

## A. 目的
- BFF / API なしで静的プレビューを GitHub Pages 上に出す

## B. Pages 設定（GitHub 側）
- Settings → Pages
- Source: Deploy from a branch
- Branch: `main`
- Folder: `/docs`
- 公開 URL: https://motookoyama.github.io/IZAKAYA_verse1.5/

## C. 典型症状と原因
- **404**: `docs/index.html` が存在しない / build していない
- **真っ白**: JS/CSS が 404 → Vite の `base` が GitHub Pages のサブパスとズレている  
  - Pages 配信は `/<repo>/`  
  - `base: '/'` のままだと JS/CSS がルートを探しに行って失敗する

## D. 恒久ルール
- GitHub Pages (https://<user>.github.io/<repo>/) へ出す Vite プロジェクトは必ず  
  `vite.config.ts` に `base: '/<repo>/'`
- `base: './'` は原則禁止（Router と干渉して無言白画面の原因になる）
- リポジトリ名を変更したら `base` も同時に更新する

## E. 正規手順
1. `npm ci`
2. `npm run build`（`dist/` 生成）
3. `rm -rf docs && mv dist docs`（`docs/index.html` を必ず作る）
4. `git add docs vite.config.*`
5. `git commit -m "build: publish static site to docs for GitHub Pages"`
6. `git push origin main`
7. ブラウザで `⌘+Shift+R`（or Ctrl+Shift+R）で強制リロード確認

## F. トラブルシュート（最短）
- 404 → `docs/index.html` の有無を確認する
- 白画面 → `docs/index.html` 内の `<script src>` / `<link href>` が `/<repo>/assets/...` になっているか確認
- Pages の “Last deployed” が push 後になっているか確認（反映遅延の切り分け）
