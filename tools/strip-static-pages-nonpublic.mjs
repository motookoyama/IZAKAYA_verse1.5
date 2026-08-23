import { existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const outputDir = process.argv[2]
if (!outputDir) {
  throw new Error('Usage: node tools/strip-static-pages-nonpublic.mjs <output-dir>')
}

const root = resolve(outputDir)
const blockedRelativePaths = [
  'assets/regions/review',
  'assets/regions/preview_smoke',
  'design',
  'prototypes',
  'regions',
]

for (const relativePath of blockedRelativePaths) {
  const target = resolve(root, relativePath)
  if (!target.startsWith(`${root}/`)) {
    throw new Error(`Refusing to remove outside static output: ${relativePath}`)
  }
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true })
  }
}
