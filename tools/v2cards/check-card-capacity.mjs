import { execFile as execFileCallback } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

const root = resolve(import.meta.dirname, '../..')
const execFile = promisify(execFileCallback)
const limits = Object.freeze({ jsonBytes: 512_000, imageBytes: 300_000, imageHeight: 960 })

function argument(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : ''
}

function withinProject(relativePath) {
  const resolved = resolve(root, relativePath)
  if (!resolved.startsWith(`${root}/`)) throw new Error('paths must stay inside this project')
  return resolved
}

async function main() {
  const cardArgument = argument('--card')
  const imageArgument = argument('--image')
  if (!cardArgument || !imageArgument) {
    throw new Error('usage: node tools/v2cards/check-card-capacity.mjs --card <V2 JSON> --image <public image>')
  }

  const cardPath = withinProject(cardArgument)
  const imagePath = withinProject(imageArgument)
  const [cardText, cardInfo, imageInfo] = await Promise.all([readFile(cardPath, 'utf8'), stat(cardPath), stat(imagePath)])
  const card = JSON.parse(cardText)
  const v2 = card?.izakaya_v2?.card
  const failures = []
  if (!v2?.name || !v2?.personaPrompt || !v2?.first_mes) failures.push('required V2 prompt fields are missing')
  if (typeof v2?.imageUrl !== 'string' || !v2.imageUrl || v2.imageUrl.startsWith('data:')) failures.push('imageUrl must be an external URL, not a data URI')
  if (cardInfo.size > limits.jsonBytes) failures.push(`V2 JSON exceeds ${limits.jsonBytes} bytes`)
  if (imageInfo.size > limits.imageBytes) failures.push(`image exceeds ${limits.imageBytes} bytes`)

  const dimensions = await execFile('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', imagePath])
  const width = Number(/pixelWidth: (\d+)/.exec(dimensions.stdout)?.[1])
  const height = Number(/pixelHeight: (\d+)/.exec(dimensions.stdout)?.[1])
  if (!width || !height) failures.push('image dimensions could not be read')
  if (width > limits.imageHeight || height > limits.imageHeight) failures.push(`image exceeds ${limits.imageHeight}px on its long edge`)

  const report = {
    standard: 'V2_CARD_CAPACITY_V1',
    card: cardArgument,
    image: imageArgument,
    jsonBytes: cardInfo.size,
    imageBytes: imageInfo.size,
    imageWidth: width,
    imageHeight: height,
    imageUrl: v2?.imageUrl ?? null,
    limits,
    verdict: failures.length ? 'HOLD' : 'PASS',
    failures,
  }
  console.log(JSON.stringify(report, null, 2))
  if (failures.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
