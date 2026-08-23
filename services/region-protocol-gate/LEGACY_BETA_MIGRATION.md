# Legacy Beta balance migration

This procedure honors early beta participants without treating the legacy BFF
wallet as automatic proof of a paid purchase.

## What is retained

- The legacy wallet file and the old Cloud Run / PayPal configuration are never
  edited by this procedure.
- A private backup of the source wallet is retained before any import.
- The audit manifest contains HMAC account fingerprints, source and record
  digests, point balances, and entry counts only. It never contains raw legacy
  account IDs, payment payloads, emails, or transaction metadata.

## Required human review

For every non-zero legacy balance, the owner compares the audit row with the
PayPal history and selects one of `APPROVE`, `HOLD`, or `REJECT`.

- `APPROVE` creates one append-only `LEGACY_BETA_MIGRATION_CREDIT` command.
- `HOLD` grants nothing and preserves the record for later inquiry.
- `REJECT` grants nothing and records the decision.

The private mapping from the old account to a newly issued commercial-gate
account must stay outside Git and outside public static assets.

## Production import rule

Firestore must execute each approved command in one transaction, reject an
existing `idempotencyKey`, append the credit ledger entry, and write a matching
audit event. The operation may be run once only after an owner approval ID and
the PayPal review evidence have been recorded.
