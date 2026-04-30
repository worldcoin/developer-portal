# MCP staging test runbook

End-to-end smoke test of the World ID MCP endpoint
(`web/api/mcp/index.ts`) against staging before promoting to prod.

## 0. Prereqs

- Access to the staging dev portal UI (admin/owner on at least one team).
- A Claude Code (or other MCP client) install you can configure with a
  custom server.
- Datadog access for the dev-portal service so you can watch
  `portal_*` events fire while running scenarios.
- Repo open at the commit where this runbook landed (so the agent
  command list matches the deployed tools).

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

For Claude Code, add to your settings (`~/.claude.json` or via `/config`):

```jsonc
{
  "mcpServers": {
    "world-portal-staging": {
      "url": "https://staging-developer.worldcoin.org/api/mcp",
      "headers": { "Authorization": "Bearer api_xxxxxxxx" }
    }
  }
}
```

Restart Claude Code, then in a fresh chat run:

```
/mcp world-portal-staging tools/list
```

Expected: 10 tools — `get_team_context`, `get_app_config`, `create_app`,
`configure_world_id`, `get_world_id_signing_key`,
`get_world_id_registration_status`, `rotate_world_id_signing_key`,
`create_world_id_action`, `configure_mini_app`, `submit_app_for_review`.

The MCP returns a skill guide via `initialize.instructions` — the agent
should pick this up automatically and follow the canonical flows below.
The same content lives at `web/api/mcp/SKILL.md`; if you'd rather load
it as a Claude Code local skill (e.g. for offline reference), copy it
into `~/.claude/skills/world-id-mcp/SKILL.md` — the YAML frontmatter
is already in place.

## 3. Scenario 1 — External World ID app, end-to-end

Prompt your agent:

> Using the world-portal-staging MCP, build me an external (non-mini-app)
> World ID app called "MCP Test External". After creating it, configure
> World ID in self-managed mode and generate a signing key (capture the
> private key — it's one-time only). Then create an action called
> `verify-account` for it. Finally, submit the app for review.

Expected tool sequence:

1. `create_app` (`app_mode: "external"`) → returns `app_id`.
2. `configure_world_id` → returns `signing_key.private_key` (capture it).
3. `create_world_id_action` (`action: "verify-account"`).
4. `submit_app_for_review` (`confirm_submission: true`).

Verify in the dashboard UI: app appears, World ID is configured, signer
address matches what the agent reported, action is listed, app is in
`awaiting_review`.

Verify in Datadog (per `docs/runbooks/mcp-datadog-queries.md`):

```
service:developer-portal @event:app_creation @actor:mcp
service:developer-portal @event:action_creation @actor:mcp
service:developer-portal @event:app_submission @actor:mcp
```

Each should fire exactly once with `@app_id` matching the new app.

## 4. Scenario 2 — Mini app with the colleague's full checklist

Prompt:

> Using world-portal-staging, create a Mini App named "MCP Test Mini".
> Set its store metadata: short_name "MCPMini", category "Other",
> world_app_description "Test mini app", supported_countries ["us"],
> supported_languages ["en"], app_website_url "https://example.com",
> support_link "mailto:test@example.com". Then set Advanced settings:
>  - max_notifications_per_day = 2
>  - contracts: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]
>  - permit2_tokens: ["0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"]
>  - can_import_all_contacts: true
>  - can_use_attestation: true
>
> After everything is set, submit the app for review.

Expected:

- `create_app` (`app_mode: "mini-app"`) → returns `app_id`.
- `configure_mini_app` accepts every advanced field listed above
  (these were added in the staging-readiness PR).
- `submit_app_for_review` succeeds.

Verify in the dashboard UI:

- App store metadata renders with the values above.
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

- [ ] All 10 tools visible in `tools/list`
- [ ] Scenario 1: external app reached `awaiting_review` via MCP
- [ ] Scenario 2: mini app reached `awaiting_review` via MCP, with
      contracts/permit2/notifications/attestation/contacts all set
- [ ] Datadog shows 4 distinct `portal_*` events per scenario, all
      tagged `@actor:mcp`
- [ ] No `Unhandled MCP error` in Datadog over the test window
- [ ] Codex review clean (or all flags accepted)

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
