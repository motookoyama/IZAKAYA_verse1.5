<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAccount } from '../composables/useAccount'
import AccountPanel from '../components/AccountPanel.vue'
import InfoGrid from '../components/InfoGrid.vue'
import FeatureGrid from '../components/FeatureGrid.vue'
import PaymentGrid from '../components/PaymentGrid.vue'
import RegionCinema from '../components/RegionCinema.vue'
import { useRegion } from '../composables/useRegion'
import homeEmblem from '../assets/icons/home-emblem.png'
import chatIcon from '../assets/icons/chat-frame.png'
import metaIcon from '../assets/icons/metacapture.png'
import libraryIcon from '../assets/icons/library.png'
import helpIcon from '../assets/icons/help-qr.png'
import paypal1000 from '../assets/payments/paypal-1000p.png'
import paypal5000 from '../assets/payments/paypal-5000p.png'
import paypal1000En from '../assets/payments/paypal-1000p-en.png'
import paypal5000En from '../assets/payments/paypal-5000p-en.png'
import paypalSupport from '../assets/payments/paypal-support.png'
import { resolvePathForNav, navigateTo } from '../constants/navigation'
import { TOP_SLIDES_TAKE1 } from '../data/top_slideshow_take1'
import type {
  HeroContent,
  GuideContent,
  AuthorContent,
  FeatureContent,
  AccountContent,
  AccountAction,
  PaymentOption,
  PaymentSupport,
  PaymentNote,
} from '../types/home'

const { t, tm } = useI18n({ useScope: 'global' })

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

const navIcons: Record<string, string | undefined> = {
  chat: chatIcon,
  metacapture: metaIcon,
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
const accountContent = computed<AccountContent>(() => tm('home.account') as AccountContent)
const accountActions = computed<AccountAction[]>(() => accountContent.value.actions?.items ?? [])
const features = computed<FeatureContent[]>(() => {
  const value = tm('home.features') as FeatureContent[]
  return value.map((feature) => ({
    ...feature,
    linkPath: resolvePathForNav(feature.id),
  }))
})
const paymentSection = computed(() => {
  const value = tm('home.payments') as Record<string, any>
  const buyLabel = (value.buyButton as string) ?? t('home.payments.buyButton', 'Pay with PayPal')
  const supportButton = (value.supportButton as string) ?? buyLabel
  const optionDefs: Array<{ key: string; image: string; localeTag?: string }> = [
    { key: 'jp1000', image: paypal1000, localeTag: 'JPY' },
    { key: 'jp5000', image: paypal5000, localeTag: 'JPY' },
    { key: 'usd1000', image: paypal1000En, localeTag: 'USD' },
    { key: 'usd5000', image: paypal5000En, localeTag: 'USD' },
  ]

  const optionsContent = (value.options ?? {}) as Record<string, any>
  const options: PaymentOption[] = optionDefs.reduce((acc, def) => {
    const entry = optionsContent[def.key]
    if (!entry?.paypalLink) return acc
    acc.push({
      id: def.key,
      title: entry.title ?? def.key,
      description: entry.description ?? '',
      price: entry.price ?? '',
      qrImage: def.image,
      paypalLink: entry.paypalLink as string,
      buttonLabel: entry.buttonLabel ?? buyLabel,
      caption: entry.caption,
      localeTag: entry.localeTag ?? def.localeTag,
    })
    return acc
  }, [] as PaymentOption[])

  let support: PaymentSupport | undefined
  if (value.support?.paypalLink) {
    support = {
      title: value.support.title ?? 'Support',
      description: value.support.description ?? '',
      price: value.support.price ?? '',
      qrImage: paypalSupport,
      paypalLink: value.support.paypalLink as string,
      buttonLabel: value.support.buttonLabel ?? supportButton,
    }
  }

  const notes = Array.isArray(value.notes)
    ? (value.notes as PaymentNote[])
    : []

  return {
    title: value.title as string,
    description: value.description as string,
    options,
    support,
    notes,
  }
})
const {
  state: accountState,
  formattedPoints,
  lastLogin,
  addPoints,
  cyclePersona,
  fetchAccount,
  loading: accountLoading,
  error: accountError,
  apiOnline,
} = useAccount()
const { activeRegion } = useRegion()

// BFF base URL for resolving AURA-generated asset paths
const BFF_URL = import.meta.env.VITE_BFF_URL || 'http://localhost:4117'

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
    return activeRegion.value.slides.map(s => ({
      image: s.image.startsWith('http') ? s.image : `${BFF_URL}${s.image}`,
      title: s.title,
      subtitle: s.subtitle,
      align: (s.align || 'left') as 'left' | 'right' | 'center' | 'top-left' | 'bottom-right'
    }))
  }
  return richSlidesArray
})

const recentActivities = computed(() => accountState.recentActivities.slice(0, 4))
const activeActionId = ref<string | null>(null)
const feedback = ref<string | null>(null)
const showAdvancedHub = ref(false)

watch(accountError, (value) => {
  if (value) {
    feedback.value = apiOnline.value
      ? value
      : 'バックエンドに接続できませんでした。オフラインモードで継続します。'
  }
})

async function runAction(action: AccountAction) {
  if (accountLoading.value || activeActionId.value) {
    return
  }

  activeActionId.value = action.id
  feedback.value = apiOnline.value ? 'Processing...' : 'オフラインモード: ローカルで反映します。'

  try {
    switch (action.id) {
      case 'addPoints':
        await addPoints()
        feedback.value = apiOnline.value ? `${action.label} ✓` : 'ポイントを仮追加しました (オフライン)'
        break
      case 'managePersona':
        await cyclePersona()
        feedback.value = apiOnline.value ? action.description : 'ペルソナをローカルで切り替えました'
        break
      case 'viewHistory':
        await fetchAccount()
        feedback.value = apiOnline.value
          ? accountState.recentActivities[0] ?? action.description
          : '最新履歴はオフラインモードでは保存のみ行います'
        break
      default:
        feedback.value = action.description
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    feedback.value = message || 'Operation failed'
  } finally {
    activeActionId.value = null
  }
}

function goTo(path?: string, fallbackId?: string) {
  const target = path ?? fallbackId ?? 'home'
  navigateTo(target)
}

watch(apiOnline, (online) => {
  if (!online) {
    feedback.value = '現在はオフラインモードです。操作はこの画面上だけで反映されます。'
  }
})

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
        v-for="link in hero.navLinks"
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
        <p>説明はあとからで大丈夫です。気になるリージョンを選び、キャラクターに一言話しかけてください。</p>
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
        <h2>遊園地の入口として使う</h2>
        <p>トップでは仕組みを説明しすぎず、世界、キャラクター、会話の入口だけを見せます。</p>
      </article>
      <a class="beginner-card" href="#/region-guide" @click.prevent="goTo('region_guide')">
        <span>01</span>
        <h3>遊び方を見る</h3>
        <p>QR、V2カード、各プラットフォームでの遊び方をまとめています。</p>
      </a>
      <a class="beginner-card" href="#/regions" @click.prevent="goTo('regions')">
        <span>02</span>
        <h3>世界を選ぶ</h3>
        <p>海賊酒場、転生裁判、配信スタジオ、癒しの旅から入れます。</p>
      </a>
      <a class="beginner-card" href="#/chat" @click.prevent="goTo('chat')">
        <span>03</span>
        <h3>話しかける</h3>
        <p>最初の一言から、リージョンの物語が始まります。</p>
      </a>
    </section>

    <section class="advanced-entry">
      <div class="advanced-entry__copy">
        <p>More</p>
        <h2>詳しい機能とポイント</h2>
        <span>慣れてきたら、ポイント、ライブラリー、利用ポリシー、運用メニューを確認できます。</span>
      </div>
      <button type="button" class="advanced-entry__button" @click="toggleAdvancedHub">
        {{ showAdvancedHub ? '閉じる' : '詳しく見る' }}
      </button>
    </section>

    <transition name="advanced-panel">
      <div v-if="showAdvancedHub" class="advanced-hub">
        <section class="account-hub">
          <AccountPanel
            :content="accountContent"
            :state="accountState"
            :formatted-points="formattedPoints"
            :last-login="lastLogin"
            :recent-activities="recentActivities"
            :actions="accountActions"
            :feedback="feedback"
            :api-online="apiOnline"
            @run-action="runAction"
          />
        </section>

        <PaymentGrid
          id="payments"
          :title="paymentSection.title"
          :description="paymentSection.description"
          :options="paymentSection.options"
          :support="paymentSection.support"
          :notes="paymentSection.notes"
        />

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
