import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const manifestPath = new URL('../src/data/v2PromptManifest.ts', import.meta.url)
const officialCardPath = new URL('../src/data/v2cards/アストライア・リライト.json', import.meta.url)

test('text-only BYOK manifest retains the required prompt fields from an official V2 card', async () => {
  const [manifestSource, officialSource] = await Promise.all([
    readFile(manifestPath, 'utf8'),
    readFile(officialCardPath, 'utf8'),
  ])
  const officialCard = JSON.parse(officialSource).izakaya_v2.card

  assert.match(manifestSource, new RegExp(escapeRegExp(officialCard.name)))
  assert.match(manifestSource, new RegExp(escapeRegExp(officialCard.summary)))
  assert.match(manifestSource, new RegExp(escapeRegExp(officialCard.personaPrompt)))
  assert.match(manifestSource, new RegExp(escapeRegExp(officialCard.first_mes)))
  assert.match(manifestSource, new RegExp(escapeRegExp(officialCard.blueprint.mission)))
})

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
