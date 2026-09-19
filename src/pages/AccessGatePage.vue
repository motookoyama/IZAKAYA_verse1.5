<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { navigateTo, PAGE_PATHS } from '../constants/navigation'
import { regionMonthlyPassPoints } from '../constants/points'
import { ACCESS_PASS_REGIONS } from '../data/accessPassRegions'

type ModeratorEvaluation = { expiresAt: string; testPointsRemaining: number }
type Account = { id: string; balance: number; initialPassIssued: boolean; createdAt: string; moderatorEvaluation: ModeratorEvaluation | null }
type LocalAccount = { accountId: string; recoveryCode: string }

const gateUrl = (import.meta.env.VITE_ACCESS_GATE_URL || '').replace(/\/$/, '')
const storageKey = 'izakaya2.accessgate.account.v1'
const pendingOrderKey = 'izakaya2.accessgate.pending-order.v1'
const measurementPrefix = 'izakaya2.measurement.v1'
const moderatorSessionKey = 'izakaya2.moderator-evaluation.v1'
const account = ref<Account | null>(null)
const recoveryCode = ref('')
const status = ref(gateUrl ? '登録すると、最初の24時間フリーパスを一度だけ発行できます。' : '接続先を確認しています。少し時間を置いて再度開いてください。')
const busy = ref(false)
const passExpiresAt = ref('')
const selectedRegionId = ref(ACCESS_PASS_REGIONS[0]?.id || '')

const ready = computed(() => Boolean(gateUrl))
const accountId = computed(() => account.value?.id || '')
const selectedRegionPrice = computed(() => regionMonthlyPassPoints(selectedRegionId.value))
const moderatorEvaluation = computed(() => account.value?.moderatorEvaluation || null)

function storedAccount(): LocalAccount | null {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<LocalAccount>
    return typeof parsed.accountId === 'string' && typeof parsed.recoveryCode === 'string' ? { accountId: parsed.accountId, recoveryCode: parsed.recoveryCode } : null
  } catch {
    return null
  }
}

async function request<T>(path: string, method = 'GET', body?: Record<string, unknown>): Promise<T> {
  if (!gateUrl) throw new Error('access_gate_not_configured')
  const response = await fetch(`${gateUrl}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({})) as T & { error?: string }
  if (!response.ok) throw new Error(data.error || `http_${response.status}`)
  return data
}

function dayKey() {
  return new Date().toISOString().slice(0, 10)
}

function moderatorClaimToken() {
  const hash = window.location.hash
  const queryIndex = hash.indexOf('?')
  if (queryIndex < 0) return ''
  return new URLSearchParams(hash.slice(queryIndex + 1)).get('moderator_claim') || ''
}

function moderatorSessionActive() {
  try {
    const expiry = window.sessionStorage.getItem(moderatorSessionKey)
    return Boolean(expiry && new Date(expiry).getTime() > Date.now())
  } catch {
    return Boolean(moderatorEvaluation.value)
  }
}

/** Measurement must never interrupt registration, ticketing, or payment. */
function trackMarketingEvent(event: 'access_gate_viewed' | 'trial_cta_clicked' | 'ticket_issued' | 'purchase_cta_clicked', regionId?: string) {
  if (!gateUrl || moderatorSessionActive() || moderatorEvaluation.value) return
  const key = `${measurementPrefix}:${dayKey()}:${event}:${regionId || '_'}`
  try {
    if (window.sessionStorage.getItem(key)) return
    window.sessionStorage.setItem(key, '1')
    void fetch(`${gateUrl}/marketing/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, campaignId: 'second-wave-launch', ...(regionId ? { regionId } : {}) }),
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    // Private browsing/storage restrictions must not affect the primary action.
  }
}

async function claimModeratorInvitation(token: string) {
  if (!token) return false
  // The fragment contains a one-time secret. Remove it before network or UI work
  // so screenshots, copied URLs, and later navigation cannot disclose it.
  window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}#/access`)
  busy.value = true
  try {
    const data = await request<{
      accountId: string
      recoveryCode: string
      invitation: { expiresAt: string; testPointsRemaining: number }
    }>('/moderator/claim', 'POST', { token })
    window.localStorage.setItem(storageKey, JSON.stringify({ accountId: data.accountId, recoveryCode: data.recoveryCode }))
    window.sessionStorage.removeItem(pendingOrderKey)
    window.sessionStorage.setItem(moderatorSessionKey, data.invitation.expiresAt)
    recoveryCode.value = data.recoveryCode
    await loadAccount()
    status.value = `評価用アカウントを受け入れました。仮ポイント${data.invitation.testPointsRemaining}P、有効期限は${new Date(data.invitation.expiresAt).toLocaleString('ja-JP')}です。`
    return true
  } catch (error) {
    status.value = `モデレーター招待を受け入れられませんでした: ${error instanceof Error ? error.message : 'unknown_error'}`
    return false
  } finally {
    busy.value = false
  }
}

async function loadAccount() {
  const stored = storedAccount()
  if (!stored) return
  try {
    const data = await request<{ account: Account }>(`/accounts/${encodeURIComponent(stored.accountId)}`)
    account.value = data.account
    recoveryCode.value = stored.recoveryCode
  } catch {
    window.localStorage.removeItem(storageKey)
  }
}

async function createAccount() {
  busy.value = true
  try {
    const data = await request<{ accountId: string; recoveryCode: string }>('/accounts', 'POST')
    const local = { accountId: data.accountId, recoveryCode: data.recoveryCode }
    window.localStorage.setItem(storageKey, JSON.stringify(local))
    recoveryCode.value = local.recoveryCode
    await loadAccount()
    status.value = 'アカウントを用意しました。復旧コードを保存してから、24時間フリーパスを発行してください。'
  } catch (error) {
    status.value = `登録できませんでした: ${error instanceof Error ? error.message : 'unknown_error'}`
  } finally {
    busy.value = false
  }
}

async function copyRecoveryCode() {
  try {
    await navigator.clipboard.writeText(recoveryCode.value)
    status.value = '復旧コードをコピーしました。安全な場所に保管してください。'
  } catch {
    status.value = 'コピーできませんでした。表示されている復旧コードを安全な場所に控えてください。'
  }
}

async function issueInitialPass() {
  if (!account.value || moderatorEvaluation.value) return
  busy.value = true
  try {
    trackMarketingEvent('trial_cta_clicked')
    const data = await request<{ pass: { expiresAt: string }; token: string }>('/passes/initial', 'POST', { accountId: account.value.id, regionId: '*' })
    window.localStorage.setItem('izakaya2.accessgate.initial-pass.v1', data.token)
    passExpiresAt.value = data.pass.expiresAt
    await loadAccount()
    trackMarketingEvent('ticket_issued', 'all-regions')
    status.value = '24時間フリーパスを発行しました。好きなリージョンから遊び始めてください。'
  } catch (error) {
    status.value = `発行できませんでした: ${error instanceof Error ? error.message : 'unknown_error'}`
  } finally {
    busy.value = false
  }
}

async function beginPurchase() {
  if (!account.value) {
    status.value = '先にアカウントを用意してください。'
    return
  }
  if (moderatorEvaluation.value) {
    status.value = '評価用アカウントでは購入しません。付与済みの仮ポイントを使用してください。'
    return
  }
  busy.value = true
  try {
    trackMarketingEvent('purchase_cta_clicked', selectedRegionId.value)
    const data = await request<{ order: { id: string }; paypal: { approveUrl: string | null } }>('/orders', 'POST', { accountId: account.value.id, sku: 'points_100' })
    if (!data.paypal.approveUrl) throw new Error('paypal_approval_url_missing')
    window.sessionStorage.setItem(pendingOrderKey, data.order.id)
    window.location.assign(data.paypal.approveUrl)
  } catch (error) {
    status.value = `PayPal購入を開始できませんでした: ${error instanceof Error ? error.message : 'unknown_error'}`
    busy.value = false
  }
}

async function issue30DayPass() {
  if (!account.value || !selectedRegionId.value) return
  busy.value = true
  try {
    const data = await request<{ pass: { expiresAt: string }; token: string }>('/passes/30d', 'POST', {
      accountId: account.value.id,
      regionId: selectedRegionId.value,
      idempotencyKey: crypto.randomUUID(),
    })
    window.localStorage.setItem(`izakaya2.accessgate.region-pass.v1:${selectedRegionId.value}`, data.token)
    passExpiresAt.value = data.pass.expiresAt
    await loadAccount()
    trackMarketingEvent('ticket_issued', selectedRegionId.value)
    status.value = `${selectedRegionPrice.value}Pを使い、選択したリージョンの30日利用権を発行しました。`
  } catch (error) {
    status.value = `30日利用権を発行できませんでした: ${error instanceof Error ? error.message : 'unknown_error'}`
  } finally {
    busy.value = false
  }
}

async function captureReturnedPayment() {
  if (moderatorEvaluation.value || moderatorSessionActive()) return
  const token = new URLSearchParams(window.location.search).get('token')
  const pendingOrder = window.sessionStorage.getItem(pendingOrderKey)
  if (!token || !pendingOrder) return
  busy.value = true
  try {
    await request('/paypal/capture', 'POST', { orderId: pendingOrder })
    window.sessionStorage.removeItem(pendingOrderKey)
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`)
    await loadAccount()
    status.value = 'PayPalの支払いを確認し、100Pを付与しました。'
  } catch (error) {
    status.value = `支払い確認を完了できませんでした: ${error instanceof Error ? error.message : 'unknown_error'}`
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  const claimToken = moderatorClaimToken()
  const claimed = await claimModeratorInvitation(claimToken)
  if (!claimed) await loadAccount()
  if (!claimToken) trackMarketingEvent('access_gate_viewed')
  await captureReturnedPayment()
})
</script>

<template>
  <main class="access-gate-page">
    <header class="access-gate-hero">
      <p class="kicker">IZAKAYA2.0 ACCESSGATE</p>
      <h1>24Hフリーパスとポイント</h1>
      <p>AIの会話・画像生成費用は各自のAI環境で管理します。ここではIZAKAYAの利用権とポイントだけを扱います。</p>
    </header>

    <section v-if="moderatorEvaluation" class="access-card moderator-card" aria-labelledby="moderator-title">
      <p class="eyebrow">MODERATOR EVALUATION</p>
      <h2 id="moderator-title">期限付きの評価用アカウントです</h2>
      <p>付与された仮ポイントで通常と同じリージョン利用権を発行し、人間プレイヤーとして開始できるか確認してください。購入は不要です。</p>
      <dl>
        <div><dt>仮ポイント残高</dt><dd>{{ moderatorEvaluation.testPointsRemaining }}P</dd></div>
        <div><dt>評価期限</dt><dd>{{ new Date(moderatorEvaluation.expiresAt).toLocaleString('ja-JP') }}</dd></div>
      </dl>
      <p>会話内容は自動送信されません。プレイスルーログ候補への提出は、評価後に別途明示して行います。</p>
    </section>

    <section class="access-card" aria-labelledby="account-title">
      <p class="eyebrow">01 · ACCOUNT</p>
      <h2 id="account-title">アカウントを用意する</h2>
      <p>メールアドレスや会話ログは標準で受け取りません。この端末の復旧コードを保管してください。</p>
      <button v-if="!accountId" type="button" :disabled="busy || !ready" @click="createAccount">アカウントを作る</button>
      <div v-else class="account-state">
        <strong>利用中のアカウント</strong>
        <code>{{ accountId }}</code>
        <span>ポイント残高: {{ account?.balance ?? 0 }}P</span>
      </div>
      <div v-if="recoveryCode" class="recovery-code">
        <span>復旧コード（大切に保管）</span>
        <code>{{ recoveryCode }}</code>
        <button type="button" @click="copyRecoveryCode">コピー</button>
      </div>
    </section>

    <section class="access-card" aria-labelledby="pass-title">
      <p class="eyebrow">02 · FIRST PASS</p>
      <h2 id="pass-title">最初の24時間を試す</h2>
      <p>一アカウントにつき一回。発行から24時間、すべての基本リージョンを自由に試せます。</p>
      <button type="button" :disabled="busy || !accountId || account?.initialPassIssued || Boolean(moderatorEvaluation)" @click="issueInitialPass">
        {{ moderatorEvaluation ? '評価用は仮ポイントを使用' : account?.initialPassIssued ? '発行済み' : '24Hフリーパスを発行する' }}
      </button>
      <p v-if="passExpiresAt" class="expiry">期限: {{ new Date(passExpiresAt).toLocaleString('ja-JP') }}</p>
    </section>

    <section class="access-card access-card--purchase" aria-labelledby="purchase-title">
      <p class="eyebrow">03 · PAYPAL</p>
      <h2 id="purchase-title">100Pを購入する</h2>
      <p>¥1,000で100P。MMO1・MMO2は20P／30日、その他のリージョンは10P／30日です。支払いはPayPalの公式画面で行われます。</p>
      <button type="button" :disabled="busy || !accountId || !ready || Boolean(moderatorEvaluation)" @click="beginPurchase">{{ moderatorEvaluation ? '評価用は購入不要' : 'PayPalで100Pを購入' }}</button>
    </section>

    <section class="access-card" aria-labelledby="monthly-title">
      <p class="eyebrow">04 · 30 DAYS</p>
      <h2 id="monthly-title">リージョンの30日利用権を発行する</h2>
      <p>{{ moderatorEvaluation ? '付与された仮ポイントを使い、通常のプレイヤーと同じ手順で発行します。' : 'ポイントを購入した後、遊びたいリージョンを選んで発行します。' }}</p>
      <label class="region-select"><span>対象リージョン</span><select v-model="selectedRegionId" :disabled="busy || !accountId"><option v-for="region in ACCESS_PASS_REGIONS" :key="region.id" :value="region.id">{{ region.label_jp }} · {{ regionMonthlyPassPoints(region.id) }}P／30日</option></select></label>
      <p class="selected-price">選択中の値札: {{ selectedRegionPrice }}P／30日</p>
      <button type="button" :disabled="busy || !accountId || (account?.balance ?? 0) < selectedRegionPrice" @click="issue30DayPass">{{ selectedRegionPrice }}Pで30日利用権を発行</button>
    </section>

    <p class="status" role="status">{{ status }}</p>
    <p v-if="!moderatorEvaluation" class="measurement-note">運用改善のため、匿名のボタン操作数を日ごとに集計します。会話内容・AIキー・個人ID・決済情報は取得しません。</p>
    <p v-else class="measurement-note">評価用セッションは一般利用者向けの匿名マーケティング集計から除外されます。</p>
    <button type="button" class="back-link" @click="navigateTo(PAGE_PATHS.regions)">リージョン一覧へ戻る</button>
  </main>
</template>

<style scoped>
.access-gate-page { display: grid; gap: 18px; max-width: 900px; margin: 0 auto; padding: 12px 0 48px; }
.access-gate-hero, .access-card { border: 1px solid rgba(255, 255, 255, .14); border-radius: 18px; padding: clamp(22px, 4vw, 36px); background: radial-gradient(circle at 88% 18%, rgba(255, 77, 173, .16), transparent 34%), rgba(8, 11, 20, .76); }
.access-gate-hero h1, .access-card h2 { margin: 6px 0 10px; color: #fff; }.access-gate-hero p:last-child, .access-card p { color: rgba(245, 248, 255, .78); line-height: 1.7; }
.kicker, .eyebrow { margin: 0; color: #ff85c7; font-size: 12px; font-weight: 900; letter-spacing: .13em; }.eyebrow { color: #79e8ff; }
.access-card { display: grid; gap: 12px; }.access-card--purchase { border-color: rgba(255, 207, 114, .42); }
.moderator-card { border-color: rgba(158, 255, 184, .58); background: radial-gradient(circle at 88% 18%, rgba(158, 255, 184, .15), transparent 34%), rgba(8, 20, 16, .82); }.moderator-card dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; margin: 0; }.moderator-card dl div { border: 1px solid rgba(158, 255, 184, .24); border-radius: 12px; padding: 12px; }.moderator-card dt { color: rgba(245, 248, 255, .68); font-size: .82rem; }.moderator-card dd { margin: 4px 0 0; color: #d9ffe6; font-weight: 900; }
button { width: fit-content; min-height: 42px; border: 1px solid rgba(114, 215, 255, .5); border-radius: 999px; padding: 0 16px; background: #72d7ff; color: #06121d; font: inherit; font-weight: 900; cursor: pointer; } button:disabled { cursor: not-allowed; opacity: .5; }.access-card--purchase button { background: #ffcf72; border-color: #ffcf72; }
.account-state, .recovery-code { display: grid; gap: 6px; border-left: 3px solid #72d7ff; padding-left: 12px; color: rgba(245, 248, 255, .85); }.recovery-code { border-color: #ffcf72; }.recovery-code code, .account-state code { overflow-wrap: anywhere; color: #fff5ce; }
.expiry, .status { margin: 0; border-left: 3px solid #9effb8; padding-left: 12px; color: #d9ffe6; line-height: 1.6; }.back-link { background: transparent; color: #bdefff; }
.measurement-note { margin: 0; color: rgba(245, 248, 255, .62); font-size: .82rem; line-height: 1.6; }
.region-select { display: grid; gap: 6px; max-width: 420px; color: rgba(245, 248, 255, .88); font-weight: 800; }.region-select select { border: 1px solid rgba(255, 255, 255, .18); border-radius: 10px; padding: 10px 12px; background: rgba(3, 7, 16, .78); color: #f5f8ff; font: inherit; }
.selected-price { margin: 0; color: #fff5ce !important; font-weight: 900; }
</style>
