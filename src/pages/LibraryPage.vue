<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import libraryIcon from '../assets/icons/library.png'
import { navigatorCards } from '../data/sampleCards'
import { determineCardRole, type CardRole } from '../utils/cardRoles'
import SessionPanel from '../components/SessionPanel.vue'
import { useSession } from '../composables/useSession'
import { FEATURE_USER_SHARE, FEATURE_USER_DOWNLOAD } from '../core/featureFlags'
import { apiRequest } from '../utils/api'
import { POINTS_PRICING } from '../constants/points'

const { tm } = useI18n({ useScope: 'global' })

const page = computed(() => tm('pages.library') as { title: string; lead: string[] })

const session = useSession()
const shareFeatureEnabled = FEATURE_USER_SHARE
const downloadFeatureEnabled = FEATURE_USER_DOWNLOAD
type LibraryTab = 'official' | 'shared'
const activeTab = ref<LibraryTab>('official')

type ProductType = 'character' | 'world' | 'scenario' | 'game'
type PriceKind = 'free' | 'points' | 'private'

type PriceInfo = {
  kind: PriceKind
  label: string
}

type LibraryProduct = {
  id: string
  title: string
  summary: string
  thumbnail: string
  tags: string[]
  type: ProductType
  official: boolean
  author: string
  price: PriceInfo
  updated?: string
}

type SharedCardEntry = {
  cardId: string
  ownerId: string
  displayName: string
  sharedAt: string
  downloads: number
  lastDownloadAt: string | null
}

const typeLabels: Record<ProductType, string> = {
  character: 'キャラ（話す人）',
  world: 'ワールド（舞台）',
  scenario: 'シナリオ（事件）',
  game: 'ゲーム（ルール）',
}

const originLabels = {
  official: 'Official',
  community: 'Community',
} as const

const roleToType: Record<CardRole, ProductType> = {
  CHARACTER: 'character',
  WORLD: 'world',
  SCENARIO: 'scenario',
  UNKNOWN: 'character',
}

const libraryMeta: Record<
  string,
  Partial<Pick<LibraryProduct, 'type' | 'official' | 'author' | 'price' | 'updated'>>
> = {
  'dr-orb': { type: 'character', official: true, author: 'IZAKAYA Ops', price: { kind: 'free', label: 'FREE' } },
  'ekaterina-menter': { type: 'world', official: true, author: 'IZAKAYA Ops', price: { kind: 'free', label: 'FREE' }, updated: '2025-12-01' },
  'lady-maholo': { type: 'character', official: true, author: 'Meta Host', price: { kind: 'points', label: '80pt' } },
  'miss-madi': { type: 'character', official: false, author: 'Community Hub', price: { kind: 'points', label: '120pt' } },
  'mammon-manager': { type: 'scenario', official: false, author: 'Mammon Office', price: { kind: 'points', label: '240pt' } },
  'team-ozanari-dungeon': { type: 'game', official: true, author: 'Atelier Reverse', price: { kind: 'points', label: '360pt' } },
  ekubo: { type: 'scenario', official: false, author: 'Ekubo Union', price: { kind: 'free', label: 'FREE' } },
  'hanaso-kawari': { type: 'world', official: true, author: 'IZAKAYA Ops', price: { kind: 'private', label: '非公開' } },
}

const catalogue = computed<LibraryProduct[]>(() => {
  return navigatorCards.map((card) => {
    const meta = libraryMeta[card.id] ?? {}
    const resolvedType = meta.type ?? roleToType[determineCardRole(card)]
    const price = meta.price ?? { kind: 'free', label: 'FREE' }
    return {
      id: card.id,
      title: card.name,
      summary: card.summary,
      thumbnail: card.avatar,
      tags: card.tags,
      type: resolvedType,
      official: meta.official ?? true,
      author: meta.author ?? (meta.official === false ? 'Community Creator' : 'IZAKAYA Ops'),
      price,
      updated: meta.updated,
    }
  })
})

const searchQuery = ref('')
const sortKey = ref<'title' | 'recent'>('title')
const typeFilter = ref<'all' | ProductType>('all')
const originFilter = ref<'all' | 'official' | 'community'>('all')
const priceFilter = ref<'all' | PriceKind>('all')
const sharedEntries = ref<SharedCardEntry[]>([])
const sharedLoading = ref(false)
const sharedError = ref<string | null>(null)
const sharedMessage = ref<string | null>(null)
const downloadCost = POINTS_PRICING.library.baseDownload

const filteredProducts = computed(() => {
  const text = searchQuery.value.trim().toLowerCase()
  let items = catalogue.value.filter((product) => {
    const matchesSearch =
      !text ||
      [product.title, product.summary, product.author, ...product.tags]
        .filter(Boolean)
        .some((fragment) => fragment.toLowerCase().includes(text))
    const matchesType = typeFilter.value === 'all' || product.type === typeFilter.value
    const matchesOrigin =
      originFilter.value === 'all' ||
      (originFilter.value === 'official' ? product.official : !product.official)
    const matchesPrice = priceFilter.value === 'all' || product.price.kind === priceFilter.value
    return matchesSearch && matchesType && matchesOrigin && matchesPrice
  })

  if (sortKey.value === 'title') {
    items = [...items].sort((a, b) => a.title.localeCompare(b.title))
  } else {
    items = [...items].sort((a, b) => (b.updated ?? '').localeCompare(a.updated ?? ''))
  }

  return items
})

const selectedProduct = ref<LibraryProduct | null>(null)
const overlayOpen = ref(false)

watch(filteredProducts, (items) => {
  if (!items.length || !selectedProduct.value || !items.some((item) => item.id === selectedProduct.value?.id)) {
    selectedProduct.value = null
    overlayOpen.value = false
  }
})

watch(activeTab, (tab) => {
  if (tab === 'shared' && shareFeatureEnabled && !sharedEntries.value.length) {
    fetchSharedLibrary()
  }
})

function selectProduct(product: LibraryProduct) {
  selectedProduct.value = product
  overlayOpen.value = true
}

function closeOverlay() {
  overlayOpen.value = false
}

async function fetchSharedLibrary() {
  if (!shareFeatureEnabled) return
  sharedLoading.value = true
  sharedError.value = null
  try {
    const response = await apiRequest<{ ok: boolean; entries: SharedCardEntry[] }>('/library/shared')
    sharedEntries.value = response.entries.map((entry) => ({
      cardId: entry.cardId,
      ownerId: entry.ownerId,
      displayName: entry.displayName,
      sharedAt: entry.sharedAt,
      downloads: entry.downloads ?? 0,
      lastDownloadAt: entry.lastDownloadAt ?? null,
    }))
  } catch (error) {
    sharedError.value = error instanceof Error ? error.message : '共有ライブラリの取得に失敗しました'
  } finally {
    sharedLoading.value = false
  }
}

async function downloadSharedCard(entry: SharedCardEntry) {
  if (!shareFeatureEnabled || !downloadFeatureEnabled) {
    sharedMessage.value = 'この機能は現在利用できません'
    return
  }
  if (session.state.status !== 'ready') {
    sharedMessage.value = 'ログインしてください'
    return
  }
  try {
    const response = await apiRequest<{ ok: boolean; cardId: string; card: any; balance: number; downloads: number }>(
      `/library/shared/${entry.cardId}/download`,
      {
        method: 'POST',
      }
    )
    const blob = new Blob([JSON.stringify(response.card, null, 2)], { type: 'application/json' })
    triggerDownload(`${entry.displayName || entry.cardId}.json`, blob)
    entry.downloads = response.downloads ?? entry.downloads + 1
    entry.lastDownloadAt = new Date().toISOString()
    sharedMessage.value = `ダウンロードしました（残高: ${response.balance}pt）`
  } catch (error) {
    sharedMessage.value = error instanceof Error ? error.message : 'ダウンロードに失敗しました'
  }
}

function triggerDownload(filename: string, blob: Blob) {
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(href)
}

const typeFilterOptions: Array<{ label: string; value: typeof typeFilter.value }> = [
  { label: 'All', value: 'all' },
  { label: 'Character', value: 'character' },
  { label: 'World', value: 'world' },
  { label: 'Scenario', value: 'scenario' },
  { label: 'Game', value: 'game' },
]

const originFilterOptions: Array<{ label: string; value: typeof originFilter.value }> = [
  { label: 'All', value: 'all' },
  { label: 'Official', value: 'official' },
  { label: 'Community', value: 'community' },
]

const priceFilterOptions: Array<{ label: string; value: typeof priceFilter.value }> = [
  { label: 'All', value: 'all' },
  { label: 'Free', value: 'free' },
  { label: 'Paid', value: 'points' },
  { label: 'Private', value: 'private' },
]
</script>

<template>
  <div class="library">
    <header class="library__hero">
      <img class="library__icon" :src="libraryIcon" alt="Library" />
      <h1>{{ page.title }}</h1>
    </header>

    <div v-if="shareFeatureEnabled" class="library__tabs">
      <button type="button" :class="{ active: activeTab === 'official' }" @click="activeTab = 'official'">
        Official
      </button>
      <button type="button" :class="{ active: activeTab === 'shared' }" @click="activeTab = 'shared'">
        User Shared
      </button>
    </div>

    <section v-if="activeTab === 'official'" class="controls">
      <label class="controls__field">
        <span>Search</span>
        <input v-model="searchQuery" type="search" :placeholder="$t('pages.library.search', 'キーワード検索')" />
      </label>
      <label class="controls__field">
        <span>Sort</span>
        <select v-model="sortKey">
          <option value="title">{{ $t('pages.library.sortTitle', 'タイトル順') }}</option>
          <option value="recent">{{ $t('pages.library.sortRecent', '最近追加') }}</option>
        </select>
      </label>
      <label class="controls__field">
        <span>Type</span>
        <select v-model="typeFilter">
          <option v-for="option in typeFilterOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <label class="controls__field">
        <span>Origin</span>
        <select v-model="originFilter">
          <option v-for="option in originFilterOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <label class="controls__field">
        <span>Price</span>
        <select v-model="priceFilter">
          <option v-for="option in priceFilterOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
    </section>

    <section v-if="activeTab === 'official'" class="catalogue">
      <p v-if="!filteredProducts.length" class="catalogue__empty">
        {{ $t('pages.library.empty', '条件に一致するカードがありません。フィルターを緩めてください。') }}
      </p>

      <article
        v-for="product in filteredProducts"
        :key="product.id"
        class="product-card"
        :class="{ 'is-selected': selectedProduct?.id === product.id }"
        @click="selectProduct(product)"
      >
        <div class="product-card__thumb">
          <img :src="product.thumbnail" :alt="product.title" />
          <span class="badge badge--type" :data-type="product.type">{{ typeLabels[product.type] }}</span>
          <span
            class="badge badge--origin"
            :class="product.official ? 'badge--official' : 'badge--community'"
          >
            {{ product.official ? originLabels.official : originLabels.community }}
          </span>
        </div>
        <div class="product-card__body">
          <div class="product-card__title">
            <h3>{{ product.title }}</h3>
            <span v-if="product.updated" class="product-card__updated">{{ product.updated }}</span>
          </div>
          <p class="product-card__author">{{ product.author }}</p>
          <p class="product-card__summary">{{ product.summary }}</p>
          <ul class="product-card__tags">
            <li v-for="tag in product.tags" :key="tag">{{ tag }}</li>
          </ul>
        </div>
        <footer class="product-card__footer">
          <span class="product-card__price" :data-kind="product.price.kind">{{ product.price.label }}</span>
          <button type="button">{{ $t('pages.library.open', '開く') }}</button>
        </footer>
      </article>
    </section>

    <section v-if="shareFeatureEnabled && activeTab === 'shared'" class="shared-library">
      <SessionPanel />
      <p class="shared-library__note">ダウンロードには {{ downloadCost }}pt 消費します。</p>
      <p v-if="sharedError" class="shared-library__error">{{ sharedError }}</p>
      <p v-if="sharedMessage" class="shared-library__status">{{ sharedMessage }}</p>
      <p v-if="sharedLoading" class="shared-library__status">共有ライブラリを読み込み中...</p>
      <p v-else-if="!sharedEntries.length" class="shared-library__empty">共有カードはまだありません。</p>
      <ul v-else class="shared-library__list">
        <li v-for="entry in sharedEntries" :key="entry.cardId" class="shared-library__item">
          <div>
            <h3>{{ entry.displayName }}</h3>
            <p>提供者: {{ entry.ownerId }}</p>
            <p>
              共有: {{ new Date(entry.sharedAt).toLocaleString() }} / DL: {{ entry.downloads }} /
              最終DL: {{ entry.lastDownloadAt ? new Date(entry.lastDownloadAt).toLocaleString() : '---' }}
            </p>
          </div>
          <button type="button" class="shared-library__btn" @click="downloadSharedCard(entry)">
            {{ downloadFeatureEnabled ? `${downloadCost}ptでDL` : 'DL停止中' }}
          </button>
        </li>
      </ul>
    </section>

    <teleport to="body">
      <div v-if="overlayOpen && selectedProduct" class="product-overlay" @click.self="closeOverlay">
        <article class="product-detail">
          <button type="button" class="product-detail__close" @click="closeOverlay">×</button>
          <div class="product-detail__media">
            <img :src="selectedProduct.thumbnail" :alt="selectedProduct.title" />
            <div class="product-detail__badges">
              <span class="badge badge--type" :data-type="selectedProduct.type">
                {{ typeLabels[selectedProduct.type] }}
              </span>
              <span
                class="badge badge--origin"
                :class="selectedProduct.official ? 'badge--official' : 'badge--community'"
              >
                {{ selectedProduct.official ? originLabels.official : originLabels.community }}
              </span>
            </div>
          </div>
          <div class="product-detail__body">
            <header>
              <h2>{{ selectedProduct.title }}</h2>
              <p class="product-detail__author">{{ selectedProduct.author }}</p>
              <p class="product-detail__price" :data-kind="selectedProduct.price.kind">
                {{ selectedProduct.price.label }}
              </p>
            </header>
            <p class="product-detail__summary">{{ selectedProduct.summary }}</p>
            <ul class="product-detail__tags">
              <li v-for="tag in selectedProduct.tags" :key="tag">{{ tag }}</li>
            </ul>
            <div class="product-detail__actions">
              <button type="button" class="primary">{{ $t('pages.library.open', '開く') }}</button>
              <button type="button" class="ghost">{{ $t('pages.library.save', '保存') }}</button>
              <button
                type="button"
                class="secondary"
                :disabled="selectedProduct.price.kind === 'private'"
              >
                {{ selectedProduct.price.kind === 'free' ? $t('pages.library.download', 'ダウンロード') : selectedProduct.price.label }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
.library {
  display: grid;
  gap: 32px;
  padding-bottom: 48px;
}

.library__hero {
  display: grid;
  gap: 12px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(12, 18, 32, 0.45);
  padding: clamp(24px, 4vw, 40px);
  position: relative;
}

.library__hero h1 {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
}

.library__icon {
  position: absolute;
  top: clamp(12px, 2vw, 24px);
  right: clamp(12px, 3vw, 32px);
  width: clamp(60px, 7vw, 92px);
  height: auto;
}

.library__tabs {
  display: flex;
  gap: 12px;
  margin: 1.5rem 0;
}

.library__tabs button {
  flex: 1 1 160px;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.library__tabs button.active {
  background: linear-gradient(90deg, #63e6ff, #5c7cfa);
  color: #030812;
  font-weight: 600;
}

.controls {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  align-items: end;
  background: rgba(9, 12, 24, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 20px;
}

.controls__field {
  display: grid;
  gap: 6px;
  font-size: 0.85rem;
  opacity: 0.8;
}

.controls__field input,
.controls__field select {
  width: 100%;
}

.catalogue {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.catalogue__empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 32px;
  border-radius: 18px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  background: rgba(10, 12, 24, 0.6);
}

.product-card {
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  border: 1px solid transparent;
  background: rgba(12, 18, 32, 0.7);
  overflow: hidden;
  transition: border-color 0.2s ease, transform 0.2s ease;
  cursor: pointer;
}

.product-card.is-selected {
  border-color: rgba(255, 255, 255, 0.45);
  transform: translateY(-2px);
}

.product-card__thumb {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
}

.product-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.badge {
  position: absolute;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 600;
}

.badge--type {
  left: 8px;
  bottom: 8px;
  background: rgba(0, 0, 0, 0.7);
}

.badge--origin {
  right: 8px;
  top: 8px;
}

.badge--official {
  background: #51d1ff;
  color: #011627;
}

.badge--community {
  background: #ff96dc;
  color: #240726;
}

.product-card__body {
  display: grid;
  gap: 8px;
  padding: 16px 18px 0;
}

.product-card__title {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.product-card__title h3 {
  margin: 0;
  font-size: 1.05rem;
}

.product-card__updated {
  font-size: 0.78rem;
  opacity: 0.6;
}

.product-card__author {
  font-size: 0.85rem;
  opacity: 0.75;
}

.product-card__summary {
  font-size: 0.9rem;
  line-height: 1.35;
  opacity: 0.9;
  max-height: 4.4em;
  overflow: hidden;
}

.product-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.product-card__tags li {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.product-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px 18px;
  gap: 12px;
}

.product-card__price {
  font-weight: 600;
  font-size: 0.95rem;
}

.product-card__price[data-kind='free'] {
  color: #9effb8;
}

.product-card__price[data-kind='points'] {
  color: #ffd866;
}

.product-card__price[data-kind='private'] {
  color: #ff6b6b;
}

.product-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 6, 12, 0.82);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 4vw, 48px);
  z-index: 30;
}

.product-detail {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 2fr;
  gap: 32px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(8, 8, 18, 0.9);
  padding: clamp(24px, 4vw, 36px);
  position: relative;
  max-width: 1080px;
  width: 100%;
}

@media (max-width: 900px) {
  .product-detail {
    grid-template-columns: 1fr;
  }
}

.product-detail__close {
  position: absolute;
  top: 12px;
  right: 12px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  font-size: 1.4rem;
  cursor: pointer;
}

.product-detail__media {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
}

.product-detail__media img {
  width: 100%;
  display: block;
  object-fit: cover;
}

.product-detail__badges {
  position: absolute;
  display: flex;
  gap: 8px;
  top: 12px;
  left: 12px;
}

.product-detail__body {
  display: grid;
  gap: 16px;
}

.product-detail__author {
  margin: 0;
  opacity: 0.7;
}

.product-detail__price {
  font-weight: 700;
  font-size: 1.1rem;
}

.product-detail__price[data-kind='free'] {
  color: #9effb8;
}

.product-detail__price[data-kind='points'] {
  color: #ffd866;
}

.product-detail__price[data-kind='private'] {
  color: #ff6b6b;
}

.product-detail__summary {
  line-height: 1.5;
  opacity: 0.95;
}

.product-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.product-detail__tags li {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.product-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 640px) {
  .controls {
    grid-template-columns: 1fr;
  }

  .product-detail__actions {
    flex-direction: column;
  }
}

.shared-library {
  margin-top: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: clamp(18px, 3vw, 28px);
  background: rgba(7, 10, 22, 0.78);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.shared-library__note,
.shared-library__status {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.75);
}

.shared-library__error {
  color: #ff8e8e;
}

.shared-library__empty {
  color: rgba(255, 255, 255, 0.65);
}

.shared-library__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shared-library__item {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
}

.shared-library__btn {
  padding: 0.65rem 1.3rem;
  border-radius: 12px;
  border: none;
  background: linear-gradient(90deg, #63e6ff, #5c7cfa);
  color: #041021;
  font-weight: 600;
  cursor: pointer;
}
</style>
