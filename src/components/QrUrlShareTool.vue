<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { decodeQrImageFile, generateShareQrDataUrl } from '../utils/qrToolkit'

type ToolStatus = 'idle' | 'reading' | 'ready' | 'error'

const sourceText = ref('')
const qrDataUrl = ref('')
const status = ref<ToolStatus>('idle')
const message = ref('URLを貼り付けるか、QR画像を選んでください。')
const inputRef = ref<HTMLInputElement | null>(null)

const trimmedText = computed(() => sourceText.value.trim())
const httpUrl = computed(() => {
  try {
    const parsed = new URL(trimmedText.value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : ''
  } catch {
    return ''
  }
})
const isReady = computed(() => Boolean(httpUrl.value))

function resetOutput() {
  qrDataUrl.value = ''
  if (status.value !== 'reading') {
    status.value = trimmedText.value ? 'ready' : 'idle'
    message.value = trimmedText.value
      ? (isReady.value ? 'URLを確認しました。コピーまたはQR発行を選べます。' : 'https:// または http:// から始まるURLを入れてください。')
      : 'URLを貼り付けるか、QR画像を選んでください。'
  }
}

async function copyUrl() {
  if (!httpUrl.value) return
  try {
    await navigator.clipboard.writeText(httpUrl.value)
    status.value = 'ready'
    message.value = 'URLをコピーしました。使いたいAIチャットへ貼り付けてください。'
  } catch {
    status.value = 'error'
    message.value = '自動コピーできませんでした。上のURL欄を選択して手動でコピーしてください。'
  }
}

async function issueQr() {
  if (!httpUrl.value) return
  try {
    qrDataUrl.value = await generateShareQrDataUrl(httpUrl.value)
    status.value = 'ready'
    message.value = 'URLからQRコードを発行しました。保存または別端末で読み取れます。'
  } catch {
    status.value = 'error'
    message.value = 'QRコードを発行できませんでした。URLを確認してください。'
  }
}

async function readQrFile(files: FileList | null) {
  const file = files?.[0]
  if (!file) return
  status.value = 'reading'
  message.value = 'このブラウザ内でQR画像を読んでいます…'
  qrDataUrl.value = ''
  try {
    sourceText.value = await decodeQrImageFile(file)
    status.value = 'ready'
    message.value = isReady.value
      ? 'QRからURLを取り出しました。内容を確認・編集してから、コピーまたはQR再発行を選べます。'
      : 'QRの内容を取り出しました。URLではないため、必要に応じて内容を確認してください。'
  } catch (error) {
    status.value = 'error'
    message.value = error instanceof Error ? error.message : 'QR画像を読み取れませんでした。'
  } finally {
    if (inputRef.value) inputRef.value.value = ''
  }
}

function downloadQr() {
  if (!qrDataUrl.value) return
  const anchor = document.createElement('a')
  anchor.href = qrDataUrl.value
  anchor.download = 'izakaya-share-qr.png'
  anchor.click()
}

onBeforeUnmount(() => {
  qrDataUrl.value = ''
})
</script>

<template>
  <section id="qr-url" class="qr-url-tool" aria-labelledby="qr-url-title">
    <header>
      <p class="kicker">LOCAL TOOL</p>
      <h2 id="qr-url-title">URL・QR受け渡し</h2>
      <p>同じリージョンを、URL貼り付けとQRコードのどちらでも渡せます。QR画像の読み取り、URLの確認・編集、QRの再発行はすべてこのブラウザ内で行います。</p>
    </header>

    <div class="qr-url-tool__steps" aria-label="使い方">
      <span>1. URLまたはQRを受け取る</span><span>2. 内容を確認・編集</span><span>3. コピーかQR発行を選ぶ</span>
    </div>

    <div class="qr-url-tool__input">
      <label>
        <span>リージョンURL</span>
        <textarea v-model="sourceText" rows="4" placeholder="https://… を貼り付けてください" @input="resetOutput" />
      </label>
      <div class="qr-url-tool__or" aria-hidden="true">または</div>
      <div class="qr-url-tool__file">
        <strong>QR画像からURLを取り出す</strong>
        <p>スクリーンショットや保存したQR画像を選びます。</p>
        <input ref="inputRef" type="file" accept="image/png,image/jpeg,image/webp,image/gif" @change="readQrFile(($event.target as HTMLInputElement).files)" />
      </div>
    </div>

    <p class="qr-url-tool__status" :class="`is-${status}`" role="status">{{ message }}</p>

    <div class="qr-url-tool__actions">
      <button type="button" :disabled="!isReady || status === 'reading'" @click="copyUrl">URLをコピーしてAIへ貼る</button>
      <button type="button" :disabled="!isReady || status === 'reading'" @click="issueQr">このURLでQRを発行</button>
    </div>

    <div v-if="qrDataUrl" class="qr-url-tool__result">
      <img :src="qrDataUrl" alt="入力したURLの共有用QRコード" />
      <div><strong>共有用QRコードを作成しました</strong><p>QRを読めないAIでは、上の「URLをコピーしてAIへ貼る」を使ってください。</p><button type="button" @click="downloadQr">PNGで保存</button></div>
    </div>

    <p class="qr-url-tool__note">このツールはURLと選択したQR画像を外部へ送信しません。決済QR、ポイント、アカウント情報の処理には使いません。期間付きアクセスURLを復元した場合は、URLを編集せず元のままコピーしてください。署名や期限のあるURLは一文字でも変えると使えなくなることがあります。</p>
  </section>
</template>

<style scoped>
.qr-url-tool { display: grid; grid-template-columns: minmax(0, 1fr); min-width: 0; max-width: 100%; gap: 18px; padding: clamp(20px, 3vw, 30px); border: 1px solid rgba(114, 215, 255, .35); border-radius: 18px; background: linear-gradient(135deg, rgba(25, 64, 94, .32), rgba(8, 11, 20, .78)); scroll-margin-top: 24px; }
.kicker { margin: 0; color: #ff85c7; font-size: 12px; font-weight: 900; letter-spacing: .13em; }.qr-url-tool h2 { margin: 6px 0 0; color: #fff; }.qr-url-tool header p:last-child, .qr-url-tool__note, .qr-url-tool__file p, .qr-url-tool__result p { color: rgba(245, 248, 255, .72); line-height: 1.65; }.qr-url-tool__steps { display: flex; flex-wrap: wrap; gap: 8px; color: #c5f3ff; font-size: .85rem; font-weight: 800; }.qr-url-tool__steps span { border: 1px solid rgba(114, 215, 255, .25); border-radius: 999px; padding: 7px 10px; background: rgba(114, 215, 255, .08); }
.qr-url-tool__input { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(220px, .72fr); gap: 16px; align-items: stretch; }.qr-url-tool label { display: grid; gap: 7px; color: rgba(245, 248, 255, .9); font-size: 14px; font-weight: 800; }.qr-url-tool textarea { box-sizing: border-box; width: 100%; min-height: 108px; resize: vertical; border: 1px solid rgba(255, 255, 255, .18); border-radius: 10px; padding: 10px 12px; background: rgba(3, 7, 16, .78); color: #f5f8ff; font: 13px/1.55 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }.qr-url-tool__or { display: grid; place-items: center; color: rgba(245, 248, 255, .55); font-size: .85rem; }.qr-url-tool__file { display: grid; grid-template-columns: minmax(0, 1fr); align-content: center; gap: 7px; border: 1px dashed rgba(114, 215, 255, .4); border-radius: 12px; padding: 16px; background: rgba(3, 7, 16, .3); }.qr-url-tool__file > * { min-width: 0; }.qr-url-tool__file p { margin: 0; font-size: .85rem; }.qr-url-tool__file input { max-width: 100%; color: #c5f3ff; }
.qr-url-tool__status { margin: 0; min-height: 1.6em; color: rgba(245, 248, 255, .76); }.qr-url-tool__status.is-ready { color: #9effb8; }.qr-url-tool__status.is-error { color: #ffb1ba; }.qr-url-tool__actions { display: flex; flex-wrap: wrap; gap: 10px; }.qr-url-tool button { min-height: 42px; border: 1px solid rgba(114, 215, 255, .48); border-radius: 999px; padding: 0 14px; background: #72d7ff; color: #06121d; font: inherit; font-weight: 900; cursor: pointer; }.qr-url-tool button:disabled { cursor: not-allowed; opacity: .45; }.qr-url-tool__actions button + button, .qr-url-tool__result button { background: rgba(255, 255, 255, .06); color: #c5f3ff; }.qr-url-tool__result { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 18px; align-items: center; border-top: 1px solid rgba(255, 255, 255, .12); padding-top: 18px; }.qr-url-tool__result img { width: 150px; height: 150px; border-radius: 10px; background: #fff; image-rendering: pixelated; }.qr-url-tool__result p { margin: 7px 0 12px; }.qr-url-tool__note { margin: 0; border-left: 3px solid #ffcf72; padding-left: 12px; font-size: 14px; }
@media (max-width: 720px) { .qr-url-tool__input { grid-template-columns: minmax(0, 1fr); }.qr-url-tool__input > * { min-width: 0; }.qr-url-tool__or { min-height: 20px; }.qr-url-tool__result { grid-template-columns: minmax(0, 1fr); }.qr-url-tool__result img { width: min(220px, 100%); height: auto; } }
</style>
