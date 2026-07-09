<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { SHOWCASE_REGIONS } from '../data/regions_v3'
import { navigateTo } from '../constants/navigation'
import { gateImage, type ImageGateResult } from '../composables/useImageQualityGate'

const navigateToRegion = (id: string) => {
  navigateTo(`region/${id}`)
}

const gateState = reactive<Record<string, ImageGateResult>>({})

const toImageSrc = (raw: string) => {
  if (!raw) return ''
  return raw.startsWith('/workspace/') ? `http://localhost:4117${raw}` : raw
}

const getState = (id: string): ImageGateResult => gateState[id] ?? { status: 'pending', reason: 'pending', score: 0 }

onMounted(async () => {
  const checks = SHOWCASE_REGIONS.map(async (region) => {
    const imageSrc = toImageSrc(region.thumbnail)
    gateState[region.id] = await gateImage(imageSrc)
  })
  await Promise.all(checks)
})
</script>

<template>
  <div class="region-select-page">
    <header class="page-header">
      <p class="badge">IZAKAYA VER.1.6</p>
      <h1>REGION CATALOG</h1>
      <p class="subtitle">公開リージョンを選択して詳細ページへ移動</p>
      <p class="refresh-marker">CODEX refresh marker: 2026-03-17 20:38 JST</p>
    </header>

    <section class="hero-card">
      <div class="hero-copy">
        <h2>リージョントップページ</h2>
        <p>カタログ形式で公開対象を一覧化。クリックで各リージョンへ遷移。</p>
      </div>
    </section>

    <section class="value-strip">
      <article class="value-panel value-panel--lead">
        <p class="panel-kicker">REGION EXPERIENCE</p>
        <h2>リージョンは、入場条件つきのアドベンチャー空間です。</h2>
        <p>
          キャラクター、物語、更新ルール、課金条件をひとまとめにして公開します。
          URLを受け取ったユーザーは、それぞれのプラットフォームから同じ世界へ入場できます。
        </p>
      </article>
      <article class="value-panel">
        <p class="panel-kicker">FREE ACCESS</p>
        <h3>無料では空気と入口を見せる</h3>
        <p>
          リージョンの雰囲気、登場人物の気配、世界観の入口までは無料で読めます。
          まずは空気を知り、入る価値があるかを判断できます。
        </p>
      </article>
      <article class="value-panel">
        <p class="panel-kicker">PAID ADVANCE</p>
        <h3>有料で物語と更新が進む</h3>
        <p>
          重い対話、世界更新、特別イベント、深い進行はポイント接続です。
          体験の燃料を利用者側が負担することで、世界が先へ進みます。
        </p>
      </article>
    </section>

    <section class="entry-flow">
      <div class="flow-card">
        <span class="flow-step">1</span>
        <div>
          <h3>リージョンを選ぶ</h3>
          <p>まずは入口として、世界のテーマと空気を読む。</p>
        </div>
      </div>
      <div class="flow-card">
        <span class="flow-step">2</span>
        <div>
          <h3>URLで入場する</h3>
          <p>公開URLや案内リンクから、各リージョンの体験空間へ移動する。</p>
        </div>
      </div>
      <div class="flow-card">
        <span class="flow-step">3</span>
        <div>
          <h3>必要なら物語を進める</h3>
          <p>更新や深い対話は有料で進み、変化は世界側に反映される。</p>
        </div>
      </div>
    </section>

    <section class="review-strip">
      <div class="review-strip__header">
        <p class="panel-kicker">REVIEW ONLY</p>
        <h2>画像確認ステータス</h2>
        <p>新規の検証済みリージョン背景はまだありません。古い候補はここに混ぜません。</p>
      </div>
      <div class="review-empty">
        <strong>Night Shift region image review</strong>
        <p>verified new outputs: 0</p>
        <p>status: rerun state mismatch detected (`completed` / `OK_SLOT_ALREADY_DONE`)</p>
        <p>next action: 新規出力を別フォルダへ確定保存してからここへ表示</p>
      </div>
    </section>

    <section class="region-grid">
      <button
        v-for="region in SHOWCASE_REGIONS"
        :key="region.id"
        class="region-card"
        type="button"
        @click="navigateToRegion(region.id)"
      >
        <div class="region-media">
          <img
            v-if="getState(region.id).status === 'approved'"
            :src="toImageSrc(region.thumbnail)"
            :alt="region.name"
            loading="lazy"
          />
          <div v-else class="media-placeholder">
            <p>{{ getState(region.id).status === 'pending' ? '画像判定中' : '隔離中（要差し替え候補）' }}</p>
          </div>
          <span class="level-tag">LV.{{ region.level }}</span>
          <span class="gate-tag" :class="`gate-tag--${getState(region.id).status}`">
            {{ getState(region.id).status }}
          </span>
        </div>
        <div class="region-body">
          <h3>{{ region.label_jp }}</h3>
          <p class="name">{{ region.name }}</p>
          <p class="desc">{{ region.description }}</p>
          <div class="chip-row">
            <span v-for="law in region.laws.slice(0, 3)" :key="law" class="chip">{{ law }}</span>
          </div>
        </div>
      </button>
    </section>
  </div>
</template>

<style scoped>
.region-select-page {
  display: grid;
  gap: 22px;
  padding: 8px 0 28px;
}

.page-header {
  border: 1px solid rgba(255, 46, 46, 0.35);
  border-radius: 18px;
  padding: 22px;
  background: linear-gradient(160deg, rgba(20, 8, 8, 0.92), rgba(8, 8, 8, 0.92));
}

.badge {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.18em;
  color: #ff8c8c;
}

.page-header h1 {
  margin: 8px 0 6px;
  font-size: clamp(28px, 4vw, 44px);
  letter-spacing: 0.02em;
  color: #fff;
}

.subtitle {
  margin: 0;
  color: #bdbdbd;
}

.refresh-marker {
  margin: 10px 0 0;
  color: #ffb1b1;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.hero-card {
  border: 1px solid rgba(255, 46, 46, 0.28);
  border-radius: 18px;
  padding: 18px;
  background:
    radial-gradient(circle at 85% 10%, rgba(255, 44, 44, 0.25), transparent 42%),
    linear-gradient(180deg, rgba(26, 10, 10, 0.95), rgba(8, 8, 8, 0.95));
}

.hero-copy h2 {
  margin: 0 0 8px;
  color: #ffd9d9;
}

.hero-copy p {
  margin: 0;
  color: #b3b3b3;
}

.value-strip {
  display: grid;
  grid-template-columns: 1.25fr 1fr 1fr;
  gap: 14px;
}

.value-panel {
  border: 1px solid rgba(255, 46, 46, 0.22);
  border-radius: 18px;
  padding: 18px;
  background:
    linear-gradient(180deg, rgba(20, 10, 10, 0.92), rgba(8, 8, 8, 0.95));
}

.value-panel--lead {
  background:
    radial-gradient(circle at 86% 14%, rgba(255, 92, 92, 0.22), transparent 34%),
    linear-gradient(180deg, rgba(32, 11, 11, 0.95), rgba(9, 9, 9, 0.98));
}

.panel-kicker {
  margin: 0 0 8px;
  font-size: 11px;
  letter-spacing: 0.14em;
  color: #ff8a8a;
}

.value-panel h2,
.value-panel h3 {
  margin: 0 0 10px;
  color: #fff4f4;
}

.value-panel h2 {
  font-size: clamp(22px, 2.8vw, 32px);
  line-height: 1.2;
}

.value-panel h3 {
  font-size: 18px;
}

.value-panel p {
  margin: 0;
  color: #c5bdbd;
  line-height: 1.6;
}

.entry-flow {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.review-strip {
  display: grid;
  gap: 14px;
  border: 1px solid rgba(255, 46, 46, 0.22);
  border-radius: 18px;
  padding: 18px;
  background: linear-gradient(180deg, rgba(20, 10, 10, 0.92), rgba(8, 8, 8, 0.95));
}

.review-strip__header h2 {
  margin: 0 0 8px;
  color: #fff4f4;
}

.review-strip__header p:last-child {
  margin: 0;
  color: #c5bdbd;
}

.review-empty {
  border-radius: 14px;
  border: 1px dashed rgba(255, 122, 122, 0.38);
  padding: 14px 16px;
  background: rgba(22, 9, 9, 0.92);
  color: #ffd7d7;
}

.review-empty strong {
  display: block;
  margin-bottom: 8px;
}

.review-empty p {
  margin: 6px 0 0;
  color: #cdbdbd;
}

.flow-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border: 1px solid rgba(255, 46, 46, 0.18);
  border-radius: 16px;
  padding: 16px;
  background: linear-gradient(180deg, rgba(18, 12, 12, 0.94), rgba(7, 7, 7, 0.98));
}

.flow-step {
  width: 28px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: #ff5757;
  color: #150808;
  font-weight: 800;
  font-size: 13px;
  flex: none;
}

.flow-card h3 {
  margin: 0 0 6px;
  color: #ffe0e0;
  font-size: 16px;
}

.flow-card p {
  margin: 0;
  color: #bbb1b1;
  line-height: 1.5;
  font-size: 13px;
}

.region-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.region-card {
  text-align: left;
  border: 1px solid rgba(255, 46, 46, 0.22);
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(180deg, #121212, #0a0a0a);
  color: inherit;
  cursor: pointer;
  transition: transform 0.22s ease, border-color 0.22s ease;
}

.region-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 62, 62, 0.55);
}

.region-media {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #1a1a1a;
}

.region-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.media-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background:
    repeating-linear-gradient(
      135deg,
      rgba(255, 68, 68, 0.22),
      rgba(255, 68, 68, 0.22) 16px,
      rgba(50, 12, 12, 0.75) 16px,
      rgba(50, 12, 12, 0.75) 32px
    );
}

.media-placeholder p {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #ffd0d0;
}

.level-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 11px;
  letter-spacing: 0.08em;
  font-weight: 800;
  color: #0d0d0d;
  background: #ff4f4f;
  padding: 5px 8px;
  border-radius: 999px;
}

.gate-tag {
  position: absolute;
  left: 10px;
  top: 10px;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  border-radius: 999px;
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.24);
}

.gate-tag--approved {
  background: rgba(13, 55, 26, 0.82);
  color: #b8ffcf;
}

.gate-tag--pending {
  background: rgba(52, 52, 16, 0.84);
  color: #fff3af;
}

.gate-tag--quarantined {
  background: rgba(65, 14, 14, 0.9);
  color: #ffd2d2;
}

.region-body {
  padding: 14px 14px 16px;
}

.region-body h3 {
  margin: 0;
  font-size: 20px;
  color: #ffffff;
}

.name {
  margin: 3px 0 8px;
  font-size: 12px;
  letter-spacing: 0.06em;
  color: #ffaaaa;
  text-transform: uppercase;
}

.desc {
  margin: 0 0 10px;
  color: #b8b8b8;
  line-height: 1.5;
  font-size: 13px;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  border: 1px solid rgba(255, 77, 77, 0.3);
  color: #ffc9c9;
  font-size: 11px;
  padding: 3px 7px;
  border-radius: 999px;
}

@media (max-width: 860px) {
  .value-strip,
  .entry-flow,
  .region-grid {
    grid-template-columns: 1fr;
  }
}
</style>
