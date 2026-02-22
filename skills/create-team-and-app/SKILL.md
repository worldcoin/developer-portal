# Skill: Create Team and App

## Purpose

Provision a new team and app in the developer portal without manual UI flows.

## Inputs expected

- team name
- app name

## Workflow

1. Authenticate (`auth login` or `auth api-key`).
2. Create team (`teams create --name=...`).
3. Create app (`apps create --teamId=... --name=...`).
4. Return IDs in machine-readable output.

## MCP equivalent

- `create_team`
- `create_app`

## Success criteria

- Non-empty `team_id` and `app_id` returned.
- Output includes next recommended action (e.g., mini app submission or World ID integration).
