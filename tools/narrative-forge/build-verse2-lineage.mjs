#!/usr/bin/env node
/**
 * Build the non-destructive 1.6 -> 2.0 lineage manifest.
 *
 * The manifest is intentionally derived from canonical region JSON/MD and
 * official V2 registrations. It never rewrites the source assets, review
 * state, or V2 manifest. `--write` only refreshes the derived 2.0 manifest.
 */
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../..')
const regionsRoot = resolve(repoRoot, 'tools/narrative-forge/regions')
const regionIds = [
  'region_000_metatuber_region',
  'region_00_izakaya_help',
  'region_0_izakaya_dev',
  'region_1_drunken_region',
  'region_2_ambient_region',
  'region_3_reincarnation_judgment',
  'region_6_mobility_region',
  'region_journey_region',
]

const targetPath = resolve(regionsRoot, 'verse2_lineage_manifest.json')
const sourcePath = (kind, regionId) => resolve(regionsRoot, kind, `${regionId}.${kind === 'json' ? 'json' : 'md'}`)
const sha256 = (value) => createHash('sha256').update(value).digest('hex')

async function readUtf8(path) {
  return readFile(path, 'utf8')
}

async function hashFile(path) {
  if (!existsSync(path)) return null
  return sha256(await readUtf8(path))
}

function normalizeReviewStatus(status) {
  if (status === 'approved') return 'reviewed'
  if (status === 'fix') return 'repair'
  if (status === 'hold') return 'hold'
  return 'unchecked'
}

export async function buildVerse2Lineage() {
  const [reviewState, v2Manifest] = await Promise.all([
    readUtf8(resolve(regionsRoot, 'review_state.json')).then(JSON.parse),
    readUtf8(resolve(regionsRoot, 'v2cards/v2card_manifest.json')).then(JSON.parse),
  ])

  const regions = await Promise.all(regionIds.map(async (regionId) => {
    const jsonPath = sourcePath('json', regionId)
    const mdPath = sourcePath('md', regionId)
    const [jsonHash, mdHash] = await Promise.all([hashFile(jsonPath), hashFile(mdPath)])
    const v2Region = v2Manifest.regions?.[regionId]
    const cards = await Promise.all((v2Region?.characters ?? []).map(async (card) => {
      const cardPath = resolve(repoRoot, 'src/data/v2cards', card.v2card)
      return {
        name: card.name,
        status: card.status ?? 'unclassified',
        source: `src/data/v2cards/${card.v2card}`,
        sha256: await hashFile(cardPath),
      }
    }))
    const sourceHashes = { json: jsonHash, markdown: mdHash, cards }

    return {
      region_id: regionId,
      inherited_from: 'IZAKAYA Verse 1.6',
      region_version: '2.0.0-draft',
      content_hash: sha256(JSON.stringify(sourceHashes)),
      source: {
        json: `tools/narrative-forge/regions/json/${regionId}.json`,
        markdown: `tools/narrative-forge/regions/md/${regionId}.md`,
        review_status: reviewState[regionId]?.status ?? 'missing',
        v2_registration: cards,
      },
      readiness: {
        content: jsonHash && mdHash ? 'present' : 'incomplete',
        review: normalizeReviewStatus(reviewState[regionId]?.status),
        public_release: 'prelaunch',
      },
      source_hashes: sourceHashes,
    }
  }))

  return {
    $schema: 'izakaya.verse2.lineage_manifest.v1',
    product: {
      name: 'IZAKAYA Verse',
      version: '2.0',
      lifecycle: 'prelaunch',
      predecessor: 'IZAKAYA Verse 1.6',
      predecessor_policy: 'inherit_only',
    },
    commercial_boundary: {
      sales_enabled: false,
      access_passes_enabled: false,
      external_ai_cost: 'user_managed',
    },
    regions,
  }
}

async function main() {
  const manifest = await buildVerse2Lineage()
  const rendered = `${JSON.stringify(manifest, null, 2)}\n`
  const wantsWrite = process.argv.includes('--write')
  const wantsCheck = process.argv.includes('--check')

  if (wantsWrite) {
    await writeFile(targetPath, rendered, 'utf8')
    console.log(`WROTE ${targetPath}`)
    return
  }

  if (wantsCheck) {
    if (!existsSync(targetPath)) {
      console.error(`MISSING ${targetPath}; run with --write`)
      process.exitCode = 1
      return
    }
    const current = await readUtf8(targetPath)
    if (current !== rendered) {
      console.error(`STALE ${targetPath}; run with --write`)
      process.exitCode = 1
      return
    }
    console.log(`PASS ${targetPath}`)
    return
  }

  process.stdout.write(rendered)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
