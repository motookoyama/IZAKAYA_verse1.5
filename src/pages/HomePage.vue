<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import InfoGrid from '../components/InfoGrid.vue'
import FeatureGrid from '../components/FeatureGrid.vue'
import RegionCinema from '../components/RegionCinema.vue'
import { useRegion } from '../composables/useRegion'
import homeEmblem from '../assets/icons/home-emblem.png'
import chatIcon from '../assets/icons/chat-frame.png'
import regionGatewayIcon from '../assets/icons/region-gateway-v1.png'
import libraryIcon from '../assets/icons/library.png'
import helpIcon from '../assets/icons/help-qr.png'
import { resolvePathForNav, navigateTo } from '../constants/navigation'
import { TOP_SLIDES_TAKE1 } from '../data/top_slideshow_take1'
import type {
  HeroContent,
  GuideContent,
  AuthorContent,
  FeatureContent,
} from '../types/home'

const { tm } = useI18n({ useScope: 'global' })

const hero = computed<HeroContent>(() => {
  const value = tm('home.hero') as HeroContent
  return {
    ...value,
    navLinks: value.navLinks.map((link) => ({
      ...link,
      path: resolvePathForNav(link.id),
    })),
  }
})

const publicEntryLinks = computed(() => {
  const priority: Record<string, number> = { regions: 10, chat: 20, library: 30 }
  return hero.value.navLinks
    .filter((link) => link.id !== 'help' && link.id !== 'region_guide')
    .sort((left, right) => (priority[left.id] ?? 50) - (priority[right.id] ?? 50))
})

const supportLinks = computed(() => hero.value.navLinks.filter((link) => link.id === 'region_guide' || link.id === 'help'))

const navIcons: Record<string, string | undefined> = {
  chat: chatIcon,
  regions: regionGatewayIcon,
  library: libraryIcon,
  help: helpIcon,
}

const guide = computed<GuideContent>(() => {
  const value = tm('home.guide') as Record<string, unknown>
  return {
    title: value.title as string,
    steps: Array.isArray(value.steps) ? (value.steps as string[]) : [],
  }
})

const author = computed<AuthorContent>(() => tm('home.author') as AuthorContent)
const features = computed<FeatureContent[]>(() => {
  const value = tm('home.features') as FeatureContent[]
  return value.map((feature) => ({
    ...feature,
    linkPath: resolvePathForNav(feature.id),
  }))
})
const { activeRegion } = useRegion()

// A public Pages build must not invent a localhost BFF. Development-only
// region slides may opt in through VITE_BFF_URL.
const BFF_URL = import.meta.env.VITE_STATIC_PAGES === 'true'
  ? ''
  : (import.meta.env.VITE_BFF_URL || '')

/*
// Region-aware hero title
const heroTitle = computed(() => {
  if (activeRegion.value) {
    return activeRegion.value.label_jp || activeRegion.value.name
  }
  return hero.value.title
})
*/
/*
const heroSubtitle = computed(() => {
  if (activeRegion.value) {
    return activeRegion.value.description
  }
  return ''
})
*/

// Dynamically switch slides: AURA-generated region slides → default richSlides
const activeSlides = computed(() => {
  if (activeRegion.value?.slides && activeRegion.value.slides.length > 0) {
    const resolved = activeRegion.value.slides
      .map((slide) => ({
        image: slide.image.startsWith('http') ? slide.image : (BFF_URL ? `${BFF_URL}${slide.image}` : ''),
        title: slide.title,
        subtitle: slide.subtitle,
        align: (slide.align || 'left') as 'left' | 'right' | 'center' | 'top-left' | 'bottom-right',
      }))
      .filter((slide) => slide.image.length > 0)
    if (resolved.length > 0) return resolved
  }
  return richSlidesArray
})

const showAdvancedHub = ref(false)

function goTo(path?: string, fallbackId?: string) {
  const target = path ?? fallbackId ?? 'home'
  navigateTo(target)
}

const richSlidesArray = [
  ...TOP_SLIDES_TAKE1.map(({ image, title, subtitle, align }) => ({ image, title, subtitle, align })),
]

const isOverlayVisible = ref(true)

function toggleHeroOverlay() {
  isOverlayVisible.value = !isOverlayVisible.value
}

function toggleAdvancedHub() {
  showAdvancedHub.value = !showAdvancedHub.value
}
</script>

<template>
  <div class="home">
    <section class="hero-container">
      <RegionCinema 
        :region="activeRegion" 
        :slides="activeSlides" 
        :full-page="false"
        :is-paused="false"
      />
      <transition name="hero-fade">
        <div v-if="isOverlayVisible" class="hero-overlay-content">
          <div class="hero__visual">
            <p class="hero__phase">{{ hero.phase }}</p>
            <h1 class="hero__title">IZAKAYAバースへようこそ</h1>

          </div>
          <img 
            class="hero__icon clickable" 
            :src="homeEmblem" 
            alt="IZAKAYA verse emblem" 
            @click="toggleHeroOverlay"
          />
        </div>
      </transition>
      
      <!-- Mini instruction when hidden -->
      <transition name="hero-fade">
        <button 
          v-if="!isOverlayVisible" 
          class="hero__restore-btn"
          @click="toggleHeroOverlay"
        >
          {{ $t('home.hero.restore', 'UIを表示') }}
        </button>
      </transition>
    </section>


    <section class="nav-panels">
      <a
        v-for="link in publicEntryLinks"
        :key="link.id"
        class="nav-panels__item"
        :href="link.path || '#/'"
        @click.prevent="goTo(link.path, link.id)"
      >
        <img
          v-if="navIcons[link.id]"
          class="nav-panels__icon"
          :src="navIcons[link.id]"
          :alt="link.label"
        />
        <span class="nav-panels__label">{{ link.label }}</span>
      </a>
    </section>

    <section class="cta-strip">
      <div class="cta-strip__text">
        <h2>まずは世界を選ぶ</h2>
        <p>説明はあとからで大丈夫です。気になるリージョンを選び、V2カードやガイドを自分のAI環境へ持ち込んで始めてください。</p>
      </div>
      <a
        class="cta-strip__button"
        href="#/regions"
        @click.prevent="goTo('regions')"
      >
        リージョンを選ぶ
      </a>
    </section>

    <section class="beginner-path">
      <article class="beginner-card beginner-card--lead">
        <p class="beginner-kicker">First Step</p>
        <h2>リージョンを選ぶ入口として使う</h2>
        <p>トップでは仕組みを説明しすぎず、世界、キャラクター、V2カード、持ち出しガイドの入口を見せます。</p>
      </article>
      <a class="beginner-card" href="#/regions" @click.prevent="goTo('regions')">
        <span>01</span>
        <h3>世界を選ぶ</h3>
        <p>海賊酒場、転生裁判、配信スタジオ、癒しの旅から入れます。</p>
      </a>
      <a class="beginner-card" href="#/region-guide" @click.prevent="goTo('region_guide')">
        <span>02</span>
        <h3>遊び方を見る</h3>
        <p>QR、V2カード、各プラットフォームでの遊び方をまとめています。</p>
      </a>
      <a class="beginner-card" href="#/region-guide" @click.prevent="goTo('region_guide')">
        <span>03</span>
        <h3>好きなAIで始める</h3>
        <p>カード、プロンプト、画像を持ち出して、普段使うAI環境で物語を始めます。</p>
      </a>
    </section>

    <nav class="support-links" aria-label="補助案内">
      <a
        v-for="link in supportLinks"
        :key="link.id"
        :href="link.path || '#/'"
        @click.prevent="goTo(link.path, link.id)"
      >
        {{ link.label }}
      </a>
    </nav>

    <section class="advanced-entry">
      <div class="advanced-entry__copy">
        <p>More</p>
        <h2>詳しい機能と配布予定</h2>
        <span>ライブラリー、利用ポリシー、24Hフリーパス、ポイント利用を確認できます。</span>
      </div>
      <button type="button" class="advanced-entry__button" @click="toggleAdvancedHub">
        {{ showAdvancedHub ? '閉じる' : '詳しく見る' }}
      </button>
    </section>

    <transition name="advanced-panel">
      <div v-if="showAdvancedHub" class="advanced-hub">
        <section id="payments" class="prelaunch-sales-notice" aria-label="ポイント販売とアカウント利用">
          <p class="prelaunch-sales-notice__eyebrow">IZAKAYA2.0 ACCESSGATE</p>
          <h2>24Hフリーパスとポイント</h2>
          <p>最初の24時間を試した後、必要に応じて100Pを購入できます。AIの推論・画像生成費用は利用者自身のAI環境で管理します。</p>
          <a href="#/access">AccessGATEを開く</a>
        </section>

        <section class="features">
          <FeatureGrid :title="$t('ui.featuresTitle')" :items="features" />
        </section>

        <section class="info">
          <InfoGrid :guide="guide" :author="author" />
        </section>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.home {
  position: relative;
  z-index: 10;
  display: grid;
  gap: 32px; /* Tightened from 48px */
}

.hero-container {
  position: relative;
  width: 100%;
  height: 60vh; /* Controlled height for the "Cinematic Window" */
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0 0 40px 40px; /* Optional: Rounded bottom for "window" feel */
}

.hero-overlay-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  z-index: 5;
  pointer-events: none;
  text-align: center;
  padding: clamp(18px, 3vh, 32px) 20px 20px;
}

.hero__icon {
  width: clamp(180px, 28vw, 340px);
  height: auto;
  filter: drop-shadow(0 20px 45px rgba(0, 0, 0, 0.6));
  margin-top: clamp(12px, 2vh, 22px);
  opacity: 0.92;
}

.hero__icon.clickable {
  cursor: pointer;
  pointer-events: auto;
}

.hero__restore-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 20;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.8rem;
  cursor: pointer;
}

.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

.hero__visual {
  display: grid;
  gap: 6px;
  max-width: min(880px, 92vw);
  text-shadow: 0 4px 18px rgba(0, 0, 0, 0.85);
}

.hero__phase {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.hero__title {
  margin: 0;
  font-size: clamp(2rem, 4.4vw, 3rem);
  font-weight: 800;
}

.hero__welcome {
  margin: 0;
  font-size: 1.05rem;
  opacity: 0.85;
}

.hero__copy {
  display: grid;
  gap: 12px;
  max-width: 720px;
}

.hero__slogan {
  margin: 0;
  font-size: clamp(1.3rem, 3.5vw, 1.8rem);
  font-weight: 600;
}

.hero__description {
  margin: 0;
  opacity: 0.85;
}

.home__connection {
  margin-top: -12px;
}

.nav-panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.nav-panels__item {
  padding: 20px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(12, 18, 32, 0.45);
  display: grid;
  place-items: center;
  gap: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.nav-panels__item:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
}

.nav-panels__icon {
  width: 48px;
  height: 48px;
}

.cta-strip {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;
  padding: 28px 32px;
  border-radius: 24px;
  background: linear-gradient(90deg, rgba(232, 123, 37, 0.85), rgba(88, 207, 245, 0.7));
  color: #0b111a;
}

.cta-strip__text {
  display: grid;
  gap: 8px;
}

.cta-strip__text h2 {
  margin: 0;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 700;
}

.cta-strip__text p {
  margin: 0;
  opacity: 0.75;
}

.cta-strip__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 32px;
  border-radius: 999px;
  background: #0b111a;
  color: #f5f7fb;
  font-weight: 700;
  letter-spacing: 0.04em;
  border: none;
}

.beginner-path {
  display: grid;
  grid-template-columns: 1.25fr repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.beginner-card {
  min-height: 172px;
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 18px;
  border-radius: 12px;
  border: 1px solid rgba(88, 207, 245, 0.2);
  background: rgba(9, 15, 26, 0.68);
  color: #fff;
  transition: transform 160ms ease, border-color 160ms ease;
}

a.beginner-card:hover {
  border-color: rgba(88, 207, 245, 0.5);
  transform: translateY(-2px);
}

.beginner-card--lead {
  background:
    radial-gradient(circle at 86% 12%, rgba(88, 207, 245, 0.22), transparent 34%),
    rgba(9, 15, 26, 0.8);
}

.beginner-kicker,
.beginner-card span {
  margin: 0;
  color: #58cff5;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.beginner-card h2,
.beginner-card h3 {
  margin: 0;
  font-size: 1.15rem;
}

.beginner-card--lead h2 {
  font-size: clamp(1.45rem, 3vw, 2rem);
}

.beginner-card p {
  margin: 0;
  color: rgba(244, 247, 251, 0.72);
  line-height: 1.65;
  font-size: 0.95rem;
}

.account-hub {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.advanced-entry {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: center;
  padding: 20px 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(9, 15, 26, 0.56);
}

.support-links {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: -12px;
}

.support-links a {
  color: rgba(244, 247, 251, 0.58);
  font-size: 0.78rem;
  text-decoration: none;
  border-bottom: 1px solid rgba(244, 247, 251, 0.24);
}

.support-links a:hover {
  color: #fff;
  border-color: rgba(88, 207, 245, 0.68);
}

.advanced-entry__copy {
  display: grid;
  gap: 4px;
}

.advanced-entry__copy p,
.advanced-entry__copy h2,
.advanced-entry__copy span {
  margin: 0;
}

.advanced-entry__copy p {
  color: #58cff5;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.advanced-entry__copy h2 {
  font-size: 1.25rem;
}

.advanced-entry__copy span {
  color: rgba(244, 247, 251, 0.68);
  line-height: 1.6;
}

.advanced-entry__button {
  min-width: 120px;
  padding: 12px 18px;
  border: 1px solid rgba(88, 207, 245, 0.42);
  border-radius: 999px;
  background: rgba(88, 207, 245, 0.12);
  color: #f5f7fb;
  font-weight: 800;
  cursor: pointer;
}

.advanced-hub {
  display: grid;
  gap: 32px;
}

.prelaunch-sales-notice {
  display: grid;
  gap: 10px;
  padding: clamp(22px, 4vw, 32px);
  border: 1px solid rgba(255, 207, 102, 0.36);
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(87, 61, 18, 0.34), rgba(18, 30, 51, 0.58));
}

.prelaunch-sales-notice__eyebrow {
  margin: 0;
  color: #ffd866;
  font-size: .74rem;
  font-weight: 800;
  letter-spacing: .13em;
}

.prelaunch-sales-notice h2,
.prelaunch-sales-notice p:not(.prelaunch-sales-notice__eyebrow) {
  margin: 0;
}

.prelaunch-sales-notice p:not(.prelaunch-sales-notice__eyebrow) {
  max-width: 720px;
  color: rgba(244, 247, 251, .78);
  line-height: 1.65;
}

.advanced-panel-enter-active,
.advanced-panel-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.advanced-panel-enter-from,
.advanced-panel-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.features {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(12, 18, 32, 0.45);
  padding: 32px;
}

.info {
  display: grid;
  gap: 32px;
}

@media (max-width: 1024px) {
  .cta-strip {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .cta-strip__button {
    justify-self: center;
  }

  .advanced-entry {
    grid-template-columns: 1fr;
  }

  .advanced-entry__button {
    justify-self: start;
  }

  .account-hub {
    grid-template-columns: 1fr;
  }

  .beginner-path {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .nav-panels {
    grid-template-columns: 1fr;
  }

  .beginner-path {
    grid-template-columns: 1fr;
  }

  .features {
    padding: 20px;
  }
}
</style>
