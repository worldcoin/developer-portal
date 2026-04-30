# MCP staging test runbook

End-to-end smoke test of the World ID MCP endpoint
(`web/api/mcp/index.ts`) against staging before promoting to prod.
Goal: build and submit both an external World ID app and a Mini App
through the MCP only — no developer-portal UI interaction at any step.

## 0. Prereqs

- Access to the staging dev portal UI (admin/owner on at least one team)
  so you can mint an API key.
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
> 2.  Configure World ID in self-managed mode and generate a signing
>     key — capture the private key, it's one-time only.
> 3.  Create an action called `verify-account`.
> 4.  Upload the logo from `https://example.com/logo.png` as the logo.
> 5.  Upload `https://example.com/screenshot.png` as `showcase_1`.
> 6.  Set the rest of the required metadata: `app_website_url`,
>     `description_overview`, `supported_countries: ["us"]`,
>     `supported_languages: ["en"]`, `is_android_only: false`,
>     `is_for_humans_only: false`.
> 7.  Submit the app for review.

Expected tool sequence:

1. `create_app` (`app_mode: "external"`, `build: "production"`,
   `verification: "cloud"`) → returns `app_id`.
2. `configure_world_id` → returns `signing_key.private_key` (capture).
3. `create_world_id_action` (`action: "verify-account"`).
4. `upload_app_image` (`image_type: "logo"`).
5. `upload_app_image` (`image_type: "showcase_1"`).
6. `configure_mini_app` (with the metadata above — `description_overview`,
   `app_website_url`, `supported_countries`, `supported_languages`,
   `is_android_only`, `is_for_humans_only`).
7. `submit_app_for_review` (`confirm_submission: true`) → response
   `verification_status: "awaiting_review"`.

Verify in the dashboard UI: app appears, World ID is configured, signer
address matches what the agent reported, action is listed, store fields
populated, logo + showcase render, app is in `awaiting_review`.

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
> 2. Configure World ID in self-managed mode and generate a signing key.
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
>    - Advanced: `max_notifications_per_day: 2`,
>      `contracts: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]`,
>      `permit2_tokens: ["0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"]`,
>      `can_import_all_contacts: true`, `can_use_attestation: true`.
> 5. Submit for review. The whole flow should not require me to open
>    the developer portal UI.

Expected:

- `create_app` (`app_mode: "mini-app"`) → returns `app_id`.
- `configure_world_id` (capture the private key).
- 3× `upload_app_image` (logo + content_card + showcase_1).
- `configure_mini_app` accepts every store-metadata and advanced field
  listed above in a single call (the server JSON-encodes
  `description_overview` into `app_metadata.description`).
- `submit_app_for_review` (`confirm_submission: true`) → returns
  `verification_status: "awaiting_review"`.

Verify in the dashboard UI:

- App store metadata renders with the values above.
- Logo, content card, and screenshot images all load.
- Configuration → Advanced shows the contracts, permit2 tokens, and
  `2 notifications / day`.
- Permissions toggles for "Import contacts" and "Attestation" are on.

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
      no UI interaction required.
- [ ] Scenario 2: mini app reached `awaiting_review` via MCP only, with
      logo + content_card + showcase_1 images uploaded and visible, and
      contracts / permit2 / notification cap / attestation / contacts
      all reflected in the dashboard.
- [ ] Datadog shows the expected `portal_*` events per scenario, all
      tagged `@actor:mcp`.
- [ ] No `Unhandled MCP error` in Datadog over the test window.
- [ ] Codex review clean (or all flags accepted).

## Rollback

If anything goes sideways in staging and you need to disable the MCP
fast: revert the App Router shim at `web/app/api/mcp/route.ts` so the
endpoint 404s. The deeper handler can stay.

## Known limitations

- `configure_world_id` only supports **self-managed** mode. Managed
  (platform-signed) registration must go through the dashboard UI —
  it requires user-session permissions and an on-chain registration
  transaction the API-key path can't perform.
- `rotate_world_id_signing_key` rejects managed RPs for the same reason.
- Notification limits accept `0 | 1 | 2 | "unlimited"`. The handler
  translates `"unlimited"` to `is_allowed_unlimited_notifications: true`
  + `max_notifications_per_day: 0` (matching the dashboard's behavior).
- Image uploads are capped at 500KB and limited to PNG / JPEG. For
  local files the agent base64-encodes via Bash and passes through
  `image_base64`; for hosted images the server fetches `source_url`
  directly. Either way the bytes go through the upload helper at
  `web/api/helpers/app-image-storage.ts`.
