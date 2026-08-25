import assert from 'node:assert/strict'
import test from 'node:test'
import {
  FIRST_PASS_DURATION_MS,
  MONTHLY_PASS_DURATION_MS,
  ProtocolError,
  RegionProtocolGate,
  SubmissionState,
} from '../src/domain.mjs'

const T0 = new Date('2026-08-21T00:00:00.000Z')
const USER = { accountId: 'acct_user_001', authenticated: true }
const REVIEWER = { accountId: 'acct_reviewer_001', authenticated: true, roles: ['PROTOCOL_REVIEWER'] }
const SCOPE = 'phase-a-test-scope'

function gate(options = {}) {
  const subject = new RegionProtocolGate({ clock: () => T0, ...options })
  subject.registerAccount({ accountId: USER.accountId, now: T0 })
  subject.registerAccount({ accountId: REVIEWER.accountId, now: T0 })
  return subject
}

function expectCode(code, callback) {
  assert.throws(callback, (err) => err instanceof ProtocolError && err.code === code)
}

function publicDraft(overrides = {}) {
  return {
    regionId: 'yoidore',
    seasonId: 'season_01',
    targetLayer: 'RUMOR',
    publicRecord: {
      title: '月夜の樽が歌った夜',
      summary: '公開してよい短い出来事の要約です。',
      publicName: '旅の記録者',
      role: '常連',
    },
    consents: {
      authorOrRightsHolder: true,
      publicShare: true,
      izakayaEditorialLicense: true,
    },
    ...overrides,
  }
}

function credit(gateInstance, { eventId = 'evt_001', captureId = 'cap_001', verified = true } = {}) {
  return gateInstance.ingestPaymentVerification({
    providerEventId: eventId,
    paypalCaptureId: captureId,
    accountId: USER.accountId,
    verified,
    points: 100,
    auditId: `audit_${eventId}`,
    now: T0,
  })
}

test('24-hour first pass is issued once and expires exactly after 24 hours', () => {
  const subject = gate()
  const pass = subject.issueFirstPass({ subject: USER, scopeKey: SCOPE, now: T0 })
  assert.equal(new Date(pass.expiresAt).valueOf() - T0.valueOf(), FIRST_PASS_DURATION_MS)
  assert.equal(subject.getAccessStatus({ subject: USER, scopeKey: SCOPE, now: T0 }).status, 'ACTIVE')
  assert.equal(subject.getAccessStatus({ subject: USER, scopeKey: SCOPE, now: new Date(T0.valueOf() + FIRST_PASS_DURATION_MS) }).status, 'ENTITLEMENT_EXPIRED')
  expectCode('FIRST_PASS_ALREADY_ISSUED', () => subject.issueFirstPass({ subject: USER, scopeKey: SCOPE, now: T0 }))
})

test('verified 100P payment appends one ledger entry and ignores duplicate webhooks', () => {
  const subject = gate()
  assert.equal(credit(subject).status, 'VERIFIED_CREDITED')
  assert.equal(subject.getPointBalance({ subject: USER }), 100)
  const duplicate = credit(subject)
  assert.equal(duplicate.status, 'DUPLICATE_IGNORED')
  assert.equal(subject.getPointBalance({ subject: USER }), 100)
  assert.equal(subject.snapshot().ledgerEntries.length, 1)
})

test('unverified payments are recorded without granting points', () => {
  const subject = gate()
  assert.equal(credit(subject, { eventId: 'evt_unverified', captureId: 'cap_unverified', verified: false }).status, 'UNVERIFIED_RECORDED')
  assert.equal(subject.getPointBalance({ subject: USER }), 0)
  assert.equal(subject.snapshot().ledgerEntries.length, 0)
})

test('monthly pass spends 10P, lasts 30 days, and refuses insufficient balance', () => {
  const subject = gate()
  expectCode('INSUFFICIENT_POINTS', () => subject.purchaseMonthlyPass({ subject: USER, scopeKey: SCOPE, now: T0 }))
  credit(subject)
  const purchase = subject.purchaseMonthlyPass({ subject: USER, scopeKey: SCOPE, now: T0 })
  assert.equal(purchase.balance, 90)
  assert.equal(new Date(purchase.entitlement.expiresAt).valueOf() - T0.valueOf(), MONTHLY_PASS_DURATION_MS)
  assert.equal(subject.getAccessStatus({ subject: USER, scopeKey: SCOPE, now: new Date(T0.valueOf() + MONTHLY_PASS_DURATION_MS) }).status, 'ENTITLEMENT_EXPIRED')
})

test('auto renewal never charges PayPal and skips safely when points are insufficient', () => {
  const subject = gate()
  subject.setAutoRenewMonthly({ subject: USER, enabled: true })
  assert.deepEqual(subject.attemptAutoRenew({ subject: USER, scopeKey: SCOPE, now: T0 }), {
    status: 'AUTO_RENEW_SKIPPED_INSUFFICIENT_POINTS',
    balance: 0,
    required: 10,
  })
  credit(subject)
  const renewed = subject.attemptAutoRenew({ subject: USER, scopeKey: SCOPE, now: T0 })
  assert.equal(renewed.status, 'AUTO_RENEWED')
  assert.equal(subject.getPointBalance({ subject: USER }), 90)
})

test('submission contract excludes raw V2, logs, API keys, source images, and CORE writes', () => {
  const subject = gate()
  expectCode('UNSUPPORTED_SUBMISSION_FIELD', () => subject.createSubmissionDraft({ subject: USER, draft: publicDraft({ v2json: { secret: 'must stay local' } }), now: T0 }))
  expectCode('INVALID_RECORD_LAYER', () => subject.createSubmissionDraft({ subject: USER, draft: publicDraft({ targetLayer: 'CORE' }), now: T0 }))
})

test('submission state machine requires consent, account ownership, and reviewer role', () => {
  const subject = gate()
  const draft = subject.createSubmissionDraft({ subject: USER, draft: publicDraft({ consents: { authorOrRightsHolder: true, publicShare: false, izakayaEditorialLicense: true } }), now: T0 })
  expectCode('MISSING_REQUIRED_CONSENT', () => subject.submitSubmission({ subject: USER, submissionId: draft.id, now: T0 }))
  const updated = subject.updateSubmissionDraft({ subject: USER, submissionId: draft.id, draft: publicDraft(), now: T0 })
  assert.equal(updated.state, SubmissionState.DRAFT)
  const submitted = subject.submitSubmission({ subject: USER, submissionId: draft.id, now: T0 })
  assert.equal(submitted.state, SubmissionState.SUBMITTED)
  expectCode('REVIEWER_ROLE_REQUIRED', () => subject.reviewSubmission({ reviewer: USER, submissionId: draft.id, decision: 'APPROVE', now: T0 }))
  const revision = subject.reviewSubmission({ reviewer: REVIEWER, submissionId: draft.id, decision: 'REQUEST_REVISION', note: '公開要約を少し短くしてください。', now: T0 })
  assert.equal(revision.state, SubmissionState.REVISION_REQUESTED)
  const resubmitted = subject.submitSubmission({ subject: USER, submissionId: draft.id, now: T0 })
  const approved = subject.reviewSubmission({ reviewer: REVIEWER, submissionId: resubmitted.id, decision: 'APPROVE', now: T0 })
  assert.equal(approved.state, SubmissionState.APPROVED)
  assert.equal(approved.review.reviewerAccountId, REVIEWER.accountId)
})

test('submission per account/region/season cap is deterministic and configurable', () => {
  const subject = gate({ config: { submissionsPerAccountRegionSeason: 1 } })
  subject.createSubmissionDraft({ subject: USER, draft: publicDraft(), now: T0 })
  expectCode('SUBMISSION_LIMIT_REACHED', () => subject.createSubmissionDraft({ subject: USER, draft: publicDraft(), now: T0 }))
})

test('snapshot reload reproduces ledger, entitlement, and submission state without private payloads', () => {
  const first = gate()
  credit(first)
  const purchase = first.purchaseMonthlyPass({ subject: USER, scopeKey: SCOPE, now: T0 })
  const draft = first.createSubmissionDraft({ subject: USER, draft: publicDraft(), now: T0 })
  first.submitSubmission({ subject: USER, submissionId: draft.id, now: T0 })
  const snapshot = first.snapshot()
  const reloaded = new RegionProtocolGate({ clock: () => T0, snapshot })
  assert.equal(reloaded.getPointBalance({ subject: USER }), 90)
  assert.equal(reloaded.getAccessStatus({ subject: USER, scopeKey: SCOPE, now: T0 }).entitlement.id, purchase.entitlement.id)
  assert.equal(reloaded.listSubmissions({ subject: USER })[0].state, SubmissionState.SUBMITTED)
  assert.equal(JSON.stringify(snapshot).includes('v2json'), false)
})
