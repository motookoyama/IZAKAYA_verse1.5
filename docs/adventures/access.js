const ACCESS_GATE_URL = 'https://izakaya2-accessgate-production-878376990978.asia-northeast1.run.app'
const INITIAL_PASS_KEY = 'izakaya2.accessgate.initial-pass.v1'
const REGION_PASS_PREFIX = 'izakaya2.accessgate.region-pass.v1:'
const MEASUREMENT_PREFIX = 'izakaya2.measurement.v1'
const CAMPAIGN_ID = 'second-wave-launch'

const regionId = document.body.dataset.regionId || ''
const gatedLinks = [...document.querySelectorAll('[data-entitlement]')]
const status = document.querySelector('[data-access-status]')
let unlocked = false

function dayKey() {
  return new Date().toISOString().slice(0, 10)
}

async function trackMarketingEvent(event) {
  if (!regionId) return { ok: false, reason: 'region_missing' }
  const key = `${MEASUREMENT_PREFIX}:${dayKey()}:${event}:${regionId}`
  try {
    if (window.sessionStorage.getItem(key)) return { ok: true, repeated: true }
    const response = await fetch(`${ACCESS_GATE_URL}/marketing/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, campaignId: CAMPAIGN_ID, regionId }),
      keepalive: true,
    })
    if (!response.ok) return { ok: false, reason: `http_${response.status}` }
    window.sessionStorage.setItem(key, '1')
    return { ok: true, repeated: false }
  } catch {
    return { ok: false, reason: 'network_error' }
  }
}

function eventForLink(link) {
  const target = link.dataset.href || ''
  if (target.endsWith('start.md')) return 'start_packet_opened'
  if (target.endsWith('novel.md')) return 'sample_novel_opened'
  if (target.endsWith('.v2.json')) return 'character_card_downloaded'
  return null
}

for (const link of gatedLinks) {
  link.setAttribute('aria-disabled', 'true')
  link.addEventListener('click', (event) => {
    if (!unlocked) {
      event.preventDefault()
      return
    }
    const marketingEvent = eventForLink(link)
    if (marketingEvent) void trackMarketingEvent(marketingEvent)
  })
}

function addPlayFeedback() {
  const footer = document.querySelector('footer')
  if (!footer || document.querySelector('[data-play-feedback]')) return
  const section = document.createElement('section')
  section.className = 'section-card play-feedback'
  section.dataset.playFeedback = 'true'
  section.innerHTML = `
    <h2>開始後の確認（任意）</h2>
    <p>外部AIで一言目まで始められたかだけ教えてください。会話内容、AIアカウント、個人情報は送信しません。</p>
    <div class="play-feedback__actions">
      <button type="button" class="button" data-play-report="play_started_reported">開始できた</button>
      <button type="button" class="button subtle" data-play-report="play_blocked_reported">開始で詰まった</button>
    </div>
    <p class="note" data-play-report-status aria-live="polite">回答は匿名の操作回数として日ごとに集計します。</p>
  `
  footer.before(section)

  const reportStatus = section.querySelector('[data-play-report-status]')
  for (const button of section.querySelectorAll('[data-play-report]')) {
    button.addEventListener('click', async () => {
      for (const control of section.querySelectorAll('button')) control.disabled = true
      reportStatus.textContent = '送信しています…'
      const result = await trackMarketingEvent(button.dataset.playReport)
      if (result.ok) reportStatus.textContent = result.repeated ? '今日はすでに回答済みです。ありがとうございます。' : '回答を記録しました。ありがとうございます。'
      else reportStatus.textContent = '回答を送信できませんでした。プレイ自体はそのまま続けられます。'
      for (const control of section.querySelectorAll('button')) control.disabled = false
    })
  }
}

async function verify(token) {
  if (!token || !regionId) return false
  const response = await fetch(`${ACCESS_GATE_URL}/passes/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, regionId }),
  })
  const data = await response.json().catch(() => ({}))
  return response.ok && data.ok === true
}

async function unlockFromStoredPass() {
  const tokens = [
    window.localStorage.getItem(`${REGION_PASS_PREFIX}${regionId}`),
    window.localStorage.getItem(INITIAL_PASS_KEY),
  ].filter(Boolean)

  try {
    for (const token of tokens) {
      if (await verify(token)) {
        unlocked = true
        for (const link of gatedLinks) {
          link.href = link.dataset.href
          link.removeAttribute('aria-disabled')
        }
        if (status) status.textContent = '利用権を確認しました。開始テキスト、作例、V2カードを利用できます。'
        return
      }
    }
    if (status) status.textContent = '初回24Hフリーパス、またはこのリージョンの30日利用権をAccessGATEで発行してください。'
  } catch {
    if (status) status.textContent = '利用権を確認できませんでした。通信状態を確認して、もう一度開いてください。'
  }
}

addPlayFeedback()
void trackMarketingEvent('region_page_viewed')
void unlockFromStoredPass()
