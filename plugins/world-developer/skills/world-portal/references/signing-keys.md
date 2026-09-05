# Signing-key handoff

`configure_world_id` can produce a new key. Rotation replaces the usable signer and requires the user's authorization for the resolved app. The adapter generates a unique owner-only `.env` destination under its private storage before making either call. It refuses private keys in tool arguments; supplying an existing signer is a separate secret-management workflow, not a chat parameter.

On success, the returned `secret_file` contains `WORLD_ID_SIGNING_KEY=<value>`. The adapter replaces the private key in the MCP result with that reference. Use the returned path as a server-only runtime secret file, or transfer its value directly into the project's approved secret manager with a script that never writes the value to stdout. Change the application's expected variable **name** if necessary without inspecting the secret through tools. Never use a `NEXT_PUBLIC_` variable.

If the app expects an ignored local dotenv file, perform the transfer with the bundled [helper](../../../scripts/install-secret.mjs):

```sh
node <plugin-root>/scripts/install-secret.mjs --source <returned-secret-file> --project <absolute-project-root> --destination <absolute-ignored-env-file> --variable WORLD_ID_SIGNING_KEY
```

The helper requires a Git-ignored, untracked destination and refuses to replace an existing variable. It prints only the destination and variable name. For deployed apps, use the deployment platform's secret mechanism instead of committing or uploading the file as an asset.

An interrupted request leaves an owner-only reservation or recovery record. Do not delete it or retry the remote mutation automatically. Inspect the actual Portal signer and registration first. If a response was received but key persistence failed, the adapter returns an explicit handoff failure and never emits the key. Recovery may require a separately authorized rotation; it is not ordinary retry behavior.
