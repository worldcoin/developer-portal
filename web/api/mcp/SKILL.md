---
name: world-id-mcp
description: Build, configure, and submit World ID 4.0 apps and Mini Apps via the World developer portal. Use whenever the user wants to ship something to the World app store, set up sign-in-with-World-ID, or manage signing keys / actions for an existing app.
---

# World ID developer portal MCP

This MCP authenticates with a developer-portal team API key and exposes 10 tools for the full app lifecycle. Always use `get_team_context` first if the user hasn't given you an `app_id` — it returns the team and any existing apps so you can pick or confirm.

## Tool reference

| Tool                               | Purpose                                                                                    | Key inputs                                                                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `get_team_context`                 | List the team's apps + status                                                              | (none)                                                                                                                                                             |
| `get_app_config`                   | Snapshot of an app: World ID config, store metadata, mini-app settings                     | `app_id`                                                                                                                                                           |
| `create_app`                       | Create a new app                                                                           | `name`; optional `app_mode` (`external` \| `mini-app`), `build` (`production` \| `staging`), `verification` (`cloud` \| `on-chain`), `category`, `integration_url` |
| `configure_world_id`               | Create the World ID 4.0 RP and (optionally) generate a signing key. **Self-managed only.** | `app_id`; optional `signer_private_key`, `generate_signing_key`                                                                                                    |
| `get_world_id_signing_key`         | Read the signer address for an app. Private key is never returned here.                    | `app_id`; optional `rotate_if_unavailable`                                                                                                                         |
| `rotate_world_id_signing_key`      | Generate a new World ID signing key. Returns the private key once.                         | `app_id`; optional `signer_private_key`                                                                                                                            |
| `get_world_id_registration_status` | Sync the on-chain registry status for an RP                                                | `app_id`                                                                                                                                                           |
| `create_world_id_action`           | Create / update a v4 action (the thing you `verify` against)                               | `app_id`, `action`; optional `description`, `environment`                                                                                                          |
| `configure_mini_app`               | Update mini-app store metadata + Advanced/Permissions config                               | `app_id`; many optional fields, see below                                                                                                                          |
| `submit_app_for_review`            | Submit an unverified app for review. Requires `confirm_submission: true`.                  | `app_id`, `confirm_submission`; optional `changelog`, `is_developer_allow_listing`                                                                                 |

## Canonical flows

### A. Build an external (non-mini) World ID app end-to-end

```
1. create_app                  { name, app_mode: "external", build: "production", verification: "cloud" }
2. configure_world_id          { app_id, generate_signing_key: true }      ← capture private_key, it's one-time
3. create_world_id_action      { app_id, action: "verify-account" }
4. submit_app_for_review       { app_id, confirm_submission: true }
```

After step 2, store the returned `private_key` in the developer's app environment as `WORLD_ID_PRIVATE_KEY` (or whatever their app expects). The portal does not retain it.

### B. Build a Mini App with full Advanced settings

```
1. create_app                  { name, app_mode: "mini-app" }
2. configure_world_id          { app_id, generate_signing_key: true }      ← only if the mini app verifies proofs itself
3. configure_mini_app          { app_id, ...store metadata, ...advanced config }
4. submit_app_for_review       { app_id, confirm_submission: true }
```

`configure_mini_app` accepts both store metadata (logo, screenshots, descriptions, supported countries/languages, ...) **and** Advanced/Permissions config in a single call:

- `contracts: string[]` — Worldchain contract addresses the mini app calls
- `permit2_tokens: string[]` — token addresses approved for Permit2 signing
- `whitelisted_addresses: string[]` — wallets allowed to interact (pass `[]` to disable)
- `associated_domains: string[]` — universal-link domains
- `can_import_all_contacts`, `can_use_attestation` — capability toggles
- `max_notifications_per_day`: `0 | 1 | 2 | "unlimited"` — notification cap (`"unlimited"` automatically sets `is_allowed_unlimited_notifications: true`)

All address arrays are validated as `0x` + 40 hex chars; URLs as `https://...`; reject any element with an embedded comma.

### C. Rotate a leaked signing key

```
1. rotate_world_id_signing_key { app_id }
```

Returns a fresh `private_key` once. Updates the on-portal `signer_address`. **Only works for self-managed RPs.** If the registration is platform-managed, the call fails and the user has to rotate from the dashboard UI (it requires an on-chain signer-update transaction the API key path can't perform).

### D. Read-only inspection

```
get_team_context                    ← what apps exist, their status
get_app_config         { app_id }   ← world ID config, store metadata, actions
get_world_id_signing_key { app_id } ← signer address (no private key)
get_world_id_registration_status { app_id }  ← on-chain registry sync
```

## Pitfalls and constraints

- **Managed mode is dashboard-only.** `configure_world_id` and rotation only work in self-managed mode. If the user wants the platform to handle on-chain registration, point them at the dashboard.
- **Private keys are returned once.** If the user loses the value from `configure_world_id` / `rotate_world_id_signing_key`, they must rotate again. The portal does not store private keys.
- **Submission preconditions are strict.** `submit_app_for_review` runs the same Yup completeness check as the dashboard; missing `logo_img_url`, `app_website_url`, English locale, etc. will return a `-32602` with the exact validation errors. Fix and retry.
- **Staging apps cannot be submitted for review.** `create_app` with `build: "staging"` is for sandbox use; switch to `build: "production"` (a different app) for store submission.
- **`is_developer_allow_listing` is optional on submit.** If you omit it, the existing value on `app_metadata` is preserved — the MCP will not silently un-list a previously listed app.
- **Don't re-run `configure_world_id` on an already-configured app.** It returns the existing registration without rotating. Use `rotate_world_id_signing_key` if the user actually wants a new key.

## When in doubt

- `get_team_context` first to see what's already there. Reusing an existing app is almost always cheaper than creating a duplicate.
- Echo the `app_id` and `signer_address` you're operating on to the user before destructive actions (rotate, submit).
- Treat any `-32602` (invalid params) error as user-fixable input; surface the validation errors verbatim. Treat `-32603` (internal) as something to retry once and then escalate.
