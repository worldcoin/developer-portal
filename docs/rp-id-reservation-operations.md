# RP ID reservation operations

This is a manual campaign for an explicit cohort, not an ongoing worker. Deployment does not authorize a scan or transaction. Keep the six-column `rp_id_backfill` worklist permanently; it is needed for later activation. Do not rescan, refresh, prune, or truncate a successfully initialized worklist.

## Prepare

1. Deploy the migration, Hasura metadata, and compatible Portal code.
2. Set `RP_SETUP_PAUSED=true` on **every serving instance**. Confirm dashboard registration, MCP configuration, direct self-managed setup, and registration retries are paused. Enabled apps' proof and verification paths and normal maintenance continue to work.
3. Establish that every previously admitted setup handler has stopped submitting, and every earlier setup transaction has finished or can no longer execute. A completed HTTP response, a missing pending database row, or a missing receipt does not establish this. If anything remains uncertain, keep setup paused and resolve that blocker before reserving. There is no automatic drain timer.
4. Configure the existing primary/staging RP Registry, Temporal RPC, Safe, and KMS settings. Set `RP_REGISTRY_MANAGER_KMS_KEY_ID` to the shared Portal manager. The two registry addresses must be distinct. Configure `RP_BACKFILL_DATABASE_URL` as a direct Postgres session connection, not a transaction pooler. The operator identity needs table access and advisory locks. Verify the Safe's existing registration-fee allowance/funding and Temporal sponsorship configuration. These are Portal-operated sponsored transactions; developers are not asked to pay gas.

Commands run from `web/`, using the operator's explicitly supplied environment. `--conditions=react-server` enables the existing server-only helpers in this standalone process. Do not point local validation at deployed services.

## Scan once

Choose and record one UTC cutoff in the operator's existing change record. The cutoff is not stored in the six-column table. The scan may run while pause/drain is being established.

```sh
NODE_OPTIONS=--conditions=react-server pnpm exec tsx scripts/rp-id-backfill.ts scan --cutoff 2026-09-01T00:00:00Z
```

The date above is an example, not an approved campaign cutoff. Each required read is attempted once. Only after all reads succeed does one atomic insert write the complete cohort, including soft-deleted apps. Duplicate RP IDs or any insertion failure roll back that insert. A failed scan can be invoked again with the same cutoff. An empty cohort is reported as uninitialized/no work. A populated worklist rejects another scan.

## Reserve

Only after independently verifying both deployment-wide pause and drain:

```sh
RP_SETUP_PAUSED=true NODE_OPTIONS=--conditions=react-server pnpm exec tsx scripts/rp-id-backfill.ts reserve --confirm-setup-paused --confirm-setup-drained
```

The flags attest to those checks; the command cannot inspect other serving processes or prove that earlier transactions are dead.

Production runs before staging, in stable batches of at most 100. Each native `registerMany` operation uses the shared manager, burn-address placeholder signer `0x000000000000000000000000000000000000dEaD`, and empty domains. Gas limits are estimated for execution capacity; the existing sponsored fee settings remain in use. Preparation failures print the error and leave the batch unused. A definite simulation revert gets one reread to classify the IDs, because no operation has been broadcast; this prevents a previously claimed ID from blocking that batch on every later manual pass. Failed rereads leave it unused. Resolve preparation errors before another manual pass.

Each batch's receipt-queryable EntryPoint v0.7 request hash is committed before broadcasting. A submission waits at most 120 seconds for its receipt. Unknown responses and failed verification remain `in_progress`. The command advances to later batches; it never automatically resends an operation or reselects an attempted ID in that invocation. It stops new submissions on tracking or lock failure. It never creates normal registrations or enables World ID 4.0.

The final stdout report covers the entire table, including earlier unresolved requests:

- `complete`: no unresolved requests or eligible unused IDs; setup can reopen.
- `incomplete`: no unresolved requests, but eligible unused IDs remain. Choose another manual pass or reopen knowing those IDs remain unprotected.
- `unresolved`: keep setup paused and investigate the printed hashes. Do not reopen while any reservation request remains unresolved.
- `no_work`: the worklist has not been initialized.

Rows with an ordinary `rp_registration` are excluded from eligible work, regardless of app deletion or registration mode/status. `claimed_by_other` does not establish malicious ownership; it needs separate support follow-up and does not block closeout.

## Exceptional manual investigation

Use the saved hash to inspect the receipt and both relevant chain and Portal records. A missing receipt or an uninitialized registry reading alone is not proof of failure. If the operation may still execute, leave its status/hash intact, do not resubmit it, and keep setup paused.

Record an established outcome in one SQL transaction after taking `SELECT pg_advisory_xact_lock(824701)`. Scan and reserve hold the same session lock, and the table's write trigger takes that lock too. Update only the affected registry, clearing its request ID only when moving out of `in_progress`. Unknown outcomes remain unchanged. Never delete the worklist.

## Later activation

After the operator reopens setup, the existing authorized dashboard/MCP managed setup flow activates reservations. Production and staging progress independently. Pending registrations contain the real signer and shared manager before submission; hashes are recorded before sending. Status reads confirm trusted manager/signer state or a failed receipt. No row-age timeout makes an uncertain activation retryable. A pending record with no hash after interruption requires manual investigation; it is not silently discarded.

Only a known failed activation can use the existing manual retry action. Deleted apps cannot activate or retry, while their reserved IDs remain protected. Restored apps can use their reservation. Direct self-managed enrollment is blocked while either registry is reserved or unresolved; the existing team-OWNER switch is available after managed activation. Rotate, toggle, and mode-switch operations cannot overwrite an unresolved activation; database claims also exclude concurrent staging retries.
