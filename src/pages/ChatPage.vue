<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import V2ChatWorkspace from '../components/V2ChatWorkspace.vue'
import ConnectionStatus from '../components/ConnectionStatus.vue'
import { useAccount } from '../composables/useAccount'
import { useTheme } from '../composables/useTheme'
import { navigatorCards, findNavigatorCard } from '../data/sampleCards'
import type { FeatureContent, ChatContent, AccountAction, AccountContent } from '../types/home'
import type { ChatMessage } from '../composables/useChat'
import chatIcon from '../assets/icons/chat-frame.png'
import { determineCardRole, loadRoleOverrides, persistRoleOverrides, type CardRole } from '../utils/cardRoles'
import { API_BASE } from '../utils/api'

const { tm } = useI18n({ useScope: 'global' })

const page = computed(() => tm('pages.chat') as {
  title: string
  quickHint?: string
  lead: string[]
  workflowTitle: string
  workflow: string[]
  notesTitle: string
  notes: string[]
})
const features = computed(() => (tm('home.features') as FeatureContent[]).find((item) => item.id === 'v2chat'))
const baseChat = computed<ChatContent>(() => tm('home.chat') as ChatContent)
const accountCopy = computed<AccountContent>(() => tm('home.account') as AccountContent)
const { currentTheme } = useTheme()

const {
  state: accountState,
  formattedPoints,
  addPoints,
  cyclePersona,
  fetchAccount,
  loading,
  error,
  apiOnline,
  connectionIssue,
} = useAccount()
const connectionTarget = API_BASE
const adminTagPattern = /(管理|管理者|翻訳|経理)/
const preferredCardIds = ['dr-orb', 'miss-madi', 'ekubo']

const playerNavigatorCards = computed(() => {
  const filtered = navigatorCards.filter((card) => !card.tags.some((tag) => adminTagPattern.test(tag)))
  const guaranteed = navigatorCards.filter((card) => preferredCardIds.includes(card.id))
  const merged = [...guaranteed, ...(filtered.length ? filtered : navigatorCards)]
  const map = new Map<string, (typeof navigatorCards)[number]>()
  merged.forEach((card) => map.set(card.id, card))
  return Array.from(map.values())
})

const cardLookup = computed(() => {
  const map = new Map<string, (typeof navigatorCards)[number]>()
  playerNavigatorCards.value.forEach((card) => map.set(card.id, card))
  return map
})

const cardRoleMap = computed<Record<string, CardRole>>(() => {
  const bucket: Record<string, CardRole> = {}
  playerNavigatorCards.value.forEach((card) => {
    bucket[card.id] = determineCardRole(card, cardRoleOverrides.value)
  })
  return bucket
})

const DEFAULT_SLOT_ORDER = ['dr-orb', 'miss-madi', 'ekubo']
const SLOT_STORAGE_KEY = 'izakaya-chat-slots'
const slotAssignments = ref<Array<string | null>>([null, null, null])
const selectedCard = ref<string>('')
const TENSION_STORAGE_KEY = 'izakaya-chat-tension'
const FREE_TALK_STORAGE_KEY = 'izakaya-chat-free-talk'

type SlotEventKind = 'enter' | 'leave' | 'swap' | 'world' | 'scenario'
type SlotEvent = {
  id: string
  slotIndex: number
  kind: SlotEventKind
  cardId?: string | null
  prevCardId?: string | null
  cardName?: string
  prevCardName?: string
  at: number
  summary?: string
}

const SLOT_EVENT_LIMIT = 5

function loadStoredTension(): number {
  if (typeof window === 'undefined') return 50
  const raw = window.localStorage.getItem(TENSION_STORAGE_KEY)
  if (raw === null) return 50
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return 50
  return Math.min(100, Math.max(0, Math.round(parsed)))
}

function loadStoredFreeTalk(): boolean {
  if (typeof window === 'undefined') return true
  const raw = window.localStorage.getItem(FREE_TALK_STORAGE_KEY)
  if (raw === null) return true
  return raw === '1'
}

const tensionRate = ref(loadStoredTension())
const freeTalkEnabled = ref(loadStoredFreeTalk())
const slotEvents = ref<SlotEvent[]>([])
const referentialResponse = ref<{ role: CardRole; text: string; cardId: string } | null>(null)
const cardRoleOverrides = ref<Record<string, CardRole>>(loadRoleOverrides())

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

const activeCards = computed(() =>
  slotAssignments.value
    .map((id) => (id ? cardLookup.value.get(id) : undefined))
    .filter((card): card is typeof navigatorCards[number] => Boolean(card))
)

const benchCards = computed(() => {
  const assigned = new Set(slotAssignments.value.filter((id): id is string => Boolean(id)))
  return playerNavigatorCards.value.filter((card) => !assigned.has(card.id))
})

function loadStoredSlots(): Array<string | null> {
  if (typeof window === 'undefined') return [null, null, null]
  try {
    const stored = JSON.parse(window.localStorage.getItem(SLOT_STORAGE_KEY) ?? '[]')
    if (Array.isArray(stored)) {
      return [stored[0] ?? null, stored[1] ?? null, stored[2] ?? null]
    }
  } catch {
    // ignore parse errors
  }
  return [null, null, null]
}

function persistSlots(slots: Array<string | null>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SLOT_STORAGE_KEY, JSON.stringify(slots))
  } catch {
    // ignore quota errors
  }
}

function sanitizeSlots(cardIds: string[], slots: Array<string | null>) {
  const normalized: Array<string | null> = [null, null, null]
  const used = new Set<string>()
  slots.forEach((id, index) => {
    if (typeof id === 'string' && cardIds.includes(id) && index < normalized.length && !used.has(id)) {
      normalized[index] = id
      used.add(id)
    }
  })
  for (const preferred of DEFAULT_SLOT_ORDER) {
    if (!cardIds.includes(preferred)) continue
    if (used.has(preferred)) continue
    const emptyIndex = normalized.findIndex((value) => !value)
    if (emptyIndex === -1) break
    normalized[emptyIndex] = preferred
    used.add(preferred)
  }
  for (let i = 0; i < normalized.length; i += 1) {
    if (normalized[i]) continue
    const next = cardIds.find((id) => !used.has(id))
    if (!next) break
    normalized[i] = next
    used.add(next)
  }
  return normalized
}

watch(
  playerNavigatorCards,
  (cards) => {
    const ids = cards.map((card) => card.id)
    if (ids.length === 0) {
      slotAssignments.value = [null, null, null]
      selectedCard.value = ''
      return
    }
    const stored = loadStoredSlots()
    slotAssignments.value = sanitizeSlots(ids, stored)
    if (!slotAssignments.value.includes(selectedCard.value)) {
      selectedCard.value = (slotAssignments.value.find((id): id is string => Boolean(id)) ?? '')
    }
  },
  { immediate: true }
)

watch(
  slotAssignments,
  (slots) => {
    persistSlots(slots)
    if (!slots.includes(selectedCard.value)) {
      selectedCard.value = (slots.find((id): id is string => Boolean(id)) ?? '')
    }
  },
  { deep: true }
)

watch(
  tensionRate,
  (value) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(TENSION_STORAGE_KEY, String(clampPercentage(value)))
    } catch {
      // ignore storage errors
    }
  },
  { immediate: true }
)

watch(
  freeTalkEnabled,
  (value) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(FREE_TALK_STORAGE_KEY, value ? '1' : '0')
    } catch {
      // ignore storage errors
    }
  },
  { immediate: true }
)

watch(
  cardRoleOverrides,
  (value) => {
    persistRoleOverrides(value)
  },
  { deep: true }
)

watch(
  slotAssignments,
  (slots, previous) => {
    const prevSlots = Array.isArray(previous) ? previous : [null, null, null]
    for (let i = 0; i < slots.length; i += 1) {
      const next = slots[i]
      const prev = prevSlots[i] ?? null
      if (next === prev) continue
      if (!prev && next) {
        recordSlotEvent('enter', i, next, prev)
      } else if (prev && !next) {
        recordSlotEvent('leave', i, null, prev)
      } else if (prev && next && prev !== next) {
        recordSlotEvent('swap', i, next, prev)
      }
    }
  },
  { deep: true }
)

function recordSlotEvent(kind: SlotEventKind, slotIndex: number, nextId: string | null, prevId: string | null, summary?: string) {
  const nextCard = nextId ? cardLookup.value.get(nextId) : undefined
  const prevCard = prevId ? cardLookup.value.get(prevId) : undefined
  const entry: SlotEvent = {
    id: `${Date.now()}-${slotIndex}-${kind}`,
    slotIndex,
    kind,
    cardId: nextId,
    prevCardId: prevId,
    cardName: nextCard?.name,
    prevCardName: prevCard?.name,
    at: Date.now(),
    summary,
  }
  slotEvents.value = [...slotEvents.value.slice(-(SLOT_EVENT_LIMIT - 1)), entry]
}

function recordReferenceEvent(kind: 'world' | 'scenario', card: (typeof navigatorCards)[number], summary: string) {
  const entry: SlotEvent = {
    id: `${Date.now()}-${card.id}-${kind}`,
    slotIndex: -1,
    kind,
    cardId: card.id,
    cardName: card.name,
    at: Date.now(),
    summary,
  }
  slotEvents.value = [...slotEvents.value.slice(-(SLOT_EVENT_LIMIT - 1)), entry]
}

const cardSlots = computed(() =>
  activeCards.value.map((card) => ({
    id: card.id,
    title: card.name,
    thumbnail: card.avatar,
    summary: card.summary,
    tags: card.tags,
  }))
)

const extraSlots = computed(() =>
  benchCards.value.map((card) => ({
    id: card.id,
    title: card.name,
  }))
)

const slotAssignmentsDetail = computed(() =>
  slotAssignments.value.map((cardId, index) => {
    const card = cardId ? cardLookup.value.get(cardId) : undefined
    return {
      slotIndex: index,
      cardId,
      card: card
        ? {
            id: card.id,
            title: card.name,
            tags: card.tags,
            summary: card.summary,
            avatar: card.avatar,
          }
        : undefined,
    }
  })
)

const rosterCards = computed(() =>
  playerNavigatorCards.value.map((card) => ({
    id: card.id,
    title: card.name,
    summary: card.summary,
    avatar: card.avatar,
  }))
)

const selectedNavigator = computed(() => (selectedCard.value ? findNavigatorCard(selectedCard.value) : undefined))
const selectedCardRole = computed<CardRole>(() => cardRoleMap.value[selectedCard.value] ?? 'UNKNOWN')

function slotLabel(index: number) {
  switch (index) {
    case 0:
      return 'Slot1（メイン）'
    case 1:
      return 'Slot2（ワールド）'
    case 2:
      return 'Slot3（シナリオ）'
    default:
      return `Slot${index + 1}`
  }
}

function describeSlotEvent(event: SlotEvent) {
  const label = slotLabel(event.slotIndex)
  switch (event.kind) {
    case 'enter':
      return `${label}: ${event.cardName ?? 'カード'} が登場（挨拶は短く）`
    case 'leave':
      return `${label}: ${event.prevCardName ?? 'カード'} を退避`
    case 'swap':
      return `${label}: ${event.prevCardName ?? 'カード'} → ${event.cardName ?? 'カード'} に切り替え`
    case 'world':
      return `[WORLD] ${event.cardName ?? 'カード'}: ${truncateLine(event.summary ?? '状況描写を参照', 60)}`
    case 'scenario':
      return `[SCENARIO] ${event.cardName ?? 'カード'}`
    default:
      return undefined
  }
}

const slotEventNotes = computed(() =>
  slotEvents.value
    .slice(-3)
    .map((event) => describeSlotEvent(event))
    .filter((note): note is string => Boolean(note))
)

const navigatorChatContent = computed<ChatContent>(() => {
  const base = baseChat.value
  const active = selectedNavigator.value ?? navigatorCards[0]
  const title = active ? `${active.name} · ${active.tags.join(', ')}` : base.title
  const systemPrompt = [base.systemPrompt, active?.summary].filter(Boolean).join('\n\n')
  return {
    ...base,
    title,
    systemPrompt,
  }
})

const quickActions = computed<AccountAction[]>(() => accountCopy.value.actions?.items ?? [])

const wallpaperOptions = computed(() => {
  const raw = tm('pages.chat.wallpapers') as unknown
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .map((entry) => ({
      id: String(entry?.id ?? ''),
      label: String(entry?.label ?? ''),
      value: String(entry?.value ?? ''),
    }))
    .filter((item) => item.id.length > 0 && item.label.length > 0)
})
const wallpaperId = ref('')
const wallpaperCustom = ref('')
const defaultWallpaper = computed(() => {
  const themeId = currentTheme.value.id
  return themeId === 'hanami-sakura' || themeId === 'rose-aurora'
    ? 'rgba(255, 255, 255, 0.82)'
    : 'rgba(12, 18, 32, 0.55)'
})
watch(wallpaperOptions, (options) => {
  if (!options.length) return
  if (wallpaperId.value === 'custom' && wallpaperCustom.value.trim().length > 0) {
    return
  }
  if (!options.some((item) => item.id === wallpaperId.value)) {
    const first = options[0]
    if (first) {
      wallpaperId.value = first.id
    }
  }
}, { immediate: true })
const wallpaperValue = computed(() => {
  if (wallpaperCustom.value.trim().length > 0) {
    return wallpaperCustom.value
  }
  const found = wallpaperOptions.value.find((item) => item.id === wallpaperId.value)
  return found?.value ?? defaultWallpaper.value
})
const sideNotes = computed(() => features.value?.bullets ?? [])

function summarizeCardSlot(card?: (typeof navigatorCards)[number]) {
  if (!card) return undefined
  const parts = [card.name]
  if (card.summary) parts.push(card.summary)
  const raw = card.raw?.data ?? card.raw
  const persona = normalizeMultiline(raw?.persona ?? raw?.personality)
  if (persona) {
    parts.push(`Persona: ${persona.split('\n')[0]}`)
  }
  const scenario = normalizeMultiline(raw?.scenario)
  if (scenario) {
    parts.push(`Scenario: ${scenario.split('\n')[0]}`)
  }
  return parts.filter(Boolean).join(' / ')
}

function truncateLine(text: string, limit = 160) {
  if (!text) return ''
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`
}

function splitSentences(source?: string | null, take = 3) {
  if (!source) return []
  const fragments = source
    .split(/[\n。！？!?]+/)
    .map((line) => line.trim())
    .filter(Boolean)
  return fragments.slice(0, take)
}

function buildWorldDescription(card: (typeof navigatorCards)[number]) {
  const raw = (card.raw?.data ?? card.raw ?? {}) as Record<string, any>
  const candidates = [
    normalizeMultiline(raw?.world),
    normalizeMultiline(raw?.setting),
    normalizeMultiline(raw?.description),
    normalizeMultiline(card.summary),
  ]
  const joined = candidates.filter(Boolean).join('\n')
  const sentences = splitSentences(joined || card.name, 3).map((line) => truncateLine(line, 140))
  if (!sentences.length) {
    return `${card.name} の環境情報は準備中です。`
  }
  return sentences.join(' ')
}

function buildScenarioDigest(card: (typeof navigatorCards)[number]) {
  const raw = (card.raw?.data ?? card.raw ?? {}) as Record<string, any>
  const scenario = normalizeMultiline(raw?.scenario ?? raw?.story ?? raw?.outline)
  const summary = normalizeMultiline(card.summary)
  const sentences = splitSentences(scenario || summary || card.name, 3).map((line) => truncateLine(line, 120))
  const [intro, current, next] = sentences
  return [
    `・ここまで: ${intro ?? '情報収集中'}`,
    `・現在地: ${current ?? '状況整理中'}`,
    `・次: ${next ?? '分岐を選んでください'}`,
  ].join('\n')
}

function slotRuleByIndex(index: number) {
  switch (index) {
    case 0:
      return [
        '【Slot1ガイド：キャラクター】',
        '・初回ドロップでは一言の挨拶のみ。長文自己紹介は禁止。',
        '・再ドロップ時は感情や立ち位置を短く伝える。',
        '・会話中はユーザーのテンポに合わせ、人格の没入感を最優先する。',
      ].join('\n')
    case 1:
      return [
        '【Slot2ガイド：World Bias】',
        '・ドロップ時に世界観や空気感を1行で提示（長文禁止）。',
        '・状況変化があれば一言で更新し、Slot1の解釈を支援する。',
      ].join('\n')
    case 2:
      return [
        '【Slot3ガイド：Scenario Bias】',
        '・現在のフェーズや課題を短く示し、次に進むための条件を整理する。',
        '・差し替え時はシーン転換として扱い、新たな行動候補を示す。',
      ].join('\n')
    default:
      return ''
  }
}

const conversationGuide = computed(() => {
  const lines = [
    '【会話進行ルール】',
    '1. カードを初めて置いたら、本人・世界・シナリオが一言だけ挨拶/状況説明を行う。',
    '2. 再配置・切替時は「今の気分」「空気」「フェーズ変化」を短く共有する。',
    `3. 自由発言スイッチ: ${freeTalkEnabled.value ? 'ON（意見を持つカードだけが自然に参加）' : 'OFF（指名したカードのみ応答）'}`,
    '4. キャラ名で呼ぶ or カードをクリックすると、そのカードが優先的に発言する。',
    `5. Tension=${tensionRate.value}%（0で静か、100で全員参加）。値に応じて発言人数を変える。`,
  ]
  if (slotEventNotes.value.length) {
    lines.push('最近のスロット操作:')
    slotEventNotes.value.forEach((note) => lines.push(`- ${note}`))
  }
  return lines.join('\n')
})

const slotPayload = computed(() => {
  const slots = slotAssignments.value.map((cardId, index) => {
    const card = cardId ? cardLookup.value.get(cardId) : undefined
    const summary = summarizeCardSlot(card)
    const rule = slotRuleByIndex(index)
    const sections = [summary, rule].filter((section): section is string => Boolean(section))
    return sections.length ? sections.join('\n\n') : undefined
  })
  const scenarioSection = [slots[2], conversationGuide.value].filter((section): section is string => Boolean(section))
  return {
    slot1: slots[0],
    slot2: slots[1],
    slot3: scenarioSection.length ? scenarioSection.join('\n\n') : undefined,
  }
})

function normalizeMultiline(value?: string): string | undefined {
  if (!value) return undefined
  const normalized = value.replace(/\r\n/g, '\n').trim()
  return normalized.length ? normalized : undefined
}

const workspaceNavigator = computed(() => {
  const card = selectedNavigator.value
  if (!card) return undefined
  const raw = (card.raw?.data ?? card.raw) ?? {}
  const persona = normalizeMultiline(raw.personality ?? raw.persona)
  const scenario = normalizeMultiline(raw.scenario)
  const firstMessage = normalizeMultiline(raw.first_mes)
  const notes = normalizeMultiline(raw.creator_notes ?? raw.creatorcomment)
  const tags: string[] = Array.isArray(raw.tags) && raw.tags.length ? raw.tags : card.tags
  return {
    name: card.name,
    summary: card.summary,
    tags,
    avatar: card.avatar,
    persona,
    scenario,
    firstMessage,
    notes,
  }
})

async function onQuickAction(action: AccountAction) {
  if (loading.value) return
  switch (action.id) {
    case 'addPoints':
      await addPoints()
      break
    case 'managePersona':
      await cyclePersona()
      await fetchAccount()
      break
    case 'viewHistory':
      await fetchAccount()
      break
    default:
      break
  }
}

function onWallpaperOption(id: string) {
  wallpaperId.value = id
  wallpaperCustom.value = ''
}

function onWallpaperCustom(value: string) {
  wallpaperCustom.value = value
  if (value.trim().length > 0) {
    wallpaperId.value = 'custom'
  }
}

function onMessageAction(type: 'rerun' | 'edit' | 'fork' | 'bookmark', message: ChatMessage) {
  void message
  if (import.meta.env.DEV) {
    console.debug(`[chat:${type}]`, message)
  }
}

function onAttachmentsAdded(files: File[]) {
  if (import.meta.env.DEV && files.length) {
    console.debug('[chat:attachments-added]', files.map((file) => `${file.name} (${file.size}B)`))
  }
}

function onAttachmentRemoved(attachment: { name: string }) {
  if (import.meta.env.DEV) {
    console.debug('[chat:attachment-removed]', attachment?.name)
  }
}

function onEjectCard(id: string) {
  const next = slotAssignments.value.map((slotId) => (slotId === id ? null : slotId))
  slotAssignments.value = next
  if (!next.includes(selectedCard.value)) {
    selectedCard.value = (next.find((slotId): slotId is string => Boolean(slotId)) ?? '')
  }
}

function promoteCard(id: string) {
  const slots = [...slotAssignments.value]
  const existingIndex = slots.findIndex((slotId) => slotId === id)
  if (existingIndex !== -1) {
    selectedCard.value = id
    return
  }
  const emptyIndex = slots.findIndex((slotId) => !slotId)
  if (emptyIndex !== -1) {
    slots[emptyIndex] = id
  } else {
    slots.pop()
    slots.unshift(id)
  }
  slotAssignments.value = slots
  selectedCard.value = id
}

function onAssignSlot(payload: { slotIndex: number; cardId: string }) {
  const slots = [...slotAssignments.value]
  if (payload.slotIndex < 0 || payload.slotIndex >= slots.length) return
  for (let i = 0; i < slots.length; i += 1) {
    if (slots[i] === payload.cardId) {
      slots[i] = null
    }
  }
  slots[payload.slotIndex] = payload.cardId
  slotAssignments.value = slots
  selectedCard.value = payload.cardId
}

function onClearSlot(slotIndex: number) {
  const slots = [...slotAssignments.value]
  if (slotIndex < 0 || slotIndex >= slots.length) return
  slots[slotIndex] = null
  slotAssignments.value = slots
  if (!slots.includes(selectedCard.value)) {
    selectedCard.value = (slots.find((slotId): slotId is string => Boolean(slotId)) ?? '')
  }
}

function onUpdateTension(value: number) {
  tensionRate.value = clampPercentage(value)
}

function onToggleFreeTalk(value: boolean) {
  freeTalkEnabled.value = Boolean(value)
}

function onCardReference(payload: { id: string; role: CardRole }) {
  const card = payload.id ? cardLookup.value.get(payload.id) : undefined
  if (!card) return
  if (payload.role === 'WORLD') {
    const description = buildWorldDescription(card)
    referentialResponse.value = { role: 'WORLD', text: description, cardId: card.id }
    recordReferenceEvent('world', card, description)
  } else if (payload.role === 'SCENARIO') {
    const digest = buildScenarioDigest(card)
    referentialResponse.value = { role: 'SCENARIO', text: digest, cardId: card.id }
    recordReferenceEvent('scenario', card, digest.split('\n')[0] ?? digest)
  }
}

function onSetCardRole(payload: { id: string; role: CardRole | 'AUTO' }) {
  if (!payload.id) return
  if (payload.role === 'AUTO' || payload.role === 'UNKNOWN') {
    if (payload.id in cardRoleOverrides.value) {
      const next = { ...cardRoleOverrides.value }
      delete next[payload.id]
      cardRoleOverrides.value = next
    }
    return
  }
  cardRoleOverrides.value = { ...cardRoleOverrides.value, [payload.id]: payload.role }
}
</script>

<template>
  <div class="chat-page">
    <div class="chat-page__intro">
      <div class="chat-page__intro-header">
        <img class="chat-page__intro-icon" :src="chatIcon" alt="Chat" />
        <div>
          <p class="chat-page__intro-label">
            <span class="chat-page__intro-label-main">{{ page.title }} &lt;&lt;</span>
          </p>
          <p class="chat-page__intro-note">
            {{ page.quickHint ?? 'すぐに会話できます' }}
          </p>
        </div>
      </div>
      <details class="chat-page__guide">
        <summary>チャットガイド</summary>
        <div class="chat-page__guide-body">
          <p v-for="line in page.lead" :key="line">{{ line }}</p>
          <ul class="chat-page__notes">
            <li v-for="note in page.notes" :key="note">{{ note }}</li>
          </ul>
        </div>
      </details>
    </div>

    <ConnectionStatus
      class="chat-page__connection"
      :api-online="apiOnline"
      :api-base="connectionTarget"
      :issue="connectionIssue"
    />

    <V2ChatWorkspace
      :chat-content="navigatorChatContent"
      :cards="cardSlots"
      :extra-cards="extraSlots"
      :selected-id="selectedCard"
      :points-label="$t('home.account.status.pointsLabel')"
      :points-value="formattedPoints"
      :account-name="accountState.user.name"
      :account-tier="accountState.user.tier"
      :user-avatar="accountState.user.personaUrl"
      :navigator="workspaceNavigator"
      :quick-actions="quickActions"
      :busy="loading"
      :error="error"
      :notes="sideNotes"
      :wallpaper="wallpaperValue"
      :wallpaper-options="wallpaperOptions"
      :wallpaper-selected="wallpaperId"
      :wallpaper-custom-value="wallpaperCustom"
      :slot-payload="slotPayload"
      :slot-assignments="slotAssignmentsDetail"
      :card-roster="rosterCards"
      :api-online="apiOnline"
      :card-roles="cardRoleMap"
      :selected-card-role="selectedCardRole"
      :referential-response="referentialResponse"
      :role-overrides="cardRoleOverrides"
      :tension="tensionRate"
      :free-talk-enabled="freeTalkEnabled"
      :slot-event-notes="slotEventNotes"
      @select-card="selectedCard = $event"
      @run-action="onQuickAction"
      @change-wallpaper="onWallpaperOption"
      @update-wallpaper-custom="onWallpaperCustom"
      @eject-card="onEjectCard"
      @activate-card="promoteCard"
      @assign-slot="onAssignSlot"
      @clear-slot="onClearSlot"
      @update:tension="onUpdateTension"
      @toggle-free-talk="onToggleFreeTalk"
      @card-reference="onCardReference"
      @set-card-role="onSetCardRole"
      @message-rerun="onMessageAction('rerun', $event)"
      @message-edit="onMessageAction('edit', $event)"
      @message-fork="onMessageAction('fork', $event)"
      @message-bookmark="onMessageAction('bookmark', $event)"
      @attachments-added="onAttachmentsAdded"
      @attachment-removed="onAttachmentRemoved"
    />
  </div>
</template>

<style scoped>
.chat-page {
  display: grid;
  gap: 32px;
}

.chat-page__intro {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(12, 18, 32, 0.35);
  padding: clamp(16px, 3vw, 24px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-page__intro-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chat-page__intro-icon {
  width: clamp(44px, 6vw, 64px);
  height: auto;
}

.chat-page__intro-label {
  margin: 0;
}

.chat-page__intro-label-main {
  display: inline-block;
  font-size: clamp(1.4rem, 4vw, 2rem);
  font-family: 'Zen Kaku Gothic Antique', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.95);
}

.chat-page__intro-note {
  margin: 2px 0 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.65);
}

.chat-page__guide {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 8px 12px;
  background: rgba(12, 18, 32, 0.25);
}

.chat-page__guide summary {
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.chat-page__guide-body {
  margin-top: 8px;
  display: grid;
  gap: 6px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.chat-page__connection {
  margin-top: -12px;
}

.chat-page__notes {
  margin: 0;
  padding-left: 1.2rem;
  display: grid;
  gap: 4px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

@media (max-width: 720px) {
  .chat-page {
    gap: 24px;
  }

  .chat-page__hero {
    padding: 24px;
  }
}
</style>
