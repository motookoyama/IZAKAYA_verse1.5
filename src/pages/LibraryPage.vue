<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import libraryIcon from '../assets/icons/library.png'
import { navigatorCards } from '../data/sampleCards'
import { determineCardRole, type CardRole } from '../utils/cardRoles'

type ProductType = 'character' | 'world' | 'scenario' | 'game'
type LibraryProduct = {
  id: string
  title: string
  summary: string
  thumbnail: string
  tags: string[]
  type: ProductType
  official: boolean
  author: string
  updated?: string
}

const PAGE_SIZE = 25
const typeLabels: Record<ProductType, string> = {
  character: 'キャラ', world: 'ワールド', scenario: 'シナリオ', game: 'ゲーム',
}
const roleToType: Record<CardRole, ProductType> = {
  CHARACTER: 'character', WORLD: 'world', SCENARIO: 'scenario', UNKNOWN: 'character',
}
const libraryMeta: Record<string, Partial<Pick<LibraryProduct, 'type' | 'official' | 'author' | 'updated'>>> = {
  'dr-orb': { type: 'character', official: true, author: 'IZAKAYA Ops' },
  'ekaterina-menter': { type: 'world', official: true, author: 'IZAKAYA Ops', updated: '2025-12-01' },
  'lady-maholo': { type: 'character', official: true, author: 'IZAKAYA Ops' },
  'miss-madi': { type: 'character', official: false, author: 'Community Hub' },
  'mammon-manager': { type: 'scenario', official: false, author: 'Mammon Office' },
  'team-ozanari-dungeon': { type: 'game', official: true, author: 'Atelier Reverse' },
  ekubo: { type: 'scenario', official: false, author: 'Ekubo Union' },
  'hanaso-kawari': { type: 'world', official: true, author: 'IZAKAYA Ops' },
}

const catalogue = computed<LibraryProduct[]>(() => navigatorCards.map((card) => {
  const meta = libraryMeta[card.id] ?? {}
  return {
    id: card.id,
    title: card.name,
    summary: card.summary,
    thumbnail: card.avatar,
    tags: card.tags,
    type: meta.type ?? roleToType[determineCardRole(card)],
    official: meta.official ?? true,
    author: meta.author ?? 'IZAKAYA Ops',
    updated: meta.updated,
  }
}))

const searchQuery = ref('')
const sortKey = ref<'title' | 'recent'>('title')
const typeFilter = ref<'all' | ProductType>('all')
const originFilter = ref<'all' | 'official' | 'community'>('all')
const pageIndex = ref(0)
const selectedProduct = ref<LibraryProduct | null>(null)
const overlayOpen = ref(false)

const filteredProducts = computed(() => {
  const text = searchQuery.value.trim().toLocaleLowerCase()
  const items = catalogue.value.filter((product) => {
    const searchable = [product.title, product.summary, product.author, ...product.tags].join(' ').toLocaleLowerCase()
    const matchesText = !text || searchable.includes(text)
    const matchesType = typeFilter.value === 'all' || product.type === typeFilter.value
    const matchesOrigin = originFilter.value === 'all' || (originFilter.value === 'official' ? product.official : !product.official)
    return matchesText && matchesType && matchesOrigin
  })
  return [...items].sort((a, b) => sortKey.value === 'recent'
    ? (b.updated ?? '').localeCompare(a.updated ?? '') || a.title.localeCompare(b.title)
    : a.title.localeCompare(b.title))
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / PAGE_SIZE)))
const visibleProducts = computed(() => filteredProducts.value.slice(pageIndex.value * PAGE_SIZE, (pageIndex.value + 1) * PAGE_SIZE))

watch([searchQuery, sortKey, typeFilter, originFilter], () => { pageIndex.value = 0 })
watch(totalPages, (count) => { if (pageIndex.value >= count) pageIndex.value = count - 1 })

function selectProduct(product: LibraryProduct) { selectedProduct.value = product; overlayOpen.value = true }
function closeOverlay() { overlayOpen.value = false }
function previousPage() { pageIndex.value = Math.max(0, pageIndex.value - 1) }
function nextPage() { pageIndex.value = Math.min(totalPages.value - 1, pageIndex.value + 1) }
</script>

<template>
  <main class="library">
    <header class="library__hero">
      <img class="library__icon" :src="libraryIcon" alt="Library" />
      <p class="library__eyebrow">V2 CATALOG · ONLINE</p>
      <h1>ライブラリー</h1>
      <p>公開済み・審査状態のカードを、外部AIへ持ち出す前に確認する一覧です。ユーザー登録・共有・ダウンロードはまだ開始していません。</p>
    </header>

    <section class="controls" aria-label="ライブラリー検索と並び替え">
      <label class="controls__search"><span>検索</span><input v-model="searchQuery" type="search" placeholder="カード名・タグ・説明で検索" /></label>
      <label><span>並び替え</span><select v-model="sortKey"><option value="title">タイトル順</option><option value="recent">更新日順</option></select></label>
      <label><span>種類</span><select v-model="typeFilter"><option value="all">すべて</option><option v-for="(label, value) in typeLabels" :key="value" :value="value">{{ label }}</option></select></label>
      <label><span>出所</span><select v-model="originFilter"><option value="all">すべて</option><option value="official">Official</option><option value="community">Community</option></select></label>
      <p class="controls__count">{{ filteredProducts.length }} 件 / 1ページ {{ PAGE_SIZE }} 件</p>
    </section>

    <section class="catalogue" aria-live="polite">
      <p v-if="!filteredProducts.length" class="catalogue__empty">条件に一致するカードがありません。検索語かフィルターを変更してください。</p>
      <article v-for="product in visibleProducts" :key="product.id" class="product-card" :class="{ 'is-selected': selectedProduct?.id === product.id }" tabindex="0" @click="selectProduct(product)" @keydown.enter="selectProduct(product)">
        <div class="product-card__thumb"><img :src="product.thumbnail" :alt="product.title" /><span class="badge badge--type">{{ typeLabels[product.type] }}</span><span class="badge" :class="product.official ? 'badge--official' : 'badge--community'">{{ product.official ? 'Official' : 'Community' }}</span></div>
        <div class="product-card__body"><h2>{{ product.title }}</h2><p>{{ product.author }}</p><p class="product-card__summary">{{ product.summary }}</p></div>
        <footer><span>CATALOG</span><button type="button" @click.stop="selectProduct(product)">詳細</button></footer>
      </article>
    </section>

    <nav v-if="totalPages > 1" class="pagination" aria-label="ページ送り"><button type="button" :disabled="pageIndex === 0" @click="previousPage">前へ</button><span>{{ pageIndex + 1 }} / {{ totalPages }}</span><button type="button" :disabled="pageIndex + 1 === totalPages" @click="nextPage">次へ</button></nav>

    <teleport to="body"><div v-if="overlayOpen && selectedProduct" class="product-overlay" @click.self="closeOverlay"><article class="product-detail"><button class="product-detail__close" type="button" aria-label="閉じる" @click="closeOverlay">×</button><img :src="selectedProduct.thumbnail" :alt="selectedProduct.title" /><div><p class="library__eyebrow">{{ typeLabels[selectedProduct.type] }} · {{ selectedProduct.official ? 'OFFICIAL' : 'COMMUNITY' }}</p><h2>{{ selectedProduct.title }}</h2><p>{{ selectedProduct.author }}</p><p>{{ selectedProduct.summary }}</p><ul><li v-for="tag in selectedProduct.tags" :key="tag">{{ tag }}</li></ul><p class="product-detail__notice">このカードは公開カタログ用です。ダウンロード、住民カタログ登録、共有の扱いは個別の案内に従ってください。</p></div></article></div></teleport>
  </main>
</template>

<style scoped>
.library { display: grid; gap: 20px; padding-bottom: 48px; }
.library__hero, .controls, .product-card { border: 1px solid rgba(255,255,255,.12); background: rgba(10,16,30,.68); border-radius: 16px; }
.library__hero { position: relative; padding: clamp(20px,3vw,30px); }.library__hero h1 { margin: 0; }.library__hero > p:last-child { max-width: 760px; margin: 8px 0 0; color: rgba(255,255,255,.75); line-height: 1.55; }.library__eyebrow { margin: 0 0 6px; color: #80e5ff; font-size: .74rem; letter-spacing: .12em; }.library__icon { position: absolute; right: 20px; top: 18px; width: 64px; }
.controls { display: grid; grid-template-columns: 2fr repeat(3, minmax(120px,1fr)); gap: 12px; align-items: end; padding: 14px; }.controls label { display: grid; gap: 5px; font-size: .78rem; color: rgba(255,255,255,.78); }.controls input, .controls select { box-sizing: border-box; width: 100%; min-height: 36px; border: 1px solid rgba(255,255,255,.18); border-radius: 8px; background: rgba(3,7,16,.75); color: inherit; padding: 7px; }.controls__count { margin: 0; grid-column: 1 / -1; color: rgba(255,255,255,.62); font-size: .8rem; }
.catalogue { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 12px; }.catalogue__empty { grid-column: 1 / -1; padding: 28px; text-align: center; border: 1px dashed rgba(255,255,255,.2); border-radius: 14px; }.product-card { min-width: 0; overflow: hidden; cursor: pointer; transition: border-color .18s ease, transform .18s ease; }.product-card:hover, .product-card.is-selected { border-color: #80e5ff; transform: translateY(-2px); }.product-card__thumb { position: relative; aspect-ratio: 1 / 1; overflow: hidden; background: #07111e; }.product-card__thumb img { width: 100%; height: 100%; display: block; object-fit: cover; }.badge { position: absolute; top: 6px; right: 6px; border-radius: 999px; padding: 3px 6px; color: #07111e; font-size: .62rem; font-weight: 800; background: #80e5ff; }.badge--type { top: auto; bottom: 6px; left: 6px; right: auto; color: white; background: rgba(0,0,0,.68); }.badge--community { background: #ff9cdb; }.product-card__body { padding: 9px 10px 4px; }.product-card__body h2 { margin: 0; font-size: .9rem; line-height: 1.25; }.product-card__body > p:not(.product-card__summary) { margin: 5px 0; color: rgba(255,255,255,.6); font-size: .72rem; }.product-card__summary { display: -webkit-box; overflow: hidden; margin: 0; color: rgba(255,255,255,.78); font-size: .76rem; line-height: 1.35; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.product-card footer { display: flex; justify-content: space-between; align-items: center; gap: 5px; padding: 8px 10px 10px; color: #ffd866; font-size: .67rem; }.product-card footer button, .pagination button { border: 1px solid rgba(128,229,255,.55); border-radius: 7px; background: transparent; color: #80e5ff; padding: 5px 7px; cursor: pointer; }.pagination { display: flex; justify-content: center; align-items: center; gap: 12px; }.pagination button:disabled { opacity: .4; cursor: not-allowed; }
.product-overlay { position: fixed; inset: 0; z-index: 40; display: grid; place-items: center; padding: 20px; background: rgba(3,6,12,.86); }.product-detail { position: relative; display: grid; grid-template-columns: minmax(180px, .8fr) 1.2fr; gap: 20px; width: min(780px,100%); max-height: 90vh; overflow: auto; padding: 24px; border: 1px solid rgba(255,255,255,.16); border-radius: 18px; background: #101828; }.product-detail > img { width: 100%; border-radius: 12px; }.product-detail h2 { margin: 0; }.product-detail ul { display: flex; flex-wrap: wrap; gap: 6px; padding: 0; list-style: none; }.product-detail li { border-radius: 999px; padding: 4px 7px; background: rgba(255,255,255,.1); font-size: .78rem; }.product-detail__close { position: absolute; top: 8px; right: 10px; border: 0; background: none; color: inherit; font-size: 1.5rem; cursor: pointer; }.product-detail__notice { border-left: 3px solid #ffd866; padding-left: 10px; color: rgba(255,255,255,.78); line-height: 1.5; }
@media (max-width: 1050px) { .catalogue { grid-template-columns: repeat(4, minmax(0,1fr)); } .controls { grid-template-columns: repeat(2,minmax(0,1fr)); }.controls__search { grid-column: span 2; } } @media (max-width: 720px) { .catalogue { grid-template-columns: repeat(3,minmax(0,1fr)); } .product-detail { grid-template-columns: 1fr; } } @media (max-width: 480px) { .catalogue { grid-template-columns: repeat(2,minmax(0,1fr)); } .controls { grid-template-columns: 1fr; }.controls__search { grid-column: auto; } }
</style>
