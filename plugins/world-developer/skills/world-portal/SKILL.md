---
name: world-portal
description: Inspect or change World Developer Portal apps, RP/actions, Mini App configuration, images, and review submissions. Use for account-specific Portal work or configuration needed by a requested integration; documentation questions need no connection.
---

# World Developer Portal

Use this plugin's `world-portal` MCP adapter. It forwards supported operations to the official Portal endpoint and stores generated private signing keys locally before returning only a file reference. Do not bypass it with an older direct Portal registration for secret-producing calls.

## Connection and target

Use `portal_connection_status` to diagnose missing credentials, rejected credentials, transport errors, or schema drift when connecting or troubleshooting. Read [connection.md](references/connection.md) when setup is needed. Continue independent docs/code work when Portal access is unavailable.

The status response also reports optional tools present on the deployed server. `run_test_verification` may be absent during rollout; existing Portal operations remain available. For that tool's payload/direct modes and limitations, read [synthetic verification](../world-build/references/test-verification.md).

If the exact app is unknown, get team context and match it to the repository's identifiers. Ask only when multiple candidates remain plausible. Read `get_app_config` before changing an existing app; preserve unrelated draft/approved fields. Read or diagnosis requests do not authorize mutation. An explicit configure/build request authorizes the ordinary changes needed for its resolved target.

## Operations

Live tool schemas define accepted arguments. The adapter checks them against the bundled contract before writes and reports drift instead of guessing. Current app creation creates **production apps only**. Action `environment` is separate; pass it deliberately. SDK sandbox is a separate client setting. Do not invent a staging app creation parameter.

For configuration or rotation that produces a signing key, the adapter reserves an owner-only file before the remote call, stores the response secret there, and returns a `secret_file` reference. Read [signing-keys.md](references/signing-keys.md) before provisioning or rotating. `get_world_id_signing_key` is read-only through this adapter; rotation is an explicit separate operation.

After an uncertain create/configure/upload result, inspect actual state before retrying. Never automatically rotate to recover from a failed key handoff. Check asynchronous RP registration until confirmed or accurately report it pending. Re-read metadata after changes.

For review preparation, retrieve current requirements with world-docs, inspect the resulting draft/assets and present the target. Set `confirm_submission: true` only for an authorized submission of that state. Do not ask again when the exact action was already authorized and nothing material changed. Submission acceptance is not approval by reviewers.

Return changed identifiers, resulting state, and what was verified. Do not print secret files, key values, proof payloads, or credentials.
