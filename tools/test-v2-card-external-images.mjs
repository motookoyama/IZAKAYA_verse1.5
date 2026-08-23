import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

test('official V2 cards keep all non-image data while using external card images', () => {
  const result = spawnSync(process.execPath, ['tools/v2cards/extract-official-card-images.mjs'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    encoding: 'utf8',
  })

  assert.equal(result.status, 0, result.stderr || result.stdout)
  const report = JSON.parse(result.stdout)
  assert.equal(report.ok, true)
  assert.equal(report.mode, 'verify')
  assert.equal(report.cards.length, 8)
  assert.ok(report.cards.every((card) => card.convertedJsonBytes < 10_000))
  assert.ok(report.cards.every((card) => card.imageHeight <= 960 && card.imageBytes < 350_000))
})
