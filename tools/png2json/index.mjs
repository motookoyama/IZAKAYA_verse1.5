#!/usr/bin/env node
import { promises as fs } from 'fs'
import path from 'path'
import zlib from 'zlib'

const SIGNATURE_HEX = '89504e470d0a1a0a'

const readUint32BE = (buffer, offset) => buffer.readUInt32BE(offset)

const extractChunks = (buffer) => {
  const chunks = []
  const signature = buffer.subarray(0, 8).toString('hex')
  if (signature !== SIGNATURE_HEX) {
    throw new Error('Invalid PNG signature')
  }
  let offset = 8
  while (offset < buffer.length) {
    const length = readUint32BE(buffer, offset)
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii')
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    const data = buffer.subarray(dataStart, dataEnd)
    chunks.push({ type, data })
    offset = dataEnd + 4
    if (type === 'IEND') break
  }
  return chunks
}

const parseITXt = (data) => {
  const keywordEnd = data.indexOf(0)
  if (keywordEnd === -1) return null
  const keyword = data.subarray(0, keywordEnd).toString('latin1')
  const compressionFlag = data[keywordEnd + 1]
  const compressionMethod = data[keywordEnd + 2]
  const rest = data.subarray(keywordEnd + 3)
  const languageEnd = rest.indexOf(0)
  const translatedEnd = rest.indexOf(0, languageEnd + 1)
  const textStart = translatedEnd + 1
  let text = rest.subarray(textStart)
  if (compressionFlag === 1) {
    if (compressionMethod !== 0) throw new Error('Unsupported compression method')
    text = zlib.inflateSync(text)
  }
  return { keyword, text: text.toString('utf8') }
}

const extractSoulCoreJson = (buffer) => {
  const chunks = extractChunks(buffer)
  for (const chunk of chunks) {
    if (chunk.type !== 'iTXt') continue
    const parsed = parseITXt(chunk.data)
    if (!parsed) continue
    const keyword = parsed.keyword.toLowerCase()
    if (keyword.includes('izakaya') || keyword.includes('soulcore')) {
      return parsed.text
    }
  }
  return null
}

const listPngFiles = async (input) => {
  const stats = await fs.stat(input)
  if (stats.isDirectory()) {
    const entries = await fs.readdir(input)
    return entries
      .filter((entry) => entry.toLowerCase().endsWith('.png'))
      .map((entry) => path.join(input, entry))
  }
  return [input]
}

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true })
}

const run = async () => {
  const [inputArg, outputArg] = process.argv.slice(2)
  if (!inputArg) {
    console.error('Usage: node tools/png2json/index.mjs <input-file-or-dir> [output-dir]')
    process.exit(1)
  }
  const inputPath = path.resolve(inputArg)
  const outputDir = path.resolve(outputArg ?? path.join(process.cwd(), 'png2json-output'))
  await ensureDir(outputDir)
  const files = await listPngFiles(inputPath)
  for (const file of files) {
    try {
      const buffer = await fs.readFile(file)
      const text = extractSoulCoreJson(buffer)
      if (!text) {
        console.warn(`⚠ No soul core data found in ${file}`)
        continue
      }
      const json = JSON.parse(text)
      const filename = path.basename(file).replace(/\.png$/i, '.json')
      const target = path.join(outputDir, filename)
      await fs.writeFile(target, JSON.stringify(json, null, 2))
      console.log(`✔ Extracted ${target}`)
    } catch (error) {
      console.error(`✖ Failed to process ${file}:`, error.message)
    }
  }
}

run().catch((error) => {
  console.error('PNG2JSON failed:', error)
  process.exit(1)
})
