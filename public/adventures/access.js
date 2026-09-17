const ACCESS_GATE_URL = 'https://izakaya2-accessgate-production-878376990978.asia-northeast1.run.app'
const INITIAL_PASS_KEY = 'izakaya2.accessgate.initial-pass.v1'
const REGION_PASS_PREFIX = 'izakaya2.accessgate.region-pass.v1:'

const regionId = document.body.dataset.regionId || ''
const gatedLinks = [...document.querySelectorAll('[data-entitlement]')]
const status = document.querySelector('[data-access-status]')
let unlocked = false

for (const link of gatedLinks) {
  link.setAttribute('aria-disabled', 'true')
  link.addEventListener('click', (event) => {
    if (!unlocked) event.preventDefault()
  })
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

void unlockFromStoredPass()
