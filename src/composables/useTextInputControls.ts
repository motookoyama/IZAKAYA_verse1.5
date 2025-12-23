import { ref, type Ref } from 'vue'

type RecognitionInstance = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: (event: any) => void
  onerror: () => void
  onend: () => void
}

type RecognitionCtor = new () => RecognitionInstance

export function useTextInputControls(target: Ref<string>, options: { lang?: string } = {}) {
  const isComposing = ref(false)
  const listening = ref(false)
  const speechError = ref('')
  const recognitionCtor: RecognitionCtor | null =
    typeof window !== 'undefined'
      ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null)
      : null
  const speechSupported = ref(Boolean(recognitionCtor))
  let recognition: RecognitionInstance | null = null

  function ensureRecognition() {
    if (!recognitionCtor) return null
    if (!recognition) {
      recognition = new recognitionCtor()
      recognition.lang = options.lang ?? 'ja-JP'
      recognition.interimResults = false
      recognition.continuous = false
      recognition.onresult = (event: any) => {
        const sequences = Array.from(event.results as ArrayLike<any>)
        const text = sequences
          .map((result) => result[0]?.transcript ?? '')
          .join('')
          .trim()
        if (!text) return
        target.value = target.value ? `${target.value} ${text}` : text
      }
      recognition.onerror = () => {
        listening.value = false
        speechError.value = '音声入力でエラーが発生しました'
      }
      recognition.onend = () => {
        listening.value = false
      }
    }
    return recognition
  }

  function handleKeydown(event: KeyboardEvent, send: () => void) {
    if (event.key !== 'Enter') return
    if (event.isComposing || isComposing.value) return
    const modifierPressed = event.metaKey || event.ctrlKey
    if (!modifierPressed) return
    event.preventDefault()
    send()
  }

  function onCompositionStart() {
    isComposing.value = true
  }

  function onCompositionEnd() {
    isComposing.value = false
  }

  function toggleMic() {
    if (!speechSupported.value || !recognitionCtor) {
      speechError.value = 'このブラウザは音声入力に対応していません'
      return
    }
    speechError.value = ''
    const instance = ensureRecognition()
    if (!instance) return
    if (listening.value) {
      instance.stop()
      listening.value = false
      return
    }
    try {
      instance.start()
      listening.value = true
    } catch {
      listening.value = false
      speechError.value = '音声入力を開始できませんでした'
    }
  }

  return {
    handleKeydown,
    onCompositionStart,
    onCompositionEnd,
    toggleMic,
    listening,
    speechSupported,
    speechError,
  }
}
