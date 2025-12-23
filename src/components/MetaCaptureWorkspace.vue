<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import QRCode from 'qrcode'
import { generateQrAssets } from '../utils/qrToolkit'
import type { MetacaptureEventPayload, V2Draft } from '../types/metacapture'
import type { MetacaptureStoredDraft } from '../utils/metacaptureLibrary'
import { apiRequest } from '../utils/api'

defineProps<{
  featureTitle?: string
  featureDescription?: string
  featureBullets?: string[]
  knowledgeTitle?: string
  knowledgeBody?: string[]
}>()

const emits = defineEmits<{
  (e: 'save', payload: MetacaptureEventPayload): void
  (e: 'preview', payload: MetacaptureEventPayload): void
}>()

const WORKSPACE_COPY = {
  ja: {
    dropPanelKicker: 'MetaCapture',
    dropTitle: '画像からカード情報を抽出',
    dropPrompt: '画像をドロップするか、クリックして選択してください。',
    browse: 'ファイルを選択',
    analyze: '解析',
    analyzing: '解析中...',
    reset: 'リセット',
    errorNoImage: '解析には画像が必要です。',
    analyzeIdle: '画像を読み込んで「解析」を押してください。',
    analyzeReady: '画像を読み込みました。「解析」を押してAIカードの草案を生成します。',
    cardDraft: 'カード概要',
    title: 'タイトル',
    titlePh: 'キャラクター名',
    role: '役割',
    rolePh: '例: Navigator / Rival',
    summary: 'サマリー',
    summaryPh: '画像から抽出した人物像やメモ...',
    firstMessage: '初回メッセージ',
    firstMessagePh: 'first_mes に相当する挨拶文',
    behavior: 'ふるまい / トーン',
    behaviorPh: '例: 落ち着いており、質問には丁寧に答える',
    links: '関連リンク',
    linksPh: 'スペース区切りでURLを入力',
    jsonPreview: 'JSON Preview',
    downloadJson: 'JSONをダウンロード',
    downloadQr: 'QRを保存',
    downloadQrEmbed: 'QR+埋込を保存',
    saveMock: 'ライブラリに保存(モック)',
    guide: 'ガイド',
    memo: 'メモ',
    qrPreview: 'QR Preview',
    qrRaw: 'raw',
    qrEmbedded: 'embedded',
    urlLabel: '世界 (URL)',
    urlPh: '参照したいURLを入力 (Wikipedia等)',
    wishLabel: '願い (Wish)',
    wishPh: '例: この場所に住む羊飼いの少年と友達になりたい',
    deepScanLabel: 'Deep Scan (画像解析を有効にする)',
    reincarnationLabel: 'QR転生コード',
  },
  en: {
    dropPanelKicker: 'MetaCapture',
    dropTitle: 'Capture card data from an image',
    dropPrompt: 'Drop an image here or click to choose.',
    browse: 'Browse Image',
    analyze: 'Analyze',
    analyzing: 'Analyzing...',
    reset: 'Reset',
    errorNoImage: 'An image is required before running analysis.',
    analyzeIdle: 'Load an image and click “Analyze”.',
    analyzeReady: 'Image loaded. Click “Analyze” to draft the card.',
    cardDraft: 'Card Draft',
    title: 'Title',
    titlePh: 'Character name',
    role: 'Role',
    rolePh: 'e.g., Navigator / Rival',
    summary: 'Summary',
    summaryPh: 'Describe the extracted persona or notes...',
    firstMessage: 'First Message',
    firstMessagePh: 'Greeting text for first_mes',
    behavior: 'Behavior / Tone',
    behaviorPh: 'e.g., Calm and answers politely',
    links: 'Links',
    linksPh: 'Enter URLs separated by spaces',
    jsonPreview: 'JSON Preview',
    downloadJson: 'Download JSON',
    downloadQr: 'Download QR',
    downloadQrEmbed: 'Download QR + Data',
    saveMock: 'Save to Library (mock)',
    guide: 'Guide',
    memo: 'Notes',
    qrPreview: 'QR Preview',
    qrRaw: 'raw',
    qrEmbedded: 'embedded',
    urlLabel: 'World (URL)',
    urlPh: 'Enter URL (e.g., Wikipedia, News)',
    wishLabel: 'Wish',
    wishPh: 'e.g., I want to be friends with a shepherd boy here',
    deepScanLabel: 'Deep Scan (Enable Image Analysis)',
    reincarnationLabel: 'QR Reincarnation Code',
  },
} as const

const { locale } = useI18n({ useScope: 'global' })
const currentLang = computed<'ja' | 'en'>(() => (locale.value?.toString().startsWith('en') ? 'en' : 'ja'))
const labels = computed(() => WORKSPACE_COPY[currentLang.value])

const fileInput = ref<HTMLInputElement | null>(null)
const previewObjectUrl = ref<string | null>(null)
const previewDataUrl = ref<string | null>(null)
const previewSrc = computed(() => previewObjectUrl.value ?? previewDataUrl.value)
const fileName = ref('')
const analyzing = ref(false)
const code = ref<string>(labels.value.analyzeIdle)
const error = ref<string | null>(null)
const qrImage = ref<string | null>(null)
const qrEmbedded = ref<string | null>(null)
const qrSize = ref<number | null>(null)
const reincarnationCode = ref<string | null>(null)
const reincarnationQr = ref<string | null>(null)

const form = reactive({
  title: '',
  role: '',
  summary: '',
  firstMessage: '',
  behavior: '',
  links: '',
  url: '',
  wish: '',
  deepScan: false,
})

const hasFile = computed(() => Boolean(previewSrc.value))
const readyToDownload = computed(() => Boolean(qrEmbedded.value && code.value.startsWith('{')))

watch(previewObjectUrl, (next, prev) => {
  if (prev && prev !== next) URL.revokeObjectURL(prev)
})

onBeforeUnmount(() => {
  if (previewObjectUrl.value) URL.revokeObjectURL(previewObjectUrl.value)
})

function resetCapture() {
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value)
  }
  previewObjectUrl.value = null
  previewDataUrl.value = null
  fileName.value = ''
  qrImage.value = null
  qrEmbedded.value = null
  qrSize.value = null
  reincarnationCode.value = null
  reincarnationQr.value = null
  code.value = labels.value.analyzeIdle
  Object.assign(form, {
    title: '',
    role: '',
    summary: '',
    firstMessage: '',
    behavior: '',
    links: '',
  })
}

function handleFileList(list: FileList | null) {
  if (!list?.length) return
  const file = list.item(0)
  if (!file) return
  if (!file.type.startsWith('image/')) {
    error.value = '画像ファイルを選択してください。'
    return
  }
  error.value = null
  if (previewObjectUrl.value) URL.revokeObjectURL(previewObjectUrl.value)
  previewObjectUrl.value = URL.createObjectURL(file)
  previewDataUrl.value = null
  fileName.value = file.name
  const reader = new FileReader()
  reader.onload = () => {
    previewDataUrl.value = typeof reader.result === 'string' ? reader.result : null
  }
  reader.onerror = () => {
    previewDataUrl.value = null
    console.warn('[MetaCapture] failed to read preview data', reader.error)
  }
  reader.readAsDataURL(file)
  qrImage.value = null
  qrEmbedded.value = null
  qrSize.value = null
  code.value = labels.value.analyzeReady
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  handleFileList(input.files)
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  handleFileList(event.dataTransfer?.files ?? null)
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
}


function buildDraft(): V2Draft {
  return {
    name: form.title || 'Sample Character',
    role: form.role || 'Explorer',
    summary:
      form.summary || '未設定。メタキャプチャーで抽出したキャラクター設定をここに追記してください。',
    first_mes:
      form.firstMessage || 'こんにちは。抽出カードの初回メッセージをここに入力してください。',
    behavior: form.behavior || 'Friendly, insightful, curious.',
    links: form.links ? form.links.split(/\s+/).filter(Boolean) : [],
    assets: {
      image: fileName.value,
      preview: previewDataUrl.value,
    },
    slots: {
      alpha: '主役: プレイヤーと直接会話するキャラクター。',
      beta: 'サポート: 追加情報や舞台装置を補助するキャラクター。',
      gamma: '世界観: 背景設定や状況説明を担う存在。',
    },
  }
}

async function analyze() {
  if (!form.url && !form.wish && !previewSrc.value) {
    error.value = '解析には URL または願い、あるいは画像が必要です。'
    return
  }
  error.value = null
  analyzing.value = true
  qrImage.value = null
  qrEmbedded.value = null
  qrSize.value = null
  code.value = '解析中...'

  try {
    // MetaCapture 2.0 flow: Call BFF /chat/v1 with encounter payload
    const response = await apiRequest<{
      reply: string,
      meta: {
        metacapture: boolean,
        persona_payload: any,
        reincarnation_code?: string
      }
    }>('/chat/v1', {
      method: 'POST',
      body: JSON.stringify({
        urls: form.url ? [form.url] : [],
        wish: form.wish,
        gap: 'mid',
        deepScan: form.deepScan
      })
    })

    if (response.meta?.metacapture && response.meta.persona_payload) {
      const card = response.meta.persona_payload
      form.title = card.name || ''
      form.role = card.tags?.[0] || 'MetaCapture Character'
      form.summary = card.description || ''
      form.firstMessage = card.first_mes || response.reply
      form.behavior = card.personality || ''
      form.links = form.url
      
      if (response.meta.reincarnation_code) {
        reincarnationCode.value = response.meta.reincarnation_code
        reincarnationQr.value = await QRCode.toDataURL(reincarnationCode.value, {
          width: 320,
          margin: 2,
        })
      }
    }

    const draft = buildDraft()
    const draftJson = JSON.stringify(draft, null, 2)
    const { raw, embedded, sizeKb } = await generateQrAssets(draftJson)
    
    code.value = draftJson
    qrImage.value = raw
    qrEmbedded.value = embedded
    qrSize.value = sizeKb
    analyzing.value = false
    emits('preview', { draft, json: draftJson, qrImage: raw, qrEmbedded: embedded })
  } catch (err) {
    analyzing.value = false
    error.value = err instanceof Error ? err.message : String(err)
  }
}

function triggerBrowse() {
  fileInput.value?.click()
}

async function downloadJson() {
  if (!code.value) return
  const blob = new Blob([code.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  triggerDownload(`${form.title || 'metacapture-card'}.json`, url)
}

async function downloadQr(raw: boolean) {
  const src = raw ? qrImage.value : qrEmbedded.value
  if (!src) return
  const response = await fetch(src)
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  triggerDownload(`${form.title || 'metacapture-card'}${raw ? '-qr' : '-qr-data'}.png`, url)
}

function triggerDownload(filename: string, href: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(href)
}

function onSave() {
  try {
    const payload = JSON.parse(code.value) as V2Draft
    if (qrEmbedded.value && qrImage.value) {
      emits('save', { draft: payload, json: code.value, qrImage: qrImage.value, qrEmbedded: qrEmbedded.value })
    }
  } catch (err) {
    error.value = '出力内容がJSONとして読み取れません。解析を実行してください。'
  }
}

function loadDraft(record: MetacaptureStoredDraft) {
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value)
  }
  previewObjectUrl.value = null
  previewDataUrl.value = record.draft.assets.preview ?? null
  fileName.value = record.draft.assets.image ?? ''
  Object.assign(form, {
    title: record.draft.name ?? '',
    role: record.draft.role ?? '',
    summary: record.draft.summary ?? '',
    firstMessage: record.draft.first_mes ?? '',
    behavior: record.draft.behavior ?? '',
    links: (record.draft.links ?? []).join(' '),
  })
  code.value = JSON.stringify(record.draft, null, 2)
  qrImage.value = record.qrImage
  qrEmbedded.value = record.qrEmbedded
  qrSize.value = record.qrSizeKb ?? Math.round((code.value.length / 1024) * 100) / 100
  analyzing.value = false
  error.value = null
}

defineExpose({
  loadDraft,
})
</script>

<template>
  <div class="workspace">
    <section class="workspace__grid">
      <article class="panel">
        <header class="panel__header">
          <span class="kicker">MetaCapture</span>
          <h2>画像からカード情報を抽出</h2>
        </header>

        <div
          class="dropzone"
          :class="{ active: hasFile }"
          @drop="onDrop"
          @dragover="onDragOver"
        >
          <p v-if="!hasFile">画像をドロップするか、クリックして選択してください。</p>
          <figure v-else class="preview">
            <img :src="previewSrc!" alt="preview" />
            <figcaption>{{ fileName }}</figcaption>
          </figure>
          <input ref="fileInput" class="dropzone__input" type="file" accept="image/*" @change="onFileChange" />
        </div>

        <div class="actions">
          <button type="button" class="btn" @click="triggerBrowse">ファイルを選択</button>
          <button type="button" class="btn btn-primary" :disabled="analyzing" @click="analyze">
            {{ analyzing ? '解析中...' : '解析' }}
          </button>
          <button type="button" class="btn btn-ghost" @click="resetCapture">リセット</button>
        </div>

        <div class="fields" style="margin-top: 20px;">
          <label class="full">
            <span>{{ labels.urlLabel }}</span>
            <input v-model="form.url" type="text" :placeholder="labels.urlPh" />
          </label>
          <label class="full">
            <span>{{ labels.wishLabel }}</span>
            <textarea v-model="form.wish" rows="2" :placeholder="labels.wishPh"></textarea>
          </label>
          <label class="checkbox">
            <input v-model="form.deepScan" type="checkbox" />
            <span>{{ labels.deepScanLabel }}</span>
          </label>
        </div>

        <p v-if="error" class="panel__error">{{ error }}</p>
      </article>

      <article class="panel">
        <header class="panel__header">
          <span class="kicker">Card Draft</span>
          <h2>カード概要</h2>
        </header>
        <div class="fields">
          <label>
            <span>タイトル</span>
            <input v-model="form.title" type="text" placeholder="キャラクター名" />
          </label>
          <label>
            <span>役割</span>
            <input v-model="form.role" type="text" placeholder="例: Navigator / Rival" />
          </label>
          <label class="full">
            <span>サマリー</span>
            <textarea v-model="form.summary" rows="4" placeholder="画像から抽出した人物像やメモ..."></textarea>
          </label>
          <label class="full">
            <span>初回メッセージ</span>
            <textarea v-model="form.firstMessage" rows="3" placeholder="first_mes に相当する挨拶文"></textarea>
          </label>
          <label class="full">
            <span>ふるまい / トーン</span>
            <textarea v-model="form.behavior" rows="3" placeholder="例: 落ち着いており、質問には丁寧に答える"></textarea>
          </label>
          <label class="full">
            <span>関連リンク</span>
            <input v-model="form.links" type="text" placeholder="スペース区切りでURLを入力" />
          </label>
        </div>
      </article>

      <article class="panel panel--code">
        <header class="panel__header">
          <span class="kicker">JSON Preview</span>
        </header>
        <pre class="code">{{ code }}</pre>
        <footer class="panel__footer">
          <button type="button" class="btn" :disabled="!readyToDownload" @click="downloadJson">JSONをダウンロード</button>
          <button type="button" class="btn" :disabled="!readyToDownload" @click="downloadQr(true)">QRを保存</button>
          <button type="button" class="btn" :disabled="!readyToDownload" @click="downloadQr(false)">QR+埋込を保存</button>
          <button type="button" class="btn btn-primary" :disabled="!readyToDownload" @click="onSave">ライブラリに保存(モック)</button>
        </footer>
      </article>

      <aside class="sidebar">
        <section class="sidebar__section" v-if="featureTitle || featureDescription">
          <span class="kicker">ガイド</span>
          <h3>{{ featureTitle }}</h3>
          <p>{{ featureDescription }}</p>
          <ul>
            <li v-for="bullet in featureBullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </section>
        <section class="sidebar__section" v-if="knowledgeTitle">
          <span class="kicker">メモ</span>
          <h3>{{ knowledgeTitle }}</h3>
          <p v-for="line in knowledgeBody" :key="line">{{ line }}</p>
        </section>
        <section class="sidebar__section" v-if="qrImage || qrEmbedded">
          <span class="kicker">QR Preview</span>
          <figure class="qr-preview" v-if="qrImage">
            <img :src="qrImage" alt="QR preview" />
            <figcaption>raw</figcaption>
          </figure>
          <figure class="qr-preview" v-if="qrEmbedded">
            <img :src="qrEmbedded" alt="QR embedded" />
            <figcaption>embedded ({{ qrSize ?? 0 }} KB)</figcaption>
          </figure>
          <figure class="qr-preview" v-if="reincarnationQr">
            <img :src="reincarnationQr" alt="QR Reincarnation" />
            <figcaption>{{ labels.reincarnationLabel }}</figcaption>
          </figure>
        </section>
      </aside>
    </section>
  </div>
</template>

<style scoped>
.workspace {
  display: grid;
  gap: 28px;
}

.workspace__grid {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.1fr) minmax(0, 0.9fr);
}

@media (max-width: 1200px) {
  .workspace__grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }
}

.panel,
.sidebar__section {
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(12, 18, 32, 0.45);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  padding: clamp(18px, 3vw, 28px);
  display: grid;
  gap: 16px;
}

.panel__header {
  display: grid;
  gap: 6px;
}

.panel__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.kicker {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.25em;
  color: var(--brand-2, #58cff5);
}

.dropzone {
  position: relative;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  min-height: 180px;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 24px;
  color: rgba(229, 233, 240, 0.8);
  background: rgba(5, 10, 18, 0.35);
}

.dropzone.active {
  border-style: solid;
  border-color: var(--brand-2, #58cff5);
}

.dropzone__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.preview {
  display: grid;
  gap: 8px;
  justify-items: center;
}

.preview img {
  max-width: min(320px, 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(0, 0, 0, 0.3);
  color: inherit;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(90deg, var(--brand, #e87b25), var(--brand-2, #58cff5));
  color: #0b0f14;
  border: none;
}

.btn-ghost {
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.22);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fields {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.fields label {
  display: grid;
  gap: 6px;
  font-size: 0.85rem;
  opacity: 0.85;
}

.fields label.full {
  grid-column: 1 / -1;
}

.fields input,
.fields textarea {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.25);
  color: inherit;
  padding: 10px 12px;
}

.panel--code {
  display: grid;
  gap: 14px;
}

.code {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8rem;
  line-height: 1.45;
  padding: 16px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.35);
  color: rgba(229, 233, 240, 0.85);
  max-height: 340px;
  overflow: auto;
  white-space: pre-wrap;
}

.sidebar {
  display: grid;
  gap: 18px;
}

.qr-preview {
  display: grid;
  gap: 6px;
  justify-items: center;
}

.qr-preview img {
  width: clamp(160px, 20vw, 220px);
  height: auto;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(0, 0, 0, 0.2);
}

.qr-preview figcaption {
  font-size: 0.75rem;
  opacity: 0.75;
}
</style>
