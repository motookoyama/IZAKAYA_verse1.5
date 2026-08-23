<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import TopNav from './components/TopNav.vue'
import HomePage from './pages/HomePage.vue'
import DirectByokPlayPage from './pages/DirectByokPlayPage.vue'
import LibraryPage from './pages/LibraryPage.vue'
import HelpPage from './pages/HelpPage.vue'
import RegionSelectPage from './pages/RegionSelectPage.vue'
import RegionDetailPage from './pages/RegionDetailPage.vue'
import RegionGuidePage from './pages/RegionGuidePage.vue'
import VerseIntroPage from './pages/VerseIntroPage.vue'
import { useTheme } from './composables/useTheme'
import { isSupported, persistLocale, type Locale } from './plugins/i18n'
import type { HeroContent, HelpContent } from './types/home'
import { PAGE_PATHS, resolvePathForNav, navigateTo, type PageKey } from './constants/navigation'
// import { useRegion } from './composables/useRegion'

const ROUTES: Partial<Record<PageKey, Component>> = {
  home: HomePage,
  chat: DirectByokPlayPage,
  library: LibraryPage,
  help: HelpPage,
  regions: RegionSelectPage,
  region_detail: RegionDetailPage,
  region_guide: RegionGuidePage,
  verse_intro: VerseIntroPage,
}

// These are retained as local/backstage tools. They are intentionally absent
// from the static Pages surface until their own commercial/runtime gate exists.
if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_INTERNAL_ROUTES === 'true') {
  ROUTES.admin = defineAsyncComponent(() => import('./pages/AdminPage.vue'))
  ROUTES.reincarnation = defineAsyncComponent(() => import('./pages/ReincarnationPage.vue'))
  ROUTES.backyard = defineAsyncComponent(() => import('./pages/IZBackyard.vue'))
}

const { themes, themeId, setTheme } = useTheme()
const { t, tm, locale } = useI18n({ useScope: 'global' })
// const { activeRegion } = useRegion() // Initialize Region System - Temporarily disabled to fix build

const hero = computed<HeroContent>(() => tm('home.hero') as HeroContent)
const navLinks = computed(() => {
  const featureLinks = hero.value.navLinks.map((link) => ({
    ...link,
    path: resolvePathForNav(link.id) ?? PAGE_PATHS.home,
  }))
  const merged = [
    ...featureLinks,
    { id: 'regions', label: t('navigation.regions'), path: PAGE_PATHS.regions },
  ]
  const dedup = new Map<string, { id: string; label: string; path: string }>()
  merged.forEach((item) => dedup.set(item.id, item))
  const links = [
    { id: 'home', label: t('navigation.home'), path: PAGE_PATHS.home },
    ...Array.from(dedup.values()),
  ]
  // The public entry is a world-first experience. Guides and Help remain
  // available, but are recovery links rather than the first instruction.
  const priority: Record<string, number> = {
    home: 0,
    regions: 10,
    chat: 20,
    library: 30,
    region_guide: 90,
    help: 100,
  }
  return links.sort((left, right) => (priority[left.id] ?? 50) - (priority[right.id] ?? 50))
})

const languageOptions: { value: Locale; label: string }[] = [
  { value: 'ja', label: '日本語' },
  { value: 'en', label: 'English' },
]

const overlayOpen = ref(false)

const helpPage = computed(() => tm('pages.help') as {
  workflowTitle: string
  workflow: string[]
  notesTitle: string
  notes: string[]
})
const homeHelp = computed(() => tm('home.help') as HelpContent)
const overlayHelp = computed(() => (tm('overlay.help') as string[]) ?? [])
const overlayHelpSections = computed(() => {
  const sections: Array<{ title: string; items: string[] }> = []
  const home = homeHelp.value
  if (home.disclaimer?.length) {
    sections.push({ title: home.title, items: home.disclaimer })
  }
  if (home.faqs?.length) {
    sections.push({ title: 'FAQ', items: home.faqs.map((item) => `${item.question}：${item.answer}`) })
  }
  sections.push({ title: helpPage.value.workflowTitle, items: helpPage.value.workflow })
  sections.push({ title: helpPage.value.notesTitle, items: helpPage.value.notes })
  if (overlayHelp.value.length) {
    sections.push({ title: t('overlay.helpTitle'), items: overlayHelp.value })
  }
  return sections
})
type OverlayLink = { id: string; label: string; path: string }

const overlayLinks = computed<OverlayLink[]>(() => [
  { id: 'regions', label: t('navigation.regions'), path: PAGE_PATHS.regions },
  { id: 'library', label: t('overlay.links.library'), path: PAGE_PATHS.library },
  { id: 'payments', label: t('overlay.links.payments'), path: PAGE_PATHS.home },
  { id: 'region_guide', label: '遊び方', path: PAGE_PATHS.region_guide },
])

function onThemeChange(input: string | Event) {
  const value = typeof input === 'string' ? input : (input.target as HTMLSelectElement).value
  setTheme(value as typeof themeId.value)
}

function onLocaleChange(next: Locale | string) {
  const localeValue = (typeof next === 'string' ? next : next) as Locale
  if (!isSupported(localeValue)) return
  locale.value = localeValue
  persistLocale(localeValue)
}

function toggleOverlay() {
  overlayOpen.value = !overlayOpen.value
}

function handleOverlayLink(link: OverlayLink) {
  overlayOpen.value = false
  if (link.id === 'payments') {
    navigateTo(PAGE_PATHS.home)
    requestAnimationFrame(() => {
      const el = document.getElementById('payments')
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return
  }
  navigateTo(link.path)
}

function resolvePageFromHash(hash: string): PageKey {
  const cleaned = hash.replace(/^#\/?/, '')
  if (cleaned.startsWith('region/')) return 'region_detail'
  const routeKey = cleaned.replace(/-/g, '_')
  const candidate = routeKey.length > 0 ? (routeKey as PageKey) : 'home'
  return (candidate in ROUTES ? candidate : 'home') as PageKey
}

const initialHash = typeof window !== 'undefined' ? window.location.hash : PAGE_PATHS.home
const currentPage = ref<PageKey>(resolvePageFromHash(initialHash))

function handleHashChange() {
  if (typeof window === 'undefined') return
  currentPage.value = resolvePageFromHash(window.location.hash)
}

watch(currentPage, () => {
  overlayOpen.value = false
})

onMounted(() => {
  if (typeof window === 'undefined') return
  window.addEventListener('hashchange', handleHashChange)
  if (!window.location.hash) {
    window.location.hash = PAGE_PATHS.home
  } else {
    currentPage.value = resolvePageFromHash(window.location.hash)
  }
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('hashchange', handleHashChange)
})

const CurrentView = computed(() => ROUTES[currentPage.value] ?? HomePage)

function onNavigate(target: string) {
  navigateTo(target)
}
</script>

<template>
  <div class="app" :class="{ 'is-home': currentPage === 'home' }">
    <TopNav
      :hero="hero"
      :nav-links="navLinks"
      :themes="themes"
      :current-theme-id="themeId"
      :language-options="languageOptions"
      :current-locale="locale"
      :theme-label="t('ui.themeLabel')"
      :language-label="t('ui.languageLabel')"
      :show-overlay-toggle="true"
      @change-theme="onThemeChange"
      @change-locale="onLocaleChange"
      @toggle-overlay="toggleOverlay"
      @navigate="onNavigate"
    />

    <transition name="overlay">
      <div v-if="overlayOpen" class="overlay">
        <div class="overlay__backdrop" @click="overlayOpen = false"></div>
        <aside class="overlay__panel">
          <button type="button" class="overlay__close" @click="overlayOpen = false">×</button>
          <header class="overlay__header">
            <h2>{{ t('overlay.title') }}</h2>
            <p>{{ t('overlay.subtitle') }}</p>
          </header>
          <nav class="overlay__section overlay__links">
            <h3>{{ t('overlay.linksTitle') }}</h3>
            <button
              v-for="link in overlayLinks"
              :key="link.id"
              type="button"
              @click="handleOverlayLink(link)"
            >
              {{ link.label }}
            </button>
          </nav>
          <section class="overlay__section overlay__controls">
            <h3>{{ t('overlay.themeTitle') }}</h3>
            <select :value="themeId" @change="onThemeChange">
              <option v-for="theme in themes" :key="theme.id" :value="theme.id">{{ theme.name }}</option>
            </select>
            <div class="overlay__languages">
              <span>{{ t('overlay.languageTitle') }}</span>
              <div class="overlay__language-buttons">
                <button
                  v-for="option in languageOptions"
                  :key="option.value"
                  type="button"
                  :class="{ active: locale === option.value }"
                  @click="onLocaleChange(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </section>
          <details class="overlay__section overlay__help">
            <summary>困ったときの案内・ヘルプ</summary>
            <section v-for="section in overlayHelpSections" :key="section.title" class="overlay__help-section">
              <h3>{{ section.title }}</h3>
              <ul>
                <li v-for="item in section.items" :key="item">{{ item }}</li>
              </ul>
            </section>
          </details>
          <p class="overlay__note">{{ t('overlay.note') }}</p>
        </aside>
      </div>
    </transition>

    <main class="app__content">
      <component :is="CurrentView" :key="currentPage" />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px clamp(16px, 4vw, 56px);
  color: var(--fg);
  background: transparent; /* Default to transparent container */
}

.app.is-home {
  background: transparent !important;
}

.app__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
  background: transparent !important;
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.25s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  align-items: start;
  justify-items: end;
  padding: 16px;
}

.overlay__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(7, 10, 18, 0.55);
  backdrop-filter: blur(6px);
}

.overlay__panel {
  position: relative;
  width: min(420px, calc(100vw - 48px));
  max-height: calc(100vh - 96px);
  overflow-y: auto;
  padding: 28px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(12, 18, 32, 0.92);
  color: #f5f7fb;
  display: grid;
  gap: 18px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.45);
}

.overlay__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: inherit;
  font-size: 1.2rem;
  cursor: pointer;
}

.overlay__header {
  display: grid;
  gap: 6px;
}

.overlay__header h2 {
  margin: 0;
  font-size: 1.4rem;
}

.overlay__header p {
  margin: 0;
  opacity: 0.75;
  font-size: 0.9rem;
}

.overlay__section {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(19, 26, 40, 0.8);
  padding: 16px;
  display: grid;
  gap: 8px;
}

.overlay__section select {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(10, 15, 26, 0.6);
  color: inherit;
  padding: 10px 12px;
}

.overlay__section h3 {
  margin: 0;
  font-size: 1rem;
  letter-spacing: 0.04em;
}

.overlay__help {
  gap: 14px;
}

.overlay__help summary {
  cursor: pointer;
  font-size: 0.85rem;
  opacity: 0.78;
}

.overlay__help-section {
  display: grid;
  gap: 8px;
}

.overlay__section ul {
  margin: 0;
  padding-left: 1.2rem;
  display: grid;
  gap: 6px;
  font-size: 0.9rem;
}

.overlay__languages {
  display: grid;
  gap: 8px;
}

.overlay__language-buttons {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

.overlay__language-buttons button {
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  padding: 6px 12px;
  color: inherit;
}

.overlay__language-buttons button.active {
  border-color: var(--brand-2, #58cff5);
  background: rgba(88, 207, 245, 0.18);
}

.overlay__links {
  display: grid;
  gap: 10px;
}

.overlay__links button {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  padding: 10px 14px;
  background: rgba(10, 17, 28, 0.7);
  color: inherit;
  cursor: pointer;
}

.overlay__note {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.7;
}

@media (max-width: 600px) {
  .overlay__panel {
    width: calc(100vw - 32px);
    max-height: calc(100vh - 64px);
    padding: 20px;
  }
}
</style>
