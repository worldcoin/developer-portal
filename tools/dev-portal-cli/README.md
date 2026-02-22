# Dev Portal CLI Prototype

This is a local prototype for an automation-first CLI experience.

## Features in this prototype

- `auth api-key` for CI/service workflows.
- `auth login` for browser/device style login.
- `teams create`
- `apps create`
- `miniapps submit`

## Run locally

Start mock API:

```bash
node tools/dev-portal-cli/mock-dev-portal-server.mjs
```

In another terminal:

```bash
node tools/dev-portal-cli/dev-portal-cli.mjs auth login
```

Approve login by opening the printed URL in the browser (or curl it).

Then run:

```bash
node tools/dev-portal-cli/dev-portal-cli.mjs teams create --name="Agent Team"
node tools/dev-portal-cli/dev-portal-cli.mjs apps create --teamId=team_1 --name="Agent App"
node tools/dev-portal-cli/dev-portal-cli.mjs miniapps submit --appId=app_1 --description="Built by automation" --category="productivity"
```

## Notes

- This CLI stores tokens in `~/.dev-portal/config.json` for local prototyping.
- Production CLI should use OS keychain/secure storage and short-lived tokens.
