# Direct World ID navigation

## Goal

Remove one avoidable V3 redirect from the default app landing and app-switch
journeys without changing V2 behavior, app selection, authorization, or empty-team
handling.

## Considered approaches

1. **Navigate directly to the canonical World ID route (selected).** Have the V3
   apps page and app dropdown target `/teams/:teamId/apps/:appId/world-id-4-0`.
   This is the smallest change and preserves the existing ownership boundaries.
2. Move first-app selection into the login callback. This can remove another hop,
   but it couples authentication to app selection and is outside this fix's scope.
3. Keep the redirects and rely on Next.js prefetching. This preserves the extra
   document request and does not improve cold or post-login navigation.

## Design

- When a V3 team has at least one app, `AppsPage` redirects directly to that
  app's `/world-id-4-0` route.
- Selecting an app in `AppsDropdown` pushes that app's `/world-id-4-0` route.
- V2 routing, invalid-membership redirects, empty-app rendering, and query
  behavior remain unchanged.

## Verification

- Add a focused `AppsPage` test for the first-app destination.
- Extend the existing `AppsDropdown` test to assert its selected destination.
- Run both focused Jest suites, TypeScript, and formatting checks.
