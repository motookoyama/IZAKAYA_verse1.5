<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  bffUrl?: string
  gateKey?: string
}>()

const emits = defineEmits<{
  (e: 'scanned', data: string): void
  (e: 'error', message: string): void
}>()

const status = ref<'idle' | 'scanning' | 'detecting' | 'success' | 'error'>('idle')
const message = ref('')
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

/**
 * Handle QR Image Scan (Upload/Drop)
 */
async function handleFiles(files: FileList | null) {
  if (!files || files.length === 0) return
  const file = files[0]
  if (!file) return
  if (file.type !== 'image/png') {
    status.value = 'error'
    message.value = 'PNG画像を選択してください。'
    return
  }

  status.value = 'scanning'
  message.value = 'スキャン中...'

  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      await scanQrViaBff(base64)
    }
    reader.readAsDataURL(file)
  } catch (err) {
    status.value = 'error'
    message.value = '読み取りに失敗しました。'
  }
}

async function scanQrViaBff(base64: string) {
  try {
    const response = await fetch(`${props.bffUrl || 'http://localhost:4117'}/api/v1/scan-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-IZAKAYA-GATE': props.gateKey || ''
      },
      body: JSON.stringify({ image_base64: base64 })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.message || 'QRコードが見つかりません。')
    }

    const { data } = await response.json()
    handleResult(data)
  } catch (err: any) {
    status.value = 'error'
    message.value = err.message
    emits('error', err.message)
  }
}

/**
 * Handle Stealth Paste (Clipboard)
 */
async function handleStealthPaste() {
  try {
    status.value = 'detecting'
    message.value = 'クリップボードを確認中...'
    
    const text = await navigator.clipboard.readText()
    
    if (text.startsWith('IZ-REIN-V25:') || text.startsWith('{"v":"soulseed')) {
      handleResult(text)
    } else {
      status.value = 'error'
      message.value = '有効な転生コードがクリップボードに見つかりませんでした。'
    }
  } catch (err) {
    status.value = 'error'
    message.value = 'クリップボードへのアクセスが拒否されました。'
  }
}

function handleResult(data: string) {
  status.value = 'success'
  message.value = '転生ソースを検出しました！'
  emits('scanned', data)
  
  // Reset after delay
  setTimeout(() => {
    status.value = 'idle'
    message.value = ''
  }, 2000)
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  handleFiles(e.dataTransfer?.files || null)
}
</script>

<template>
  <div class="qr-scanner" :class="[`status--${status}`, { 'is-dragging': isDragging }]">
    <div 
      class="drop-zone"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
    >
      <input 
        ref="fileInput" 
        type="file" 
        accept="image/png" 
        class="sr-only" 
        @change="handleFiles(($event.target as HTMLInputElement).files)"
      />
      
      <div class="drop-zone__content">
        <span class="icon">
          <template v-if="status === 'idle'">📷</template>
          <template v-else-if="status === 'scanning' || status === 'detecting'">⌛</template>
          <template v-else-if="status === 'success'">✨</template>
          <template v-else-if="status === 'error'">⚠️</template>
        </span>
        <p v-if="status === 'idle'" class="hint">QR画像をドロップ、またはクリックして選択</p>
        <p v-else class="status-text">{{ message }}</p>
      </div>
    </div>

    <div class="actions">
      <button 
        type="button" 
        class="btn-stealth" 
        @click="handleStealthPaste"
        :disabled="status !== 'idle'"
      >
        <span class="btn-icon">📋</span>
        <span class="btn-text">ステルス転生 (クリップボードから)</span>
      </button>
    </div>

    <div class="privacy-note">
      <small>※転生コードの内容は画面には表示されません（ネタバレ防止）</small>
    </div>
  </div>
</template>

<style scoped>
.qr-scanner {
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.drop-zone {
  aspect-ratio: 16 / 9;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.03);
}

.is-dragging .drop-zone {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
}

.drop-zone:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.06);
}

.drop-zone__content {
  text-align: center;
  padding: 20px;
}

.icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 12px;
}

.hint {
  font-size: 0.85rem;
  color: #94a3b8;
}

.status-text {
  font-weight: 600;
  font-size: 0.95rem;
}

.btn-stealth {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(16, 185, 129, 0.4);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
  color: #ecfdf5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-stealth:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.3));
  transform: translateY(-1px);
}

.btn-stealth:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status--success {
  border-color: rgba(16, 185, 129, 0.6);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
}

.status--error {
  border-color: rgba(239, 68, 68, 0.6);
}

.privacy-note {
  text-align: center;
  color: #64748b;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
