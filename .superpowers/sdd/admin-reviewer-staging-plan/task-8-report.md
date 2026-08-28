# Task 8: Public catalog mode filtering

## Delivered

- Added a Hasura `where` predicate to catalog ranking and highlight queries so mode filtering happens before pagination.
- Made explicit `app_mode` requests exact for `mini-app`, `external`, and `native`; legacy `External` categories are excluded from Mini Apps.
- Preserved default and `show_external=true` compatibility, including null-mode rows, and made explicit `app_mode` take precedence over `show_external`.
- Added API/query coverage for pagination variables, highlights, country filtering, null modes, native apps, and compatibility behavior.

## Verification

- `pnpm generate:graphql-types`
- `pnpm exec jest tests/api/v2/public/apps/apps.test.ts --runInBand`
- `pnpm test:api`
- `pnpm typecheck`
- `pnpm lint -- api/v2/public/apps/index.ts`
- `pnpm exec prettier --check api/v2/public/apps/index.ts api/v2/public/apps/graphql/get-app-rankings.graphql api/v2/public/apps/graphql/get-highlighted-apps.graphql tests/api/v2/public/apps/apps.test.ts`
- `git diff --check`

## Review

Independent read-only review approved the final diff. It specifically verified that `GetHighlights` no longer declares or receives an unused `highlightsIds` variable.
