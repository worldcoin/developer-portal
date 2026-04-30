# MCP staging test runbook

End-to-end smoke test of the World ID MCP endpoint
(`web/api/mcp/index.ts`) against staging before promoting to prod.
Goal: build and submit both an external World ID app and a Mini App
through the MCP only — no developer-portal UI interaction at any step.

## 0. Prereqs

- Access to the staging dev portal UI (admin/owner on at least one team)
  so you can mint an API key.
- **The team must be enabled for World ID 4.0** in staging.
  `configure_world_id` runs the same managed registration pipeline as
  the dashboard (KMS manager key + on-chain `registerRp` TX), and the
  pipeline gates on `isWorldId40EnabledServer(team_id)`. If the flag
  is off the call returns `-32004` with `data.reason: "feature_not_enabled"`.
- A Claude Code (or other MCP client) install you can configure with a
  custom server.
- Datadog access for the dev-portal service so you can watch
  `portal_*` events fire while running scenarios.
- Public-HTTPS image URLs (or local PNG/JPEG files ≤500KB) for the
  required app store images: **logo** (always), **content_card** (Mini
  Apps only), and **showcase_1** (always — schema requires ≥1 showcase
  per locale).

Staging URLs:

- Dev portal: `https://staging-developer.worldcoin.org`
- MCP endpoint: `https://staging-developer.worldcoin.org/api/mcp`

## 1. Mint an API key in staging

1. Sign in to the staging dev portal as an admin/owner.
2. Create a fresh team (intentionally **no apps yet** — the agent will
   create them).
3. Team settings → API keys → "Create API key" → copy the
   `api_<base64>` token. **Do not commit or paste it into chat.**

## 2. Wire the MCP into your agent

For Claude Code, easiest is the CLI:

```bash
claude mcp add --transport http --scope user world-portal-staging \
  https://staging-developer.worldcoin.org/api/mcp \
  --header "Authorization: Bearer api_YOURKEY"
```

`--scope user` makes the registration follow you across project
directories. Verify:

```bash
claude mcp list
```

You should see `world-portal-staging ... ✓ Connected`. Restart
Claude Code, then in a fresh chat run:

```
/mcp
```

Expected: 11 tools — `get_team_context`, `get_app_config`, `create_app`,
`configure_world_id`, `get_world_id_signing_key`,
`get_world_id_registration_status`, `rotate_world_id_signing_key`,
`create_world_id_action`, `configure_mini_app`, `upload_app_image`,
`submit_app_for_review`.

The MCP returns a skill guide via `initialize.instructions` — the agent
should pick this up automatically and follow the canonical flows below.
The same content lives at `web/api/mcp/SKILL.md`; if you'd rather load
it as a Claude Code local skill (e.g. for offline reference), copy it
into `~/.claude/skills/world-id-mcp/SKILL.md` — the YAML frontmatter
is already in place.

## What submission actually requires

`submit_app_for_review` runs the same Yup completeness check as the
dashboard. Both scenarios below assume these are set; if any is
missing, the MCP returns `-32602 Invalid tool input` with the exact
field name and the agent has to backfill before re-submitting.

**Always required (external + Mini App):**

| Field                  | Provider                                                              |
| ---------------------- | --------------------------------------------------------------------- |
| `name`                 | `create_app`                                                          |
| `logo_img_url`         | `upload_app_image { image_type: "logo" }`                             |
| `app_website_url`      | `configure_mini_app { app_website_url }`                              |
| `is_android_only`      | `configure_mini_app { is_android_only: false }` (or default)          |
| `is_for_humans_only`   | `configure_mini_app { is_for_humans_only: false }` (or default)       |
| `supported_countries`  | `configure_mini_app { supported_countries: ["us", ...] }`             |
| `supported_languages`  | `configure_mini_app { supported_languages: ["en", ...] }` — must include `"en"` |
| `description_overview` | `configure_mini_app { description_overview: "..." }` — server JSON-encodes into `description` |
| ≥1 showcase per locale | `upload_app_image { image_type: "showcase_1" }`                       |

**Mini App additionally requires:**

| Field                    | Provider                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `short_name`             | `configure_mini_app { short_name }`                                                                |
| `category`               | `configure_mini_app { category: "Other" }` (or any from `lib/categories.ts`)                       |
| `world_app_description`  | `configure_mini_app { world_app_description }` — the one-line tag line shown in app listings       |
| `content_card_image_url` | `upload_app_image { image_type: "content_card" }`                                                  |
| support contact          | `configure_mini_app { support_link: "https://..." }` _or_ `support_link: "mailto:support@..."`     |

**Image rules:** PNG or JPEG, ≤500KB each. The handler stores just the
filename (`logo_img.png`) — the dashboard reconstructs the CDN URL at
view time. Don't try to set `*_img_url` fields directly via
`configure_mini_app`; always upload through `upload_app_image`.

## 3. Scenario 1 — External World ID app, fully via MCP

Prompt your agent (substitute your own image URLs):

> Using the world-portal-staging MCP, build me an external (non-mini-app)
> World ID app called "MCP Test External". Steps:
>
> 1.  Create the app (production build, cloud verification).
> 2.  Configure World ID. The server will generate a signer wallet,
>     create a KMS manager key, and submit the on-chain registration —
>     capture the returned `signing_key.private_key`, it's one-time.
> 3.  Poll `get_world_id_registration_status` until it reports
>     `production_status: "registered"` so the on-chain TX has confirmed.
> 4.  Create an action called `verify-account`.
> 5.  Upload the logo from `https://example.com/logo.png`.
> 6.  Upload `https://example.com/screenshot.png` as `showcase_1`.
> 7.  Set the rest of the required metadata: `app_website_url`,
>     `description_overview`, `supported_countries: ["us"]`,
>     `supported_languages: ["en"]`, `is_android_only: false`,
>     `is_for_humans_only: false`.
> 8.  Submit the app for review.

Expected tool sequence:

1. `create_app` (`app_mode: "external"`, `build: "production"`,
   `verification: "cloud"`) → returns `app_id`.
2. `configure_world_id` (no args beyond `app_id`) → returns
   `signing_key.private_key` + `manager_address` + `operation_hash` +
   `status: "pending"`. **Capture the private key now.** The on-chain
   TX is in flight.
3. `get_world_id_registration_status { app_id }` until
   `production_status: "registered"` (typically a few seconds; on
   prod we also see `staging_status: "registered"`).
4. `create_world_id_action` (`action: "verify-account"`).
5. `upload_app_image` (`image_type: "logo"`).
6. `upload_app_image` (`image_type: "showcase_1"`).
7. `configure_mini_app` (with `description_overview`, `app_website_url`,
   `supported_countries`, `supported_languages`, `is_android_only`,
   `is_for_humans_only`).
8. `submit_app_for_review` (`confirm_submission: true`) → response
   `verification_status: "awaiting_review"`.

Verify in the dashboard UI: app appears, World ID is configured, signer
address matches what the agent reported, the manager address is set,
action is listed, store fields populated, logo + showcase render, app
is in `awaiting_review`.

Verify in Datadog (per `docs/runbooks/mcp-datadog-queries.md`):

```
service:developer-portal @event:app_creation @actor:mcp
service:developer-portal @event:action_creation @actor:mcp
service:developer-portal @event:app_submission @actor:mcp
```

Each fires exactly once with `@app_id` matching the new app.

## 4. Scenario 2 — Mini app, fully via MCP, with the colleague's full checklist

Prompt:

> Using world-portal-staging, build a Mini App named "MCP Test Mini",
> end to end via MCP only.
>
> 1. Create the mini app.
> 2. Configure World ID — the server generates a signer wallet, creates
>    the KMS manager key, and submits the on-chain registration.
>    Capture the returned `private_key`. Then poll
>    `get_world_id_registration_status` until `production_status` is
>    `registered`.
> 3. Upload these images (use HTTPS URLs or local files):
>    - `logo` from `https://example.com/logo.png`
>    - `content_card` from `https://example.com/card.png`
>    - `showcase_1` from `https://example.com/showcase.png`
> 4. Set store metadata + Advanced/Permissions config:
>    - `short_name: "MCPMini"`
>    - `category: "Other"`
>    - `world_app_description: "Test mini app"`
>    - `description_overview: "Built end-to-end via MCP for staging dogfood"`
>    - `app_website_url: "https://example.com"`
>    - `support_link: "mailto:test@example.com"`
>    - `supported_countries: ["us"]`, `supported_languages: ["en"]`
>    - `is_android_only: false`, `is_for_humans_only: false`
>    - Advanced: `max_notifications_per_day: "2"`,
>      `contracts: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]`,
>      `permit2_tokens: ["0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"]`,
>      `can_import_all_contacts: true`, `can_use_attestation: true`.
> 5. Submit for review. The whole flow should not require me to open
>    the developer portal UI.

Expected:

- `create_app` (`app_mode: "mini-app"`) → returns `app_id`.
- `configure_world_id` → returns the one-time `private_key`,
  `manager_address`, `operation_hash`, `status: "pending"`.
- `get_world_id_registration_status` polled until
  `production_status: "registered"` (typically a few seconds).
- 3× `upload_app_image` (logo + content_card + showcase_1) — each
  returns `committed: true` once the metadata patch lands.
- `configure_mini_app` accepts every store-metadata and advanced field
  listed above in a single call (the server JSON-encodes
  `description_overview` into `app_metadata.description` for you).
- `submit_app_for_review` (`confirm_submission: true`) → returns
  `verification_status: "awaiting_review"`.

Verify in the dashboard UI:

- App store metadata renders with the values above.
- Logo, content card, and screenshot images all load.
- Configuration → Advanced shows the contracts, permit2 tokens, and
  `2 notifications / day`.
- Permissions toggles for "Import contacts" and "Attestation" are on.

### Optional: rotate the signing key

If you also want to dogfood `rotate_world_id_signing_key`, prompt:

> Rotate the World ID signing key for `MCP Test Mini`. Capture the new
> private key. Then poll `get_world_id_registration_status` until the
> on-chain rotation confirms.

This submits an on-chain `updateRp` TX, returns a new
`signing_key.private_key`, and flips the RP status to `pending` until
the bundler confirms. Self-managed RPs (none in these scenarios, but
relevant for any pre-existing apps) get `-32004` with
`data.reason: "self_managed_mode"` — those have to be rotated by the
developer themselves.

## 5. Codex security review

In the GitHub PR that carries this work, comment:

```
@codex review
```

Wait for the Codex bot's report. Triage:

- **P0 / P1**: must be addressed before merge — fix or push back with a
  comment explaining why.
- **P2**: judgment call. If it's tightening an unlikely edge case and
  staging tests pass, it can land in a follow-up.

Resolve each Codex review thread once handled.

## 6. Sign-off checklist

- [ ] All 11 tools visible in `tools/list`
- [ ] Scenario 1: external app reached `awaiting_review` via MCP only —
      no UI interaction required. RP status confirmed `registered` on
      both production and staging (where applicable) registry contracts
      via `get_world_id_registration_status`.
- [ ] Scenario 2: mini app reached `awaiting_review` via MCP only, with
      logo + content_card + showcase_1 images uploaded and visible, and
      contracts / permit2 / notification cap / attestation / contacts
      all reflected in the dashboard.
- [ ] (Optional) `rotate_world_id_signing_key` produced a new private
      key and the on-chain rotation confirmed.
- [ ] Datadog shows the expected `portal_*` events per scenario, all
      tagged `@actor:mcp`.
- [ ] No `Unhandled MCP error` in Datadog over the test window.
- [ ] Codex review clean (or all flags accepted).

## Rollback

If anything goes sideways in staging and you need to disable the MCP
fast: revert the App Router shim at `web/app/api/mcp/route.ts` so the
endpoint 404s. The deeper handler can stay.

## Known limitations

- `configure_world_id` is **managed-only** and **asynchronous**. The
  call returns `status: "pending"` once the on-chain `registerRp` TX
  has been submitted to the bundler; the agent must poll
  `get_world_id_registration_status` until it reads `registered`
  before relying on the RP for verifications. There is no MCP path
  to create a self-managed RP — that flow only exists in the
  dashboard.
- `rotate_world_id_signing_key` runs the same managed-mode pipeline
  (KMS-signed `updateRp` TX). Self-managed RPs (e.g. legacy
  registrations not created via MCP) return `-32004` with
  `data.reason: "self_managed_mode"` — they have to be rotated by the
  developer themselves. After rotation, the agent should re-poll
  `get_world_id_registration_status` until the new signer reflects
  on-chain.
- `configure_world_id` and `rotate_world_id_signing_key` both gate on
  the team having World ID 4.0 enabled. A disabled team gets `-32004`
  with `data.reason: "feature_not_enabled"`.
- Notification limits accept the string-only enum `"0" | "1" | "2" |
  "unlimited"` (the schema is string-only because mixed-type `oneOf`
  fails strict JSON schema validators in some MCP clients). The handler
  parses the integer server-side, and translates `"unlimited"` to
  `is_allowed_unlimited_notifications: true` + `max_notifications_per_day: 0`
  (matching the dashboard's behavior).
- `configure_mini_app` accepts `description_overview`,
  `description_how_it_works`, `description_connect` as separate
  inputs; the server JSON-encodes them into `app_metadata.description`.
  Partial updates preserve the sub-fields the caller didn't pass — no
  silent data loss.
- Image uploads are capped at 500KB and limited to PNG / JPEG. The
  server detects the format from magic bytes (no `content_type`
  parameter). For hosted images the server fetches `source_url` over
  HTTPS using a pinned-IP `https.request` with no redirect-following,
  so an SSRF / DNS-rebinding payload can't reach internal hosts. For
  local files the agent base64-encodes via Bash and passes
  `image_base64`. Bytes go through the helper at
  `web/api/helpers/app-image-storage.ts`. Per-API-key cap: **60
  uploads/minute, 500/day** — overflow returns `-32029` with
  `data.retry_after_seconds`.
- Image upload is atomic: if the S3 PUT succeeds but the metadata
  patch then fails, the server best-effort deletes the just-written
  S3 object and returns `-32603` with `data: { committed: false }`.
  Retries are idempotent (deterministic key + bytes), so the agent
  just calls the same tool again. Successful responses include
  `committed: true`.
