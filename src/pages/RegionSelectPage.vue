<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { SHOWCASE_REGIONS } from '../data/regions_v3'
import { navigateTo } from '../constants/navigation'
import { gateImage, type ImageGateResult } from '../composables/useImageQualityGate'
import { commercialGateNotice, releaseBadge, releaseProfile } from '../core/releaseProfile'

const navigateToRegion = (id: string) => {
  navigateTo(`region/${id}`)
}

const gateState = reactive<Record<string, ImageGateResult>>({})
const displayRegions = computed(() => [...SHOWCASE_REGIONS].sort((left, right) => {
  const isSupportRegion = (region: typeof left) => /help|ヘルプ/i.test(`${region.name} ${region.label_jp}`)
  return Number(isSupportRegion(left)) - Number(isSupportRegion(right))
}))

const toImageSrc = (raw: string) => {
  if (!raw) return ''
  // `/workspace/` paths belong to the backstage BFF and are never valid on
  // GitHub Pages. Public catalog media must arrive through region_public_media.
  return raw.startsWith('/workspace/') ? '' : raw
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
      <p class="badge">{{ releaseBadge() }}</p>
      <h1>REGION CATALOG</h1>
      <p class="subtitle">2.0へ継承するリージョン候補を確認し、遊び方とV2制作ガイドへ進みます。</p>
    </header>

    <section class="hero-card">
      <div class="hero-copy">
        <h2>2.0リージョン継承カタログ</h2>
        <p>1.6までの制作資産を継承し、2.0の検品・案内・体験設計へ接続します。</p>
      </div>
    </section>

    <section class="region-grid" aria-label="リージョンを選ぶ">
      <button
        v-for="region in displayRegions"
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
          <div v-else class="media-placeholder" aria-hidden="true"></div>
          <span class="level-tag">LV.{{ region.level }}</span>
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

    <section class="value-strip">
      <article class="value-panel value-panel--lead">
        <p class="panel-kicker">REGION EXPERIENCE</p>
        <h2>リージョンは、持ち出せるアドベンチャー空間です。</h2>
        <p>
          キャラクター、物語、更新ルール、V2カード、遊び方をひとまとめにして公開します。
          URLを受け取ったユーザーは、それぞれのAIプラットフォームへ同じ世界を持ち込めます。
        </p>
      </article>
      <article class="value-panel">
        <p class="panel-kicker">STATIC GUIDE</p>
        <h3>静的な案内は誰でも読める</h3>
        <p>
          リージョン紹介、V2カード規格、持ち出し方は静的ガイドとして確認できます。
          推論・画像生成の費用はユーザー自身のAI環境で管理します。
        </p>
      </article>
      <article class="value-panel">
        <p class="panel-kicker">ACCESS PASSES</p>
        <h3>利用権はAccessGATEで扱う</h3>
        <p>
          {{ releaseProfile.accessModel.firstPass }}。{{ releaseProfile.accessModel.monthlyPass }}。
          初回の24時間フリーパスと100P購入は、AccessGATEから利用できます。
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
          <h3>ガイドとカードを受け取る</h3>
          <p>公式V2カード、最小テンプレート、導入情報を確認する。</p>
        </div>
      </div>
      <div class="flow-card">
        <span class="flow-step">3</span>
        <div>
          <h3>好きなAI環境で始める</h3>
          <p>カード、プロンプト、画像を持ち込み、ユーザー側のAI環境で物語を動かす。</p>
        </div>
      </div>
    </section>

    <p class="commercial-note">{{ commercialGateNotice() }}</p>
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

.commercial-note {
  margin: 0;
  color: rgba(255, 202, 202, 0.62);
  font-size: 11px;
  text-align: right;
}

@media (max-width: 860px) {
  .value-strip,
  .entry-flow,
  .region-grid {
    grid-template-columns: 1fr;
  }
}
</style>
