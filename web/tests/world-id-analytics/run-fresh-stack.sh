#!/usr/bin/env bash
set -euo pipefail

test_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
web_root="$(cd "${test_root}/../.." && pwd)"
repository_root="$(cd "${web_root}/.." && pwd)"
compose_file="${test_root}/docker-compose.yaml"
compose_project="wia_contract_${PPID}_$RANDOM"

export WIA_REPOSITORY_ROOT="${repository_root}"

cleanup() {
  docker compose --project-name "${compose_project}" --file "${compose_file}" \
    down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker compose --project-name "${compose_project}" --file "${compose_file}" \
  up --detach --wait

postgres_binding="$(
  docker compose --project-name "${compose_project}" --file "${compose_file}" \
    port postgres 5432
)"
hasura_binding="$(
  docker compose --project-name "${compose_project}" --file "${compose_file}" \
    port hasura 8080
)"
postgres_port="${postgres_binding##*:}"
hasura_port="${hasura_binding##*:}"
hasura_url="http://127.0.0.1:${hasura_port}"

for attempt in $(seq 1 120); do
  if curl --fail --silent "${hasura_url}/healthz" >/dev/null; then
    break
  fi
  if [[ "${attempt}" == "120" ]]; then
    docker compose --project-name "${compose_project}" --file "${compose_file}" logs
    exit 1
  fi
  sleep 0.5
done

metadata_status="$(
  curl --fail --silent \
    --header "content-type: application/json" \
    --header "x-hasura-admin-secret: secret!" \
    --data '{"type":"get_inconsistent_metadata","args":{}}' \
    "${hasura_url}/v1/metadata"
)"
node -e '
  const status = JSON.parse(process.argv[1]);
  if (status.is_consistent !== true || status.inconsistent_objects?.length) {
    console.error(JSON.stringify(status, null, 2));
    process.exit(1);
  }
' "${metadata_status}"

migration_status="$(
  docker compose --project-name "${compose_project}" --file "${compose_file}" \
    exec --no-TTY hasura hasura-cli migrate status \
      --project /hasura-project \
      --endpoint http://127.0.0.1:8080 \
      --admin-secret "secret!" \
      --database-name default \
      --disable-interactive \
      --no-color
)"
node -e '
  const fs = require("fs");
  const path = require("path");
  const root = process.argv[1];
  const status = process.argv[2];
  const directories = fs
    .readdirSync(path.join(root, "hasura/migrations/default"), {
      withFileTypes: true,
    })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const legacyUntracked = directories.filter((name) => /\s/.test(name));
  if (
    legacyUntracked.length !== 1 ||
    legacyUntracked[0] !== "1726177042301_add import all contacts"
  ) {
    console.error(`Unexpected CLI-untracked migration directories: ${legacyUntracked.join(", ")}`);
    process.exit(1);
  }
  const expected = directories
    .filter((name) => !/\s/.test(name))
    .map((name) => name.match(/^\d+/)?.[0])
    .filter(Boolean)
    .sort();
  const present = status
    .split(/\r?\n/)
    .map((line) => line.match(/^(\d+)\s+\S+\s+Present\s+Present\s*$/)?.[1])
    .filter(Boolean)
    .sort();
  if (
    expected.length === 0 ||
    expected.length !== present.length ||
    expected.some((version, index) => version !== present[index])
  ) {
    console.error(status);
    console.error(`Expected ${expected.length} checkout migrations, found ${present.length} fully applied`);
    process.exit(1);
  }
' "${repository_root}" "${migration_status}"

export PGHOST=127.0.0.1
export PGPORT="${postgres_port}"
export PGDATABASE=postgres
export PGUSER=postgres
export PGPASSWORD=password
export DATABASE_URL="postgres://postgres:password@127.0.0.1:${postgres_port}/postgres"
export NEXT_PUBLIC_GRAPHQL_API_URL="${hasura_url}/v1/graphql"
export HASURA_GRAPHQL_ADMIN_SECRET="secret!"
export INTERNAL_ENDPOINTS_SECRET="world-id-analytics-test-secret"
# Must match the stack's HASURA_GRAPHQL_JWT_SECRET so a service JWT minted by
# the real route is accepted by this Hasura.
export HASURA_GRAPHQL_JWT_SECRET='{"key":"unsafe_AnEsZxveGsAWoENHGAnEsZxveGsAvxgMtDq9UxgTsDq9UxgTsNHGWoENIoJ","type":"HS512"}'
export JWT_ISSUER="https://world-id-analytics.test"
export WORLD_ID_ANALYTICS_ROLLUP_ENABLED=true
export WIA_HASURA_METADATA_URL="${hasura_url}/v1/metadata"
export WIA_MIGRATIONS_PROVEN=true
export WIA_FRESH_STACK=true
export WIA_COMPOSE_FILE="${compose_file}"
export WIA_COMPOSE_PROJECT="${compose_project}"

docker compose --project-name "${compose_project}" --file "${compose_file}" \
  exec --no-TTY postgres \
    psql \
      --username postgres \
      --dbname postgres \
      --no-psqlrc \
      --file - \
  < "${repository_root}/hasura/operations/world-id-analytics/create-nullifier-created-at-index.sql"

cd "${web_root}"
if [[ "${1:-}" == "--smoke" ]]; then
  npx jest tests/world-id-analytics/stack-smoke.test.ts --runInBand
  exit 0
fi

if [[ "${1:-}" == "--release-gate" ]]; then
  npx jest \
    tests/world-id-analytics/stack-smoke.test.ts \
    tests/world-id-analytics/window-rollup.test.ts \
    tests/world-id-analytics/backfill-and-validate.test.ts \
    tests/world-id-analytics/index-build-locking.test.ts \
    tests/world-id-analytics/cron-and-rollout.test.ts \
    tests/world-id-analytics/end-to-end-release.test.ts \
    --runInBand
  exit 0
fi

npx jest \
  tests/world-id-analytics/stack-smoke.test.ts \
  tests/world-id-analytics/window-rollup.test.ts \
  tests/world-id-analytics/backfill-and-validate.test.ts \
  tests/world-id-analytics/index-build-locking.test.ts \
  tests/world-id-analytics/cron-and-rollout.test.ts \
  tests/world-id-analytics/end-to-end-release.test.ts \
  --runInBand
