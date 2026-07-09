# Region Visual Distill v0.1

作成日: 2026-06-02  
所属: IZAKAYA Art Style 下位工程  
実装ノード: `/Volumes/Yggdrasill/GitHub/IZAKAYA_verse1.5/tools/narrative-forge/nodes/region-visual-distill-node/visual-distill.mjs`

## 0. 目的

Region Visual Distill は、リージョンの世界情報を画像生成に渡せる視覚情報へ蒸留する工程である。

この工程は、単なる Image Generation ではなく Image Direction である。

ここでいう Image Direction とは、画像モデルを呼ぶ前に「何を描くか」「どの用途の画像か」「どの画角で見せるか」「どこを人間の意図として守るか」を決める工程を指す。
画質や解像度を上げるための工程ではなく、人間の内的イメージと生成結果のズレを減らすための制作指示工程である。

対象は V2カードだけではない。

- V2カード
- ページヒーロー画像
- タイトルワイド画像
- スライドショー
- SNS画像
- 番組用画像
- ゲーム素材の初期視覚設計

に共通して使う。

## 1. なぜ必要か

リージョンには、世界観、キャラクター、関係性、歴史、用語、文化、会話が混ざっている。

しかし画像生成モデルが必要とするのは、次である。

1. 誰を描くのか
2. どんな姿か
3. 何をしているか
4. どんな場面か
5. どんな構図か
6. どんな色か
7. 何に使う画像か

この変換を省略すると、画像は美麗でも、人間の空想とズレる。

## 2. 人間の空想と画像生成がズレる理由

人間はリージョンを読む時、文字をそのまま絵にしていない。

同時に以下を圧縮している。

- 役割
- 感情
- 場所の空気
- 文化的連想
- 色の記憶
- キャラクター同士の距離
- 何に使う絵か

一方、画像生成モデルは、明示された視覚条件に強く依存する。

したがって、リージョン文を直接投げると、モデルは以下を勝手に補完しやすい。

- 髪色
- 服装
- ポーズ
- カメラ位置
- 背景密度
- 主題
- 画面用途

この補完が、人間の内的イメージとズレる主因である。

## 3. 基本フロー

```text
Region JSON / MD
  -> Region Visual Distill
  -> Visual Card
  -> 用途別 Prompt Handoff
  -> AURA2 Check Focus
  -> 画像生成 / Preview / Review
```

原則:

```text
Image Direction comes before Image Generation.
```

画像モデルに世界観を理解させるのではなく、世界観から絵に必要な情報を抽出して渡す。
モデルは最終描画エンジンであり、構図・用途・主題の決定者ではない。

## 4. Visual Card 出力

最低出力:

- `visual_card.json`
- `visual_direction.yaml`
- `visual_direction.json`
- `prompt_handoff.md`
- `aura2_check_focus.json`
- `distill_theory.md`

`visual_card.json` は、以下を含む。

- source region
- purpose
- visual anchor
- forbidden elements
- character cards
- scene cards
- unknown visual traits

`visual_direction.yaml` は、AIや人間が読みやすい制作指示レイヤーとして以下を含む。

- identity
- intent profiles
- subject
- scene
- composition
- palette
- symbols
- negative
- acceptance

## 5. 用途分離

同じリージョンからでも、用途によって画像は異なる。

### V2カード

- キャラクターの顔
- 体型
- 服装
- 性格の見え方
- 会話人格との同期

### ページヒーロー

- 入口の風景
- 世界の空気
- タイトルを置く余白
- 初見ユーザーへの読みやすさ

### タイトルワイド

- ロゴ性
- 象徴性
- 横長クロップ耐性
- SNSヘッダー耐性

### スライドショー

- 入口
- キャスト
- ルール/儀式
- 変化

を分ける。

## 6. AURA2 への渡し方

AURA2 は raw region lore ではなく、Visual Card との同期率を見る。

評価例:

- 用途が画像から分かるか
- visual anchor が画面内にあるか
- キャラクター、背景、タイトル画像が混線していないか
- palette が Visual Card と一致するか
- unknown traits を勝手に固定していないか

## 7. スモークテスト

画像生成なしで実行できる。

```bash
node tools/narrative-forge/nodes/region-visual-distill-node/visual-distill.mjs \
  --id region_000_metatuber_region \
  --id region_00_izakaya_help
```

期待出力:

```text
/Volumes/Yggdrasill/yggdrasill_workspace/outputs/region_visual_distill_smoke_20260602/
  manifest.json
  000_metatuber_region/
    visual_card.json
    visual_direction.yaml
    visual_direction.json
    prompt_handoff.md
    aura2_check_focus.json
    distill_theory.md
  00_izakaya_help/
    visual_card.json
    visual_direction.yaml
    visual_direction.json
    prompt_handoff.md
    aura2_check_focus.json
    distill_theory.md
```

Visual Direction Layer のスモーク出力:

```text
/Volumes/Yggdrasill/yggdrasill_workspace/outputs/region_visual_direction_smoke_20260603/
```

## 8. 判定

PASS:

- Visual Card が生成される
- Visual Direction YAML / JSON が生成される
- character / page hero / title wide / slideshow が分離される
- AURA2 の判定焦点が生成される
- 未確定の外見情報が unknown として残る

FAIL:

- raw region lore をそのまま prompt にする
- キャラクター画像とページ画像が同じ扱いになる
- 用途が不明
- 不明な外見情報を canon として固定する

## 9. 固定方針

Region Visual Distill は IZAKAYA Art Style の下位工程である。

すぐに画像生成へ進むためのノードではなく、生成前の視覚契約を作るノードである。
