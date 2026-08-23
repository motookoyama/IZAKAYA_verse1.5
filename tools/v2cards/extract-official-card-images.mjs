import { createHash } from 'node:crypto'
import { execFile as execFileCallback } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

const root = resolve(import.meta.dirname, '../..')
const cardsDirectory = resolve(root, 'src/data/v2cards')
const imageDirectory = resolve(root, 'public/v2card-images/official')
const manifestPath = resolve(import.meta.dirname, 'official-card-image-manifest.json')

const targets = [
  ['エグゼ・マキナ.json', 'exe-machina.jpg'],
  ['ココロエ・ヨウマ.json', 'kokoroe-youma.jpg'],
  ['ダガミ・テンカイ.json', 'dagami-tenkai.jpg'],
  ['ハワタリ・ザン.json', 'hawatari-zan.jpg'],
  ['ハワワ.json', 'hawawa.jpg'],
  ['ミヤコ・スイム.json', 'miyako-swim.jpg'],
  ['ヨリドコロ・ユイカ.json', 'yoridokoro-yuika.jpg'],
  ['株式会社オシマシ.json', 'oshimashi-inc.jpg'],
]

const writeMode = process.argv.includes('--write')
const execFile = promisify(execFileCallback)
const imageProfile = Object.freeze({
  format: 'jpeg',
  quality: 70,
  maxHeight: 960,
})

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function cardWithoutImage(cardDocument) {
  const clone = structuredClone(cardDocument)
  delete clone.izakaya_v2?.card?.imageUrl
  return clone
}

function parseDataUri(value, sourceFile) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\r\n]+)$/s.exec(value)
  if (!match) {
    throw new Error(`${sourceFile}: imageUrl is not a supported image data URI`)
  }
  return { mimeType: match[1], image: Buffer.from(match[2], 'base64') }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function optimizeCardImage(originalImage, imagePath) {
  const tempDirectory = await mkdtemp(join(tmpdir(), 'izakaya-v2-card-'))
  const sourcePath = join(tempDirectory, 'source.png')
  try {
    await writeFile(sourcePath, originalImage)
    await execFile('sips', [
      '--resampleHeight', String(imageProfile.maxHeight),
      '-s', 'format', imageProfile.format,
      '-s', 'formatOptions', String(imageProfile.quality),
      sourcePath,
      '--out', imagePath,
    ])
  } finally {
    await rm(tempDirectory, { recursive: true, force: true })
  }
}

function comparableRecord(record) {
  const { originalJsonSha256, originalImageSha256, originalImageBytes, ...current } = record
  return current
}

async function main() {
  const expected = []
  await mkdir(imageDirectory, { recursive: true })

  for (const [sourceFile, imageFile] of targets) {
    const cardPath = resolve(cardsDirectory, sourceFile)
    const cardDocument = await readJson(cardPath)
    const card = cardDocument?.izakaya_v2?.card
    if (!card?.name || !card.personaPrompt || !card.first_mes) {
      throw new Error(`${sourceFile}: required V2 prompt fields are missing`)
    }

    const publicImageUrl = `/v2card-images/official/${imageFile}`
    const nonImageSha256 = sha256(JSON.stringify(cardWithoutImage(cardDocument)))
    const imagePath = resolve(imageDirectory, imageFile)
    let imageSha256
    let imageBytes
    let originalJsonSha256 = null
    let originalImageSha256 = null
    let originalImageBytes = null

    if (typeof card.imageUrl === 'string' && card.imageUrl.startsWith('data:')) {
      const decoded = parseDataUri(card.imageUrl, sourceFile)
      originalImageSha256 = sha256(decoded.image)
      originalImageBytes = decoded.image.length
      originalJsonSha256 = sha256(await readFile(cardPath))

      if (writeMode) {
        await optimizeCardImage(decoded.image, imagePath)
        card.imageUrl = publicImageUrl
        await writeFile(cardPath, `${JSON.stringify(cardDocument, null, 2)}\n`)
      }
    } else {
      if (card.imageUrl !== publicImageUrl) {
        throw new Error(`${sourceFile}: expected ${publicImageUrl}, found ${String(card.imageUrl)}`)
      }
      const image = await readFile(imagePath)
      imageSha256 = sha256(image)
      imageBytes = image.length
    }

    const persisted = await readJson(cardPath)
    const persistedCard = persisted?.izakaya_v2?.card
    if (sha256(JSON.stringify(cardWithoutImage(persisted))) !== nonImageSha256) {
      throw new Error(`${sourceFile}: non-image V2 data changed during conversion`)
    }
    if (persistedCard?.imageUrl !== publicImageUrl) {
      throw new Error(`${sourceFile}: external image URL was not written`)
    }
    const persistedImage = await readFile(imagePath)
    imageSha256 = sha256(persistedImage)
    imageBytes = persistedImage.length
    const imageInfo = await execFile('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', imagePath])
    const widthMatch = /pixelWidth: (\d+)/.exec(imageInfo.stdout)
    const heightMatch = /pixelHeight: (\d+)/.exec(imageInfo.stdout)
    if (!widthMatch || !heightMatch || Number(heightMatch[1]) > imageProfile.maxHeight) {
      throw new Error(`${sourceFile}: optimized image dimensions are invalid`)
    }

    expected.push({
      sourceFile,
      cardName: persistedCard.name,
      publicImageUrl,
      nonImageSha256,
      imageSha256,
      imageBytes,
      imageWidth: Number(widthMatch[1]),
      imageHeight: Number(heightMatch[1]),
      originalJsonSha256,
      originalImageSha256,
      originalImageBytes,
      convertedJsonBytes: (await stat(cardPath)).size,
    })
  }

  if (writeMode) {
    await writeFile(manifestPath, `${JSON.stringify({ version: 2, imageProfile, cards: expected }, null, 2)}\n`)
  } else {
    const manifest = await readJson(manifestPath)
    if (JSON.stringify(manifest.imageProfile) !== JSON.stringify(imageProfile) || manifest.cards?.length !== expected.length) {
      throw new Error('conversion manifest is incomplete or uses a different image profile')
    }
    const savedBySource = new Map(manifest.cards.map((record) => [record.sourceFile, record]))
    if (expected.some((record) => JSON.stringify(comparableRecord(savedBySource.get(record.sourceFile) ?? {})) !== JSON.stringify(comparableRecord(record)))) {
      throw new Error('conversion manifest does not match the current official cards')
    }
  }

  console.log(JSON.stringify({ ok: true, mode: writeMode ? 'write' : 'verify', cards: expected }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
