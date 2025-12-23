<script setup lang="ts">
import { computed, ref } from 'vue'
import V2ChatLog from './V2ChatLog.vue'
import V2ChatComposer from './V2ChatComposer.vue'
import SyncHUD from './SyncHUD.vue'
import { useChat, type ChatAttachment, type ChatMessage, type ChatSlotPayload } from '../composables/useChat'
import type { ChatContent } from '../types/home'

const props = defineProps<{
  content: ChatContent
  assistantAvatar?: string
  userAvatar?: string
  assistantTone?: { background?: string; text?: string; font?: string }
  userTone?: { background?: string; text?: string; font?: string }
  greeting?: string
  slots?: ChatSlotPayload
  tension: number
}>()

const emits = defineEmits<{
  (e: 'message-rerun', message: ChatMessage): void
  (e: 'message-edit', message: ChatMessage): void
  (e: 'message-fork', message: ChatMessage): void
  (e: 'message-bookmark', message: ChatMessage): void
  (e: 'attachments-added', files: File[]): void
  (e: 'attachment-removed', attachment: ChatAttachment): void
  (e: 'update:tension', value: number): void
}>()

const input = ref('')
const attachments = ref<ChatAttachment[]>([])

const {
  visibleMessages,
  loading,
  error,
  sendMessage,
  resetConversation,
  history,
} = useChat(props.content.systemPrompt)

const hasMessages = computed(() => visibleMessages.value.length > 0)
const firstAssistantMessage = computed(() => {
  if (hasMessages.value) {
    const found = history.find((message) => message.role === 'assistant')
    if (found?.content) {
      return found.content
    }
  }
  return props.greeting ?? ''
})

const payloadFlags = computed(() => ({
  text: true,
  slot1: Boolean(props.slots?.slot1 && props.slots.slot1.trim().length),
  slot2: Boolean(props.slots?.slot2 && props.slots.slot2.trim().length),
  slot3: Boolean(props.slots?.slot3 && props.slots.slot3.trim().length),
}))

const SYNC_RATE = 50
const tensionRate = computed(() => {
  const numeric = typeof props.tension === 'number' ? props.tension : 50
  if (Number.isNaN(numeric)) return 50
  return Math.min(100, Math.max(0, Math.round(numeric)))
})

function clampPercentage(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

function onTensionInput(event: Event) {
  const inputEl = event.target as HTMLInputElement
  const next = Number(inputEl.value)
  const clamped = clampPercentage(Number.isFinite(next) ? next : 0)
  emits('update:tension', clamped)
}

function downloadTranscript() {
  if (!history.length) return
  const lines = history.map((message) => {
    const timestamp = new Date(message.createdAt || Date.now()).toISOString()
    const role = message.role.toUpperCase()
    return `[${timestamp}] ${role}: ${message.content}`
  })
  const footer = `---\nTotal messages: ${history.length}`
  const payload = `${lines.join('\n')}\n${footer}\n`
  const filename = `izakaya-log_${new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16)}.txt`
  const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

async function onSubmit() {
  if (!input.value.trim()) return
  await sendMessage(input.value, attachments.value, props.slots)
  input.value = ''
  attachments.value = []
}

function handleAddFiles(files: File[]) {
  if (!files.length) return
  const mapped = files.map((file) => ({
    id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    size: file.size,
    type: file.type,
    source: file,
  }))
  attachments.value = [...attachments.value, ...mapped]
  emits('attachments-added', files)
}

function handleRemoveAttachment(attachment: ChatAttachment) {
  attachments.value = attachments.value.filter((item) => item.id !== attachment.id)
  emits('attachment-removed', attachment)
}

function onRerun(message: ChatMessage) {
  emits('message-rerun', message)
}

function onEdit(message: ChatMessage) {
  emits('message-edit', message)
}

function onFork(message: ChatMessage) {
  emits('message-fork', message)
}

function onBookmark(message: ChatMessage) {
  emits('message-bookmark', message)
}
</script>

<template>
  <section class="chat-console">
    <V2ChatLog
      v-if="hasMessages"
      :messages="visibleMessages"
      :assistant-label="content.assistantLabel"
      :user-label="content.userLabel"
      :assistant-avatar="assistantAvatar"
      :user-avatar="userAvatar"
      :assistant-tone="assistantTone"
      :user-tone="userTone"
      @rerun="onRerun"
      @edit="onEdit"
      @fork="onFork"
      @bookmark="onBookmark"
    />
    <div v-else class="chat-console__empty">
      <p v-if="firstAssistantMessage">{{ firstAssistantMessage }}</p>
      <p v-else>{{ content.empty }}</p>
      <button type="button" @click="resetConversation">{{ content.composer.sendLabel }}</button>
    </div>

    <V2ChatComposer
      class="chat-console__composer"
      :model-value="input"
      :disabled="loading"
      :placeholder="content.composer.placeholder"
      :send-label="content.composer.sendLabel"
      :attach-label="content.composer.attachLabel"
      :attach-hint="content.composer.attachHint"
      :enter-hint="content.composer.enterToSendHint"
      :files-label="content.composer.filesLabel"
      :remove-file-label="content.composer.removeFileLabel"
      :attachments="attachments"
      @update:model-value="input = $event"
      @send="onSubmit"
      @add-files="handleAddFiles"
      @remove-attachment="handleRemoveAttachment"
    />

    <div v-if="props.slots" class="chat-console__payload">
      <div class="chat-console__payload-flags">
        <span>Payload:</span>
        <span class="chat-console__payload-flag is-active">Text</span>
        <span :class="['chat-console__payload-flag', { 'is-active': payloadFlags.slot1 }]" :title="props.slots?.slot1">
          Slot1
        </span>
        <span :class="['chat-console__payload-flag', { 'is-active': payloadFlags.slot2 }]" :title="props.slots?.slot2">
          Slot2
        </span>
        <span :class="['chat-console__payload-flag', { 'is-active': payloadFlags.slot3 }]" :title="props.slots?.slot3">
          Slot3
        </span>
      </div>
      <div class="chat-console__payload-tools">
        <SyncHUD :sync="SYNC_RATE" :tension="tensionRate" />
        <label class="chat-console__tension-control">
          <span>Tension</span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            :value="tensionRate"
            @input="onTensionInput"
          />
          <span class="chat-console__tension-value">{{ tensionRate }}%</span>
        </label>
        <button type="button" class="chat-console__save" @click="downloadTranscript">
          ログ保存
        </button>
      </div>
    </div>

    <p v-if="loading" class="chat-console__status">{{ content.loadingMessage }}</p>
    <p v-else-if="error" class="chat-console__status chat-console__status--error">{{ error }}</p>
  </section>
</template>

<style scoped>

.chat-console {
  display: grid;
  gap: 18px;
  padding: clamp(12px, 3vw, 20px);
}

.chat-console__empty {
  display: grid;
  gap: 12px;
  justify-items: center;
  text-align: center;
  padding: 32px;
  border-radius: 20px;
  border: 1px dashed rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.04);
  font-size: 0.95rem;
  opacity: 0.8;
}

.chat-console__empty button {
  border-radius: 999px;
  padding: 10px 22px;
  font-weight: 600;
}

.chat-console__composer {
  margin-top: auto;
}

.chat-console__status {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.75;
}

.chat-console__status--error {
  color: #f87171;
}

.chat-console__payload {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  opacity: 0.85;
  flex-wrap: wrap;
}

.chat-console__payload-flags {
  display: flex;
  gap: 8px;
  align-items: center;
}

.chat-console__payload-tools {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.chat-console__payload-flag {
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.chat-console__payload-flag.is-active {
  border-color: #9ef5ff;
  color: #9ef5ff;
}

.chat-console__tension-control {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  opacity: 0.85;
}

.chat-console__tension-control input {
  width: 120px;
}

.chat-console__tension-value {
  min-width: 36px;
  text-align: right;
}

.chat-console__save {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.75rem;
}

@media (max-width: 720px) {
  .chat-console {
    padding: 12px;
  }
}
</style>
