# World Developer

Install World documentation, coding workflows, and Developer Portal tools in Codex. The plugin uses the existing World servers; you do not need to run or build the Developer Portal.

## Install from a checkout

Requires a Codex version with plugin support and Node.js 20+. Private credential/key-file storage supports macOS and Linux; Windows is not supported by this release. Python 3 is needed only for the optional interactive team connection.

```sh
# Run from the repository root.
codex plugin marketplace add .
codex plugin add world-developer@world
```

Start a new task and ask:

- “Explain the World ID integration supported by this project's SDK version.”
- “Add World ID to this project and test the complete flow.”
- “Prepare this Mini App's Portal configuration for review.”

The catalog is a small install index hosted in this repository. This is a desktop/CLI plugin, not an OpenAI public-directory listing. Versioned distribution and release automation are provided separately; this checkout can be installed without them.

## Connect your Portal team

Documentation lookup works immediately without credentials. For account-specific work, create a team API key in [Developer Portal → Team settings → API keys](https://developer.world.org), then ask the `world-portal` skill to show the installed package's connection command.

Run the bundled `scripts/connect.py` with Python 3 in your own terminal. It uses a hidden prompt, validates team access, and saves the credential to an owner-only file under `~/.config/world-developer/`. Do not put the key in chat or source control. Use `--replace` only to replace an existing local credential; it does not rotate the server key.

Alternatively provide `WORLD_DEVELOPER_API_KEY` through the Codex host's secret environment. A nonempty environment value takes precedence over the saved file. File changes are picked up on the next operation; host environment changes require restarting Codex.

From a checkout, run `python3 plugins/world-developer/scripts/connect.py` from the repository root. The resulting credential is independent of the installation path.

## Capabilities

| Skill          | Work                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `world-docs`   | Find current, version-matched World documentation.                                             |
| `world-build`  | Implement, migrate, diagnose and test World ID, Mini Apps, World Chain and agent integrations. |
| `world-portal` | Inspect/configure apps, RP/actions, signing keys, metadata, images and review submissions.     |

World Docs connects to `https://docs.world.org/mcp`. A dependency-free local adapter forwards Portal operations to `https://developer.world.org/api/mcp`. Generated signing keys are stored in private local files; only references and public operation details reach the agent. The signer getter cannot rotate implicitly. See the [handoff procedure](skills/world-portal/references/signing-keys.md).

The adapter is not an OS security boundary against other processes running as the same user. Direct Portal MCP registrations do not receive its protections. Existing direct registrations remain separate; the bundled adapter is named `world-portal`.

`run_test_verification` is used only when the deployed server supports it. It produces a synthetic staging payload for the developer's backend or performs a Portal-only diagnostic in direct mode. These tests simulate the chain verdict, not proof generation. Custom signals and session proofs are currently unsupported. See [synthetic verification](skills/world-build/references/test-verification.md). Older deployments continue to support the other Portal operations.

## Validate a checkout

From this directory:

```sh
npm ci
npm test
npm run format:check
python3 -B -m unittest discover -s tests -p 'test_*.py'
```

`node scripts/portal.mjs doctor` checks live team access without returning team data or secrets.

The checked-in `contracts/portal-tools.json` snapshot describes the expected Portal tools. The adapter checks the deployed schemas before forwarding operations and tolerates the optional synthetic verification tool being absent. Contract-generation tooling, model evaluations, archive checks and release publishing are maintained separately from the core runtime and its regression tests.

Report reproducible issues through this repository, or contact [World developer support](mailto:developers@toolsforhumanity.com). Never include credentials or raw personal proof payloads in a report.
