<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { generateShareQrDataUrl } from '../utils/qrToolkit'
import { REGION_HELP_PROFILES } from '../data/regionHelpProfiles'
import { findPromotionCampaign, promotionCampaignIdFromHash } from '../data/promotionCampaigns'
import {
  buildPromotionStartPacket,
  EXTERNAL_AI_VENDORS,
  PLAY_MODES,
  type ExternalAiVendorId,
  type PlayModeId,
} from '../core/promotionTicket'
import { navigateTo, PAGE_PATHS } from '../constants/navigation'

type PassState = 'checking' | 'not_claimed' | 'active' | 'inactive' | 'error'
type ReportEvent = 'start_packet_opened' | 'play_started_reported' | 'play_blocked_reported'

const gateUrl = (import.meta.env.VITE_ACCESS_GATE_URL || '').replace(/\/$/, '')
const initialPassKey = 'izakaya2.accessgate.initial-pass.v1'
const measurementPrefix = 'izakaya2.measurement.v1'
const campaignId = promotionCampaignIdFromHash(window.location.hash)
const campaign = findPromotionCampaign(campaignId)
const qrDataUrl = ref('')
const selectedRegionId = ref(REGION_HELP_PROFILES[0]?.regionId ?? '')
const selectedVendorId = ref<ExternalAiVendorId>('chatgpt')
const selectedModeId = ref<PlayModeId>('guided')
const passState = ref<PassState>('checking')
const status = ref('利用権を確認しています。')
const packet = ref('')
const reportStatus = ref('')

const selectedProfile = computed(() => REGION_HELP_PROFILES.find((item) => item.regionId === selectedRegionId.value) ?? REGION_HELP_PROFILES[0])
const selectedVendor = computed(() => EXTERNAL_AI_VENDORS.find((item) => item.id === selectedVendorId.value) ?? EXTERNAL_AI_VENDORS[0])
const selectedMode = computed(() => PLAY_MODES.find((item) => item.id === selectedModeId.value) ?? PLAY_MODES[0])
const campaignActive = computed(() => {
  if (!campaign) return false
  const now = Date.now()
  return now >= new Date(campaign.activeFrom).getTime() && now <= new Date(campaign.activeUntil).getTime()
})
const canIssuePacket = computed(() => Boolean(campaign && campaignActive.value && passState.value === 'active' && selectedProfile.value && selectedVendor.value && selectedMode.value))

function dayKey() {
  return new Date().toISOString().slice(0, 10)
}

async function track(event: ReportEvent, regionId?: string) {
  if (!gateUrl || !campaign) return false
  const key = `${measurementPrefix}:${dayKey()}:${campaign.id}:${event}:${regionId || '_'}`
  try {
    if (window.sessionStorage.getItem(key)) return true
    const response = await fetch(`${gateUrl}/marketing/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, campaignId: campaign.id, ...(regionId ? { regionId } : {}) }),
      keepalive: true,
    })
    if (response.ok) window.sessionStorage.setItem(key, '1')
    return response.ok
  } catch {
    return false
  }
}

async function verifyPass() {
  packet.value = ''
  if (!campaign || !campaignActive.value) {
    passState.value = 'inactive'
    status.value = campaign ? 'このキャンペーンの発券期間は終了しています。' : '指定されたキャンペーンは利用できません。'
    return
  }
  const token = window.localStorage.getItem(initialPassKey)
  if (!token) {
    passState.value = 'not_claimed'
    status.value = '24時間フリーパスはまだ発行されていません。AccessGATEで無料発行してください。'
    return
  }
  if (!gateUrl || !selectedProfile.value) {
    passState.value = 'error'
    status.value = '利用権の確認先に接続できません。時間を置いて再度お試しください。'
    return
  }
  passState.value = 'checking'
  status.value = '利用権を確認しています。'
  try {
    const response = await fetch(`${gateUrl}/passes/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, regionId: selectedProfile.value.regionId }),
    })
    const data = await response.json().catch(() => ({})) as { ok?: boolean }
    if (response.ok && data.ok === true) {
      passState.value = 'active'
      status.value = '24時間フリーパスを確認しました。開始パケットを発行できます。'
    } else {
      passState.value = 'inactive'
      status.value = 'フリーパスが期限切れか、この利用権を確認できませんでした。'
    }
  } catch {
    passState.value = 'error'
    status.value = '通信のため利用権を確認できませんでした。再確認してください。'
  }
}

function openAccessGate() {
  if (!campaign) return
  try {
    window.sessionStorage.setItem('izakaya2.promo.return.v1', campaign.publicUrl)
  } catch {
    // Storage restrictions do not block navigation.
  }
  navigateTo(`${PAGE_PATHS.access}?campaign=${encodeURIComponent(campaign.id)}`)
}

async function copyText(value: string, success: string) {
  try {
    await navigator.clipboard.writeText(value)
    status.value = success
  } catch {
    status.value = 'コピーできませんでした。表示されている内容を手動でコピーしてください。'
  }
}

function downloadQr() {
  if (!campaign || !qrDataUrl.value) return
  const anchor = document.createElement('a')
  anchor.href = qrDataUrl.value
  anchor.download = `${campaign.id}-public-entry-qr.png`
  anchor.click()
}

async function issuePacket() {
  if (!canIssuePacket.value || !campaign || !selectedProfile.value || !selectedVendor.value || !selectedMode.value) return
  packet.value = buildPromotionStartPacket(campaign, selectedProfile.value, selectedMode.value, selectedVendor.value)
  status.value = '開始パケットを発行しました。コピーして選んだAIの新規チャットへ貼り付けてください。'
  void track('start_packet_opened', selectedProfile.value.regionId)
}

function openVendor() {
  if (!selectedVendor.value?.url) {
    status.value = '利用したいAIの新規チャットを開き、開始パケットを貼り付けてください。'
    return
  }
  window.open(selectedVendor.value.url, '_blank', 'noopener,noreferrer')
}

async function reportPlay(event: 'play_started_reported' | 'play_blocked_reported') {
  const ok = await track(event, selectedRegionId.value)
  reportStatus.value = ok ? '匿名の結果だけを記録しました。会話本文は送信していません。' : '結果を送信できませんでした。プレイはそのまま続けられます。'
}

watch(selectedRegionId, () => void verifyPass())

onMounted(async () => {
  window.scrollTo({ top: 0, behavior: 'auto' })
  if (!campaign) {
    passState.value = 'inactive'
    status.value = '指定されたキャンペーンは利用できません。'
    return
  }
  qrDataUrl.value = await generateShareQrDataUrl(campaign.publicUrl)
  await verifyPass()
})
</script>

<template>
  <main class="promo-page">
    <header class="promo-hero">
      <div>
        <p class="kicker">MUSE OFFICIAL · IZAKAYA VERSE</p>
        <h1>{{ campaign?.title || 'キャンペーンを確認できません' }}</h1>
        <p v-if="campaign">ミューズが運用モデレーターとして案内する、外部AIでの人間プレイ検証入口です。自動プレイではなく、利用者が選んだAIで体験します。</p>
      </div>
      <div v-if="campaign" class="pass-badge"><strong>0P</strong><span>24 HOURS</span><small>1アカウント1回</small></div>
    </header>

    <section v-if="campaign" class="promo-card promo-card--qr" aria-labelledby="qr-title">
      <div>
        <p class="eyebrow">PUBLIC CAMPAIGN QR</p>
        <h2 id="qr-title">公式フリーパス入口を共有</h2>
        <p>このQRには公開キャンペーンURLだけが入っています。秘密鍵、モデレーター招待、利用権トークンは含みません。</p>
        <dl>
          <div><dt>運用</dt><dd>{{ campaign.operatorDisplayName }}</dd></div>
          <div><dt>発券期間</dt><dd>{{ new Date(campaign.activeUntil).toLocaleString('ja-JP') }}まで</dd></div>
        </dl>
        <div class="actions">
          <button type="button" @click="copyText(campaign.publicUrl, '公式キャンペーンURLをコピーしました。')">URLをコピー</button>
          <button type="button" class="secondary" :disabled="!qrDataUrl" @click="downloadQr">QR画像を保存</button>
        </div>
        <code class="public-url">{{ campaign.publicUrl }}</code>
      </div>
      <img v-if="qrDataUrl" :src="qrDataUrl" alt="ミューズ公式AI体験フリーパスの公開入口QRコード" />
    </section>

    <section v-if="campaign" class="promo-card" aria-labelledby="pass-title">
      <p class="eyebrow">01 · FREE PASS</p>
      <h2 id="pass-title">24時間フリーパスを確認</h2>
      <p>QRは入口です。実際の利用権はAccessGATEで無料発行し、この端末で確認します。</p>
      <div class="actions">
        <button v-if="passState !== 'active'" type="button" @click="openAccessGate">0P・24Hパスを発行</button>
        <button type="button" class="secondary" @click="verifyPass">利用権を再確認</button>
      </div>
    </section>

    <section v-if="campaign" class="promo-card" aria-labelledby="play-title">
      <p class="eyebrow">02 · EXPERIENCE PLAY</p>
      <h2 id="play-title">外部AI用の開始パケットを作る</h2>
      <div class="control-grid">
        <label><span>リージョン</span><select v-model="selectedRegionId"><option v-for="profile in REGION_HELP_PROFILES" :key="profile.regionId" :value="profile.regionId">{{ profile.regionName }} · {{ profile.version }}</option></select></label>
        <label><span>利用するAI</span><select v-model="selectedVendorId"><option v-for="vendor in EXTERNAL_AI_VENDORS" :key="vendor.id" :value="vendor.id">{{ vendor.label }}</option></select></label>
        <label><span>プレイ方式</span><select v-model="selectedModeId"><option v-for="mode in PLAY_MODES" :key="mode.id" :value="mode.id">{{ mode.label }}</option></select></label>
      </div>
      <button type="button" :disabled="!canIssuePacket" @click="issuePacket">開始パケットを発行</button>
      <div v-if="packet" class="packet">
        <textarea :value="packet" rows="22" readonly aria-label="外部AI用開始パケット" />
        <div class="actions">
          <button type="button" @click="copyText(packet, '開始パケットをコピーしました。AIの新規チャットへ貼り付けてください。')">パケットをコピー</button>
          <button type="button" class="secondary" @click="openVendor">{{ selectedVendor?.label }}を開く</button>
        </div>
      </div>
      <p class="boundary">AIアカウント、APIキー、会話ログ、元V2カード、画像原本はIZAKAYAへ送信しません。AI側の費用は利用者側で管理します。</p>
    </section>

    <section v-if="campaign && packet" class="promo-card" aria-labelledby="report-title">
      <p class="eyebrow">03 · PLAY REPORT</p>
      <h2 id="report-title">人間プレイが開始できたか報告</h2>
      <p>当面は健全に開始できたかだけを匿名集計します。成功シナリオをプレイスルーログ候補へ採用する場合は、別途明示的な提出手続きが必要です。</p>
      <div class="actions">
        <button type="button" @click="reportPlay('play_started_reported')">開始できた</button>
        <button type="button" class="secondary" @click="reportPlay('play_blocked_reported')">開始で詰まった</button>
      </div>
      <p v-if="reportStatus" class="report-status">{{ reportStatus }}</p>
    </section>

    <p class="status" role="status">{{ status }}</p>
  </main>
</template>

<style scoped>
.promo-page { display: grid; gap: 18px; max-width: 1040px; margin: 0 auto; padding: 12px 0 52px; }
.promo-hero, .promo-card { border: 1px solid rgba(255,255,255,.14); border-radius: 20px; padding: clamp(22px,4vw,38px); background: rgba(8,11,20,.78); }
.promo-hero { display: grid; grid-template-columns: minmax(0,1fr) auto; align-items: center; gap: 24px; background: radial-gradient(circle at 84% 18%, rgba(255,77,173,.25), transparent 34%), radial-gradient(circle at 14% 84%, rgba(114,215,255,.12), transparent 36%), rgba(8,11,20,.8); }
.promo-hero h1, .promo-card h2 { margin: 6px 0 10px; color: #fff; }.promo-hero p:last-child, .promo-card p { color: rgba(245,248,255,.78); line-height: 1.7; }
.kicker, .eyebrow { margin: 0; color: #ff85c7; font-size: 12px; font-weight: 900; letter-spacing: .13em; }.eyebrow { color: #79e8ff; }
.pass-badge { display: grid; justify-items: center; min-width: 150px; border: 1px solid rgba(255,207,114,.58); border-radius: 999px; padding: 24px 18px; background: rgba(255,207,114,.1); color: #fff5ce; }.pass-badge strong { font-size: 2.1rem; }.pass-badge span { font-weight: 900; letter-spacing: .1em; }.pass-badge small { margin-top: 4px; }
.promo-card { display: grid; gap: 14px; }.promo-card--qr { grid-template-columns: minmax(0,1fr) minmax(180px,260px); align-items: center; }.promo-card--qr img { box-sizing: border-box; width: 100%; border-radius: 16px; padding: 10px; background: #fff; }
.promo-card dl { display: flex; flex-wrap: wrap; gap: 10px; margin: 0; }.promo-card dl div { min-width: 180px; border-left: 3px solid #ffcf72; padding-left: 10px; }.promo-card dt { color: rgba(245,248,255,.6); font-size: .8rem; }.promo-card dd { margin: 3px 0 0; color: #fff5ce; font-weight: 800; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; }.actions button, .promo-card > button { width: fit-content; min-height: 42px; border: 1px solid #72d7ff; border-radius: 999px; padding: 0 16px; background: #72d7ff; color: #06121d; font: inherit; font-weight: 900; cursor: pointer; }.actions button.secondary { background: rgba(255,255,255,.06); color: #bdefff; }.actions button:disabled, .promo-card > button:disabled { cursor: not-allowed; opacity: .45; }
.public-url { display: block; overflow-wrap: anywhere; color: #bdefff; }.control-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; }.control-grid label { display: grid; gap: 7px; color: rgba(245,248,255,.86); font-size: .86rem; font-weight: 800; }.control-grid select, .packet textarea { box-sizing: border-box; width: 100%; border: 1px solid rgba(255,255,255,.18); border-radius: 10px; padding: 10px 12px; background: rgba(3,7,16,.82); color: #f5f8ff; font: inherit; }.packet { display: grid; gap: 12px; }.packet textarea { resize: vertical; font: 13px/1.55 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; }
.boundary { margin: 0; border-left: 3px solid #ffcf72; padding-left: 12px; font-size: .9rem; }.status, .report-status { margin: 0; border-left: 3px solid #9effb8; padding-left: 12px; color: #d9ffe6; line-height: 1.65; }
@media (max-width: 760px) { .promo-hero, .promo-card--qr { grid-template-columns: 1fr; }.pass-badge { justify-self: start; }.promo-card--qr img { width: min(100%,280px); }.control-grid { grid-template-columns: 1fr; } }
</style>
