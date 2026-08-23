# Phase-A persistence and API contract

This file is a handoff contract for the later Firestore / Cloud Run adapter. It is not a deployment instruction and contains no credentials.

## Collection mapping

| Planned Firestore collection | Phase-A snapshot field | Purpose | Must not contain |
| --- | --- | --- | --- |
| `accounts` | `accounts` | account ID, first-pass issuance marker, point-only auto-renew preference | provider tokens, user API keys, chat history |
| `ledger_entries` | `ledgerEntries` | append-only signed point delta and source/reason | mutable balance field as the financial source of truth |
| `entitlements` | `entitlements` | scope, kind, issue/expiry time, issuance reason | V2/card payload |
| `payment_events` | `paymentEvents` | PayPal event/capture IDs, verification result, audit ID | raw webhook body, PayPal secret, card data |
| `protocol_submissions` | `protocolSubmissions` | minimal public record, consent flags, state, reviewer decision | V2 JSON, conversation/log, API key, source/high-res image |

The current `snapshot()` data is the local replay serialization. A production adapter must store only the corresponding records and preserve their IDs and timestamps.

## Commands and authority

| Command | Required authority | State effect | External side effect |
| --- | --- | --- | --- |
| `issueFirstPass` | authenticated submitting account | one `FIRST_24H` entitlement; permanent account marker | none |
| `ingestPaymentVerification` | trusted future webhook adapter after PayPal verification | immutable `payment_events`; one purchase ledger entry only if verified | none in this core |
| `purchaseMonthlyPass` | authenticated submitting account | one -100P ledger entry and `MONTHLY_30D` entitlement | none |
| `attemptAutoRenew` | authenticated account with explicit preference | same as monthly purchase only if enough stored points | never calls PayPal |
| `createSubmissionDraft` / `updateSubmissionDraft` / `submitSubmission` | authenticated owning account | exact protocol state transition | none |
| `reviewSubmission` | authenticated account with `PROTOCOL_REVIEWER` role | `SUBMITTED` to review result | no auto-publication or region change |

## Required adapter guarantees

1. Authenticate the account subject before calling user commands.
2. Verify PayPal outside this module, then pass only the verification result and stable IDs.
3. Use one transaction for a point spend and entitlement issuance. Duplicate webhook event IDs and capture IDs must stay idempotent.
4. Treat ledger entries as append-only. Corrections must be new entries with a reason/audit ID, never edits to old entries.
5. Reject fields outside the minimum submission contract before persistence. Do not add a generic JSON/blob escape hatch.
6. Approval must enqueue an internal editorial task; it must not mutate a public region automatically.
7. Before production, replace the local quota/retention test defaults with owner-approved values and add a scheduled deletion job for expired rejected/withdrawn material.
