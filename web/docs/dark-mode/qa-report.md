# Portal dark mode

## Implementation and rollback

`PORTAL_DARK_MODE_ENABLED=true` enables appearance controls; explicit `false` forces light, including in development. Unset enables local development only. Supported portal routes share availability rules between server initialization and client navigation. Unsupported routes remain light, and disabling the flag retains the user's saved preference.

`next-themes` owns Light/Dark/System, persistence and system changes. Nonce-aware initialization and strict preference validation handle malformed storage. Keep the provider mounted for reliable forced-light rollback.

`styles/portal-theme.css` defines semantic colors without redefining source primitives. Light values are preserved; dark monochrome icons inherit text color while brand artwork stays fixed. Canvas charts resolve CSS colors on theme changes. Palette source: [UI Kit 4.0 primitives](https://www.figma.com/design/rQyitWCsRVKHsR26qsZHdX/UI-Kit-4.0?node-id=4-3). Dark surfaces `#1f1f1f`, `#272727`, `#2f2f2f` are deliberately derived neutrals, not claimed Figma tokens.

## QA baseline — 2026-09-13

- Agent-run: 145 unit/schema/script suites, 900 tests passed; typecheck, lint and formatting passed.
- Chrome desktop (1440/1728px) and mobile (390 × 844): shell/apps, profile/settings, menus, dialogs, verification steps, controls, and synthetic charts/tooltips. No real saves, destructive confirmations, invitations, registrations or key generation.
- Menu spacing/highlights, mobile Help expansion and verification field clipping were corrected. Tests cover token contrast, icon exceptions, storage/prototype-key handling, cross-tab events and forced-light rollback.
- Screenshots below are historical QA evidence: synthetic chart data and a mobile menu-only crop. Full account/profile captures are excluded from the public PR.

## Known gaps / draft blockers

- User-reported white fragments near the top app-switcher area on pages where it is absent remain unresolved.
- Registered-RP and Mini App-only workflows were unavailable; transactions showed an upstream error. Shared-component checks do not prove those entire workflows.
- Production CSP/hydration, browser OS-change/cross-tab behavior and non-Chrome browsers still need release QA. Some pre-existing light-mode contrast issues remain.
- Keep rollout internal and the PR draft until open issues are verified. No backend schema changes.

## Screenshots

![Dark charts and keyboard tooltip, synthetic data](screenshots/desktop-dark-charts.png)

![Mobile Help Center, cropped to exclude account details](screenshots/pr-mobile-help-menu.png)
