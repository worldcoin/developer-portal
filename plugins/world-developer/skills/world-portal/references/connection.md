# Connect a Portal team

Docs remain available without Portal credentials. The adapter initializes locally without a network request and `portal_connection_status` performs only `initialize`, `tools/list`, and `get_team_context` remotely.

Preferred interactive setup: run the bundled [connect.py](../../../scripts/connect.py) with Python 3 in the user's terminal. The prompt hides input, checks the team key with the Portal, and stores it in an owner-only file outside repositories. Do not ask for the key in chat. The script refuses to overwrite an existing key unless the user runs it with `--replace`; this changes the local saved credential, not the server key.

Alternatively the host can supply `WORLD_DEVELOPER_API_KEY` through its secret mechanism. A nonempty environment value takes precedence over the saved key. An invalid environment key must be replaced or unset; silently falling back could select another team. The adapter re-reads the local saved credential for each operation, so file-based setup does not require restarting the host. Environment changes do.

`node <plugin-root>/scripts/portal.mjs doctor` is a read-only terminal check. It reports connection state and compatibility without returning team data or secrets. `portal_connection_status` does the same inside the agent.

Local credentials and signing files live under `~/.config/world-developer/`, with owner-only permissions. POSIX/macOS/Linux are the supported secret-storage platforms for this version. On Windows, docs still work; use a supported secret storage adapter before provisioning. Do not use a repository-local credential file.

The installed adapter intentionally uses the distinct server name `world-portal` so a legacy `world-developer-portal` user registration cannot silently replace its protected behavior. The docs connection remains `world-docs`.
