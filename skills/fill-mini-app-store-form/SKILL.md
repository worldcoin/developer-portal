# Skill: Fill Mini App Store Form

## Purpose

Automate mini app listing submission with high-quality metadata and policy checks.

## Inputs expected

- `app_id`
- app description
- category
- optional marketing links and assets

## Workflow

1. Validate required metadata completeness.
2. Run `miniapps submit` via CLI or `submit_miniapp_form` via MCP.
3. Return submission identifier and status.
4. Emit follow-up tasks if metadata quality is below threshold.

## Quality rubric

- Description is specific and user-outcome focused.
- Category is valid and aligned with app behavior.
- Listing text avoids placeholders and internal jargon.

## Success criteria

- Submission API returns success.
- Agent outputs submission ID and review-ready summary.
