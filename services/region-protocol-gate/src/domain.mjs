/**
 * IZAKAYA Verse Region Protocol Gate — Phase A domain model.
 *
 * This module deliberately has no HTTP, database, payment SDK, AI provider,
 * image upload, or UI dependency.  A Cloud Run / Firestore adapter may call
 * these functions later, but must not change the rules encoded here.
 */

export const POINTS_PER_MONTHLY_PASS = 100
export const FIRST_PASS_DURATION_MS = 24 * 60 * 60 * 1000
export const MONTHLY_PASS_DURATION_MS = 30 * 24 * 60 * 60 * 1000

export const SubmissionState = Object.freeze({
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
  REJECTED: 'REJECTED',
  APPROVED: 'APPROVED',
})

export const RecordLayer = Object.freeze({
  PRECEDENT: 'PRECEDENT',
  RUMOR: 'RUMOR',
  ARCHIVE: 'ARCHIVE',
})

export class ProtocolError extends Error {
  constructor(code, message, details = undefined) {
    super(message)
    this.name = 'ProtocolError'
    this.code = code
    this.details = details
  }
}

const DEFAULT_CONFIG = Object.freeze({
  // Local Phase-A guard only. Production policy is an owner decision.
  submissionsPerAccountRegionSeason: 3,
  rejectedSubmissionRetentionDays: 90,
})

const DAY_MS = 24 * 60 * 60 * 1000
const ACCOUNT_ID = /^[A-Za-z0-9:_-]{3,128}$/
const PUBLIC_RECORD_KEYS = new Set(['title', 'summary', 'publicName', 'role'])
const DRAFT_KEYS = new Set(['regionId', 'seasonId', 'targetLayer', 'publicRecord', 'consents'])
const CONSENT_KEYS = new Set(['authorOrRightsHolder', 'publicShare', 'izakayaEditorialLicense'])

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function error(code, message, details) {
  throw new ProtocolError(code, message, details)
}

function asTimestamp(value, field = 'time') {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.valueOf())) error('INVALID_TIME', `${field} must be a valid time`)
  return date.toISOString()
}

function millis(value) {
  return new Date(value).valueOf()
}

function assertString(value, field, { min = 1, max = 512 } = {}) {
  if (typeof value !== 'string') error('INVALID_FIELD', `${field} must be a string`)
  const normalized = value.trim()
  if (normalized.length < min || normalized.length > max) {
    error('INVALID_FIELD', `${field} must be ${min}-${max} characters`)
  }
  return normalized
}

function assertKnownKeys(value, allowed, code, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    error(code, `${field} must be an object`)
  }
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) error(code, `${field}.${key} is not accepted by the minimum public-data contract`)
  }
}

function assertAccountId(accountId) {
  if (typeof accountId !== 'string' || !ACCOUNT_ID.test(accountId)) {
    error('INVALID_ACCOUNT_ID', 'accountId must be a stable 3-128 character identifier')
  }
  return accountId
}

function makeId(prefix, serial) {
  return `${prefix}_${String(serial).padStart(6, '0')}`
}

function normalizeDraft(input, { forSubmission = false } = {}) {
  assertKnownKeys(input, DRAFT_KEYS, 'UNSUPPORTED_SUBMISSION_FIELD', 'submission')
  const regionId = assertString(input.regionId, 'regionId', { max: 96 })
  const seasonId = assertString(input.seasonId, 'seasonId', { max: 96 })
  if (!Object.values(RecordLayer).includes(input.targetLayer)) {
    error('INVALID_RECORD_LAYER', 'targetLayer must be PRECEDENT, RUMOR, or ARCHIVE; CORE is not writable')
  }

  assertKnownKeys(input.publicRecord, PUBLIC_RECORD_KEYS, 'UNSUPPORTED_SUBMISSION_FIELD', 'publicRecord')
  const publicRecord = {
    title: assertString(input.publicRecord?.title ?? '', 'publicRecord.title', { min: forSubmission ? 1 : 0, max: 120 }),
    summary: assertString(input.publicRecord?.summary ?? '', 'publicRecord.summary', { min: forSubmission ? 1 : 0, max: 1200 }),
  }
  for (const optionalField of ['publicName', 'role']) {
    if (input.publicRecord?.[optionalField] !== undefined) {
      publicRecord[optionalField] = assertString(input.publicRecord[optionalField], `publicRecord.${optionalField}`, { max: 120 })
    }
  }

  assertKnownKeys(input.consents, CONSENT_KEYS, 'INVALID_CONSENT', 'consents')
  const consents = {
    authorOrRightsHolder: input.consents?.authorOrRightsHolder === true,
    publicShare: input.consents?.publicShare === true,
    izakayaEditorialLicense: input.consents?.izakayaEditorialLicense === true,
  }
  if (forSubmission && Object.values(consents).some((accepted) => !accepted)) {
    error('MISSING_REQUIRED_CONSENT', 'submission requires rights, public-share, and editorial-license consent')
  }

  return { regionId, seasonId, targetLayer: input.targetLayer, publicRecord, consents }
}

/**
 * An in-memory, serializable reference implementation. Each public method is
 * deterministic when a `now` value is supplied, which makes it suitable for
 * Phase-A local replay. Its snapshot shape maps directly to the planned
 * Firestore collections, without storing V2 originals, chat logs, API keys,
 * or source images.
 */
export class RegionProtocolGate {
  constructor({ clock = () => new Date(), config = {}, snapshot = undefined } = {}) {
    this.clock = clock
    this.config = { ...DEFAULT_CONFIG, ...(snapshot?.config ?? {}), ...config }
    this.accounts = new Map((snapshot?.accounts ?? []).map((entry) => [entry.accountId, entry]))
    this.ledgerEntries = snapshot?.ledgerEntries ?? []
    this.entitlements = snapshot?.entitlements ?? []
    this.paymentEvents = snapshot?.paymentEvents ?? []
    this.protocolSubmissions = snapshot?.protocolSubmissions ?? []
    this.serial = snapshot?.serial ?? 0
  }

  registerAccount({ accountId, autoRenewMonthly = false, now = this.clock() }) {
    assertAccountId(accountId)
    if (this.accounts.has(accountId)) error('ACCOUNT_ALREADY_EXISTS', 'account already exists')
    const account = {
      accountId,
      authenticated: true,
      autoRenewMonthly: autoRenewMonthly === true,
      firstPassIssuedAt: null,
      createdAt: asTimestamp(now),
    }
    this.accounts.set(accountId, account)
    return clone(account)
  }

  setAutoRenewMonthly({ subject, enabled }) {
    const account = this.#accountFor(subject)
    account.autoRenewMonthly = enabled === true
    return clone(account)
  }

  issueFirstPass({ subject, scopeKey, now = this.clock() }) {
    const account = this.#accountFor(subject)
    const issuedAt = asTimestamp(now)
    if (account.firstPassIssuedAt) {
      error('FIRST_PASS_ALREADY_ISSUED', 'the 24-hour first pass is limited to one issuance per account')
    }
    const entitlement = this.#appendEntitlement({
      accountId: account.accountId,
      scopeKey: assertString(scopeKey, 'scopeKey', { max: 128 }),
      kind: 'FIRST_24H',
      issuedAt,
      expiresAt: new Date(millis(issuedAt) + FIRST_PASS_DURATION_MS).toISOString(),
      issuanceReason: 'FIRST_PASS_ONCE_PER_ACCOUNT',
    })
    account.firstPassIssuedAt = issuedAt
    return clone(entitlement)
  }

  /**
   * Accepts only the *result* of a future PayPal verification adapter. Raw
   * webhook bodies and credentials are intentionally outside this contract.
   */
  ingestPaymentVerification({ providerEventId, paypalCaptureId, accountId, verified, points = 1000, auditId, now = this.clock() }) {
    assertString(providerEventId, 'providerEventId', { max: 160 })
    assertString(paypalCaptureId, 'paypalCaptureId', { max: 160 })
    assertAccountId(accountId)
    this.#requireAccount(accountId)
    const duplicate = this.paymentEvents.find((event) => event.providerEventId === providerEventId || event.paypalCaptureId === paypalCaptureId)
    if (duplicate) return { status: 'DUPLICATE_IGNORED', paymentEvent: clone(duplicate) }
    if (!Number.isInteger(points) || points !== 1000) {
      error('UNSUPPORTED_PURCHASE_AMOUNT', 'Phase A accepts only the initial 1,000P purchase unit')
    }
    const event = {
      id: this.#nextId('payment'),
      provider: 'PAYPAL',
      providerEventId,
      paypalCaptureId,
      accountId,
      verificationStatus: verified === true ? 'VERIFIED' : 'UNVERIFIED',
      points,
      auditId: assertString(auditId, 'auditId', { max: 160 }),
      receivedAt: asTimestamp(now),
    }
    this.paymentEvents.push(event)
    if (event.verificationStatus !== 'VERIFIED') return { status: 'UNVERIFIED_RECORDED', paymentEvent: clone(event) }

    const ledgerEntry = this.#appendLedger({
      accountId,
      deltaPoints: points,
      kind: 'PURCHASE',
      reason: 'PAYPAL_VERIFIED_1000P',
      sourceId: event.id,
      occurredAt: event.receivedAt,
    })
    return { status: 'VERIFIED_CREDITED', paymentEvent: clone(event), ledgerEntry: clone(ledgerEntry) }
  }

  getPointBalance({ subject }) {
    const account = this.#accountFor(subject)
    return this.#balanceFor(account.accountId)
  }

  purchaseMonthlyPass({ subject, scopeKey, now = this.clock(), issuanceReason = 'MONTHLY_100P' }) {
    const account = this.#accountFor(subject)
    const balance = this.#balanceFor(account.accountId)
    if (balance < POINTS_PER_MONTHLY_PASS) {
      error('INSUFFICIENT_POINTS', '100P is required for a 30-day monthly pass', { balance, required: POINTS_PER_MONTHLY_PASS })
    }
    const issuedAt = asTimestamp(now)
    const ledgerEntry = this.#appendLedger({
      accountId: account.accountId,
      deltaPoints: -POINTS_PER_MONTHLY_PASS,
      kind: 'SPEND',
      reason: issuanceReason,
      sourceId: null,
      occurredAt: issuedAt,
    })
    const entitlement = this.#appendEntitlement({
      accountId: account.accountId,
      scopeKey: assertString(scopeKey, 'scopeKey', { max: 128 }),
      kind: 'MONTHLY_30D',
      issuedAt,
      expiresAt: new Date(millis(issuedAt) + MONTHLY_PASS_DURATION_MS).toISOString(),
      issuanceReason,
    })
    return { ledgerEntry: clone(ledgerEntry), entitlement: clone(entitlement), balance: this.#balanceFor(account.accountId) }
  }

  attemptAutoRenew({ subject, scopeKey, now = this.clock() }) {
    const account = this.#accountFor(subject)
    if (!account.autoRenewMonthly) return { status: 'AUTO_RENEW_DISABLED' }
    const access = this.getAccessStatus({ subject, scopeKey, now })
    if (access.allowed) return { status: 'AUTO_RENEW_NOT_DUE', access }
    const balance = this.#balanceFor(account.accountId)
    if (balance < POINTS_PER_MONTHLY_PASS) {
      return { status: 'AUTO_RENEW_SKIPPED_INSUFFICIENT_POINTS', balance, required: POINTS_PER_MONTHLY_PASS }
    }
    return { status: 'AUTO_RENEWED', ...this.purchaseMonthlyPass({ subject, scopeKey, now, issuanceReason: 'AUTO_RENEW_MONTHLY_100P' }) }
  }

  getAccessStatus({ subject, scopeKey, now = this.clock() }) {
    const account = this.#accountFor(subject)
    const at = asTimestamp(now)
    const matching = this.entitlements.filter((entry) => entry.accountId === account.accountId && entry.scopeKey === scopeKey)
    const active = matching.filter((entry) => millis(entry.expiresAt) > millis(at)).sort((a, b) => millis(b.expiresAt) - millis(a.expiresAt))[0]
    if (active) return { allowed: true, status: 'ACTIVE', entitlement: clone(active) }
    if (matching.length) return { allowed: false, status: 'ENTITLEMENT_EXPIRED', latestExpiry: matching.sort((a, b) => millis(b.expiresAt) - millis(a.expiresAt))[0].expiresAt }
    return { allowed: false, status: 'NO_ACTIVE_ENTITLEMENT' }
  }

  createSubmissionDraft({ subject, draft, now = this.clock() }) {
    const account = this.#accountFor(subject)
    const normalized = normalizeDraft(draft)
    const sameScopeCount = this.protocolSubmissions.filter((entry) => (
      entry.accountId === account.accountId && entry.regionId === normalized.regionId && entry.seasonId === normalized.seasonId
    )).length
    if (sameScopeCount >= this.config.submissionsPerAccountRegionSeason) {
      error('SUBMISSION_LIMIT_REACHED', 'the account/region/season submission limit has been reached', { limit: this.config.submissionsPerAccountRegionSeason })
    }
    const createdAt = asTimestamp(now)
    const submission = {
      id: this.#nextId('submission'),
      accountId: account.accountId,
      ...normalized,
      state: SubmissionState.DRAFT,
      createdAt,
      updatedAt: createdAt,
      submittedAt: null,
      review: null,
      retentionDeleteAfter: new Date(millis(createdAt) + this.config.rejectedSubmissionRetentionDays * DAY_MS).toISOString(),
    }
    this.protocolSubmissions.push(submission)
    return clone(submission)
  }

  updateSubmissionDraft({ subject, submissionId, draft, now = this.clock() }) {
    const submission = this.#submissionOwnedBy(subject, submissionId)
    if (![SubmissionState.DRAFT, SubmissionState.REVISION_REQUESTED].includes(submission.state)) {
      error('INVALID_SUBMISSION_TRANSITION', 'only DRAFT or REVISION_REQUESTED submissions may be edited')
    }
    const normalized = normalizeDraft(draft)
    if (submission.regionId !== normalized.regionId || submission.seasonId !== normalized.seasonId) {
      error('SUBMISSION_SCOPE_IMMUTABLE', 'regionId and seasonId cannot be changed after the draft is created')
    }
    Object.assign(submission, normalized, { updatedAt: asTimestamp(now) })
    return clone(submission)
  }

  submitSubmission({ subject, submissionId, now = this.clock() }) {
    const submission = this.#submissionOwnedBy(subject, submissionId)
    if (![SubmissionState.DRAFT, SubmissionState.REVISION_REQUESTED].includes(submission.state)) {
      error('INVALID_SUBMISSION_TRANSITION', 'only DRAFT or REVISION_REQUESTED submissions may be submitted')
    }
    normalizeDraft({
      regionId: submission.regionId,
      seasonId: submission.seasonId,
      targetLayer: submission.targetLayer,
      publicRecord: submission.publicRecord,
      consents: submission.consents,
    }, { forSubmission: true })
    submission.state = SubmissionState.SUBMITTED
    submission.submittedAt = asTimestamp(now)
    submission.updatedAt = submission.submittedAt
    return clone(submission)
  }

  reviewSubmission({ reviewer, submissionId, decision, note = '', now = this.clock() }) {
    this.#requireReviewer(reviewer)
    const submission = this.protocolSubmissions.find((entry) => entry.id === submissionId)
    if (!submission) error('SUBMISSION_NOT_FOUND', 'submission was not found')
    if (submission.state !== SubmissionState.SUBMITTED) {
      error('INVALID_SUBMISSION_TRANSITION', 'only SUBMITTED submissions may be reviewed')
    }
    const stateByDecision = {
      REQUEST_REVISION: SubmissionState.REVISION_REQUESTED,
      REJECT: SubmissionState.REJECTED,
      APPROVE: SubmissionState.APPROVED,
    }
    const nextState = stateByDecision[decision]
    if (!nextState) error('INVALID_REVIEW_DECISION', 'decision must be REQUEST_REVISION, REJECT, or APPROVE')
    const reviewedAt = asTimestamp(now)
    submission.state = nextState
    submission.updatedAt = reviewedAt
    submission.review = {
      reviewerAccountId: reviewer.accountId,
      decision,
      note: typeof note === 'string' ? note.trim().slice(0, 1000) : '',
      reviewedAt,
    }
    return clone(submission)
  }

  listSubmissions({ subject }) {
    const account = this.#accountFor(subject)
    return this.protocolSubmissions.filter((entry) => entry.accountId === account.accountId).map(clone)
  }

  snapshot() {
    return clone({
      config: this.config,
      accounts: [...this.accounts.values()],
      ledgerEntries: this.ledgerEntries,
      entitlements: this.entitlements,
      paymentEvents: this.paymentEvents,
      protocolSubmissions: this.protocolSubmissions,
      serial: this.serial,
    })
  }

  #nextId(prefix) {
    this.serial += 1
    return makeId(prefix, this.serial)
  }

  #accountFor(subject) {
    if (!subject?.authenticated || typeof subject.accountId !== 'string') {
      error('UNAUTHENTICATED_SUBJECT', 'an authenticated account subject is required')
    }
    return this.#requireAccount(subject.accountId)
  }

  #requireAccount(accountId) {
    const account = this.accounts.get(accountId)
    if (!account) error('ACCOUNT_NOT_FOUND', 'account was not found')
    return account
  }

  #requireReviewer(reviewer) {
    const account = this.#accountFor(reviewer)
    if (!Array.isArray(reviewer.roles) || !reviewer.roles.includes('PROTOCOL_REVIEWER')) {
      error('REVIEWER_ROLE_REQUIRED', 'PROTOCOL_REVIEWER role is required')
    }
    return account
  }

  #appendLedger(entry) {
    if (!Number.isInteger(entry.deltaPoints) || entry.deltaPoints === 0) {
      error('INVALID_LEDGER_ENTRY', 'ledger delta must be a non-zero integer')
    }
    const record = { id: this.#nextId('ledger'), ...entry }
    this.ledgerEntries.push(record)
    return record
  }

  #appendEntitlement(entry) {
    const record = { id: this.#nextId('entitlement'), ...entry }
    this.entitlements.push(record)
    return record
  }

  #balanceFor(accountId) {
    return this.ledgerEntries
      .filter((entry) => entry.accountId === accountId)
      .reduce((total, entry) => total + entry.deltaPoints, 0)
  }

  #submissionOwnedBy(subject, submissionId) {
    const account = this.#accountFor(subject)
    const submission = this.protocolSubmissions.find((entry) => entry.id === submissionId)
    if (!submission) error('SUBMISSION_NOT_FOUND', 'submission was not found')
    if (submission.accountId !== account.accountId) error('SUBMISSION_OWNER_REQUIRED', 'only the submitting account may change this submission')
    return submission
  }
}
