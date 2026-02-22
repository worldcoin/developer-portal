# Skill: Integrate World ID

## Purpose

Guide an agent/developer through integrating World ID into an app with minimal manual portal interaction.

## Inputs expected

- Team identifier (or team name)
- App identifier (or app name)
- Environment (staging/production)
- Verification level requirements

## Workflow

1. Ensure authentication with CLI (`auth login` or `auth api-key`).
2. Ensure target app exists (`apps create` if needed).
3. Register/verify required relying party configuration.
4. Generate implementation checklist for frontend and backend verification.
5. Output copy-paste snippets and test plan.

## Tooling hints

- Prefer CLI commands for deterministic execution.
- If running in an IDE agent with MCP, call:
  - `create_team`
  - `create_app`
- Use docs.world.org for latest integration constraints.

## Success criteria

- App is present in portal.
- Required World ID configuration exists.
- Agent produces runnable integration steps and verification checklist.
