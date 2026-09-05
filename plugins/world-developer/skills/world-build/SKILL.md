---
name: world-build
description: Implement, migrate, debug, and test World ID, World App Mini Apps, World Chain, or World AgentKit integrations in a codebase. Use for World-specific coding work, not generic agents, OIDC, EVM, or x402 projects without a World integration.
---

# Build with World

Reconcile the requested behavior, existing code, current documentation, and relevant Portal state. Preserve the user's framework and working integrations unless the requested change requires otherwise.

## Select the work

- Inspect project instructions, dependencies and lockfile, existing integration, environment variable **names**, and tests. Do not read secret values into the conversation.
- Classify the request: explanation, diagnosis, implementation, migration, or deployment. Diagnose with evidence; implement a fix only when requested or already authorized. Do not turn a bug fix into a major-version migration or app-store submission.
- Load [world-docs](../world-docs/SKILL.md) for version-matched retrieval and only the relevant guide below. Multiple guides are appropriate when the actual integration crosses products.

| Integration                                                     | Read                                     |
| --------------------------------------------------------------- | ---------------------------------------- |
| IDKit / World ID proof, signing, verification, migration        | [World ID](references/world-id.md)       |
| MiniKit / World App commands, device testing, review readiness  | [Mini Apps](references/mini-apps.md)     |
| World Chain RPC, contracts, deployment or on-chain verification | [World Chain](references/world-chain.md) |
| AgentKit access or World human approval                         | [Agents](references/agents.md)           |

## Reconcile before changing

Resolve the application's existing IDs and target version before selecting a guide's new-app path. Use [world-portal](../world-portal/SKILL.md) when the requested outcome needs account inspection or a Portal change. App production/staging state, action environment, and SDK sandbox are distinct; do not derive one from another. Existing authentication failure must not block independent code or documentation work.

Use the smallest change that satisfies the request. After an uncertain remote outcome, inspect the actual app or transaction before retrying. Keep returned IDs and pending operations in the project's existing task notes when the work spans sessions; never store secrets there or introduce a second memory system.

## Prove the result

For automated World ID backend checks, read [synthetic verification](references/test-verification.md). Use it when the deployed Portal exposes `run_test_verification`; keep real SDK/device testing as a separate check.

Run the project's relevant format, type, and behavioral checks. Test branch decisions and failure handling, not mocks returning configured values. Check that identifiers and environments used by code agree with Portal configuration when access is available. A successful mutation response is not proof of an active RP or a working device integration.

Report the code change, configuration change, tests actually executed, and the exact remaining verification layer. Distinguish mocked I/O, local runtime, public network, and real device verification. Do not claim end-to-end success when one is unavailable.
