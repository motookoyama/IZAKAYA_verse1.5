import QRCode from 'qrcode'
import pako from 'pako'
import jsQR from 'jsqr'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

function crc32(bytes: Uint8Array): number {
  let crc = ~0
  for (let i = 0; i < bytes.length; i += 1) {
    const value = bytes[i] ?? 0
    crc ^= value
    for (let k = 0; k < 8; k += 1) {
      const mask = -(crc & 1)
      crc = (crc >>> 1) ^ (0xedb88320 & mask)
    }
  }
  return (crc ^ -1) >>> 0
}

function createChunk(type: string, data: Uint8Array): Uint8Array {
  const length = data.length
  const chunk = new Uint8Array(12 + length)
  const view = new DataView(chunk.buffer)
  view.setUint32(0, length, false)

  const typeAndData = new Uint8Array(4 + length)
  for (let i = 0; i < 4; i += 1) {
    const code = type.charCodeAt(i)
    chunk[i + 4] = code
    typeAndData[i] = code
  }
  chunk.set(data, 8)
  typeAndData.set(data, 4)

  const crc = crc32(typeAndData)
  view.setUint32(8 + length, crc, false)
  return chunk
}

function embedITxtChunk(base64Png: string, keyword: string, text: string): string {
  const pngBytes = base64ToUint8Array(base64Png)
  const signature = [137, 80, 78, 71, 13, 10, 26, 10]
  for (let i = 0; i < signature.length; i += 1) {
    if (pngBytes[i] !== signature[i]) {
      throw new Error('PNG signature mismatch')
    }
  }

  let offset = 8
  let iendIndex = -1
  while (offset < pngBytes.length) {
    const view = new DataView(pngBytes.buffer, offset)
    const length = view.getUint32(0, false)
    const type = textDecoder.decode(pngBytes.slice(offset + 4, offset + 8))
    if (type === 'IEND') {
      iendIndex = offset
      break
    }
    offset += 12 + length
  }
  if (iendIndex < 0) throw new Error('IEND chunk not found')

  const before = pngBytes.slice(0, iendIndex)
  const iendChunk = pngBytes.slice(iendIndex)

  const keywordBytes = textEncoder.encode(keyword)
  const textBytes = textEncoder.encode(text)
  const chunkData = new Uint8Array(keywordBytes.length + 5 + textBytes.length)
  let idx = 0
  chunkData.set(keywordBytes, idx); idx += keywordBytes.length
  chunkData[idx++] = 0
  chunkData[idx++] = 0
  chunkData[idx++] = 0
  chunkData[idx++] = 0
  chunkData[idx++] = 0
  chunkData.set(textBytes, idx)

  const itxtChunk = createChunk('iTXt', chunkData)

  const combined = new Uint8Array(before.length + itxtChunk.length + iendChunk.length)
  combined.set(before, 0)
  combined.set(itxtChunk, before.length)
  combined.set(iendChunk, before.length + itxtChunk.length)

  return `data:image/png;base64,${uint8ArrayToBase64(combined)}`
}

export async function generateQrAssets(payload: string) {
  const baseDataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 512 })
  const [, base64 = ''] = baseDataUrl.split(',')
  const compressed = pako.deflate(payload, { to: 'string' })
  const encoded = uint8ArrayToBase64(compressed)
  const embedded = embedITxtChunk(base64, 'chara', encoded)
  const size = Math.round((payload.length / 1024) * 100) / 100
  return { raw: baseDataUrl, embedded, sizeKb: size }
}

export async function generateShareQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 512,
  })
}

const MAX_QR_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_QR_EDGE = 2048

async function loadImageElement(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('画像を読み込めませんでした。'))
      element.src = objectUrl
    })
    return image
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/**
 * Decode a QR image entirely in the browser.
 * The image is never posted to an IZAKAYA server or an external API.
 */
export async function decodeQrImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('PNG、JPEG、WebPなどの画像を選択してください。')
  }
  if (file.size > MAX_QR_IMAGE_BYTES) {
    throw new Error('画像は8MB以下にしてください。')
  }

  const image = await loadImageElement(file)
  const scale = Math.min(1, MAX_QR_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('QR画像を読み取る準備ができませんでした。')

  context.drawImage(image, 0, 0, width, height)
  const pixels = context.getImageData(0, 0, width, height)
  const result = jsQR(pixels.data, width, height, { inversionAttempts: 'attemptBoth' })
  if (!result?.data) throw new Error('QRコードを読み取れませんでした。明るい画像か、余白を含むQR画像を試してください。')
  return result.data.trim()
}
