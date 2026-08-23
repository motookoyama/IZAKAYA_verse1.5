import { createHmac, createHash } from 'node:crypto'

export class LegacyMigrationError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'LegacyMigrationError'
    this.code = code
  }
}

function fail(code, message) {
  throw new LegacyMigrationError(code, message)
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function hmac(secret, value) {
  return createHmac('sha256', secret).update(value).digest('hex')
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function positiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 0) fail('INVALID_LEGACY_BALANCE', `${field} must be a non-negative integer`)
  return value
}

/**
 * Builds a shareable audit manifest from the legacy file-mode wallet.
 * It deliberately omits raw legacy account IDs and transaction metadata.
 */
export function buildLegacyWalletAudit({ wallet, auditSalt, sourceLabel = 'legacy-wallet.json', generatedAt = new Date().toISOString() }) {
  if (!auditSalt || auditSalt.length < 16) fail('AUDIT_SALT_REQUIRED', 'MIGRATION_AUDIT_SALT must be at least 16 characters')
  if (!wallet || typeof wallet !== 'object' || !wallet.users || typeof wallet.users !== 'object') {
    fail('INVALID_LEGACY_WALLET', 'legacy wallet must contain a users object')
  }

  const accounts = Object.entries(wallet.users).map(([legacyAccountId, account]) => {
    const balance = positiveInteger(account?.balance ?? 0, 'legacy account balance')
    const transactions = account?.transactions && typeof account.transactions === 'object' ? account.transactions : {}
    const records = Object.values(transactions).filter((entry) => entry && typeof entry === 'object')
    return {
      legacyAccountFingerprint: hmac(auditSalt, `izakaya-legacy-account-v1:${legacyAccountId}`),
      legacyRecordDigest: sha256(canonicalJson(records)),
      remainingPoints: balance,
      ledgerEntryCount: records.length,
    }
  }).sort((a, b) => a.legacyAccountFingerprint.localeCompare(b.legacyAccountFingerprint))

  return {
    schema: 'izakaya.legacy-wallet-audit.v1',
    sourceLabel,
    generatedAt,
    sourceDigest: sha256(canonicalJson(wallet)),
    accountCount: accounts.length,
    totalRemainingPoints: accounts.reduce((sum, account) => sum + account.remainingPoints, 0),
    accounts,
    limitations: [
      'This audit does not prove which legacy credits were paid purchases.',
      'PayPal transaction history or an owner decision is required before import.',
      'Raw account IDs, emails, payment payloads, and transaction metadata are intentionally omitted.',
    ],
  }
}

/**
 * Turns a private, owner-reviewed mapping into append-only import commands.
 * The mapping is never embedded in the audit manifest and must stay out of Git.
 */
export function prepareLegacyBalanceImport({ wallet, auditSalt, approvedMappings, ownerApprovalId, now = new Date().toISOString() }) {
  if (typeof ownerApprovalId !== 'string' || ownerApprovalId.trim().length < 8) {
    fail('OWNER_APPROVAL_REQUIRED', 'ownerApprovalId is required for a legacy balance import')
  }
  const audit = buildLegacyWalletAudit({ wallet, auditSalt, generatedAt: now })
  if (!Array.isArray(approvedMappings)) fail('MAPPING_REQUIRED', 'approvedMappings must be an array')

  const byFingerprint = new Map(audit.accounts.map((account) => [account.legacyAccountFingerprint, account]))
  const seenLegacy = new Set()
  const seenNew = new Set()
  const commands = approvedMappings.map((mapping) => {
    const fingerprint = String(mapping?.legacyAccountFingerprint ?? '')
    const newAccountId = String(mapping?.newAccountId ?? '')
    const decision = String(mapping?.decision ?? '')
    if (!byFingerprint.has(fingerprint)) fail('UNKNOWN_LEGACY_ACCOUNT', 'mapping references an account outside the audited wallet')
    if (seenLegacy.has(fingerprint)) fail('DUPLICATE_LEGACY_MAPPING', 'legacy account may be mapped only once')
    if (seenNew.has(newAccountId)) fail('DUPLICATE_NEW_ACCOUNT_MAPPING', 'each new account requires a distinct migration review')
    if (!/^[A-Za-z0-9:_-]{3,128}$/.test(newAccountId)) fail('INVALID_NEW_ACCOUNT_ID', 'newAccountId is invalid')
    if (!['APPROVE', 'HOLD', 'REJECT'].includes(decision)) fail('INVALID_MIGRATION_DECISION', 'decision must be APPROVE, HOLD, or REJECT')
    seenLegacy.add(fingerprint)
    seenNew.add(newAccountId)
    const account = byFingerprint.get(fingerprint)
    return {
      idempotencyKey: `legacy-wallet-v1:${audit.sourceDigest}:${fingerprint}`,
      legacyAccountFingerprint: fingerprint,
      newAccountId,
      decision,
      points: decision === 'APPROVE' ? account.remainingPoints : 0,
      ledgerKind: 'LEGACY_BETA_MIGRATION_CREDIT',
      reason: 'OWNER_REVIEWED_LEGACY_BETA_BALANCE',
      ownerApprovalId: ownerApprovalId.trim(),
      preparedAt: now,
    }
  })

  return {
    schema: 'izakaya.legacy-wallet-import.v1',
    auditSourceDigest: audit.sourceDigest,
    ownerApprovalId: ownerApprovalId.trim(),
    preparedAt: now,
    commands,
    totalApprovedPoints: commands.reduce((sum, command) => sum + command.points, 0),
    holdCount: commands.filter((command) => command.decision === 'HOLD').length,
  }
}
