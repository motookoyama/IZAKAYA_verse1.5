export type ImageGateStatus = 'pending' | 'approved' | 'quarantined'

export type ImageGateResult = {
  status: ImageGateStatus
  reason: string
  score: number
}

const cache = new Map<string, Promise<ImageGateResult>>()
const KNOWN_APPROVED_SOURCES: string[] = []
const KNOWN_QUARANTINED_SOURCES = [
  '/assets/regions/mtuber_region/bg_mtuber_region_20260307.png',
  '/assets/regions/iz_help_nexus/bg_iz_help_nexus_20260307.png',
  '/assets/regions/yoidore_region/bg_yoidore_region_20260307.png',
  '/assets/regions/ambient_region/bg_ambient_region_20260307.png',
  '/assets/regions/mobility_region/bg_mobility_region_20260307.png',
  '/assets/regions/mtuber_region/bg_mtuber_region_20260317.png',
  '/assets/regions/iz_help_nexus/bg_iz_help_nexus_20260317.png',
  '/assets/regions/yoidore_region/bg_yoidore_region_20260317.png',
  '/assets/regions/ambient_region/bg_ambient_region_20260317.png',
  '/assets/regions/mobility_region/bg_mobility_region_20260317.png',
]

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image_load_error'))
    img.src = src
  })
}

function computeMetrics(imageData: ImageData) {
  const data = imageData.data
  const px = data.length / 4
  if (px === 0) return null

  let sumL = 0
  let sumL2 = 0
  let sumSat = 0
  let clipped = 0

  const width = imageData.width
  const height = imageData.height
  const luma = new Float32Array(px)

  for (let i = 0; i < px; i += 1) {
    const base = i * 4
    const r = data[base] ?? 0
    const g = data[base + 1] ?? 0
    const b = data[base + 2] ?? 0
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    luma[i] = lum
    sumL += lum
    sumL2 += lum * lum
    sumSat += max - min
    if (max >= 250 || min <= 5) clipped += 1
  }

  let edgeSum = 0
  let edgeCount = 0
  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const idx = y * width + x
      const c = luma[idx] ?? 0
      const right = luma[idx + 1] ?? 0
      const down = luma[idx + width] ?? 0
      edgeSum += Math.abs(c - right)
      edgeSum += Math.abs(c - down)
      edgeCount += 2
    }
  }

  const mean = sumL / px
  const variance = Math.max(0, sumL2 / px - mean * mean)
  const stdev = Math.sqrt(variance)
  const sat = sumSat / px
  const clipRatio = clipped / px
  const edge = edgeCount > 0 ? edgeSum / edgeCount : 0

  return { mean, stdev, sat, clipRatio, edge }
}

function classify(metrics: ReturnType<typeof computeMetrics>): ImageGateResult {
  if (!metrics) {
    return { status: 'quarantined', reason: 'empty_pixels', score: 0 }
  }

  const { mean, stdev, sat, clipRatio, edge } = metrics

  let score = 100
  let reason = 'ok'

  if (mean < 14 || mean > 244) {
    score -= 45
    reason = 'extreme_exposure'
  }
  if (stdev < 11) {
    score -= 30
    reason = reason === 'ok' ? 'too_flat' : reason
  }
  if (edge < 6) {
    score -= 20
    reason = reason === 'ok' ? 'low_detail' : reason
  }
  if (sat < 10) {
    score -= 10
    reason = reason === 'ok' ? 'low_saturation' : reason
  }
  if (clipRatio > 0.72) {
    score -= 35
    reason = reason === 'ok' ? 'clipped_pixels' : reason
  }

  const finalScore = clamp(Math.round(score), 0, 100)
  if (finalScore >= 62) {
    return { status: 'approved', reason: 'ok', score: finalScore }
  }
  return { status: 'quarantined', reason, score: finalScore }
}

async function inspectImage(src: string): Promise<ImageGateResult> {
  try {
    const image = await loadImage(src)
    const canvas = document.createElement('canvas')
    canvas.width = 160
    canvas.height = 90
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return { status: 'quarantined', reason: 'ctx_unavailable', score: 0 }
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return classify(computeMetrics(imageData))
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'inspect_failed'
    return { status: 'quarantined', reason, score: 0 }
  }
}

export function gateImage(src: string): Promise<ImageGateResult> {
  if (!src) return Promise.resolve({ status: 'quarantined', reason: 'empty_src', score: 0 })
  if (KNOWN_APPROVED_SOURCES.some((pattern) => src.includes(pattern))) {
    return Promise.resolve({ status: 'approved', reason: 'owner_promoted_asset', score: 100 })
  }
  if (KNOWN_QUARANTINED_SOURCES.some((pattern) => src.includes(pattern))) {
    return Promise.resolve({ status: 'quarantined', reason: 'known_bad_asset', score: 0 })
  }
  const existing = cache.get(src)
  if (existing) return existing
  const promise = inspectImage(src)
  cache.set(src, promise)
  return promise
}
