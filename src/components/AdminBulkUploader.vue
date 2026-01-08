<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import JSZip from 'jszip'
import { apiRequest } from '../utils/api'
import { useSession } from '../composables/useSession'
import { FEATURE_USER_SHARE } from '../core/featureFlags'

const session = useSession()
const featureEnabled = FEATURE_USER_SHARE
const dropActive = ref(false)
const processing = ref(false)

interface UploadLog {
  id: string
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
}

const logs = reactive<UploadLog[]>([])
const stats = reactive({ total: 0, success: 0, error: 0 })

const canUpload = computed(() => featureEnabled && session.state.status === 'ready')

const resetLogs = () => {
  logs.splice(0, logs.length)
  stats.total = 0
  stats.success = 0
  stats.error = 0
}

function openFilePicker() {
  if (!canUpload.value) return
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = '.json,.zip'
  input.onchange = () => {
    if (input.files) {
      handleFiles(input.files)
    }
  }
  input.click()
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  dropActive.value = false
  if (!event.dataTransfer?.files) return
  await handleFiles(event.dataTransfer.files)
}

function handleDrag(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (event.type === 'dragenter' || event.type === 'dragover') {
    dropActive.value = true
  } else {
    dropActive.value = false
  }
}

async function handleFiles(fileList: FileList) {
  if (!canUpload.value) return
  const files = Array.from(fileList)
  if (!files.length) return
  processing.value = true
  if (logs.length > 200) {
    resetLogs()
  }
  for (const file of files) {
    if (file.name.toLowerCase().endsWith('.zip')) {
      await processZip(file)
    } else if (file.name.toLowerCase().endsWith('.json')) {
      await processJsonFile(file)
    } else {
      addLog(file.name, 'error', '未対応のファイル形式')
    }
  }
  processing.value = false
}

async function processZip(file: File) {
  try {
    const zip = await JSZip.loadAsync(file)
    const entries = Object.keys(zip.files).filter((name) => name.toLowerCase().endsWith('.json'))
    if (!entries.length) {
      addLog(file.name, 'error', 'ZIP内に JSON がありません')
      return
    }
    for (const name of entries) {
      const entry = zip.files[name]
      if (!entry) continue
      try {
        const content = await entry.async('string')
        await processCardString(content, name)
      } catch (error) {
        addLog(name, 'error', error instanceof Error ? error.message : '解析に失敗しました')
      }
    }
  } catch (error) {
    addLog(file.name, 'error', error instanceof Error ? error.message : 'ZIPの読み込みに失敗しました')
  }
}

async function processJsonFile(file: File) {
  try {
    const text = await file.text()
    await processCardString(text, file.name)
  } catch (error) {
    addLog(file.name, 'error', error instanceof Error ? error.message : 'JSONの解析に失敗しました')
  }
}

async function processCardString(raw: string, sourceName: string) {
  const name = sourceName.replace(/^.*[\\/]/, '')
  let payload: any
  try {
    payload = JSON.parse(raw)
  } catch (error) {
    addLog(name, 'error', 'JSONの構文エラー')
    return
  }
  const displayName = payload?.name || payload?.card?.name || name
  const logEntry = addLog(displayName, 'pending', 'アップロード中...')
  try {
    const saveResponse = await apiRequest<{ ok: boolean; cardId: string; displayName: string }>(
      '/cards/save',
      {
        method: 'POST',
        body: JSON.stringify({ card: payload, originalFileName: name }),
      }
    )
    await apiRequest('/cards/share', {
      method: 'POST',
      body: JSON.stringify({ cardId: saveResponse.cardId }),
    })
    updateLog(logEntry.id, 'success', '共有まで完了しました')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'アップロードに失敗しました'
    updateLog(logEntry.id, 'error', message)
  }
}

function addLog(name: string, status: UploadLog['status'], message: string) {
  const entry: UploadLog = {
    id: crypto.randomUUID(),
    name,
    status,
    message,
  }
  logs.unshift(entry)
  return entry
}

function updateLog(id: string, status: UploadLog['status'], message: string) {
  const entry = logs.find((log) => log.id === id)
  if (!entry) return
  const previous = entry.status
  entry.status = status
  entry.message = message
  if (previous !== status) {
    if (status === 'success') stats.success += 1
    if (status === 'error') stats.error += 1
  }
}
</script>

<template>
  <div class="bulk-uploader">
    <header>
      <div>
        <h3>カード一括アップロード</h3>
        <p>MetaCaptureから出力した JSON / ZIP を指定するとBFFへ保存&共有します。</p>
        <p v-if="!featureEnabled" class="bulk-uploader__warn">共有機能がOFFのため無効です。</p>
        <p v-else-if="session.state.status !== 'ready'" class="bulk-uploader__warn">ログインすると有効になります。</p>
      </div>
      <div class="bulk-uploader__stats">
        <span>成功: {{ stats.success }}</span>
        <span>失敗: {{ stats.error }}</span>
      </div>
    </header>

    <div
      class="dropzone"
      :class="{ 'is-active': dropActive, 'is-disabled': !canUpload || processing }"
      @dragenter="handleDrag"
      @dragover="handleDrag"
      @dragleave="handleDrag"
      @drop="handleDrop"
      @click="openFilePicker"
    >
      <p v-if="!processing">ここに ZIP/JSON をドロップ or クリックして選択</p>
      <p v-else>処理中...</p>
      <small>対応形式: .zip（複数JSON） / .json</small>
    </div>

    <ul class="upload-log">
      <li v-for="entry in logs" :key="entry.id" :class="['upload-log__item', entry.status]">
        <div class="upload-log__meta">
          <strong>{{ entry.name }}</strong>
          <span class="upload-log__status">{{ entry.status }}</span>
        </div>
        <p>{{ entry.message }}</p>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.bulk-uploader {
  display: grid;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: clamp(16px, 3vw, 24px);
  background: rgba(7, 12, 24, 0.8);
}

.bulk-uploader header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
}

.bulk-uploader__stats {
  display: flex;
  gap: 12px;
  font-weight: 600;
}

.bulk-uploader__warn {
  color: #ff8e8e;
}

.dropzone {
  border: 2px dashed rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.dropzone.is-active {
  border-color: #63e6ff;
  background: rgba(99, 230, 255, 0.1);
}

.dropzone.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-log {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 220px;
  overflow-y: auto;
}

.upload-log__item {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.25);
}

.upload-log__item.success {
  border-color: rgba(98, 250, 181, 0.6);
}

.upload-log__item.error {
  border-color: rgba(255, 142, 142, 0.6);
}

.upload-log__meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.upload-log__status {
  font-size: 0.85rem;
  opacity: 0.7;
}
</style>
