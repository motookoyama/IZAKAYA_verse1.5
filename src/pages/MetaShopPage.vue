<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { apiRequest } from '../utils/api'
import { generateQrAssets } from '../utils/qrToolkit'
import { useTextInputControls } from '../composables/useTextInputControls'

type Message = {
  id: string
  role: 'npc' | 'user'
  text: string
}

const typeOptions = [
  { label: 'キャラ（話す人）', value: 'character', placeholder: '例: この町に住む少年と友達になりたい' },
  { label: 'ワールド（舞台）', value: 'world', placeholder: '例: 二つの太陽が昇る水上都市のルールを教えて' },
  { label: 'シナリオ（事件）', value: 'scenario', placeholder: '例: 女王が失踪した事件の真相を追いたい' },
  { label: 'ゲーム（ルール）', value: 'game', placeholder: '例: 3ターン制で記憶を奪い合う推理ゲームにしたい' },
] as const

type TypeValue = (typeof typeOptions)[number]['value']

type V2Card = {
  name: string
  role: string
  tags: string[]
  visibility: string
  persona: { prompt: string }
  safety: { consume: 'ignite_only' }
  source: {
    provider: string
    endpoint: string
    createdAt: string
    orderSummary: string
  }
  type?: TypeValue
  priority?: number
  conflictPolicy?: 'last_wins'
}

type StoredCard = {
  id: string
  createdAt: string
  title: string
  payload: V2Card
  script: string
  previewImage?: string | null
}

const LOG_TEXT = {
  connected: '回線を開いた。点火はいつでもできる。',
  generating: '工房を動かしている。少し待て。',
  success: '出力を整えておいた。確認してくれ。',
  empty: '応答が空だった。仮出力で補ってある。',
  failure: '生成に失敗した。モック出力で受け取ってくれ。',
}

const npcGreeting = 'よう。ここは生成工房だ。何を作る？'
const LIBRARY_KEY = 'izakaya:metashop:library'

const messages = ref<Message[]>([
  { id: 'msg-0', role: 'npc', text: npcGreeting },
])
const pendingInput = ref('')
const orderMemo = ref<string>('')

const toneOptions = [
  { label: '標準（ニュートラル）', value: 'Neutral' },
  { label: '明るい', value: 'Cheerful' },
  { label: '物悲しい', value: 'Melancholic' },
  { label: '混沌', value: 'Chaotic' },
] as const

const genreOptions = [
  { label: 'SF', value: 'Sci-Fi' },
  { label: 'ファンタジー', value: 'Fantasy' },
  { label: '日常系', value: 'Slice of Life' },
  { label: 'サスペンス', value: 'Thriller' },
] as const

const visibilityOptions = [
  { label: '非公開', value: 'private' },
  { label: '限定公開', value: 'unlisted' },
  { label: '公開', value: 'public' },
  { label: '限定公開（ネタバレ防止）', value: 'unlisted_spoiler' },
  { label: '公開（ネタバレ防止）', value: 'public_spoiler' },
] as const

const typePlaceholderMap: Record<TypeValue, string> = {
  character: '例: この町に住む少年と友達になりたい',
  world: '例: 二つの太陽が昇る水上都市のルールを教えて',
  scenario: '例: 女王が失踪した事件の真相を追いたい',
  game: '例: 3ターン制で記憶を奪い合う推理ゲームにしたい',
}

const typeRoleMap: Record<TypeValue, string> = {
  character: 'Meta Persona Seed',
  world: 'World Lore Seed',
  scenario: 'Scenario Relay Seed',
  game: 'Game Rule Seed',
}

const typeTagMap: Record<TypeValue, string> = {
  character: 'type:character',
  world: 'type:world',
  scenario: 'type:scenario',
  game: 'type:game',
}

const typePriorityMap: Record<TypeValue, number> = {
  world: 10,
  scenario: 50,
  character: 80,
  game: 90,
}

const DEFAULT_CONFLICT_POLICY = 'last_wins'

function resolveVisibility(value?: string | null): VisibilityValue {
  const match = visibilityOptions.find((opt) => opt.value === value)
  return match?.value ?? visibilityOptions[0].value
}

function resolveType(value?: string | null): TypeValue {
  const match = typeOptions.find((opt) => opt.value === value)
  return match?.value ?? typeOptions[0].value
}

function resolvePriority(value: number | undefined, type: TypeValue): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return typePriorityMap[type]
}

function resolveConflictPolicy(value?: string | null): 'last_wins' {
  return value === DEFAULT_CONFLICT_POLICY ? DEFAULT_CONFLICT_POLICY : DEFAULT_CONFLICT_POLICY
}

type ToneValue = (typeof toneOptions)[number]['value']
type GenreValue = (typeof genreOptions)[number]['value']
type VisibilityValue = (typeof visibilityOptions)[number]['value']

const adjustments = reactive<{
  tone: ToneValue
  genre: GenreValue
  visibility: VisibilityValue
  type: TypeValue
}>({
  tone: toneOptions[0].value,
  genre: genreOptions[2].value,
  visibility: visibilityOptions[0].value,
  type: typeOptions[0].value,
})

const gateOpen = ref(false)
const provider = ref<'bff'>('bff')
const providerConnected = ref(false)
const isIgniting = ref(false)
const libraryEntries = ref<StoredCard[]>([])
const captureInput = reactive({ url: '', wish: '' })
const previewImage = ref<string | null>(null)
const thumbnailInput = ref<HTMLInputElement | null>(null)
const actionFeedback = ref('')
const resultVisibility = ref<VisibilityValue>(adjustments.visibility)
const scriptCollapsed = ref(false)
const jsonCollapsed = ref(false)
const qrImage = ref<string | null>(null)
const qrEmbedded = ref<string | null>(null)
const qrSize = ref<number | null>(null)
const soulSeedJson = ref('')

const sampleScript = ref<string>(
  'Scene 01: Neon bar counter, soft rain outside.\n- Character greets patron with a weary smile.\n- Promise: keep secrets safe, but hint at hidden power.'
)
const sampleJson = ref<string>(
  JSON.stringify(
    {
      name: 'Prototype Spirit',
      description: 'A placeholder card exported from the Meta Shop mock.',
      tags: ['mock', 'atelier'],
      persona: 'Calm, reliable, slightly sarcastic.',
      safety: { consume: 'ignite_only' },
      source: {
        provider: 'mock',
        endpoint: '/chat/v1',
        createdAt: new Date().toISOString(),
        orderSummary: 'Sample prompt',
      },
      visibility: 'private',
      role: 'Meta Shop Prototype',
      type: 'character',
      priority: 80,
      conflictPolicy: 'last_wins',
    },
    null,
    2
  )
)

const parsedCard = computed(() => {
  try {
    return JSON.parse(sampleJson.value) as V2Card
  } catch {
    return null
  }
})

const selectedToneLabel = computed(() => toneOptions.find((opt) => opt.value === adjustments.tone)?.label ?? adjustments.tone)
const selectedGenreLabel = computed(() => genreOptions.find((opt) => opt.value === adjustments.genre)?.label ?? adjustments.genre)
const selectedVisibilityLabel = computed(() => visibilityOptions.find((opt) => opt.value === adjustments.visibility)?.label ?? adjustments.visibility)
const selectedTypeLabel = computed(() => typeOptions.find((opt) => opt.value === adjustments.type)?.label ?? adjustments.type)
const wishPlaceholder = computed(() => typePlaceholderMap[adjustments.type])
const spoilerGuard = computed(() => adjustments.visibility.includes('_spoiler'))
const hasOutput = computed(() => sampleScript.value.trim().length > 0)
const currentCardName = computed(() => parsedCard.value?.name ?? 'No Title')

const scriptSummary = computed(() => {
  const text = sampleScript.value || ''
  const length = text.length
  const sceneMatches = text.match(/scene\s*\d+/gi) ?? text.match(/scene/gi) ?? []
  const bulletMatches = text.match(/^\s*(?:[-*•+]|Scene)/gim) ?? []
  return {
    length,
    scenes: sceneMatches.length || Math.max(1, Math.floor(text.split(/\n\s*\n/).length)),
    keywords: Math.min(bulletMatches.length, 99),
  }
})

const jsonSummary = computed(() => {
  const fallback = {
    ok: false,
    name: '-',
    tags: 0,
    role: '-',
    visibility: resultVisibility.value,
  }
  if (!parsedCard.value) return fallback
  return {
    ok: true,
    name: parsedCard.value.name ?? '-',
    tags: Array.isArray(parsedCard.value.tags) ? parsedCard.value.tags.length : 0,
    role: parsedCard.value.role ?? '-',
    visibility: parsedCard.value.visibility ?? resultVisibility.value,
  }
})

const {
  handleKeydown: handleChatKeydown,
  onCompositionStart: onChatCompositionStart,
  onCompositionEnd: onChatCompositionEnd,
  toggleMic: toggleChatMic,
  listening: micListening,
  speechSupported,
  speechError,
} = useTextInputControls(pendingInput, { lang: 'ja-JP' })

function pushMessage(role: 'npc' | 'user', text: string) {
  const trimmed = text.trim()
  if (!trimmed) return
  messages.value = [
    ...messages.value,
    { id: `msg-${Date.now()}-${role}`, role, text: trimmed },
  ]
}

function handleSend() {
  const trimmed = pendingInput.value.trim()
  if (!trimmed) return
  pushMessage('user', trimmed)
  orderMemo.value = trimmed
  pendingInput.value = ''
}

function summarizeOrderMemo() {
  const wish = captureInput.wish.trim()
  const url = captureInput.url.trim()
  if (wish && url) {
    return `${wish}（${url}の世界観を半ずらしした兆し）`
  }
  if (wish) {
    return `${wish}（兆しとして再構築）`
  }
  if (url) {
    return `参照URL: ${url}`
  }
  return orderMemo.value
}

function onChatInputKeydown(event: KeyboardEvent) {
  handleChatKeydown(event, handleSend)
}

function onMicButtonClick() {
  toggleChatMic()
}

const hasOrder = computed(() => orderMemo.value.trim().length > 0)
const igniteDisabled = computed(() => isIgniting.value || !(providerConnected.value && hasOrder.value))
const igniteLockReason = computed(() => {
  if (isIgniting.value) return '🔥 生成中...'
  if (!providerConnected.value) return '🔒 Provider未接続：Access Gateで接続してください'
  if (!hasOrder.value) return '🔒 オーダーが空です：店主に話しかけて注文を作ってください'
  return ''
})

function handleGate() {
  gateOpen.value = true
}

function handleConnect() {
  if (provider.value === 'bff') {
    providerConnected.value = true
    gateOpen.value = false
    pushMessage('npc', LOG_TEXT.connected)
  }
}

function truncate(text = '', limit = 160) {
  if (!text) return ''
  if (text.length <= limit) return text
  return `${text.slice(0, limit - 1)}…`
}

type SeedContext = { url?: string; wish?: string }

function buildSoulSeedPayload(card: V2Card, script: string, context: SeedContext = { url: captureInput.url, wish: captureInput.wish }) {
  const normalizedType = resolveType(card.type ?? adjustments.type)
  const normalizedPriority = resolvePriority(card.priority, normalizedType)
  const normalizedConflict = resolveConflictPolicy(card.conflictPolicy)
  const tags = Array.isArray(card.tags) ? [...card.tags] : []
  if (!tags.some((tag) => tag.startsWith('type:'))) {
    tags.unshift(typeTagMap[normalizedType])
  }
  const seed = {
    v: 'soulseed:1.0',
    type: normalizedType,
    priority: normalizedPriority,
    conflict_policy: normalizedConflict,
    char: {
      n: truncate(card.name, 60),
      t: tags.slice(0, 3),
      p: truncate(card.persona.prompt ?? script, 240),
      s: truncate(`${adjustments.tone} / ${card.role}`, 120),
      f: context.url ? truncate(context.url, 140) : undefined,
      w: context.wish ? truncate(context.wish, 200) : undefined,
    },
  }
  const encoder = new TextEncoder()
  let json = JSON.stringify(seed)
  const dropOptional = () => {
    if (seed.char.w) {
      delete seed.char.w
      return true
    }
    if (seed.char.f) {
      delete seed.char.f
      return true
    }
    if (seed.char.t && seed.char.t.length > 1) {
      seed.char.t = seed.char.t.slice(0, Math.max(1, seed.char.t.length - 1))
      return true
    }
    if (seed.char.p.length > 120) {
      seed.char.p = truncate(seed.char.p, seed.char.p.length - 30)
      return true
    }
    return false
  }
  while (encoder.encode(json).length > 1000 && dropOptional()) {
    json = JSON.stringify(seed)
  }
  return { seed, json }
}

function buildV2Card(script: string, summary: string): V2Card {
  const now = new Date().toISOString()
  const safeVisibility = adjustments.visibility
  const normalizedType = adjustments.type
  const primaryLine = script
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)[0]
  const fallbackName = summary.trim() || `Workshop Draft ${now.slice(11, 19)}`
  const name = (primaryLine ?? fallbackName).replace(/^[-#*\s]+/, '').slice(0, 80) || fallbackName
  return {
    name,
    role: typeRoleMap[normalizedType],
    tags: ['metashop', adjustments.genre.toLowerCase(), typeTagMap[normalizedType]],
    visibility: safeVisibility,
    type: normalizedType,
    priority: typePriorityMap[normalizedType],
    conflictPolicy: DEFAULT_CONFLICT_POLICY,
    persona: { prompt: script },
    safety: { consume: 'ignite_only' },
    source: {
      provider: provider.value,
      endpoint: '/chat/v1',
      createdAt: now,
      orderSummary: summary,
    },
  }
}

function addToLibrary(card: V2Card, script: string) {
  const entry: StoredCard = {
    id: card.source.createdAt,
    createdAt: card.source.createdAt,
    title: card.name,
    payload: card,
    script,
    previewImage: previewImage.value,
  }
  libraryEntries.value = [entry, ...libraryEntries.value].slice(0, 24)
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(libraryEntries.value))
    } catch {
      // ignore quota errors
    }
  }
}

async function loadLibraryEntry(entry: StoredCard) {
  sampleJson.value = JSON.stringify(entry.payload, null, 2)
  sampleScript.value = entry.script
  previewImage.value = entry.previewImage ?? null
  const restoredVisibility = resolveVisibility(entry.payload.visibility)
  adjustments.visibility = restoredVisibility
  resultVisibility.value = restoredVisibility
  const restoredType = resolveType(entry.payload.type)
  adjustments.type = restoredType
  try {
    const seed = buildSoulSeedPayload(entry.payload, entry.script, {})
    soulSeedJson.value = seed.json
    const qr = await generateQrAssets(seed.json)
    qrImage.value = qr.raw
    qrEmbedded.value = qr.embedded
    qrSize.value = qr.sizeKb
  } catch {
    qrImage.value = null
    qrEmbedded.value = null
    qrSize.value = null
  }
  pushMessage('npc', `保管庫から ${entry.title} を表示した。`)
}

async function finalizeCardOutput(card: V2Card, script: string) {
  sampleScript.value = script
  sampleJson.value = JSON.stringify(card, null, 2)
  const normalizedVisibility = resolveVisibility(card.visibility)
  resultVisibility.value = normalizedVisibility
  const soulSeed = buildSoulSeedPayload(card, script)
  soulSeedJson.value = soulSeed.json
  try {
    const qr = await generateQrAssets(soulSeed.json)
    qrImage.value = qr.raw
    qrEmbedded.value = qr.embedded
    qrSize.value = qr.sizeKb
  } catch (err) {
    console.warn('[MetaShop:qr]', err)
    qrImage.value = null
    qrEmbedded.value = null
    qrSize.value = null
  }
}

async function applyDummyOutput(note?: string) {
  const summary = summarizeOrderMemo()
  const script = [
    `# Ignite Script (${adjustments.genre})`,
    `- Entry cue: ${summary}`,
    `- Tone: ${adjustments.tone}`,
    '- Output routed to library staging (mock)',
    ...(captureInput.url ? [`- Source URL: ${captureInput.url}`] : []),
    ...(captureInput.wish ? [`- Wish: ${captureInput.wish}`] : []),
    ...(note ? [`- Note: ${note}`] : []),
  ].join('\n')
  const card = buildV2Card(script, summary)
  await finalizeCardOutput(card, script)
  addToLibrary(card, script)
}

async function handleIgnite() {
  if (igniteDisabled.value) return
  isIgniting.value = true
  pushMessage('npc', LOG_TEXT.generating)
  try {
    const payload = {
      text: orderMemo.value,
      provider: provider.value,
      visibility: adjustments.visibility,
      meta: {
        source: 'meta-shop',
        tone: adjustments.tone,
        genre: adjustments.genre,
        type: adjustments.type,
        capture: {
          url: captureInput.url || undefined,
          wish: captureInput.wish || undefined,
          halfShift: Boolean(captureInput.wish || captureInput.url),
        },
      },
    }
    const response = await apiRequest<{
      reply?: string
      choices?: Array<{ message?: { content?: string } }>
    }>('/chat/v1', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const firstChoice = Array.isArray(response.choices) && response.choices.length > 0
      ? response.choices[0]?.message?.content?.trim()
      : undefined
    const text = response.reply?.trim() ?? firstChoice ?? ''
    if (text.length > 0) {
      const summary = summarizeOrderMemo()
      const card = buildV2Card(text, summary)
      await finalizeCardOutput(card, text)
      addToLibrary(card, text)
      pushMessage('npc', LOG_TEXT.success)
    } else {
      await applyDummyOutput('BFF応答が空だったためダミーを表示')
      pushMessage('npc', LOG_TEXT.empty)
    }
  } catch {
    pushMessage('npc', LOG_TEXT.failure)
    await applyDummyOutput('fallback (BFF error)')
  } finally {
    isIgniting.value = false
  }
}

if (typeof window !== 'undefined') {
  try {
    const raw = window.localStorage.getItem(LIBRARY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredCard[]
      if (Array.isArray(parsed)) {
        libraryEntries.value = parsed
      }
    }
  } catch {
    libraryEntries.value = []
  }
}

watch(
  spoilerGuard,
  (value) => {
    if (value) {
      scriptCollapsed.value = true
      jsonCollapsed.value = true
    } else {
      scriptCollapsed.value = false
      jsonCollapsed.value = false
    }
  },
  { immediate: true }
)

function triggerThumbnailPicker() {
  thumbnailInput.value?.click()
}

function handleThumbnailSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    target.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    previewImage.value = reader.result as string
  }
  reader.readAsDataURL(file)
  target.value = ''
}

async function downloadQr(raw: boolean) {
  const source = raw ? qrImage.value : qrEmbedded.value
  if (!source) return
  const response = await fetch(source)
  const blob = await response.blob()
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = `${currentCardName.value}${raw ? '-qr' : '-qr-data'}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(href)
}

function buildSharePackage(includeSpoilers: boolean) {
  const card = parsedCard.value
  const tags = Array.isArray(card?.tags) ? (card?.tags as string[]) : []
  const normalizedVisibility = resolveVisibility(card?.visibility ?? adjustments.visibility)
  const normalizedType = resolveType(card?.type ?? adjustments.type)
  const payload: {
    name: string
    role: string
    tags: string[]
    visibility: string
    type: TypeValue
    priority: number
    conflictPolicy: 'last_wins'
    previewImage?: string | null
    script?: string
    v2json?: V2Card
    summary?: {
      script: typeof scriptSummary.value
      v2json: typeof jsonSummary.value
    }
  } = {
    name: card?.name ?? 'Workshop Draft',
    role: card?.role ?? 'Meta Shop Prototype',
    tags,
    visibility: normalizedVisibility,
    type: normalizedType,
    priority: resolvePriority(card?.priority, normalizedType),
    conflictPolicy: resolveConflictPolicy(card?.conflictPolicy),
    previewImage: previewImage.value,
  }
  if (includeSpoilers && card) {
    payload.script = sampleScript.value
    payload.v2json = card
  } else {
    payload.summary = {
      script: scriptSummary.value,
      v2json: jsonSummary.value,
    }
  }
  return payload
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function dataUrlToBlob(dataUrl: string) {
  const [meta, content] = dataUrl.split(',')
  if (!meta || !content) return null
  const mimeMatch = meta.match(/data:(.*?);base64/)
  if (!mimeMatch) return null
  const byteCharacters = atob(content)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeMatch[1] })
}

async function handleShare() {
  if (!hasOutput.value) return
  const includeSpoilers = !spoilerGuard.value
  const payload = buildSharePackage(includeSpoilers)
  try {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    actionFeedback.value = includeSpoilers
      ? 'カードJSONをクリップボードにコピーしました。'
      : 'ネタバレを除いた要約をコピーしました。'
  } catch {
    actionFeedback.value = 'クリップボードにコピーできませんでした。'
  }
  setTimeout(() => {
    actionFeedback.value = ''
  }, 4000)
}

function handleDownload() {
  if (!hasOutput.value) return
  const includeSpoilers = !spoilerGuard.value
  const payload = buildSharePackage(includeSpoilers)
  const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  downloadBlob(jsonBlob, 'card.json')
  if (previewImage.value) {
    const blob = dataUrlToBlob(previewImage.value)
    if (blob) {
      downloadBlob(blob, 'thumbnail.png')
    }
  }
  actionFeedback.value = includeSpoilers
    ? 'card.json をダウンロードしました。'
    : '要約card.jsonをダウンロードしました。'
  setTimeout(() => {
    actionFeedback.value = ''
  }, 4000)
}
</script>

<template>
  <section class="meta-shop">
    <header class="meta-shop__header">
      <div>
        <p class="meta-shop__kicker">META SHOP</p>
        <h1>Order Workshop</h1>
      </div>
      <div class="meta-shop__hint">
        <strong>入口は会話。消費はIGNITEのみ。</strong>
        <span>Gate で接続するまではプレビュー専用モードです。</span>
      </div>
    </header>

    <div class="meta-shop__grid">
      <!-- Chat -->
      <section class="meta-shop__section">
        <div class="meta-shop__section-header">
          <span>店主チャット</span>
          <small>Mr.Reverse を呼び出す</small>
        </div>
        <div class="chat-panel">
          <div class="chat-panel__portrait">
            <div class="chat-panel__avatar">MR</div>
            <span>Mr.Reverse</span>
          </div>
          <div class="chat-panel__dialog">
            <div class="chat-panel__log">
              <p
                v-for="message in messages"
                :key="message.id"
                :class="['chat-panel__bubble', message.role === 'npc' ? 'is-npc' : 'is-user']"
              >
                {{ message.text }}
              </p>
            </div>
            <div class="chat-panel__controls">
              <div class="chat-panel__input-wrapper">
                <input
                  v-model="pendingInput"
                  type="text"
                  class="chat-panel__input"
                  placeholder="今日のご注文は？"
                  @keydown="onChatInputKeydown"
                  @compositionstart="onChatCompositionStart"
                  @compositionend="onChatCompositionEnd"
                />
                <button
                  v-if="speechSupported"
                  type="button"
                  class="chat-panel__mic"
                  :class="{ 'is-active': micListening }"
                  @click="onMicButtonClick"
                >
                  🎤
                </button>
              </div>
              <div class="chat-panel__input-hint">
                <small>送信：⌘/Ctrl+Enter</small>
                <small v-if="speechSupported">音声入力</small>
                <small v-else>音声入力は未対応</small>
              </div>
              <p v-if="speechError" class="chat-panel__mic-error">{{ speechError }}</p>
              <div class="chat-panel__actions">
                <button type="button" class="ghost-btn" @click="handleGate">Access Gate</button>
                <button type="button" class="primary-btn" @click="handleSend">Send</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Order -->
      <section class="meta-shop__section">
        <div class="meta-shop__section-header">
          <span>オーダー確認</span>
          <small>Quote → Confirm → Ignite</small>
        </div>
        <div class="order-panel">
          <div class="order-panel__summary">
            <h3>要約</h3>
            <p>{{ orderMemo || '（入力待ち）' }}</p>
            <ul>
              <li><strong>トーン:</strong> {{ selectedToneLabel }}</li>
              <li><strong>ジャンル:</strong> {{ selectedGenreLabel }}</li>
              <li><strong>公開設定:</strong> {{ selectedVisibilityLabel }}</li>
              <li><strong>種別:</strong> {{ selectedTypeLabel }}</li>
            </ul>
          </div>
          <div class="order-panel__form">
          <label>
            <span>トーン</span>
            <select v-model="adjustments.tone">
                <option v-for="tone in toneOptions" :key="tone.value" :value="tone.value">
                  {{ tone.label }}
                </option>
              </select>
            </label>
            <label>
              <span>ジャンル</span>
              <select v-model="adjustments.genre">
                <option v-for="genre in genreOptions" :key="genre.value" :value="genre.value">
                  {{ genre.label }}
                </option>
              </select>
            </label>
            <label>
              <span>種別 (Type)</span>
              <select v-model="adjustments.type">
                <option v-for="type in typeOptions" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </label>
            <label>
              <span>公開設定</span>
              <select v-model="adjustments.visibility">
                <option v-for="visibility in visibilityOptions" :key="visibility.value" :value="visibility.value">
                  {{ visibility.label }}
                </option>
            </select>
          </label>
          <label class="order-panel__full">
            <span>URL</span>
            <input v-model="captureInput.url" type="url" placeholder="参考にしたい世界のURL" />
          </label>
          <label class="order-panel__full">
            <span>願い (Wish)</span>
            <textarea v-model="captureInput.wish" rows="2" :placeholder="wishPlaceholder"></textarea>
          </label>
        </div>
          <div class="order-panel__actions">
            <button type="button">Quote</button>
            <button type="button">Confirm</button>
            <div class="order-panel__ignite">
              <button type="button" :disabled="igniteDisabled" @click="handleIgnite">
                <span>IGNITE ▶</span>
              </button>
              <small>{{ igniteLockReason }}</small>
            </div>
          </div>
        </div>
      </section>

      <!-- Output -->
      <section class="meta-shop__section">
        <div class="meta-shop__section-header">
          <span>出力プレビュー</span>
          <small>生成結果をそのまま確認</small>
        </div>
        <div class="output-panel">
          <div class="output-panel__card">
            <input
              ref="thumbnailInput"
              type="file"
              accept="image/*"
              hidden
              @change="handleThumbnailSelected"
            />
            <p class="output-card__label">生成カード</p>
            <div class="output-card__image" :class="{ 'has-image': previewImage }">
              <img v-if="previewImage" :src="previewImage" alt="生成された立ち絵" />
              <span v-else>立ち絵プレビュー</span>
            </div>
            <p class="output-card__name">{{ currentCardName }}</p>
            <button type="button" class="ghost-btn output-card__change" @click="triggerThumbnailPicker">
              画像変更
            </button>
          </div>
          <div class="output-panel__script">
            <label>Script</label>
            <div v-if="spoilerGuard && scriptCollapsed" class="spoiler-guard">
              <p>（ネタバレ防止）内容は折りたたまれています。必要なときだけ表示してください。</p>
              <p class="spoiler-guard__summary">
                長さ: {{ scriptSummary.length }}文字 / シーン: {{ scriptSummary.scenes }} / キーワード: {{ scriptSummary.keywords }}
              </p>
              <button type="button" class="ghost-btn" @click="scriptCollapsed = false">👁 表示する</button>
            </div>
            <template v-else>
              <textarea v-model="sampleScript" spellcheck="false"></textarea>
              <button
                v-if="spoilerGuard"
                type="button"
                class="ghost-btn align-end"
                @click="scriptCollapsed = true"
              >
                🙈 隠す
              </button>
            </template>
          </div>
          <div class="output-panel__json">
            <label>V2 JSON</label>
            <div v-if="spoilerGuard && jsonCollapsed" class="spoiler-guard">
              <p>（ネタバレ防止）内容は折りたたまれています。必要なときだけ表示してください。</p>
              <p class="spoiler-guard__summary">
                JSON {{ jsonSummary.ok ? 'OK' : 'NG' }} / name: {{ jsonSummary.name }} / tags: {{ jsonSummary.tags }} /
                role: {{ jsonSummary.role }} / visibility: {{ jsonSummary.visibility }}
              </p>
              <button type="button" class="ghost-btn" @click="jsonCollapsed = false">👁 表示する</button>
            </div>
            <template v-else>
              <textarea v-model="sampleJson" spellcheck="false"></textarea>
              <button
                v-if="spoilerGuard"
                type="button"
                class="ghost-btn align-end"
                @click="jsonCollapsed = true"
              >
                🙈 隠す
              </button>
            </template>
          </div>
          <div class="output-panel__qr">
            <label>QR転生コード</label>
            <div v-if="qrImage" class="qr-preview">
              <img :src="qrImage" alt="QR Preview" />
              <p class="qr-meta" v-if="qrSize">{{ qrSize.toFixed(2) }} KB</p>
              <div class="qr-actions">
                <button type="button" class="ghost-btn" :disabled="!qrImage" @click="downloadQr(true)">QR</button>
                <button type="button" class="ghost-btn" :disabled="!qrEmbedded" @click="downloadQr(false)">
                  QR+埋込
                </button>
              </div>
            </div>
            <p v-else class="qr-placeholder">IGNITEでQRを生成します。</p>
          </div>
          <div v-if="hasOutput" class="output-panel__actions">
            <div class="output-panel__actions-header">
              <span>次にすること</span>
              <small>保存は自動です。共有またはダウンロードを選んでください。</small>
            </div>
            <div class="output-panel__actions-buttons">
              <button
                type="button"
                class="primary-btn"
                :disabled="!hasOutput"
                @click="handleShare"
              >
                共有（エクスポート）
              </button>
              <button type="button" :disabled="!hasOutput" @click="handleDownload">ダウンロード</button>
            </div>
            <small v-if="spoilerGuard" class="output-panel__note">
              ネタバレ防止モードのため、共有/ダウンロードでは安全な要約のみを含みます。
            </small>
            <p v-if="actionFeedback" class="output-panel__feedback">{{ actionFeedback }}</p>
          </div>
        </div>
      </section>

      <section class="meta-shop__section">
        <div class="meta-shop__section-header">
          <span>Library</span>
          <small>直近の生成を保存</small>
        </div>
        <div v-if="libraryEntries.length" class="library-list">
          <article
            v-for="entry in libraryEntries.slice(0, 3)"
            :key="entry.id"
            class="library-item"
          >
            <div>
              <p class="library-item__title">{{ entry.title }}</p>
              <small>{{ new Date(entry.createdAt).toLocaleString() }}</small>
            </div>
            <button type="button" class="ghost-btn" @click="loadLibraryEntry(entry)">
              Load
            </button>
          </article>
        </div>
        <p v-else class="library-empty">まだ保存はありません。</p>
      </section>
    </div>
  </section>
  <transition name="gate-fade">
    <div v-if="gateOpen" class="gate-overlay">
      <div class="gate-sheet">
        <header>
          <h3>Access Gate</h3>
          <button type="button" @click="gateOpen = false">×</button>
        </header>
        <p class="gate-sheet__hint">接続先を選んで Connect を押してください。</p>
        <label>
          <span>Provider</span>
          <select v-model="provider">
            <option value="bff">IZAKAYA BFF（推奨）</option>
          </select>
        </label>
        <button type="button" class="primary-btn" @click="handleConnect">Connect</button>
        <p class="gate-sheet__status">
          状態:
          <strong>{{ providerConnected ? 'CONNECTED' : 'NOT CONNECTED' }}</strong>
        </p>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.meta-shop {
  display: grid;
  gap: 24px;
}

.meta-shop__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  padding-bottom: 12px;
}

.meta-shop__kicker {
  font-size: 0.75rem;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 6px;
}

.meta-shop__header h1 {
  margin: 0;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  letter-spacing: 0.1em;
}

.meta-shop__hint {
  font-size: 0.85rem;
  display: grid;
  gap: 4px;
  text-align: right;
  color: rgba(255, 255, 255, 0.8);
}

.meta-shop__grid {
  display: grid;
  gap: 24px;
}

.meta-shop__section {
  padding: clamp(16px, 3vw, 24px);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(12, 18, 32, 0.85);
  display: grid;
  gap: 18px;
}

.meta-shop__section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: rgba(255, 255, 255, 0.7);
}

.chat-panel {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 16px;
}

.chat-panel__portrait {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 16px;
  display: grid;
  place-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.3);
}

.chat-panel__avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(120deg, #ff6b6b, #feca57);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 1.2rem;
}

.chat-panel__dialog {
  display: grid;
  gap: 12px;
}

.chat-panel__log {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.25);
  max-height: 260px;
  overflow-y: auto;
  display: grid;
  gap: 8px;
}

.chat-panel__bubble {
  margin: 0;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.4;
}

.chat-panel__bubble.is-npc {
  background: rgba(103, 232, 249, 0.12);
  border: 1px solid rgba(103, 232, 249, 0.35);
}

.chat-panel__bubble.is-user {
  background: rgba(129, 140, 248, 0.15);
  border: 1px solid rgba(129, 140, 248, 0.35);
}

.chat-panel__controls {
  display: grid;
  gap: 8px;
}

.chat-panel__input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.chat-panel__input {
  width: 100%;
  padding: 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.3);
  color: inherit;
}

.chat-panel__mic {
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.chat-panel__mic.is-active {
  background: rgba(34, 197, 94, 0.25);
  border-color: rgba(34, 197, 94, 0.6);
}

.chat-panel__input-hint {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  opacity: 0.75;
  flex-wrap: wrap;
}

.chat-panel__mic-error {
  margin: 0;
  font-size: 0.78rem;
  color: #f87171;
}

.chat-panel__actions {
  display: flex;
  gap: 8px;
}

.ghost-btn,
.primary-btn,
.order-panel__actions button,
.order-panel__ignite button {
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid transparent;
}

.ghost-btn {
  border-color: rgba(255, 255, 255, 0.3);
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
}

.primary-btn {
  background: linear-gradient(120deg, #7f5eff, #3ac7f2);
  color: #111;
  font-weight: 700;
}

.order-panel {
  display: grid;
  gap: 16px;
}

.order-panel__summary {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.25);
  display: grid;
  gap: 6px;
}

.order-panel__summary h3 {
  margin: 0;
  letter-spacing: 0.2em;
}

.order-panel__form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.order-panel__full {
  grid-column: 1 / -1;
}

.order-panel__form label {
  display: grid;
  gap: 6px;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.order-panel__form select {
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.3);
  color: inherit;
}

.order-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.order-panel__actions button {
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
}

.order-panel__ignite {
  display: grid;
  gap: 4px;
}

.order-panel__ignite button {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.4);
  border-color: rgba(255, 255, 255, 0.2);
}

.order-panel__ignite small {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
}

.output-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.output-panel__card {
  border: 1px dashed rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 18px;
  display: grid;
  gap: 12px;
  background: rgba(0, 0, 0, 0.35);
  text-align: center;
}

.output-card__image {
  height: 220px;
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.4);
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.output-card__label {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}

.output-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.output-card__name {
  margin: 0;
  font-weight: 600;
}

.output-card__change {
  justify-self: center;
  width: 100%;
}

.output-panel__script,
.output-panel__json {
  display: grid;
  gap: 6px;
}

.output-panel__qr {
  display: grid;
  gap: 8px;
}

.output-panel label {
  font-size: 0.78rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.output-panel textarea {
  min-height: 200px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  color: inherit;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: 0.85rem;
}

.qr-preview {
  border: 1px dashed rgba(255, 255, 255, 0.25);
  border-radius: 14px;
  padding: 12px;
  display: grid;
  gap: 8px;
  place-items: center;
}

.qr-preview img {
  width: 160px;
  height: 160px;
  object-fit: contain;
}

.qr-actions {
  display: flex;
  gap: 8px;
}

.qr-placeholder {
  font-size: 0.85rem;
  opacity: 0.7;
}

.ghost-btn.align-end {
  justify-self: end;
  margin-top: 8px;
}

.spoiler-guard {
  border: 1px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 8px;
  background: rgba(0, 0, 0, 0.25);
  font-size: 0.85rem;
}

.spoiler-guard__summary {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
}

.output-panel__actions {
  grid-column: 1 / -1;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  padding: 16px;
  display: grid;
  gap: 12px;
  background: rgba(0, 0, 0, 0.25);
}

.output-panel__actions-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.output-panel__actions-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.output-panel__actions-buttons button {
  flex: 1;
  min-width: 160px;
}

.output-panel__note {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.8);
}

.output-panel__feedback {
  margin: 0;
  font-size: 0.82rem;
  color: var(--brand-2, #58cff5);
}

@media (max-width: 960px) {
  .chat-panel {
    grid-template-columns: 1fr;
  }

  .output-panel {
    grid-template-columns: 1fr;
  }
}

.library-list {
  display: grid;
  gap: 12px;
}

.library-item {
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(0, 0, 0, 0.25);
}

.library-item__title {
  margin: 0;
  font-weight: 600;
}

.library-empty {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.gate-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  z-index: 20;
}

.gate-sheet {
  width: min(360px, 90vw);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(8, 12, 20, 0.95);
  padding: 20px;
  display: grid;
  gap: 12px;
}

.gate-sheet header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gate-sheet header h3 {
  margin: 0;
  letter-spacing: 0.3em;
  font-size: 0.95rem;
}

.gate-sheet header button {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.2rem;
}

.gate-sheet label {
  display: grid;
  gap: 6px;
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.gate-sheet select {
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: inherit;
}

.gate-sheet__hint {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
}

.gate-sheet__status {
  font-size: 0.85rem;
}

.gate-fade-enter-active,
.gate-fade-leave-active {
  transition: opacity 0.2s ease;
}

.gate-fade-enter-from,
.gate-fade-leave-to {
  opacity: 0;
}
</style>
