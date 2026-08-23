# Region Protocol Gate — Phase A

This is the isolated Phase-A core for IZAKAYA Verse 2.0's commercial gate and region-protocol reception. It is deliberately independent of the existing BFF Lite prototype under `bff/`.

## What is fixed here

- authenticated account subject boundary (adapter supplied)
- append-only point ledger with a 1,000P verified-payment unit
- PayPal verification result ingestion and duplicate event/capture suppression
- one 24-hour first pass per account
- 100P, 30-day entitlement issuance and optional *point-only* auto renewal
- deterministic access/expiry results
- minimum-public-data region-protocol drafts and the exact state machine:
  `DRAFT → SUBMITTED → REVISION_REQUESTED | REJECTED | APPROVED`
- reviewer-role requirement; no automatic review or static-region reflection
- snapshot/reload of the entire Phase-A state for local replay

## Explicit non-goals

No HTTP listener, PayPal SDK, cloud credential, Firestore client, API-key field, AI call, chat-log field, V2 JSON field, source-image upload, resident-thumbnail upload, or public UI exists here. The resident catalog remains closed. Existing BFF Lite code and its legacy 7-day/QR prototype are untouched.

The only payment method exposed by the domain is `ingestPaymentVerification`: a future webhook adapter must verify PayPal first, then pass the small verified result into this function. Raw webhook payloads and secrets must not enter this model.

## Local verification

```bash
npm run test:region-protocol-gate
```

The tests replay the required Phase-A paths: 24-hour issue/expiry/repeat refusal, verified and unverified payment handling, duplicate webhook suppression, 100P/30-day issuance, insufficient balance, point-only auto renewal, submission consent/ownership/reviewer checks, and snapshot reload.

## Decisions intentionally still outside the code

- initial identity provider and real account authentication adapter
- final entitlement product scope(s)
- production submission quota and retention period (the local defaults of 3 and 90 days are test guards, not launch policy)
- resident-catalog / thumbnail acceptance opening date
- legal terms, refund rules, PayPal Sandbox and production credentials
- GCP project, budgets, quotas, IAM, Cloud Run deployment, and Firestore persistence adapter

Those are Phase B–D or owner/legal approval gates. Do not treat passing this local test suite as authorization to deploy or charge users.
