import { computed, reactive, ref } from 'vue'
import { apiRequest } from '../utils/api'

type ChatRole = 'system' | 'user' | 'assistant'

export type ChatAttachment = {
  id: string
  name: string
  size: number
  type: string
  source?: File
}

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  createdAt: number
  attachments?: ChatAttachment[]
}

type ChatResponse = {
  reply?: string
  choices?: Array<{
    index: number
    message?: { role?: ChatRole; content?: string }
  }>
  error?: string
}

export type ChatSlotPayload = {
  slot1?: string
  slot2?: string
  slot3?: string
}

const HISTORY_LIMIT = 60

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try {
      return `${prefix}-${crypto.randomUUID()}`
    } catch (err) {
      /* noop fallback */
    }
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function useChat(initialSystemPrompt?: string) {
  const history = reactive<ChatMessage[]>([])
  const trimmedSystemPrompt = initialSystemPrompt?.trim()
  if (trimmedSystemPrompt && trimmedSystemPrompt.length > 0) {
    history.push({
      id: createId('sys'),
      role: 'system',
      content: trimmedSystemPrompt,
      createdAt: Date.now(),
    })
  }

  const loading = ref(false)
  const error = ref<string | null>(null)

  const visibleMessages = computed(() => history.filter((message) => message.role !== 'system'))

  function trimHistory() {
    let nonSystemCount = 0
    for (const entry of history) {
      if (entry.role !== 'system') {
        nonSystemCount += 1
      }
    }
    if (nonSystemCount <= HISTORY_LIMIT) {
      return
    }
    let toRemove = nonSystemCount - HISTORY_LIMIT
    for (let i = 0; i < history.length && toRemove > 0; i += 1) {
      const entry = history[i]
      if (!entry) break
      if (entry.role !== 'system') {
        history.splice(i, 1)
        i -= 1
        toRemove -= 1
      }
    }
  }

  function resetConversation() {
    const startIndex = history.findIndex((entry) => entry.role !== 'system')
    if (startIndex >= 0) {
      history.splice(startIndex)
    }
    error.value = null
  }

  async function sendMessage(
    input: string,
    attachments: ChatAttachment[] = [],
    slots?: ChatSlotPayload
  ): Promise<void> {
    const trimmed = input.trim()
    if (trimmed.length === 0 || loading.value) {
      return
    }

    loading.value = true
    error.value = null

    const userMessage: ChatMessage = {
      id: createId('user'),
      role: 'user',
      content: trimmed,
      createdAt: Date.now(),
      attachments: attachments.length ? attachments.map((item) => ({ ...item })) : undefined,
    }

    history.push(userMessage)
    trimHistory()

    try {
      const payload: Record<string, unknown> = {
        text: trimmed,
        attachments: attachments.map((item) => ({
          id: item.id,
          name: item.name,
          size: item.size,
          type: item.type,
        })),
      }
      if (slots?.slot1 && slots.slot1.trim().length > 0) payload.slot1 = slots.slot1
      if (slots?.slot2 && slots.slot2.trim().length > 0) payload.slot2 = slots.slot2
      if (slots?.slot3 && slots.slot3.trim().length > 0) payload.slot3 = slots.slot3

      const response = await apiRequest<ChatResponse>('/chat/v1', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const firstChoice = Array.isArray(response.choices) && response.choices.length > 0
        ? response.choices[0]
        : undefined
      const choiceContent = firstChoice?.message?.content?.trim()
      const assistantContent = response.reply?.trim() ?? choiceContent
      if (response.error) {
        error.value = response.error
      }

      if (assistantContent && assistantContent.length > 0) {
        history.push({
          id: createId('assistant'),
          role: 'assistant',
          content: assistantContent,
          createdAt: Date.now(),
        })
      } else {
        history.push({
          id: createId('assistant'),
          role: 'assistant',
          content: '[no response]',
          createdAt: Date.now(),
        })
      }
      trimHistory()
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  return {
    history,
    visibleMessages,
    loading,
    error,
    sendMessage,
    resetConversation,
  }
}
