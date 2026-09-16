# One-time RP ID backfill

Run from `web/` with the operator's configured Postgres, Temporal RPC and RP registry environment. `scan` needs only database/RPC/registry read access; `reserve` also needs the existing Safe-owner and shared-manager KMS configuration. Both commands hold the same session-level database lock.

Deploy the migration/Hasura metadata, then the compatible Portal handlers, before executing the worker. The table is service-only and survives app deletion. There are no extra report files or scheduled workers.

## Scan

Choose and retain one explicit UTC creation cutoff, including on a retry:

```sh
pnpm rp:backfill scan --created-before 2026-09-16T00:00:00Z
```

This loads every eligible non-staging/non-deleted app before the cutoff, including inactive and archived apps. It checks both registries and inserts only after all reads succeed. A read/insert error or duplicate derived RP ID leaves the table empty. A populated table cannot be scanned again. For initialized IDs, an ordinary Portal row means `already_registered`, regardless of its mode/status; this intentionally is not an ownership audit.

## Pause and drain setup

Set `RP_ID_BACKFILL_SETUP_PAUSED=true` on every serving Portal instance and in the operator process. Verify the rollout covers dashboard, MCP and first-registration retry paths; setting it only in the CLI does not pause the deployed Portal. Existing enabled-app maintenance remains available.

Wait for admitted handlers and their operations to finish or expire. Use the deployed `USER_OP_MAX_VALIDITY_MS` (currently 30 minutes), plus five minutes of settlement margin from the last possible submission. Add the deployed maximum request duration if handler completion cannot be observed. Neither an HTTP response nor an empty pending-row query proves all operations settled. `--setup-drained` records the operator's confirmation that this procedure is complete.

## Reserve

```sh
pnpm rp:backfill reserve --setup-drained --batch-size 100
```

The worker traverses production then staging once per invocation. It excludes apps with an existing ordinary Portal registration and rechecks current app eligibility. Each prepared batch gets a receipt-queryable UserOperation hash persisted on all members before broadcast. Batch gas is estimated; each batch uses a distinct nonce key.

- Confirmed success: `reserved`, request cleared.
- Definite failure: reconcile actual state, clear resolved requests, move on. Confirmed-unused IDs may be attempted in a later invocation.
- Unknown outcome/read failure: retain `in_progress` and the request hash, move on, and skip those rows after restart.
- Database tracking failure or lock loss: stop new submissions.

Receipt polling defaults to 60 seconds per batch (`--receipt-timeout-ms`). Exit 2 indicates unresolved or preparation-failed work, not that successful batches were rolled back. A successful traversal may still have previously unresolved rows; inspect the table before reopening setup.

```sql
SELECT * FROM rp_id_backfill
WHERE production_status IN ('unused', 'in_progress')
   OR staging_status IN ('unused', 'in_progress');
```

Some `unused` rows are intentionally excluded because an ordinary registration exists or the app is no longer eligible.

## Reconcile one request without resubmitting

```sh
pnpm rp:backfill reserve --reconcile-request 0x<64-hex-digits> --registry production
```

Use the actual saved request hash, not the literal example. The receipt and live registry state resolve only that request's members. A missing receipt is not proof of failure. To release an unreceipted request, add `--wait-for-expiry`: this holds the worker lock and waits a fresh full operation-validity window plus margin (currently 35 minutes), then rereads the receipt and registry. It does not trust an operator-supplied historical timestamp or submit anything. Read failures leave the request unresolved. Do not manually clear `in_progress` based solely on an unused registry reading.

Reopen setup only after no `in_progress` rows remain in either registry. Reserved apps enable in managed mode by replacing the placeholder signer; direct self-managed enrollment is blocked until managed enablement, after which the existing OWNER-only switch remains available. Production and staging finalize independently.
