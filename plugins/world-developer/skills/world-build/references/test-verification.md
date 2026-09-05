# Synthetic World ID backend tests

Use this only for a requested implementation/test workflow. Minting a test payload writes a short-lived server record; direct verification and backend forwarding can write staging actions/nullifiers. A docs question or diagnosis alone does not authorize those changes.

## Discover and prepare

Call `portal_connection_status`. If `unavailable_optional_tools` includes `run_test_verification`, use the documented SDK/device flow and report this deployment limitation. Do not fabricate a payload, bypass the adapter, or assume the REST twin exists on an older deployment.

Resolve the team's active, non-archived **production app**, its registered primary RP, and the action. The synthetic payload itself uses **staging**, independently of the app's production status. A failed staging registry mirror does not block these synthetic tests; genuine staging proofs still need the correct on-chain registration.

## Exercise the developer's backend

1. Call `run_test_verification` with `app_id`, `action`, an `outcome`, and `direct: false` (the default).
2. Send the returned `payload` **unchanged** through the developer's intended test backend, using the envelope that backend actually expects. The backend should forward the proof to `verify_url`.
3. Assert the backend response and protected side effects for `success`, `expired`, and `invalid_proof`. Keep `test: true` in recorded results and do not report simulated chain verdicts as cryptographically proven identity.
4. Reuse an unexpired payload to check the application's own replay/claim semantics. Portal verification can return HTTP 200 again with nullifier reuse; there is no v4 action use counter. A one-time-claim application must enforce its own atomic uniqueness. Repeatable sign-in has different semantics.

The payload is digest-bound to its verifier inputs and expires after ten minutes. Changing the action, nonce, signal, proof or nullifier invalidates that binding. Current inputs do **not** accept a custom signal, RP ID, destination URL, environment, or use count. `signal_hash` is fixed to zero; if the application's real test route requires a nonzero signal or an independently issued challenge, this interface cannot fully exercise that path. Do not weaken the application's validation to make the test pass. Report the unsupported case and retain the real SDK/device test.

Session proofs, invalid RP signatures and below-sybil-threshold scenarios are not supported by this interface. Do not substitute a different error and claim they were covered.

## Portal-only diagnostics

`direct: true` calls the Portal verifier and returns `direct_result: { status, body }`. It does not test the developer's backend. HTTP 400 for an intentionally expired or invalid proof is an expected test result, not a failed MCP connection. A timeout or malformed response has an unknown outcome and may already have written staging state; inspect that state before any retry. The adapter retains the safe synthetic payload and error details for diagnosis.

Rate limits are shared between MCP and REST: 30 requests per minute and 500 per day per team API key. Honor returned retry timing. Synthetic success does not validate RP signing, UI/native transport, credential issuance, cryptographic proof generation, or production-environment acceptance.
