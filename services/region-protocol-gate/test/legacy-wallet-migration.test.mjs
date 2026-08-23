import test from 'node:test'
import assert from 'node:assert/strict'
import { LegacyMigrationError, buildLegacyWalletAudit, prepareLegacyBalanceImport } from '../migrations/legacy-wallet-migration.mjs'

const wallet = {
  version: 1,
  users: {
    legacy_alpha: { balance: 900, transactions: { a: { id: 'a', amount: 1000, type: 'grant' } } },
    legacy_beta: { balance: 120, transactions: { b: { id: 'b', amount: -100, type: 'consume' } } },
  },
}

test('legacy audit is privacy-preserving, reproducible, and counts remaining balances', () => {
  const audit = buildLegacyWalletAudit({ wallet, auditSalt: 'audit-salt-at-least-sixteen', generatedAt: '2026-08-23T00:00:00.000Z' })
  assert.equal(audit.accountCount, 2)
  assert.equal(audit.totalRemainingPoints, 1020)
  assert.equal(JSON.stringify(audit).includes('legacy_alpha'), false)
  assert.equal(JSON.stringify(audit).includes('legacy_beta'), false)
  assert.equal(audit.accounts[0].legacyAccountFingerprint.length, 64)
})

test('approved migration produces immutable one-time credit commands', () => {
  const auditSalt = 'audit-salt-at-least-sixteen'
  const audit = buildLegacyWalletAudit({ wallet, auditSalt })
  const imported = prepareLegacyBalanceImport({
    wallet,
    auditSalt,
    ownerApprovalId: 'owner-approval-20260823',
    now: '2026-08-23T00:00:00.000Z',
    approvedMappings: audit.accounts.map((account, index) => ({
      legacyAccountFingerprint: account.legacyAccountFingerprint,
      newAccountId: `new_account_${index + 1}`,
      decision: index === 0 ? 'APPROVE' : 'HOLD',
    })),
  })
  assert.equal(imported.commands.length, 2)
  assert.equal(imported.totalApprovedPoints, 900)
  assert.equal(imported.holdCount, 1)
  assert.match(imported.commands[0].idempotencyKey, /^legacy-wallet-v1:/)
})

test('migration rejects duplicated or unaudited mappings', () => {
  const auditSalt = 'audit-salt-at-least-sixteen'
  const audit = buildLegacyWalletAudit({ wallet, auditSalt })
  assert.throws(() => prepareLegacyBalanceImport({
    wallet,
    auditSalt,
    ownerApprovalId: 'owner-approval-20260823',
    approvedMappings: [
      { legacyAccountFingerprint: audit.accounts[0].legacyAccountFingerprint, newAccountId: 'new_account_1', decision: 'APPROVE' },
      { legacyAccountFingerprint: audit.accounts[0].legacyAccountFingerprint, newAccountId: 'new_account_2', decision: 'APPROVE' },
    ],
  }), (error) => error instanceof LegacyMigrationError && error.code === 'DUPLICATE_LEGACY_MAPPING')
})
