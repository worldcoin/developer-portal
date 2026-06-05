---
name: world-id-mcp
description: Build, configure, and submit World ID 4.0 apps and Mini Apps via the World developer portal. Use whenever the user wants to ship something to the World app store, set up sign-in-with-World-ID, or manage signing keys / actions for an existing app.
---

# World ID developer portal MCP

This MCP authenticates with a developer-portal team API key and exposes 11 tools for the full app lifecycle. Always use `get_team_context` first if the user hasn't given you an `app_id` — it returns the team and any existing apps so you can pick or confirm.

## Tool reference

| Tool                               | Purpose                                                                                                       | Key inputs                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_team_context`                 | List the team's apps + status                                                                                 | (none)                                                                                                                                                   |
| `get_app_config`                   | Snapshot of an app: World ID config, store metadata, mini-app settings                                        | `app_id`                                                                                                                                                 |
| `create_app`                       | Create a new production app                                                                                   | `name`; optional `app_mode` (`external` \| `mini-app`), `verification` (`cloud` \| `on-chain`), `category`, `integration_url`                            |
| `configure_world_id`               | Create a managed World ID 4.0 RP for the app: KMS manager key, on-chain registration, signer wallet           | `app_id`; optional `signer_private_key` (else the server generates one and returns it once)                                                              |
| `get_world_id_signing_key`         | Read the signer address for an app. Private key is never returned here.                                       | `app_id`; optional `rotate_if_unavailable`                                                                                                               |
| `rotate_world_id_signing_key`      | Generate a new World ID signing key. Returns the private key once.                                            | `app_id`; optional `signer_private_key`                                                                                                                  |
| `get_world_id_registration_status` | Sync the on-chain registry status for an RP                                                                   | `app_id`                                                                                                                                                 |
| `create_world_id_action`           | Create / update a v4 action (the thing you `verify` against)                                                  | `app_id`, `action`; optional `description`, `environment`                                                                                                |
| `configure_mini_app`               | Update mini-app store metadata + Advanced/Permissions config                                                  | `app_id`; many optional fields, see below                                                                                                                |
| `upload_app_image`                 | Upload an app image (logo, hero, content_card, meta_tag, showcase_1/2/3) and patch the matching `*_url` field | `app_id`, `image_type`, one of `source_url` (https only, public addr, no redirects) / `image_base64`. Format detected from magic bytes. PNG/JPEG ≤500KB. |
| `submit_app_for_review`            | Submit an unverified app for review. Requires `confirm_submission: true`.                                     | `app_id`, `confirm_submission`; optional `changelog`, `is_developer_allow_listing`                                                                       |

## Canonical flows

### A. Build an external (non-mini) World ID app end-to-end

```
1. create_app             { name, app_mode: "external", verification: "cloud" }
2. configure_world_id     { app_id, generate_signing_key: true }      ← capture private_key, it's one-time
3. create_world_id_action { app_id, action: "verify-account" }
4. upload_app_image       { app_id, image_type: "logo",       source_url }   ← required: logo_img_url
5. upload_app_image       { app_id, image_type: "showcase_1", source_url }   ← required: ≥1 showcase per locale
6. configure_mini_app     {
                            app_id,
                            app_website_url:     "https://your-app.example",
                            description_overview: "What the app does, in one paragraph.",
                            supported_countries: ["us"],
                            supported_languages: ["en"],
                            is_android_only:     false,
                            is_for_humans_only:  false,
                          }
7. submit_app_for_review  { app_id, confirm_submission: true }
```

After step 2, store the returned `private_key` in the developer's app environment as `WORLD_ID_PRIVATE_KEY` (or whatever their app expects). The portal does not retain it.

### B. Build a Mini App with full Advanced settings

```
1. create_app             { name, app_mode: "mini-app" }
2. configure_world_id     { app_id, generate_signing_key: true }      ← only if the mini app verifies proofs itself
3. upload_app_image       { app_id, image_type: "logo",         source_url }   ← required
4. upload_app_image       { app_id, image_type: "content_card", source_url }   ← required for Mini Apps
5. upload_app_image       { app_id, image_type: "showcase_1",   source_url }   ← required: ≥1 showcase per locale
6. configure_mini_app     {
                            app_id,
                            short_name:           "MyApp",
                            category:             "Other",
                            world_app_description: "One-line tag line",
                            description_overview:  "What the mini app does, in one paragraph.",
                            app_website_url:      "https://your-app.example",
                            support_link:         "mailto:support@your-app.example",  // or "https://your-app.example/support"
                            supported_countries:  ["us"],
                            supported_languages:  ["en"],
                            is_android_only:      false,
                            is_for_humans_only:   false,
                            // optional Advanced fields:
                            contracts:            ["0x..."],
                            permit2_tokens:       ["0x..."],
                            max_notifications_per_day: "2",
                          }
7. submit_app_for_review  { app_id, confirm_submission: true }
```

`configure_mini_app` accepts store metadata, Advanced/Permissions config, and the App Store description in a single call:

If an app already has an approved version and no current draft, `configure_mini_app` and `upload_app_image` first create an `unverified` draft copied from the approved metadata, then apply the change. Successful responses include `draft_created: true` when that happens.

- `description_overview: string` — required for review; the human-readable overview shown to users in the app store. Pass it as a plain string here; the server JSON-encodes it (with `description_how_it_works` and `description_connect`) into the underlying `app_metadata.description` column for you. Don't pre-construct the JSON yourself.
- `description_how_it_works`, `description_connect` — optional companion sections (also stored inside the encoded description JSON).
- `contracts: string[]` — Worldchain contract addresses the mini app calls
- `permit2_tokens: string[]` — token addresses approved for Permit2 signing
- `whitelisted_addresses: string[]` — wallets allowed to interact (pass `[]` to disable)
- `associated_domains: string[]` — universal-link domains
- `can_import_all_contacts`, `can_use_attestation` — capability toggles
- `max_notifications_per_day`: `"0" | "1" | "2" | "unlimited"` — notification cap (string-only enum so MCP clients with strict JSON schema validators accept all values; `"unlimited"` automatically sets `is_allowed_unlimited_notifications: true`)

All address arrays are validated as `0x` + 40 hex chars; URLs as `https://...`; reject any element with an embedded comma.

### C. Upload images (logo / hero / content_card / meta_tag / showcase_N)

`upload_app_image` accepts the bytes in two ways:

- **`source_url`** — public HTTPS URL the server fetches (best for URLs the user already gave you, or staging asset CDNs)
- **`image_base64`** — base64-encoded bytes (use for local files)

When the user gives you a **local file path**, base64-encode it client-side via Bash and pass through:

```
# in Bash:
base64 -i ./logo.png
# pipe / capture the output, then call upload_app_image:
upload_app_image { app_id, image_type: "logo", image_base64: "<that string>" }
```

You don't need to specify the format — the server inspects the magic bytes and stores the file as PNG or JPEG accordingly. Anything that isn't a real PNG/JPEG (or anything >500KB) is rejected with `-32602`.

`source_url` is fetched server-side over HTTPS only, must resolve to a public address (loopback / private / link-local rejected), and **redirects are not followed** — if the user gives you a URL that redirects, resolve the final URL client-side first.

The server uploads the bytes to S3 and patches `app_metadata.{logo_img_url|hero_image_url|content_card_image_url|meta_tag_image_url|showcase_img_urls[N]}` in one call. No follow-up `configure_mini_app` is needed for images. Successful responses include `committed: true`.

If the metadata patch fails after the S3 upload (rare — typically a transient Hasura error), the server best-effort deletes the S3 object and returns `-32603` with `data: { committed: false }`. Retries are idempotent, so just call the same tool again.

`upload_app_image` is rate-limited per API key: **60 uploads/minute, 500/day**. Hitting the cap returns `-32029` with `data.retry_after_seconds`.

Image bytes flow through your context as base64 — fine for typical app icons (<100KB), wasteful for very large screenshots. Prefer `source_url` whenever the image is already on the web.

### D. Rotate a leaked signing key

```
1. rotate_world_id_signing_key { app_id }
```

Returns a fresh `private_key` once. Submits the on-chain `updateRp` transaction (primary registry, plus best-effort staging on production deployments) and updates `app_metadata.signer_address`. The status flips to `pending` until the on-chain TX confirms; poll `status_endpoint` to watch the transition back to `registered`. Self-managed RPs (e.g. legacy registrations not created via MCP) return `-32004` with `data.reason: "self_managed_mode"` — those have to be rotated by the developer themselves.

### E. Read-only inspection

```
get_team_context                    ← what apps exist, their status
get_app_config         { app_id }   ← world ID config, store metadata, actions
get_world_id_signing_key { app_id } ← signer address (no private key)
get_world_id_registration_status { app_id }  ← on-chain registry sync
```

## Pitfalls and constraints

- **`configure_world_id` is asynchronous.** The on-chain registration is submitted to the bundler and returns immediately with `status: "pending"` and an `operation_hash`. Watch `status_endpoint` until it returns `production_status: "registered"` before relying on the RP for verifications.
- **`configure_world_id` requires the team to be enabled for World ID 4.0.** A team without the feature flag gets `-32004` with `data.reason: "feature_not_enabled"`. Surface that to the user and point them at the dashboard for enrollment.
- **Private keys are returned once.** If the user loses the value from `configure_world_id` / `rotate_world_id_signing_key`, they must rotate again. The portal does not store private keys.
- **Submission preconditions are strict.** `submit_app_for_review` runs the same Yup completeness check as the dashboard. The full required set:
  - **Always required**: `name`, `logo_img_url`, `app_website_url`, `is_android_only`, `is_for_humans_only`, `supported_countries` (≥1), `supported_languages` (must include `"en"`), `description_overview` (encoded into the description JSON), and at least one entry in `showcase_img_urls` for the English locale.
  - **Mini-app additional**: `short_name`, `category`, `world_app_description` (the tag line), `content_card_image_url`, and either `support_link` (HTTPS URL) or `support_link` set to a `mailto:` URL.
  - On failure the server returns a `-32602` with the exact field path; surface that to the user verbatim.
- **Use `upload_app_image`, not `configure_mini_app`, for image fields.** Image fields store filenames (`logo_img.png`), not full URLs — the dashboard reconstructs the CDN URL at view time. `upload_app_image` handles the S3 upload and stores the right filename automatically. Passing `logo_img_url`, `hero_image_url`, `meta_tag_image_url`, `showcase_img_urls`, or `content_card_image_url` to `configure_mini_app` is rejected with `-32602`.
- **Draft creation is edit-driven.** `configure_mini_app` and `upload_app_image` can create a draft from an approved app when no draft exists. `submit_app_for_review` does not create a draft by itself; make at least one metadata or image change first.
- **MCP-created apps are production apps.** The MCP no longer exposes staging app creation; use the dashboard or existing internal tooling for legacy staging-only sandbox flows.
- **`is_developer_allow_listing` is optional on submit.** If you omit it, the existing value on `app_metadata` is preserved — the MCP will not silently un-list a previously listed app.
- **Don't re-run `configure_world_id` on an already-configured app.** It returns the existing registration without rotating. Use `rotate_world_id_signing_key` if the user actually wants a new key.

## When in doubt

- `get_team_context` first to see what's already there. Reusing an existing app is almost always cheaper than creating a duplicate.
- Echo the `app_id` and `signer_address` you're operating on to the user before destructive actions (rotate, submit).
- Treat any `-32602` (invalid params) error as user-fixable input; surface the validation errors verbatim. Treat `-32603` (internal) as something to retry once and then escalate.
