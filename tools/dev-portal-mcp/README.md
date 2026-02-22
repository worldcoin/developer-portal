# Dev Portal MCP Prototype

This MCP server is a thin wrapper around the same automation API used by the CLI.

## Why this shape

- Keeps business logic in backend APIs.
- Gives coding agents structured tool calls.
- Reuses auth/token model from CLI and platform APIs.

## Exposed tools

- `create_team`
- `create_app`
- `submit_miniapp_form`

## Local run

```bash
# terminal 1
node tools/dev-portal-cli/mock-dev-portal-server.mjs

# terminal 2
DEV_PORTAL_API_URL=http://localhost:4010 DEV_PORTAL_TOKEN=mock_token node tools/dev-portal-mcp/server.mjs
```

Then send JSON-RPC lines over stdin, for example:

```json
{"id":1,"method":"tools/list"}
```
