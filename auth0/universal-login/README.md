# Universal Login page template

Custom page template for the Auth0-hosted login screens
(`worldcoin-developer-portal.eu.auth0.com`). It adds Slack-style
**Open Gmail / Open Outlook** shortcuts under the card on every screen where
Auth0 has just emailed the user a code (the "Verify Your Identity" 2FA
challenge, passwordless email code, and login email verification screens), so
people don't have to hunt for their inbox while a code is waiting.

Behavior, decided from the address the code was sent to:

| Email domain                            | Buttons shown                        |
| --------------------------------------- | ------------------------------------ |
| `gmail.com`, `googlemail.com`           | Open Gmail                           |
| `outlook.*`, `hotmail.*`, `live.*`, `msn.com` | Open Outlook (outlook.live.com) |
| anything else (work domains)            | Both (Gmail + outlook.office.com)    |

The Gmail link deep-links the exact account
(`mail.google.com/mail/u/?authuser=<email>`), so multi-account users land in
the right inbox. Links open in a new tab so the code entry screen stays put.
If no email address is found on the screen, the block stays hidden.

## Why this lives here and not in `web/`

None of the login screens are rendered by this app — the portal redirects to
Auth0's hosted Universal Login, and the whole flow (including the email 2FA
challenge) is served by Auth0. The only supported way to add page content
around the New Universal Login widget is a [page template][docs] stored in the
tenant via the Management API. This directory is the source of truth for that
template plus the script that applies it.

[docs]: https://auth0.com/docs/customize/login-pages/universal-login/customize-templates

## Prerequisite: custom domain

Auth0 only renders page templates on a **verified custom domain**. Login
currently runs on the default `worldcoin-developer-portal.eu.auth0.com`
domain, so this template will have no visible effect until a custom domain
(e.g. `auth.developer.worldcoin.org`) is configured on the tenant and used by
the app. The deploy script checks and warns about this.

## Deploying

Needs a Management API token (or M2M client) with `read:branding`,
`update:branding`, and ideally `read:custom_domains`:

```bash
AUTH0_DOMAIN=worldcoin-developer-portal.eu.auth0.com \
AUTH0_MGMT_TOKEN=... \
node deploy.mjs --dry-run   # validate + back up current template, write nothing
```

Drop `--dry-run` to deploy. The script always backs up the tenant's current
template to `backup-<timestamp>.html` (gitignored) before writing.

Rollback: `node deploy.mjs --delete` removes the custom template and restores
Auth0's default page, or re-deploy a backup by copying it over
`page-template.html`.

## Maintenance notes

- The shortcut block only activates on these Universal Login screens:
  `mfa-email-challenge`, `email-otp-challenge`,
  `login-passwordless-email-code`, `login-email-verification`. If Auth0
  renames a screen the block silently stays hidden (it never breaks login).
- The script inserts the links under the login card (`main > section`) after
  hydration, falling back to bottom-of-page placement if the widget DOM
  changes.
- Brand icons are hand-drawn compact SVGs (a red Gmail "M", a blue Outlook
  tile). Swap in official brand assets if design wants exact marks.
