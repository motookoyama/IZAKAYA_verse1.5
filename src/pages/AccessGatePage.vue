<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { navigateTo, PAGE_PATHS } from '../constants/navigation'

type Account = { id: string; balance: number; initialPassIssued: boolean; createdAt: string }
type LocalAccount = { accountId: string; recoveryCode: string }

const gateUrl = (import.meta.env.VITE_ACCESS_GATE_URL || '').replace(/\/$/, '')
const storageKey = 'izakaya2.accessgate.account.v1'
const pendingOrderKey = 'izakaya2.accessgate.pending-order.v1'
const account = ref<Account | null>(null)
const recoveryCode = ref('')
const status = ref(gateUrl ? '登録すると、最初の24時間フリーパスを一度だけ発行できます。' : '接続先を確認しています。少し時間を置いて再度開いてください。')
const busy = ref(false)
const passExpiresAt = ref('')

const ready = computed(() => Boolean(gateUrl))
const accountId = computed(() => account.value?.id || '')

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
  if (!account.value) return
  busy.value = true
  try {
    const data = await request<{ pass: { expiresAt: string }; token: string }>('/passes/initial', 'POST', { accountId: account.value.id, regionId: '*' })
    window.localStorage.setItem('izakaya2.accessgate.initial-pass.v1', data.token)
    passExpiresAt.value = data.pass.expiresAt
    await loadAccount()
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
  busy.value = true
  try {
    const data = await request<{ order: { id: string }; paypal: { approveUrl: string | null } }>('/orders', 'POST', { accountId: account.value.id, sku: 'points_100' })
    if (!data.paypal.approveUrl) throw new Error('paypal_approval_url_missing')
    window.sessionStorage.setItem(pendingOrderKey, data.order.id)
    window.location.assign(data.paypal.approveUrl)
  } catch (error) {
    status.value = `PayPal購入を開始できませんでした: ${error instanceof Error ? error.message : 'unknown_error'}`
    busy.value = false
  }
}

async function captureReturnedPayment() {
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
  await loadAccount()
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
      <button type="button" :disabled="busy || !accountId || account?.initialPassIssued" @click="issueInitialPass">
        {{ account?.initialPassIssued ? '発行済み' : '24Hフリーパスを発行する' }}
      </button>
      <p v-if="passExpiresAt" class="expiry">期限: {{ new Date(passExpiresAt).toLocaleString('ja-JP') }}</p>
    </section>

    <section class="access-card access-card--purchase" aria-labelledby="purchase-title">
      <p class="eyebrow">03 · PAYPAL</p>
      <h2 id="purchase-title">100Pを購入する</h2>
      <p>¥1,000で100P。レベル1リージョンの30日利用権は10Pです。支払いはPayPalの公式画面で行われます。</p>
      <button type="button" :disabled="busy || !accountId || !ready" @click="beginPurchase">PayPalで100Pを購入</button>
    </section>

    <p class="status" role="status">{{ status }}</p>
    <button type="button" class="back-link" @click="navigateTo(PAGE_PATHS.regions)">リージョン一覧へ戻る</button>
  </main>
</template>

<style scoped>
.access-gate-page { display: grid; gap: 18px; max-width: 900px; margin: 0 auto; padding: 12px 0 48px; }
.access-gate-hero, .access-card { border: 1px solid rgba(255, 255, 255, .14); border-radius: 18px; padding: clamp(22px, 4vw, 36px); background: radial-gradient(circle at 88% 18%, rgba(255, 77, 173, .16), transparent 34%), rgba(8, 11, 20, .76); }
.access-gate-hero h1, .access-card h2 { margin: 6px 0 10px; color: #fff; }.access-gate-hero p:last-child, .access-card p { color: rgba(245, 248, 255, .78); line-height: 1.7; }
.kicker, .eyebrow { margin: 0; color: #ff85c7; font-size: 12px; font-weight: 900; letter-spacing: .13em; }.eyebrow { color: #79e8ff; }
.access-card { display: grid; gap: 12px; }.access-card--purchase { border-color: rgba(255, 207, 114, .42); }
button { width: fit-content; min-height: 42px; border: 1px solid rgba(114, 215, 255, .5); border-radius: 999px; padding: 0 16px; background: #72d7ff; color: #06121d; font: inherit; font-weight: 900; cursor: pointer; } button:disabled { cursor: not-allowed; opacity: .5; }.access-card--purchase button { background: #ffcf72; border-color: #ffcf72; }
.account-state, .recovery-code { display: grid; gap: 6px; border-left: 3px solid #72d7ff; padding-left: 12px; color: rgba(245, 248, 255, .85); }.recovery-code { border-color: #ffcf72; }.recovery-code code, .account-state code { overflow-wrap: anywhere; color: #fff5ce; }
.expiry, .status { margin: 0; border-left: 3px solid #9effb8; padding-left: 12px; color: #d9ffe6; line-height: 1.6; }.back-link { background: transparent; color: #bdefff; }
</style>
