# World Developer

Connect Codex to World documentation and the hosted Developer Portal to build, debug, and configure World integrations.

## Install

Requires a Codex version with plugin support and Node.js 20+. Private credential/key-file storage supports macOS and Linux; Windows is not supported by this release. Python 3 is needed only for the optional interactive team connection.

```sh
codex plugin marketplace add worldcoin/developer-portal \
  --ref world-developer-v1.0.0 \
  --sparse .agents/plugins --sparse plugins/world-developer
codex plugin add world-developer@world
```

Start a new task and ask:

- “Explain the World ID integration supported by this project's SDK version.”
- “Add World ID to this project and test the complete flow.”
- “Prepare this Mini App's Portal configuration for review.”

The catalog is a small install index hosted in this repository. This release is a desktop/CLI plugin distributed from GitHub, not an OpenAI public-directory listing. Pinning the version tag keeps installation reproducible; update the tag in the command when adopting a later release.

## Connect your Portal team

Documentation lookup works immediately without credentials. For account-specific work, create a team API key in [Developer Portal → Team settings → API keys](https://developer.world.org), then ask the `world-portal` skill to show the installed package's connection command.

Run the bundled `scripts/connect.py` with Python 3 in your own terminal. It uses a hidden prompt, validates team access, and saves the credential to an owner-only file under `~/.config/world-developer/`. Do not put the key in chat or source control. Use `--replace` only to replace an existing local credential; it does not rotate the server key.

Alternatively provide `WORLD_DEVELOPER_API_KEY` through the Codex host's secret environment. A nonempty environment value takes precedence over the saved file. File changes are picked up on the next operation; host environment changes require restarting Codex.

You can also download the release archive, extract it, and run `python3 plugins/world-developer/scripts/connect.py` there. The resulting credential is independent of the installation path.

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
npm run check
npm run format:check
python3 -B -m unittest discover -s tests -p 'test_*.py'
```

`node scripts/portal.mjs doctor` checks live team access without returning team data or secrets. `npm run check:installed` verifies the installed `world` catalog through Codex's runtime without an LLM turn. For a local catalog, pass `-- --marketplace-path /absolute/path/to/.agents/plugins/marketplace.json`. It calls only connection status and documentation search.

From the repository's `web/` directory, synchronize the contract after changing MCP tools or instructions:

```sh
pnpm exec tsx scripts/generate-mcp-contract.ts
pnpm exec tsx scripts/generate-mcp-contract.ts --check
```

The generator reads literal definitions and imported constants without executing API/helper modules. It writes this package's tool snapshot and the Portal's embedded instructions from `web/api/mcp/SKILL.md`. CI compares the snapshot with the actual handler's tool listing.

## Evaluations and release

`npm run evaluate` runs Codex fixture tasks with fake Docs/Portal boundaries, using account quota. Its independent claim grader requires Docker: first run `docker pull node:20-alpine`. Model-written code is graded only in a network-disabled, read-only, non-root container with resource limits and no host environment or credentials. If Docker or the image is unavailable, grading fails; it never falls back to host execution. The model task itself uses Codex's normal workspace-write permissions, not the grader container; do not treat this harness as a general adversarial-agent sandbox.

The fixture servers do not contact World services. Case-specific structured assessments and observed tool responses determine success; an empty answer or arbitrary tool call is not sufficient. Baseline results are comparisons; the combined run's exit code reflects the plugin cases. Generated transcripts/results are local artifacts, not release contents. See [VALIDATION.md](VALIDATION.md) for the evidence and limitations; historical runs with the old permissive grader are not counted.

Merge a reviewed version change to `main` to release it. The plugin workflow checks the package and contract, then creates `world-developer-v<version>` and its archive if that release does not exist. It never overwrites a release or replaces the Portal application's “latest” release. The root catalog and plugin must be released together.

Report reproducible issues through this repository, or contact [World developer support](mailto:developers@toolsforhumanity.com). Never include credentials or raw personal proof payloads in a report.
