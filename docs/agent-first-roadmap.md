# Agent-First Developer Portal: Exploration and Local Prototype Plan

## Goals

Move the portal from a manually operated UI-first flow to an automation-first platform where developers (and coding agents) can:

1. authenticate once,
2. create teams/apps programmatically,
3. submit mini app store metadata,
4. run repeatable workflows via CLI and MCP,
5. consume prebuilt `SKILL.md` playbooks for common outcomes.

## Current friction (manual today)

The current portal UX is optimized for browser forms (team creation, app creation, mini app store submission). This creates friction for:

- agent automation,
- CI/CD bootstrapping,
- repeatable onboarding at scale,
- “infrastructure as code” style setup.

## Proposed target architecture

```text
Developer or Agent
   ├── dev-portal CLI (human and CI use)
   ├── MCP Server (agent tool protocol)
   └── SKILL.md libraries (workflow-level guidance)

CLI / MCP
   └── Portal API layer (new stable automation API)
          ├── Teams API
          ├── Apps API
          ├── Mini App Submission API
          └── Auth API (API key + OAuth device/browser login)

Portal Backend
   ├── Existing GraphQL/Hasura + server actions
   └── New automation-facing API contracts + policy/quotas/auditing
```

## Authentication exploration

### Option A: API key

**Best for**: CI, headless agents, service accounts.

- Add per-user/per-team API keys with scoped permissions:
  - `teams:write`
  - `apps:write`
  - `miniapps:submit`
- Store hashed API keys server-side.
- Expose key lifecycle endpoints: create/list/revoke.

### Option B: Browser redirect / device-like login

**Best for**: local CLI used by a human.

- CLI starts login (`POST /api/v1/auth/cli/start`).
- Portal returns:
  - `verification_uri`
  - `user_code`
  - `device_code`
  - polling interval
- CLI opens browser to verification URI.
- User approves session in the portal.
- CLI polls token endpoint and receives access token.

This gives a modern Stripe/GitHub style login UX without forcing static API keys.

### Recommendation

Ship **both**:

- browser/device login for local developer experience,
- API keys for CI and unattended automation.

## API layer requirements

To support both CLI and MCP robustly, add a stable automation API facade:

- `POST /api/v1/teams`
- `POST /api/v1/apps`
- `POST /api/v1/miniapps/submissions`
- `GET /api/v1/me`
- auth endpoints for API key mgmt + CLI device login

### Non-functional requirements

- idempotency keys for mutation endpoints,
- strict input validation + typed error codes,
- audit logs with actor identity (user/api key/session),
- request tracing + rate limiting.

## MCP exploration

MCP is valuable when agents need tool discovery and composable function calls from editors/IDE agents.

### Where MCP helps beyond CLI

- native tool exposure for LLM agents,
- contextual form filling (`submit_miniapp_form`) with machine-readable schemas,
- less prompt fragility than shelling out to raw CLI.

### Suggested strategy

- Implement MCP as a thin wrapper over the same stable API used by the CLI.
- Keep business logic in backend APIs, not in MCP server.
- Start with 3 tools:
  - `create_team`
  - `create_app`
  - `submit_miniapp_form`

## Local mock strategy (implemented in this branch)

The branch includes:

1. a **mock portal API server**,
2. a **CLI prototype** supporting api-key + browser/device auth,
3. an **MCP prototype server** over stdio,
4. starter `SKILL.md` workflows for agent-friendly tasks.

Use these to test integration contracts quickly before core backend changes.

## Core platform changes needed in the real portal

1. Add automation-first API endpoints in `web/app/api` (or equivalent server layer).
2. Introduce long-lived token strategy and scoped API keys.
3. Add team/app/miniapp submission service boundaries with idempotency.
4. Add policy controls (role-based + scope-based authorization).
5. Add a public, versioned automation spec (OpenAPI or JSON Schema).

## Rollout plan

### Phase 0 (now)

- Validate API shapes with mock server + CLI + MCP.
- Validate top SKILL workflows with internal teams.

### Phase 1

- Implement real auth endpoints (device + API key).
- Ship first-party CLI to internal beta users.

### Phase 2

- Ship MCP server + official tool schemas.
- Publish curated SKILL bundles.

### Phase 3

- Add “Generate command/agent plan” UX in the web portal for every manual form.
- Move full onboarding path to automation parity.

## Success metrics

- Time-to-first-app reduced for new developers.
- % of app/team creation done via CLI/API.
- % of mini app submissions with zero UI form interaction.
- Agent task completion rate for end-to-end onboarding flows.
