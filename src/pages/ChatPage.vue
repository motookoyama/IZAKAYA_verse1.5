<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import V2ChatWorkspace from '../components/V2ChatWorkspace.vue'
import { useAccount } from '../composables/useAccount'
import { useTheme } from '../composables/useTheme'
import { navigatorCards, findNavigatorCard } from '../data/sampleCards'
import type { FeatureContent, ChatContent, AccountAction, AccountContent } from '../types/home'
import type { ChatMessage } from '../composables/useChat'
import chatIcon from '../assets/icons/chat-frame.png'

const { tm } = useI18n({ useScope: 'global' })

const page = computed(() => tm('pages.chat') as {
  title: string
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
} = useAccount()

const adminTagPattern = /(管理|管理者|翻訳|経理)/
const playerNavigatorCards = computed(() => {
  const filtered = navigatorCards.filter((card) => !card.tags.some((tag) => adminTagPattern.test(tag)))
  return filtered.length ? filtered : navigatorCards
})

const cardLookup = computed(() => {
  const map = new Map<string, (typeof navigatorCards)[number]>()
  playerNavigatorCards.value.forEach((card) => map.set(card.id, card))
  return map
})

const activeSlots = ref<string[]>([])
const benchSlots = ref<string[]>([])
const selectedCard = ref<string>('')

const activeCards = computed(() => activeSlots.value
  .map((id) => cardLookup.value.get(id))
  .filter((card): card is typeof navigatorCards[number] => Boolean(card))
)

const benchCards = computed(() => benchSlots.value
  .map((id) => cardLookup.value.get(id))
  .filter((card): card is typeof navigatorCards[number] => Boolean(card))
)

watch(
  playerNavigatorCards,
  (cards) => {
    const ids = cards.map((card) => card.id)
    if (ids.length === 0) {
      activeSlots.value = []
      benchSlots.value = []
      selectedCard.value = ''
      return
    }
    const nextActive: string[] = []
    for (const id of activeSlots.value) {
      if (ids.includes(id) && nextActive.length < 3) {
        nextActive.push(id)
      }
    }
    for (const id of ids) {
      if (!nextActive.includes(id) && nextActive.length < 3) {
        nextActive.push(id)
      }
    }
    activeSlots.value = nextActive
    benchSlots.value = ids.filter((id) => !nextActive.includes(id))
    if (!activeSlots.value.includes(selectedCard.value)) {
      selectedCard.value = activeSlots.value[0] ?? ''
    }
  },
  { immediate: true }
)

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

const selectedNavigator = computed(() => (selectedCard.value ? findNavigatorCard(selectedCard.value) : undefined))

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

const slotPayload = computed(() => {
  const slots = activeCards.value.slice(0, 3).map((card) => summarizeCardSlot(card))
  return {
    slot1: slots[0],
    slot2: slots[1],
    slot3: slots[2],
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
  activeSlots.value = activeSlots.value.filter((slot) => slot !== id)
  benchSlots.value = Array.from(new Set([id, ...benchSlots.value]))
  if (selectedCard.value === id) {
    selectedCard.value = activeSlots.value[0] ?? ''
  }
  if (!selectedCard.value) {
    const fallback = benchSlots.value.find((slot) => slot !== id)
    if (fallback) {
      promoteCard(fallback)
    }
  }
}

function promoteCard(id: string) {
  if (activeSlots.value.includes(id)) {
    selectedCard.value = id
    return
  }
  const nextActive = Array.from(new Set([id, ...activeSlots.value])).slice(0, 3)
  activeSlots.value = nextActive
  benchSlots.value = benchSlots.value.filter((slot) => slot !== id)
  selectedCard.value = id
}
</script>

<template>
  <div class="chat-page">
    <div class="chat-page__intro">
      <div class="chat-page__intro-header">
        <img class="chat-page__intro-icon" :src="chatIcon" alt="Chat" />
        <div>
          <p class="chat-page__intro-label">{{ page.title }}</p>
          <p class="chat-page__intro-note">
            {{ $t('pages.chat.quickHint') || 'すぐに会話できます' }}
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
      @select-card="selectedCard = $event"
      @run-action="onQuickAction"
      @change-wallpaper="onWallpaperOption"
      @update-wallpaper-custom="onWallpaperCustom"
      @eject-card="onEjectCard"
      @activate-card="promoteCard"
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
  font-size: 1rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.8);
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
