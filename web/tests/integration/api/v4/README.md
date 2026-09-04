# Agent test-verification integration check

This opt-in test exercises the actual MCP REST operation and verify handler over
local HTTP, with real Hasura, PostgreSQL and Redis. It creates its own team/app/API
key and removes those fixtures afterward. Logger and metrics delivery are mocked.

From the repository root, start the isolated test database and Redis:

```sh
docker compose -p agent-verification-tests -f docker-compose-test.yaml up -d
docker run -d --name agent-verification-tests-redis -p 6381:6379 redis:7-alpine
```

From `web/`, run only this test:

```sh
RUN_AGENT_TEST_VERIFICATION_INTEGRATION=true pnpm test:integration --runTestsByPath tests/integration/api/v4/test-verifications.test.ts
```

The test uses the compose test services on ports 5433/8081 and Redis on 6381. It
checks backend forwarding, an ordinary staging insert, existing replay behavior,
and a direct invalid-proof response. It does not generate a real ZK proof.

Stop only these test services when finished:

```sh
docker compose -p agent-verification-tests -f docker-compose-test.yaml down
docker rm -f agent-verification-tests-redis
```
